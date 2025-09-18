import { NextRequest } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import { getAuthContext } from '@/lib/clerk';

export async function POST(_req: NextRequest) {
  const { builderSlug } = await getAuthContext();
  const builder = await prisma.builder.findUnique({ where: { slug: builderSlug }, include: { subscription: true } });
  const customerId = builder?.subscription?.stripeCustomerId;
  if (!customerId) return new Response('No customer', { status: 400 });
  const session = await stripe.billingPortal.sessions.create({ customer: customerId, return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing` });
  return new Response(null, { status: 303, headers: { Location: session.url || '/' } });
}
