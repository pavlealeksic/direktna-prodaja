import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthContext } from '@/lib/clerk';
import { requireRole, Roles } from '@/lib/rbac';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const fps = await prisma.floorPlan.findMany({ where: { projectId: params.id } });
  return Response.json({ floorPlans: fps });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext();
  requireRole(ctx, Roles.OwnerOrManager as any);
  const { floor, imageUrl } = await req.json();
  if (typeof floor !== 'number' || !imageUrl) return new Response('Invalid', { status: 400 });
  const upsert = await prisma.floorPlan.upsert({ where: { projectId_floor: { projectId: params.id, floor } }, create: { projectId: params.id, floor, imageUrl }, update: { imageUrl } });
  return Response.json(upsert);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext();
  requireRole(ctx, Roles.OwnerOrManager as any);
  const url = new URL(req.url);
  const floor = Number(url.searchParams.get('floor'));
  if (!floor && floor !== 0) return new Response('Missing floor', { status: 400 });
  await prisma.floorPlan.delete({ where: { projectId_floor: { projectId: params.id, floor } } });
  return Response.json({ ok: true });
}

