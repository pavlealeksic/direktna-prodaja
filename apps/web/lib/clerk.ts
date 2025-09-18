import { auth, clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

export type AuthContext = {
  userId: string;
  orgId?: string | null;
  builderSlug: string;
  role: 'owner' | 'manager' | 'sales' | 'member';
};

export async function getAuthContext(): Promise<AuthContext> {
  const a = auth();
  if (!a.userId) throw new Error('Unauthorized');
  let builderSlug = 'builder';
  let role: AuthContext['role'] = 'member';
  if (a.orgId) {
    try {
      const org = await clerkClient.organizations.getOrganization({ organizationId: a.orgId });
      builderSlug = org.slug ?? org.id;
      // determine role from membership
      const memberships = await clerkClient.organizations.getOrganizationMembershipList({ organizationId: a.orgId });
      const me = memberships.data.find((m) => m.publicUserData?.userId === a.userId);
      const clerkRole = me?.role as string | undefined;
      role = clerkRole === 'org:admin' || clerkRole === 'owner' ? 'owner' : clerkRole === 'manager' ? 'manager' : clerkRole === 'basic_member' ? 'member' : 'sales';
    } catch {
      builderSlug = a.orgId;
    }
  } else {
    builderSlug = `user-${a.userId.slice(0, 6)}`;
    role = 'owner';
  }
  return { userId: a.userId, orgId: a.orgId, builderSlug, role };
}

export async function hasActiveSubscription(): Promise<boolean> {
  const a = auth();
  if (!a.userId) return false;
  // Determine builder from org or user
  let builderSlug: string | null = null;
  if (a.orgId) {
    try {
      const org = await clerkClient.organizations.getOrganization({ organizationId: a.orgId });
      builderSlug = org.slug ?? org.id;
    } catch {}
  } else {
    builderSlug = `user-${a.userId.slice(0, 6)}`;
  }
  if (!builderSlug) return false;
  const builder = await prisma.builder.findUnique({ where: { slug: builderSlug }, include: { subscription: true } });
  if (!builder?.subscription) return false;
  return builder.subscription.status === 'ACTIVE';
}

// Billing portal handled via Stripe now.
export async function getBillingPortalUrl(): Promise<string | null> {
  return null;
}
