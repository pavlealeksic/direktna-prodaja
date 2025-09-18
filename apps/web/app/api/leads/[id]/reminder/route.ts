import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthContext } from '@/lib/clerk';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await getAuthContext();
  const { when } = await req.json();
  const reminderAt = when ? new Date(when) : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  await prisma.lead.update({ where: { id: params.id }, data: { reminderAt } });
  return Response.json({ ok: true, reminderAt });
}

