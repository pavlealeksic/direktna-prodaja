import { auth } from '@clerk/nextjs/server';
import { hasActiveSubscription } from '@/lib/clerk';
import { prisma } from '@/lib/db';
import { stripe, prices as priceIds } from '@/lib/stripe';

export default async function BillingPage() {
  const { userId, orgId } = auth();
  if (!userId) return <main><h1>Unauthorized</h1></main>;
  const active = await hasActiveSubscription();
  // Resolve builder and subscription
  let builderSlug = 'builder';
  if (orgId) {
    builderSlug = '';
  } else {
    builderSlug = `user-${userId.slice(0, 6)}`;
  }
  const builder = await prisma.builder.findFirst({ where: orgId ? { clerkOrgId: orgId } : { slug: builderSlug }, include: { subscription: true } });
  const plan = builder?.subscription?.plan || 'STARTER';
  // Fetch Stripe prices for labels
  let monthlyLabel = 'Monthly';
  let yearlyLabel = 'Yearly';
  try {
    if (priceIds.PRO_MONTH) {
      const pm = await stripe.prices.retrieve(priceIds.PRO_MONTH);
      if (pm.unit_amount && pm.currency) {
        const amt = (pm.unit_amount / 100).toLocaleString(undefined, { style: 'currency', currency: pm.currency.toUpperCase() });
        monthlyLabel = `Monthly (${amt}/mo)`;
      }
    }
    if (priceIds.PRO_YEAR) {
      const py = await stripe.prices.retrieve(priceIds.PRO_YEAR);
      if (py.unit_amount && py.currency) {
        const amt = (py.unit_amount / 100).toLocaleString(undefined, { style: 'currency', currency: py.currency.toUpperCase() });
        yearlyLabel = `Yearly (${amt}/yr)`;
      }
    }
  } catch {}

  return (
    <main className="grid" style={{ gap: 16 }}>
      <h1>Billing</h1>
      <p>Plan: <strong>{plan}</strong> {active ? '(active)' : '(inactive)'}</p>
      {!active && (
        <form action="/api/billing/checkout" method="post" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div>
            <label style={{ marginRight: 8 }}><input type="radio" name="billingInterval" value="month" defaultChecked /> {monthlyLabel}</label>
            <label><input type="radio" name="billingInterval" value="year" /> {yearlyLabel}</label>
          </div>
          <button className="btn">Upgrade to Pro</button>
        </form>
      )}
      <form action="/api/billing/portal" method="post" style={{ display: 'flex', gap: 8 }}>
        {active && <button className="btn">Open Billing Portal</button>}
      </form>
    </main>
  );
}
