import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthContext } from '@/lib/clerk';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext();
  await prisma.lead.update({ where: { id: params.id }, data: { assignedToUserId: ctx.userId, assignedAt: new Date() } });
  return new Response(null, { status: 302, headers: { Location: '/sales?mine=1' } });
}

