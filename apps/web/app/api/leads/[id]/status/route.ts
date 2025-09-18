import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthContext } from '@/lib/clerk';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await getAuthContext();
  const form = await req.formData();
  const status = String(form.get('status')) as any;
  await prisma.lead.update({ where: { id: params.id }, data: { status } });
  return new Response(null, { status: 302, headers: { Location: req.headers.get('referer') || '/leads' } });
}

