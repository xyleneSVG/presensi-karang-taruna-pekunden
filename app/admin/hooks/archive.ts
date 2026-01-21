/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use server';

import { PrismaClient } from '@prisma/client';
import { put, del } from '@vercel/blob';
import { revalidatePath } from 'next/cache';
import ExcelJS from 'exceljs';

const prisma = new PrismaClient();

async function fetchImageBuffer(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed');
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    return null;
  }
}

export async function archiveMonthlyData(monthName: string, year: number) {
  try {
    const monthIndex = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", 
                        "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
                        .indexOf(monthName);
    
    if (monthIndex === -1) return { success: false, message: 'Nama bulan tidak valid' };

    const startDate = new Date(year, monthIndex, 1);
    const endDate = new Date(year, monthIndex + 1, 0, 23, 59, 59);

    const records = await prisma.attendance.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    if (records.length === 0) {
      return { success: false, message: 'Tidak ada data untuk diarsipkan pada periode ini.' };
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Presensi');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Nama', key: 'name', width: 25 },
      { header: 'Jabatan', key: 'position', width: 20 },
      { header: 'Tanggal', key: 'date', width: 10 },
      { header: 'Bulan', key: 'month', width: 10 },
      { header: 'Waktu', key: 'time', width: 10 },
      { header: 'Minggu Ke', key: 'week', width: 10 },
      { header: 'Foto', key: 'photo', width: 15 }, 
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    for (let i = 0; i < records.length; i++) {
        const record = records[i];
        const rowIndex = i + 2; 

        const row = worksheet.getRow(rowIndex);
        row.values = {
            id: record.id,
            name: record.name,
            position: record.position,
            date: record.date,
            month: record.month,
            time: new Date(record.createdAt).toLocaleTimeString('id-ID'),
            week: record.week,
            photo: '' 
        };

        row.height = 60; 
        row.alignment = { vertical: 'middle', horizontal: 'left' };

        if (record.photo && record.photo.includes('http')) {
            const imageBuffer = await fetchImageBuffer(record.photo);
            
            if (imageBuffer) {
                const imageId = workbook.addImage({
                    buffer: imageBuffer as any,
                    extension: 'jpeg',
                });

                worksheet.addImage(imageId, {
                    tl: { col: 7, row: rowIndex - 1 },
                    ext: { width: 80, height: 80 },
                    editAs: 'oneCell'
                });
            }
        }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `archives/Presensi-${monthName}-${year}-${Date.now()}.xlsx`;

    const blob = await put(filename, buffer as unknown as Buffer, {
      access: 'public',
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const photoUrlsToDelete = records
      .map(r => r.photo)
      .filter((url): url is string => url !== null && url.includes('public.blob.vercel-storage.com'));

    await prisma.$transaction([
      prisma.attendanceArchive.create({
        data: {
          month: monthName,
          year: year,
          fileUrl: blob.url,
          totalRecords: records.length,
        }
      }),
      prisma.attendance.updateMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        data: {
          photo: 'ARCHIVED' 
        }
      })
    ]);

    if (photoUrlsToDelete.length > 0) {
        await del(photoUrlsToDelete);
    }

    revalidatePath('/admin');
    return { success: true, message: `Sukses! ${records.length} data diarsipkan. Foto diganti status ARCHIVED.` };

  } catch (error) {
    console.error('Archive Error:', error);
    return { success: false, message: 'Gagal melakukan pengarsipan.' };
  }
}

export async function deleteArchive(archiveId: string, fileUrl: string) {
    try {
        await del(fileUrl);
        await prisma.attendanceArchive.delete({ where: { id: archiveId } });
        revalidatePath('/admin');
        return { success: true, message: 'Arsip berhasil dihapus permanen.' };
    } catch (error) {
        return { success: false, message: 'Gagal menghapus arsip.' };
    }
}

export async function getArchivesList() {
    return await prisma.attendanceArchive.findMany({
        orderBy: { createdAt: 'desc' }
    });
}