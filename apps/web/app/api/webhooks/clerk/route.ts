import { headers } from 'next/headers';
import { NextRequest } from 'next/server';
import { Webhook } from 'svix';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const h = headers();

  const svix_id = h.get('svix-id');
  const svix_timestamp = h.get('svix-timestamp');
  const svix_signature = h.get('svix-signature');
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Missing svix headers', { status: 400 });
  }

  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
  let evt: any;
  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (e) {
    return new Response('Invalid signature', { status: 400 });
  }

  const type = evt.type as string;
  // Sync builder/org into DB and subscription status from metadata
  if (type === 'organization.created' || type === 'organization.updated') {
    const org = evt.data;
    const slug = org.slug || org.id;
    const name = org.name || slug;
    await prisma.builder.upsert({
      where: { slug },
      update: { name, clerkOrgId: org.id },
      create: { slug, name, ownerUserId: '', clerkOrgId: org.id },
    });
    return new Response('ok');
  }
  if (type.startsWith('billing.')) {
    // Example: billing.subscription.updated → mirror status into our DB subscription if needed
    // We prefer checking Clerk for truth at runtime; no DB write is required here.
    return new Response('ok');
  }

  return new Response('ignored', { status: 200 });
}

export const dynamic = 'force-dynamic';
