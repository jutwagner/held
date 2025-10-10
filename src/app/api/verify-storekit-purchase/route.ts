import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase.admin';

export async function POST(req: NextRequest) {
  try {
    const { uid, productId, transactionId, receipt } = await req.json();

    if (!uid || !productId || !transactionId || !receipt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // In a real implementation, you would verify the receipt with Apple's servers
    // For now, this is a placeholder that accepts any valid-looking receipt
    const isValidReceipt = receipt.length > 10; // Basic validation

    if (!isValidReceipt) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid receipt' 
      });
    }

    // Check if this transaction has already been processed
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();

    if (userData?.premium?.active) {
      return NextResponse.json({ 
        success: true, 
        message: 'Subscription already active' 
      });
    }

    // Update user's premium status
    await db.collection('users').doc(uid).update({
      'premium.active': true,
      'premium.plan': 'heldplus',
      'premium.since': Date.now(),
      'premium.renewsAt': Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days from now
      'premium.cancelRequested': false,
      'premium.storekitTransactionId': transactionId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('StoreKit verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify purchase' },
      { status: 500 }
    );
  }
}

