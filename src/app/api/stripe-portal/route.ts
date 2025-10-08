import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import admin from 'firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

export async function POST(req: NextRequest) {
  try {
    // Get user from request (assume Firebase Auth cookie)
    const { uid } = await req.json();
    if (!uid) {
      return NextResponse.json({ error: 'Missing user UID' }, { status: 400 });
    }
    // Get Stripe customer ID from Firestore user doc
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();
    if (!userData || !userData.stripeCustomerId) {
      return NextResponse.json({ error: 'No Stripe customer ID found' }, { status: 404 });
    }
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: userData.stripeCustomerId,
      return_url: process.env.STRIPE_PORTAL_RETURN_URL || 'http://localhost:3000/settings/premium',
    });
    return NextResponse.json({ url: portalSession.url });
  } catch (err: unknown) {
    let message = 'Unknown error';
    if (err instanceof Error) message = err.message;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ error: 'Use POST with user UID' }, { status: 405 });
}
