/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';
import { redirect } from 'next/navigation';
import { USER_DATABASE } from '../../constant/data';

const prisma = new PrismaClient();
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_PASS_ADMIN; 

export async function loginAdmin(formData: FormData) {
  const password = formData.get('password') as string;

  if (password === ADMIN_PASSWORD) {
    (await cookies()).set('admin_session', 'true', { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 
    });
    return { success: true };
  } else {
    return { success: false, message: 'Password salah!' };
  }
}

export async function logoutAdmin() {
  (await cookies()).delete('admin_session');
  redirect('/admin/login');
}

export async function getDashboardStats() {
    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);
    
    const todayCount = await prisma.attendance.count({
        where: { createdAt: { gte: startOfDay } }
    });

    const totalAnggota = Object.keys(USER_DATABASE).length;

    return { today: todayCount, totalAnggota: totalAnggota };
}

export async function getAttendanceData(startDate?: string, endDate?: string, nameFilter?: string) {
  const whereClause: any = {};

  if (startDate && endDate) {
    const start = new Date(startDate);
    start.setHours(0,0,0,0);
    
    const end = new Date(endDate);
    end.setHours(23,59,59,999);
    
    whereClause.createdAt = {
        gte: start,
        lte: end
    };
  } else if (startDate) {
     const start = new Date(startDate);
     start.setHours(0,0,0,0);
     const end = new Date(startDate);
     end.setHours(23,59,59,999);
     whereClause.createdAt = { gte: start, lte: end };
  }

  if (nameFilter) {
      whereClause.name = { contains: nameFilter, mode: 'insensitive' };
  }

  return await prisma.attendance.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
  });
}

export async function getUserHistory(name: string) {
    return await prisma.attendance.findMany({
        where: { name: name },
        orderBy: { createdAt: 'desc' }
    });
}