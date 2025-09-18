import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthContext } from '@/lib/clerk';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const notes = await prisma.leadNote.findMany({ where: { leadId: params.id }, orderBy: { createdAt: 'desc' } });
  return Response.json({ notes });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext();
  const { content } = await req.json();
  if (!content || typeof content !== 'string') return new Response('Invalid', { status: 400 });
  const note = await prisma.leadNote.create({ data: { leadId: params.id, authorId: ctx.userId, content } });
  return Response.json(note);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext();
  const url = new URL(req.url);
  const noteId = url.searchParams.get('noteId');
  if (!noteId) return new Response('Missing noteId', { status: 400 });
  const note = await prisma.leadNote.findUnique({ where: { id: noteId } });
  if (!note) return new Response('Not found', { status: 404 });
  if (note.authorId !== ctx.userId) return new Response('Forbidden', { status: 403 });
  await prisma.leadNote.delete({ where: { id: noteId } });
  return Response.json({ ok: true });
}

