import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const builder = url.searchParams.get('builder')!;
  const project = url.searchParams.get('project')!;
  const unit = url.searchParams.get('unit')!;
  const data = await prisma.project.findFirst({ where: { micrositeSlug: project, builder: { slug: builder } }, include: { units: true } });
  if (!data) return new Response('Not found', { status: 404 });
  const u = data.units.find((x) => x.id === unit);
  if (!u) return new Response('Not found', { status: 404 });
  return Response.json({ project: { id: data.id, name: data.name }, unit: u });
}

