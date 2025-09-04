import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase.admin';
import { ethers } from 'ethers';
import { getWorkingPolygonProvider } from '@/lib/polygon-provider';
import { HELD_ANCHORS_CONTRACT, generateCoreDigest, generateFullDigest } from '@/lib/blockchain-services';

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('x-anchor-token');
    if (!process.env.ANCHOR_ADMIN_TOKEN || token !== process.env.ANCHOR_ADMIN_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { objectId, kind = 'core', uri = '', version = 1 } = await req.json();
    if (!objectId) return NextResponse.json({ error: 'Missing objectId' }, { status: 400 });

    const doc = await db.collection('objects').doc(objectId).get();
    if (!doc.exists) return NextResponse.json({ error: 'Object not found' }, { status: 404 });
    const passport = { id: doc.id, ...doc.data() } as any;

    const pk = process.env.PRIVATE_KEY;
    if (!pk) return NextResponse.json({ error: 'Server PRIVATE_KEY not configured' }, { status: 500 });

    const provider = await getWorkingPolygonProvider();
    const signer = new ethers.Wallet(pk, provider);
    const contract = new ethers.Contract(HELD_ANCHORS_CONTRACT.address, HELD_ANCHORS_CONTRACT.abi, signer);

    const digest = kind === 'full' ? generateFullDigest(passport) : generateCoreDigest(passport);
    const passportId = ethers.utils.formatBytes32String(String(passport.id));
    const tx = await contract.anchor(passportId, digest, 'keccak256', uri, ethers.BigNumber.from(version));
    const receipt = await tx.wait();

    // Persist to Firestore document
    await db.collection('objects').doc(objectId).update({
      anchoring: {
        isAnchored: true,
        txHash: tx.hash,
        digest,
        version,
        anchoredAt: new Date(),
        uri,
        blockNumber: receipt?.blockNumber,
      },
      updatedAt: new Date(),
    });

    return NextResponse.json({ txHash: tx.hash, digest, passportId, blockNumber: receipt?.blockNumber });
  } catch (err: any) {
    console.error('[API/admin/anchor-object] Error:', err);
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  }
}
export const runtime = 'nodejs';
