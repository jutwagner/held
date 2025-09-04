import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { db } from '@/lib/firebase.admin';
import { getWorkingPolygonProvider } from '@/lib/polygon-provider';
import { HELD_ANCHORS_CONTRACT } from '@/lib/blockchain-services';

type AnchorJob = {
  objectId: string;
  txHash: string;
  digest: string;
  version: number;
  uri: string;
  status: 'pending' | 'confirmed' | 'failed' | 'timeout';
  attempts: number;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  lastCheckedAt: FirebaseFirestore.Timestamp | null;
  blockNumber?: number;
  error?: string;
};

export async function GET(req: NextRequest) {
  try {
    const provider = await getWorkingPolygonProvider();
    try { (provider as any).pollingInterval = 10_000; } catch {}

    const now = new Date();
    const maxBatch = Number(process.env.ANCHOR_WORKER_BATCH || '5');
    const maxAttempts = Number(process.env.ANCHOR_WORKER_MAX_ATTEMPTS || '60');

    // Query a small batch of pending jobs
    // Keep the query simple to avoid composite index requirements in dev
    const snap = await db
      .collection('anchorJobs')
      .where('status', '==', 'pending')
      .limit(maxBatch)
      .get();

    const results: any[] = [];

    for (const doc of snap.docs) {
      const job = doc.data() as AnchorJob;
      const id = doc.id;
      try {
        const receipt = await provider.getTransactionReceipt(job.txHash);
        if (receipt && receipt.blockNumber) {
          const statusOk = (receipt.status ?? 0) === 1;
          if (statusOk) {
            // Update object anchoring data
            await db.collection('objects').doc(job.objectId).update({
              anchoring: {
                isAnchored: true,
                txHash: job.txHash,
                digest: job.digest,
                version: job.version,
                anchoredAt: new Date(),
                uri: job.uri,
                blockNumber: receipt.blockNumber,
              },
              updatedAt: new Date(),
            });

            await doc.ref.update({
              status: 'confirmed',
              updatedAt: now,
              lastCheckedAt: now,
              blockNumber: receipt.blockNumber,
            });
            results.push({ id, status: 'confirmed', blockNumber: receipt.blockNumber });
            continue;
          } else {
            await doc.ref.update({
              status: 'failed',
              updatedAt: now,
              lastCheckedAt: now,
              error: 'On-chain status 0 (failed)'
            });
            results.push({ id, status: 'failed' });
            continue;
          }
        }

        // No receipt yet: increment attempts and reschedule
        const attempts = (job.attempts || 0) + 1;
        if (attempts >= maxAttempts) {
          await doc.ref.update({
            status: 'timeout',
            updatedAt: now,
            lastCheckedAt: now,
            attempts
          });
          results.push({ id, status: 'timeout' });
          continue;
        }

        await doc.ref.update({ attempts, updatedAt: now, lastCheckedAt: now });
        results.push({ id, status: 'pending', attempts });
      } catch (e: any) {
        await doc.ref.update({
          status: 'failed',
          updatedAt: now,
          lastCheckedAt: now,
          error: e?.message || String(e)
        });
        results.push({ id, status: 'failed', error: e?.message || String(e) });
      }
    }

    return NextResponse.json({ success: true, processed: results.length, results });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
