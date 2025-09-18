import { NextRequest } from 'next/server';
import { stripe, prices } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import { getAuthContext } from '@/lib/clerk';

export async function POST(req: NextRequest) {
  const { builderSlug } = await getAuthContext();
  const builder = await prisma.builder.findUnique({ where: { slug: builderSlug }, include: { subscription: true } });
  if (!builder) return new Response('Builder not found', { status: 404 });

  let sub = builder.subscription;
  if (!sub) {
    sub = await prisma.subscription.create({ data: { builderId: builder.id, status: 'CANCELED', plan: 'STARTER' } });
  }

  let customerId = sub.stripeCustomerId || undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({ name: builder.name });
    customerId = customer.id;
    await prisma.subscription.update({ where: { id: sub.id }, data: { stripeCustomerId: customerId } });
  }

  let priceId = prices.PRO_MONTH;
  // Accept body as formData or JSON
  try {
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await req.json().catch(() => ({}));
      if (body.billingInterval === 'year') priceId = prices.PRO_YEAR || prices.PRO_MONTH;
    } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const form = await req.formData();
      const interval = String(form.get('billingInterval') || 'month');
      if (interval === 'year') priceId = prices.PRO_YEAR || prices.PRO_MONTH;
    }
  } catch {}

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=1`,
  });

  return new Response(null, { status: 303, headers: { Location: session.url || '/' } });
}
