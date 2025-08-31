import type { NextApiRequest, NextApiResponse } from 'next';

// TODO: Replace with real Stripe invoice fetching logic
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // For now, return mock invoice data
    const { uid } = req.body;
    if (!uid) {
      return res.status(400).json({ error: 'Missing uid in request body' });
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
