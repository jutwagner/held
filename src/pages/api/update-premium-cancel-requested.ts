import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[PREMIUM CANCEL REQUEST] Request body:', req.body);
    console.log('[PREMIUM CANCEL REQUEST] Request headers:', req.headers);
    
    const { uid, cancelRequested } = req.body;
    console.log('[PREMIUM CANCEL REQUEST] Incoming:', { uid, cancelRequested });
    
    if (!uid || typeof cancelRequested === 'undefined') {
      console.warn('[PREMIUM CANCEL REQUEST] Missing uid or cancelRequested', { uid, cancelRequested });
      return res.status(400).json({ error: 'Missing uid or cancelRequested in request body' });
    }

    const { db } = await import('@/lib/firebase.admin');
    const userRef = db.collection('users').doc(uid);
    
    try {
      await userRef.set({
        premium: {
          cancelRequested,
        },
      }, { merge: true });
      
      console.log('[PREMIUM CANCEL REQUEST] Firestore updated for uid:', uid);
      return res.status(200).json({ success: true });
    } catch (firestoreError) {
      console.error('[PREMIUM CANCEL REQUEST] Firestore error:', firestoreError);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

