import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { getWorkingPolygonProvider } from '@/lib/polygon-provider';
import { HELD_ANCHORS_CONTRACT } from '@/lib/blockchain-services';

export async function POST(req: NextRequest) {
  try {
    const { passport } = await req.json();
    if (!passport?.id) {
      return NextResponse.json({ error: 'Missing passport.id' }, { status: 400 });
    }

    const provider = await getWorkingPolygonProvider();
    const contract = new ethers.Contract(HELD_ANCHORS_CONTRACT.address, HELD_ANCHORS_CONTRACT.abi, provider);

    const passportId = ethers.utils.formatBytes32String(String(passport.id));
    const events = await contract.queryFilter(contract.filters.Anchored(passportId), 0, 'latest');
    if (events.length === 0) return NextResponse.json({ latest: null });

    const latest = events[events.length - 1];
    const args = latest.args;
    if (!args) return NextResponse.json({ latest: null });

    return NextResponse.json({
      latest: {
        digest: args.digest,
        uri: args.uri,
        version: args.version?.toNumber?.() ?? Number(args.version),
        txHash: latest.transactionHash,
        blockNumber: latest.blockNumber,
      },
    });
  } catch (err: any) {
    console.error('[API/anchoring-events] Error:', err);
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  }
}
export const runtime = 'nodejs';
