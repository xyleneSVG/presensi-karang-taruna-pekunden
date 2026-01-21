/* eslint-disable @typescript-eslint/no-unused-vars */
'use server';

import { PrismaClient } from '@prisma/client';
import { put } from '@vercel/blob';

const prisma = new PrismaClient();

export async function checkTodayAttendance(name: string) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const record = await prisma.attendance.findFirst({
    where: {
      name: name,
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  return !!record;
}

export async function submitAttendanceAction(data: {
  name: string;
  position: string;
  photo: string;
}) {
  try {
    const hasAttended = await checkTodayAttendance(data.name);
    if (hasAttended) {
      return { success: false, message: 'Anda sudah melakukan presensi hari ini.' };
    }

    const now = new Date();
    const dateNum = now.getDate();
    const monthName = now.toLocaleString('id-ID', { month: 'long' });
    const weekNum = Math.ceil(dateNum / 7);

    const base64Data = data.photo.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');
    const filename = `presensi/${data.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.jpg`;

    const blob = await put(filename, buffer, {
      access: 'public',
      contentType: 'image/jpeg',
    });

    await prisma.attendance.create({
      data: {
        name: data.name,
        position: data.position,
        photo: blob.url,
        date: dateNum,
        month: monthName,
        week: weekNum,
      },
    });

    return { 
        success: true, 
        message: 'Presensi berhasil dicatat!', 
        photoUrl: blob.url 
    };

  } catch (error) {
    return { success: false, message: 'Gagal menyimpan data ke sistem.' };
  }
}