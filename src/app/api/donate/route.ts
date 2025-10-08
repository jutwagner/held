import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const ALLOWED_AMOUNTS = [0.01, 1, 5, 10, 20, 50];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const amount = Number(body?.amount);
    const email = typeof body?.email === 'string' ? body.email.trim() : undefined;

    if (!ALLOWED_AMOUNTS.includes(amount)) {
      return NextResponse.json({ error: 'Invalid donation amount.' }, { status: 400 });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      receipt_email: email || undefined,
      metadata: {
        type: 'donation',
        amount: amount.toString(),
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('[DONATION] Error creating payment intent:', error);
    return NextResponse.json({ error: 'Unable to process donation.' }, { status: 500 });
  }
}
