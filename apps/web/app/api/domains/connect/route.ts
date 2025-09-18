import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthContext } from '@/lib/clerk';
import { requireRole, Roles } from '@/lib/rbac';
import { addDomainToProject, getDomainStatus } from '@/lib/vercel';

export async function POST(_req: NextRequest) {
  const ctx = await getAuthContext();
  requireRole(ctx, Roles.OwnerOrManager as any);
  const builder = await prisma.builder.findUnique({ where: { slug: ctx.builderSlug } });
  if (!builder?.customDomain) return new Response('No custom domain set in settings', { status: 400 });
  const info = await addDomainToProject(builder.customDomain);
  const status = await getDomainStatus(builder.customDomain);
  return Response.json({ info, status });
}

