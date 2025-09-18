import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthContext } from '@/lib/clerk';
import { requireRole, Roles } from '@/lib/rbac';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext(); // ensure authenticated
  requireRole(ctx, Roles.SalesOrAbove as any);
  const form = await req.formData();
  const status = String(form.get('status')) as 'AVAILABLE' | 'RESERVED' | 'SOLD';
  const updated = await prisma.apartmentUnit.update({ where: { id: params.id }, data: { status }, include: { project: true } });
  revalidatePath(`/${ctx.builderSlug}/${updated.project.micrositeSlug}`);
  return new Response(null, { status: 302, headers: { Location: req.headers.get('referer') || '/projects' } });
}
