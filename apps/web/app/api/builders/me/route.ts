import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthContext } from '@/lib/clerk';
import { requireRole, Roles } from '@/lib/rbac';

export async function GET() {
  const { builderSlug } = await getAuthContext();
  const b = await prisma.builder.findUnique({ where: { slug: builderSlug } });
  if (!b) return new Response('Not found', { status: 404 });
  return Response.json(b);
}

export async function PATCH(req: NextRequest) {
  const ctx = await getAuthContext();
  requireRole(ctx, Roles.OwnerOrManager as any);
  const body = await req.json();
  const { name, logoUrl, contactEmail, contactPhone, website, companyInfo, calendlyUrl, customDomain } = body;
  const b = await prisma.builder.update({ where: { slug: ctx.builderSlug }, data: { name, logoUrl, contactEmail, contactPhone, website, companyInfo, calendlyUrl, customDomain } });
  return Response.json(b);
}
