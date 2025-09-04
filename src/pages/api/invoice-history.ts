import type { NextApiRequest, NextApiResponse } from 'next';

// TODO: Replace with real Stripe invoice fetching logic
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[INVOICE HISTORY] Request method:', req.method);
    console.log('[INVOICE HISTORY] Request body:', req.body);
    console.log('[INVOICE HISTORY] Request query:', req.query);
    
    // For now, return mock invoice data
    let uid: string;
    
    if (req.method === 'POST') {
      const { uid: bodyUid } = req.body;
      uid = bodyUid;
    } else {
      // For GET requests, try to get uid from query params
      const { uid: queryUid } = req.query;
      uid = Array.isArray(queryUid) ? queryUid[0] : queryUid;
    }
    
    console.log('[INVOICE HISTORY] Extracted uid:', uid);
    
    if (!uid) {
      return res.status(400).json({ error: 'Missing uid in request body or query params' });
    }
    // Example mock data
    const invoices = [
      {
        id: 'inv_001',
        amount: 1200,
        currency: 'usd',
        status: 'paid',
        date: Date.now() - 86400000,
      },
      {
        id: 'inv_002',
        amount: 1200,
        currency: 'usd',
        status: 'open',
        date: Date.now(),
      },
    ];
    return res.status(200).json({ invoices });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
