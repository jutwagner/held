import { NextApiRequest, NextApiResponse } from 'next';
import { updateObjectAnchoring } from '@/lib/firebase-services';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { objectId, anchoring } = req.body;

    if (!objectId || !anchoring) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Update the object's anchoring data in Firestore
    await updateObjectAnchoring(objectId, anchoring);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error updating anchoring:', error);
    res.status(500).json({ 
      error: 'Failed to update anchoring',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
