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

// Get invoice history for a Stripe customer
export async function POST(req: NextRequest) {
  try {
    const { uid } = await req.json();
    if (!uid) {
      return NextResponse.json({ error: 'Missing user UID' }, { status: 400 });
    }
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();
    if (!userData || !userData.stripeCustomerId) {
      return NextResponse.json({ invoices: [] });
    }
    const invoices = await stripe.invoices.list({ customer: userData.stripeCustomerId, limit: 10 });
    return NextResponse.json({ invoices: invoices.data });
  } catch (err: unknown) {
    let message = 'Unknown error';
    if (err instanceof Error) message = err.message;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
