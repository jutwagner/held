import { NextRequest, NextResponse } from 'next/server';
import { getWorkingPolygonProvider } from '@/lib/polygon-provider';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const hash = searchParams.get('hash');
    if (!hash) {
      return NextResponse.json({ error: 'Missing hash' }, { status: 400 });
    }

    const provider = await getWorkingPolygonProvider();
    try { (provider as any).pollingInterval = 10_000; } catch {}

    const receipt = await provider.getTransactionReceipt(hash);
    if (!receipt) {
      return NextResponse.json({ confirmed: false });
    }
    const status = (receipt.status ?? 0) === 1 ? 1 : 0;
    return NextResponse.json({ confirmed: !!receipt.blockNumber, status, blockNumber: receipt.blockNumber || null });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';

