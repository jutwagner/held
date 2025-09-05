import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import admin from 'firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

if (!admin.apps.length) {
  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env as Record<string, string | undefined>;
  if (FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  } else {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }
}

const db = admin.firestore();

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  const buf = await req.arrayBuffer();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(Buffer.from(buf), sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: unknown) {
    let message = 'Webhook Error';
    if (err instanceof Error) message = err.message;
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const customerId = session.customer as string;
    const uid = session.metadata?.uid;
    console.log('[STRIPE WEBHOOK] checkout.session.completed', { uid, customerId });
    if (uid && customerId) {
      await db.collection('users').doc(uid).set({
        stripeCustomerId: customerId,
        premium: {
          active: true,
          plan: 'heldplus',
          since: Date.now(),
          renewsAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
          cancelRequested: admin.firestore.FieldValue.delete(),
        },
      }, { merge: true });
      console.log('[STRIPE WEBHOOK] Firestore updated for checkout.session.completed', { uid });
    } else {
      console.warn('[STRIPE WEBHOOK] Missing uid or customerId in checkout.session.completed', { uid, customerId });
    }
  }

  // Handle PaymentIntent flow for Stripe Elements
  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object as Stripe.PaymentIntent;
    const customerId = intent.customer as string;
    const uid = intent.metadata?.uid;
    console.log('[STRIPE WEBHOOK] payment_intent.succeeded', { uid, customerId });
    if (uid) {
      await db.collection('users').doc(uid).set({
        stripeCustomerId: customerId || '',
        premium: {
          active: true,
          plan: 'heldplus',
          since: Date.now(),
          renewsAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
          cancelRequested: admin.firestore.FieldValue.delete(),
        },
      }, { merge: true });
      console.log('[STRIPE WEBHOOK] Firestore updated for payment_intent.succeeded', { uid });
    } else {
      console.warn('[STRIPE WEBHOOK] Missing uid in payment_intent.succeeded', { uid });
    }
  }

  return NextResponse.json({ received: true });
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
