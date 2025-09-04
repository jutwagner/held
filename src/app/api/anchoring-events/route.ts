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
    // Limit the search window; allow override via env
    const latestBlock = await provider.getBlockNumber();
    const configuredFrom = Number(process.env.HELD_ANCHORS_FROM_BLOCK || '0');
    const defaultWindow = 200_000;
    const from = configuredFrom > 0 ? configuredFrom : Math.max(0, latestBlock - defaultWindow);
    // If caller supplied a txHash on the passport, decode latest from receipt first
    const txHash = (passport as any)?.anchoring?.txHash as string | undefined;
    if (txHash && /^0x([0-9a-fA-F]{64})$/.test(txHash)) {
      try {
        const receipt = await provider.getTransactionReceipt(txHash);
        if (receipt && receipt.logs) {
          for (const log of receipt.logs) {
            if (log.address.toLowerCase() !== HELD_ANCHORS_CONTRACT.address.toLowerCase()) continue;
            try {
              const parsed = contract.interface.parseLog(log);
              if (parsed?.name === 'Anchored') {
                const args = parsed.args;
                if (args) {
                  return NextResponse.json({
                    latest: {
                      digest: String(args.digest),
                      uri: String(args.uri),
                      version: Number(args.version),
                      txHash,
                      blockNumber: receipt.blockNumber || 0,
                    }
                  });
                }
              }
            } catch {}
          }
        }
      } catch {}
    }

    // Query Anchored events in <=10-block pages; filter client-side (params are non-indexed)
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
      return typeof evPassportId === 'string' && evPassportId.toLowerCase() === passportId.toLowerCase();
    });
    if (filtered.length === 0) return NextResponse.json({ latest: null });

    const lastEvent = filtered[filtered.length - 1];
    const args = lastEvent.args;
    if (!args) return NextResponse.json({ latest: null });

    return NextResponse.json({
      latest: {
        digest: args.digest,
        uri: args.uri,
        version: args.version?.toNumber?.() ?? Number(args.version),
        txHash: lastEvent.transactionHash,
        blockNumber: lastEvent.blockNumber,
      },
    });
  } catch (err: any) {
    console.error('[API/anchoring-events] Error:', err);
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  }
}
export const runtime = 'nodejs';
