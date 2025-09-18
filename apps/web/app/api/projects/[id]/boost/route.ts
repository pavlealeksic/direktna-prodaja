import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthContext, hasActiveSubscription } from '@/lib/clerk';
import { requireRole, Roles } from '@/lib/rbac';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext();
  requireRole(ctx, Roles.OwnerOrManager as any);
  if (!(await hasActiveSubscription())) return new Response('Subscription required', { status: 402 });
  const form = await req.formData();
  const boosted = form.get('boosted') === 'on';
  const updated = await prisma.project.update({ where: { id: params.id }, data: { boosted } });
  revalidatePath('/explore');
  revalidatePath(`/${ctx.builderSlug}/${updated.micrositeSlug}`);
  return new Response(null, { status: 302, headers: { Location: `/projects/${updated.id}` } });
}
