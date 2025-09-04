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

    // Fast path: verify by tx receipt if available on the passport
    const txHash = (passport as any)?.anchoring?.txHash as string | undefined;
    if (txHash && /^0x([0-9a-fA-F]{64})$/.test(txHash)) {
      try {
        const receipt = await provider.getTransactionReceipt(txHash);
        if (receipt && receipt.logs && receipt.logs.length) {
          for (const log of receipt.logs) {
            if (log.address.toLowerCase() !== HELD_ANCHORS_CONTRACT.address.toLowerCase()) continue;
            try {
              const parsed = contract.interface.parseLog(log);
              if (parsed?.name === 'Anchored') {
                const evPid = String(parsed.args?.passportId || '').toLowerCase();
                const evDigest = String(parsed.args?.digest || '').toLowerCase();
                if (evPid === passportId.toLowerCase() && evDigest === digest.toLowerCase()) {
                  return NextResponse.json({ isAnchored: true, txHash, blockNumber: receipt.blockNumber });
                }
              }
            } catch {}
          }
        }
      } catch {}
    }

    // Limit the search window and page with <=10-block ranges (Alchemy Free tier)
    const latestBlock = await provider.getBlockNumber();
    const configuredFrom = Number(process.env.HELD_ANCHORS_FROM_BLOCK || '0');
    const windowBlocks = Number(process.env.ANCHOR_LOGS_WINDOW_BLOCKS || '300');
    const from = configuredFrom > 0 ? configuredFrom : Math.max(0, latestBlock - windowBlocks);
    const step = 10;
    const all: any[] = [];
    for (let start = from; start <= latestBlock; start += step) {
      const end = Math.min(start + step - 1, latestBlock);
      try {
        const chunk = await contract.queryFilter(contract.filters.Anchored(), start, end);
        if (chunk.length) all.push(...chunk);
      } catch {}
    }
    const filtered = all.filter((ev: any) => {
      const args = ev.args;
      if (!args) return false;
      const evPassportId: string | undefined = args.passportId;
      const evDigest: string | undefined = args.digest;
      return (
        typeof evPassportId === 'string' &&
        typeof evDigest === 'string' &&
        evPassportId.toLowerCase() === passportId.toLowerCase() &&
        evDigest.toLowerCase() === digest.toLowerCase()
      );
    });
    if (filtered.length === 0) return NextResponse.json({ isAnchored: false });
    const lastEvent = filtered[filtered.length - 1];
    return NextResponse.json({ isAnchored: true, txHash: lastEvent.transactionHash, blockNumber: lastEvent.blockNumber });
  } catch (err: any) {
    console.error('[API/verify] Error:', err);
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  }
}
export const runtime = 'nodejs';
