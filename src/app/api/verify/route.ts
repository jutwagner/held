import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { getWorkingPolygonProvider } from '@/lib/polygon-provider';
import { HELD_ANCHORS_CONTRACT, generateCoreDigest, generateFullDigest } from '@/lib/blockchain-services';

export async function POST(req: NextRequest) {
  try {
    const { passport, kind = 'core' } = await req.json();
    if (!passport?.id) {
      return NextResponse.json({ error: 'Missing passport.id' }, { status: 400 });
    }

    const provider = await getWorkingPolygonProvider();
    const contract = new ethers.Contract(HELD_ANCHORS_CONTRACT.address, HELD_ANCHORS_CONTRACT.abi, provider);

    const digest = kind === 'full' ? generateFullDigest(passport) : generateCoreDigest(passport);
    const passportId = ethers.utils.formatBytes32String(String(passport.id));

    const events = await contract.queryFilter(contract.filters.Anchored(passportId, digest), 0, 'latest');
    if (events.length === 0) {
      return NextResponse.json({ isAnchored: false });
    }
    const latest = events[events.length - 1];
    return NextResponse.json({ isAnchored: true, txHash: latest.transactionHash, blockNumber: latest.blockNumber });
  } catch (err: any) {
    console.error('[API/verify] Error:', err);
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  }
}
export const runtime = 'nodejs';
