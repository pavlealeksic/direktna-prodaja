import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { sendLeadReply } from '@/lib/email';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { subject, message, ccBuilder } = await req.json();
  if (!subject || !message) return new Response('Invalid', { status: 400 });
  const lead = await prisma.lead.findUnique({ where: { id: params.id }, include: { project: { include: { builder: true } }, unit: true } });
  if (!lead) return new Response('Not found', { status: 404 });
  const replyTo = ccBuilder ? lead.project.builder.contactEmail || undefined : undefined;
  const text = message.replace(/\{\{project\}\}/g, lead.project.name).replace(/\{\{unit\}\}/g, lead.unit?.number || '');
  await sendLeadReply(lead.email, { subject, text, replyTo });
  return Response.json({ ok: true });
}

