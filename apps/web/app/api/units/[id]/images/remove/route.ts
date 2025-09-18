import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthContext } from '@/lib/clerk';
import { requireRole, Roles } from '@/lib/rbac';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext();
  requireRole(ctx, Roles.OwnerOrManager as any);
  const { urls } = await req.json();
  if (!Array.isArray(urls)) return new Response('Invalid', { status: 400 });
  const current = await prisma.apartmentUnit.findUnique({ where: { id: params.id }, include: { project: true } });
  const images = ((current?.images as string[] | null) || []).filter((u) => !urls.includes(u));
  const unit = await prisma.apartmentUnit.update({ where: { id: params.id }, data: { images }, include: { project: true } });
  revalidatePath(`/${ctx.builderSlug}/${unit.project.micrositeSlug}`);
  return Response.json(unit);
}

