import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });

export const prices = {
  PRO_MONTH: process.env.STRIPE_PRICE_PRO_MONTH!,
  PRO_YEAR: process.env.STRIPE_PRICE_PRO_YEAR!,
};

