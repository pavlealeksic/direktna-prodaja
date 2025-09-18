import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthContext } from '@/lib/clerk';
import { requireRole, Roles } from '@/lib/rbac';
import { revalidatePath } from 'next/cache';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  await getAuthContext();
  const p = await prisma.project.findUnique({ where: { id: params.id } });
  if (!p) return new Response('Not found', { status: 404 });
  return Response.json(p);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext();
  requireRole(ctx, Roles.OwnerOrManager as any);
  const body = await req.json();
  const { name, location, brandColor, description, heroImageUrl, phase, amenities } = body;
  const updated = await prisma.project.update({ where: { id: params.id }, data: { name, location, brandColor, description, heroImageUrl, phase, amenities } });
  revalidatePath(`/${ctx.builderSlug}/${updated.micrositeSlug}`);
  revalidatePath('/explore');
  return Response.json(updated);
}
