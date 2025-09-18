import { headers } from 'next/headers';
import { NextRequest } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const sig = headers().get('stripe-signature') as string;
  let event: any;
  try {
    event = stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as any;
      // Find subscription
      const subId = session.subscription as string | undefined;
      const customerId = session.customer as string;
      if (customerId) {
        // Link to our Subscription
        const sub = await prisma.subscription.findFirst({ where: { stripeCustomerId: customerId } });
        if (sub) {
          await prisma.subscription.update({ where: { id: sub.id }, data: { stripeSubId: subId || sub.stripeSubId || undefined, status: 'ACTIVE', plan: 'PRO' } });
        }
      }
      break;
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.created': {
      const subObj = event.data.object as any;
      const customerId = subObj.customer as string;
      const statusMap: any = { active: 'ACTIVE', trialing: 'ACTIVE', past_due: 'PAST_DUE', canceled: 'CANCELED', unpaid: 'PAST_DUE' };
      const sub = await prisma.subscription.findFirst({ where: { stripeCustomerId: customerId } });
      if (sub) {
        await prisma.subscription.update({ where: { id: sub.id }, data: { stripeSubId: subObj.id, status: statusMap[subObj.status] || 'ACTIVE', plan: 'PRO' } });
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const subObj = event.data.object as any;
      const customerId = subObj.customer as string;
      const sub = await prisma.subscription.findFirst({ where: { stripeCustomerId: customerId } });
      if (sub) {
        await prisma.subscription.update({ where: { id: sub.id }, data: { status: 'CANCELED' } });
      }
      break;
    }
  }

  return new Response('ok');
}

export const dynamic = 'force-dynamic';

