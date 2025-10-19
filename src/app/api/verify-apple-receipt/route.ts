import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { receipt } = await req.json();
    
    if (!receipt) {
      return NextResponse.json({ error: 'Missing receipt' }, { status: 400 });
    }

    // Verify with Apple's servers
    const response = await fetch('https://buy.itunes.apple.com/verifyReceipt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        'receipt-data': receipt,
        'password': process.env.APPLE_SHARED_SECRET, // From App Store Connect
        'exclude-old-transactions': true
      })
    });
    
    const data = await response.json();
    
    if (data.status === 0) {
      // Valid receipt
      return NextResponse.json({ valid: true, data });
    } else {
      // Invalid receipt
      return NextResponse.json({ valid: false, error: data.status });
    }
  } catch (error) {
    console.error('Receipt verification error:', error);
    return NextResponse.json({ valid: false, error: 'Verification failed' });
  }
}




