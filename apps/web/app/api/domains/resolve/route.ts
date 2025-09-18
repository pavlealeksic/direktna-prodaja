import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const hostRaw = url.searchParams.get('host');
  if (!hostRaw) return new Response('Missing host', { status: 400 });
  const host = hostRaw.toLowerCase().replace(/^www\./, '');
  const b = await prisma.builder.findFirst({ where: { customDomain: host } });
  if (!b) return new Response('Not found', { status: 404 });
  return Response.json({ slug: b.slug });
}

