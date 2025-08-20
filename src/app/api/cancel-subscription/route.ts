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

export async function POST(req: NextRequest) {
  try {
    const { uid } = await req.json();
    if (!uid) return NextResponse.json({ error: 'Missing user UID' }, { status: 400 });
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();
    if (!userData || !userData.stripeCustomerId) {
      // No Stripe customer, but still allow marking cancelRequested for one-time premium
      await db.collection('users').doc(uid).set({
        premium: {
          ...userData?.premium,
          cancelRequested: true,
        },
      }, { merge: true });
      return NextResponse.json({ success: true, info: 'No Stripe customer, marked cancelRequested.' });
    }
    // Find active subscription for this customer
    const subs = await stripe.subscriptions.list({ customer: userData.stripeCustomerId, status: 'active', limit: 1 });
    if (!subs.data.length) {
      // No active subscription, but still allow marking cancelRequested for one-time premium
      await db.collection('users').doc(uid).set({
        premium: {
          ...userData.premium,
          cancelRequested: true,
        },
      }, { merge: true });
      return NextResponse.json({ success: true, info: 'No active subscription, marked cancelRequested.' });
    }
    const subId = subs.data[0].id;
    await stripe.subscriptions.update(subId, { cancel_at_period_end: true });
    // Update Firestore to reflect cancellation
    await db.collection('users').doc(uid).set({
      premium: {
        ...userData.premium,
        cancelRequested: true,
      },
    }, { merge: true });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    let message = 'Unknown error';
    if (err instanceof Error) message = err.message;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
