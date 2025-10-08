import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/firebase.admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
    }

    // Get user's latest subscription status from Firestore
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();

    if (userData?.premium?.active) {
      return NextResponse.json({ success: true });
    }

    // Check for recent Stripe sessions
    const sessions = await stripe.checkout.sessions.list({
      limit: 10,
      customer_email: userData?.email,
    });

    const completedSession = sessions.data.find(
      session => session.payment_status === 'paid' && session.status === 'complete'
    );

    if (completedSession) {
      // Update user's premium status
      await db.collection('users').doc(uid).update({
        'premium.active': true,
        'premium.plan': 'heldplus',
        'premium.since': Date.now(),
        'premium.renewsAt': Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days from now
        'premium.cancelRequested': false,
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false });
  } catch (error) {
    console.error('Payment status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    );
  }
}
