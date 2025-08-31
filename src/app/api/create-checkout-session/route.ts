import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

export async function POST(req: NextRequest) {
  try {
    const { uid, email } = await req.json();
    console.log('[CHECKOUT SESSION] Creating session with:', { uid, email });
    if (!uid || !email) {
      console.warn('[CHECKOUT SESSION] Missing uid or email', { uid, email });
      return NextResponse.json({ error: 'Missing user UID or email' }, { status: 400 });
    }
    // Create a Stripe Checkout Session for Held+ subscription
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email,
      line_items: [
        {
          price: process.env.STRIPE_HELDPLUS_PRICE_ID!, // Your Stripe price ID for Held+
          quantity: 1,
        },
      ],
      success_url: process.env.STRIPE_SUCCESS_URL || 'http://localhost:3000/settings/premium?success=true',
      cancel_url: process.env.STRIPE_CANCEL_URL || 'http://localhost:3000/settings/premium?canceled=true',
      metadata: { uid },
    });
    console.log('[CHECKOUT SESSION] Session created:', { id: session.id, url: session.url, metadata: session.metadata });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('[CHECKOUT SESSION] Error creating session:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
