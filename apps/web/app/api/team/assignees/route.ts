import { auth, clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { NextRequest } from 'next/server';

export async function GET() {
  const { orgId } = auth();
  if (!orgId) return new Response('No organization', { status: 400 });
  // Find builder by org id
  const builder = await prisma.builder.findFirst({ where: { clerkOrgId: orgId } });
  if (!builder) return new Response('Builder not found', { status: 404 });
  const [memberships, eligible] = await Promise.all([
    clerkClient.organizations.getOrganizationMembershipList({ organizationId: orgId }),
    prisma.eligibleAssignee.findMany({ where: { builderId: builder.id } }),
  ]);
  const eligibleSet = new Set(eligible.map((e) => e.userId));
  const members = memberships.data.map((m) => ({
    userId: m.publicUserData?.userId as string,
    email: m.publicUserData?.identifier,
    name: m.publicUserData?.firstName || m.publicUserData?.identifier,
    role: m.role,
    eligible: eligibleSet.has(m.publicUserData?.userId as string),
  }));
  return Response.json({ members });
}

export async function POST(req: NextRequest) {
  const { orgId } = auth();
  if (!orgId) return new Response('No organization', { status: 400 });
  const builder = await prisma.builder.findFirst({ where: { clerkOrgId: orgId } });
  if (!builder) return new Response('Builder not found', { status: 404 });
  const { userId, eligible } = await req.json();
  if (!userId || typeof eligible !== 'boolean') return new Response('Invalid', { status: 400 });
  if (eligible) {
    await prisma.eligibleAssignee.upsert({ where: { builderId_userId: { builderId: builder.id, userId } }, create: { builderId: builder.id, userId }, update: {} });
  } else {
    await prisma.eligibleAssignee.delete({ where: { builderId_userId: { builderId: builder.id, userId } } }).catch(() => {});
  }
  return Response.json({ ok: true });
}

