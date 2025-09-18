import { NextRequest } from 'next/server';
import { getAuthContext } from '@/lib/clerk';
import { requireRole, Roles } from '@/lib/rbac';
import { getDomainStatus } from '@/lib/vercel';
import { prisma } from '@/lib/db';

export async function GET(_req: NextRequest) {
  const ctx = await getAuthContext();
  requireRole(ctx, Roles.OwnerOrManager as any);
  const builder = await prisma.builder.findUnique({ where: { slug: ctx.builderSlug } });
  if (!builder?.customDomain) return new Response('No custom domain', { status: 400 });
  const status = await getDomainStatus(builder.customDomain);
  return Response.json(status);
}

