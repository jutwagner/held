import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const uid = body?.uid;
    const email = body?.email;
    console.log('[PAYMENT INTENT] Incoming request:', { uid, email });

    // Find or create Stripe customer for this user
    let customerId = undefined;
    if (email) {
      // Search for existing customer by email
      const customers = await stripe.customers.list({ email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      } else {
        const customer = await stripe.customers.create({ email, metadata: { uid } });
        customerId = customer.id;
      }
    }

    // Set the amount and currency for Held+ (e.g., $10.00)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1000, // $10.00 in cents
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: uid ? { uid } : undefined,
      customer: customerId,
    });
    console.log('[PAYMENT INTENT] Created:', { id: paymentIntent.id, metadata: paymentIntent.metadata });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('[PAYMENT INTENT] Error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
