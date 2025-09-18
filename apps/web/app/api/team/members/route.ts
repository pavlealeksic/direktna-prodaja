import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';

export async function GET() {
  const { orgId } = auth();
  if (!orgId) return new Response('No organization', { status: 400 });
  const list = await clerkClient.organizations.getOrganizationMembershipList({ organizationId: orgId });
  const members = list.data.map((m) => ({ id: m.id, role: m.role, email: m.publicUserData?.identifier, name: m.publicUserData?.firstName || m.publicUserData?.identifier }));
  return Response.json({ members });
}

export async function POST(req: NextRequest) {
  const { orgId } = auth();
  if (!orgId) return new Response('No organization', { status: 400 });
  const { email, role } = await req.json();
  if (!email || !role) return new Response('Missing email/role', { status: 400 });
  const invitation = await clerkClient.organizations.createOrganizationInvitation({ organizationId: orgId, emailAddress: email, role });
  return Response.json({ invitation });
}

