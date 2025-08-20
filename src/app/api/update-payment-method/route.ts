import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import admin from 'firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

// Attach a new payment method to the Stripe customer
export async function POST(req: NextRequest) {
  try {
    const { uid, paymentMethodId } = await req.json();
    if (!uid || !paymentMethodId) {
      return NextResponse.json({ error: 'Missing user UID or payment method ID' }, { status: 400 });
    }
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();
    if (!userData || !userData.stripeCustomerId) {
      return NextResponse.json({ error: 'No Stripe customer ID found' }, { status: 404 });
    }
    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: userData.stripeCustomerId,
    });
    // Set as default payment method for invoices
    await stripe.customers.update(userData.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    let message = 'Unknown error';
    if (err instanceof Error) message = err.message;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
