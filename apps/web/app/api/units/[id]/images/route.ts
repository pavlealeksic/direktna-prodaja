import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthContext } from '@/lib/clerk';
import { requireRole, Roles } from '@/lib/rbac';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext();
  requireRole(ctx, Roles.OwnerOrManager as any);
  const { url } = await req.json();
  if (!url) return new Response('Missing url', { status: 400 });
  const unit = await prisma.apartmentUnit.update({ where: { id: params.id }, data: { images: { push: url } }, include: { project: true } });
  revalidatePath(`/${ctx.builderSlug}/${unit.project.micrositeSlug}`);
  return Response.json(unit);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext();
  requireRole(ctx, Roles.OwnerOrManager as any);
  const u = new URL(req.url);
  const url = u.searchParams.get('url');
  if (!url) return new Response('Missing url', { status: 400 });
  const current = await prisma.apartmentUnit.findUnique({ where: { id: params.id } });
  const images = (current?.images as string[] | null)?.filter((x) => x !== url) ?? [];
  const unit = await prisma.apartmentUnit.update({ where: { id: params.id }, data: { images }, include: { project: true } });
  revalidatePath(`/${ctx.builderSlug}/${unit.project.micrositeSlug}`);
  return Response.json(unit);
}
