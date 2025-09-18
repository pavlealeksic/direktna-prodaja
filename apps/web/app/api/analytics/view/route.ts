import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { rateLimit } from '@/lib/ratelimit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'ip:unknown';
  if (!rateLimit.allow(`view:${ip}`)) return new Response('Too many requests', { status: 429 });
  const { projectId, unitId, path } = await req.json();
  if (!projectId || !path) return new Response('Bad request', { status: 400 });
  await prisma.viewEvent.create({ data: { projectId, unitId, path } });
  return Response.json({ ok: true });
}
