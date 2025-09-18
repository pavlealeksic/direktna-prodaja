import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { orgId } = auth();
  if (!orgId) return new Response('No organization', { status: 400 });
  const { role } = await req.json();
  await clerkClient.organizations.updateOrganizationMembership({ organizationId: orgId, userId: params.id, role });
  return Response.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { orgId } = auth();
  if (!orgId) return new Response('No organization', { status: 400 });
  await clerkClient.organizations.deleteOrganizationMembership({ organizationId: orgId, userId: params.id });
  return Response.json({ ok: true });
}

