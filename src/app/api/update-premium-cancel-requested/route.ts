import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Initialize Firebase Admin (env cert fallback)
if (!admin.apps.length) {
  try {
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
  } catch (e) {
    console.error('[update-premium-cancel-requested] Admin init failed:', e);
  }
}

export async function POST(req: NextRequest) {
  if (!admin.apps.length) {
    return NextResponse.json({ error: 'Firebase Admin not initialized. Set GOOGLE_APPLICATION_CREDENTIALS.' }, { status: 500 });
  }

  try {
    const { uid, cancelRequested } = await req.json();
    if (!uid || typeof cancelRequested === 'undefined') {
      return NextResponse.json({ error: 'Missing uid or cancelRequested' }, { status: 400 });
    }
    const db = admin.firestore();
    await db.collection('users').doc(uid).set({
      premium: { cancelRequested },
    }, { merge: true });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[update-premium-cancel-requested] Error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
