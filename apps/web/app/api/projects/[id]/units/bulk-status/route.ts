import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthContext } from '@/lib/clerk';
import { requireRole, Roles } from '@/lib/rbac';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext();
  requireRole(ctx, Roles.SalesOrAbove as any);
  const form = await req.formData();
  const status = String(form.get('status')) as 'AVAILABLE' | 'RESERVED' | 'SOLD';
  const unitIds = form.getAll('unitId').map((v) => String(v));
  if (!status || unitIds.length === 0) return new Response('Missing selection', { status: 400 });
  await prisma.apartmentUnit.updateMany({ where: { id: { in: unitIds }, projectId: params.id }, data: { status } });
  const project = await prisma.project.findUnique({ where: { id: params.id }, select: { micrositeSlug: true } });
  if (project) revalidatePath(`/${ctx.builderSlug}/${project.micrositeSlug}`);
  return new Response(null, { status: 302, headers: { Location: `/projects/${params.id}` } });
}

