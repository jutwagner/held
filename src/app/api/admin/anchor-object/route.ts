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
    try { (provider as any).pollingInterval = 10_000; } catch {}
    const signer = new ethers.Wallet(pk, provider);
    const contract = new ethers.Contract(HELD_ANCHORS_CONTRACT.address, HELD_ANCHORS_CONTRACT.abi, signer);

    const digest = kind === 'full' ? generateFullDigest(passport) : generateCoreDigest(passport);
    const passportId = ethers.utils.formatBytes32String(String(passport.id));
    const feeData = await provider.getFeeData();
    const gasLimit = ethers.BigNumber.from(200_000);
    const floorPriority = ethers.BigNumber.from(30_000_000_000); // 30 gwei
    const floorMaxFee = ethers.BigNumber.from(60_000_000_000);   // 60 gwei
    const floorLegacy = ethers.BigNumber.from(60_000_000_000);   // 60 gwei

    const useLegacy = !feeData.maxFeePerGas || feeData.maxFeePerGas.lt(ethers.BigNumber.from(5_000_000_000));
    let overrides: any = { gasLimit };
    if (useLegacy) {
      const rawGasPrice = (await provider.getGasPrice()).mul(2);
      const gasPrice = rawGasPrice.lt(floorLegacy) ? floorLegacy : rawGasPrice;
      overrides.gasPrice = gasPrice;
    } else {
      const suggestedPriority = (feeData.maxPriorityFeePerGas ?? floorPriority).mul(2);
      const suggestedMaxFee = (feeData.maxFeePerGas ?? floorMaxFee).mul(2);
      let maxPriorityFeePerGas = suggestedPriority.lt(floorPriority) ? floorPriority : suggestedPriority;
      let maxFeePerGas = suggestedMaxFee.lt(floorMaxFee) ? floorMaxFee : suggestedMaxFee;
      if (maxFeePerGas.lt(maxPriorityFeePerGas)) {
        maxFeePerGas = maxPriorityFeePerGas.add(ethers.BigNumber.from(10_000_000_000));
      }
      overrides.maxPriorityFeePerGas = maxPriorityFeePerGas;
      overrides.maxFeePerGas = maxFeePerGas;
    }

    const tx = await contract.anchor(
      passportId,
      digest,
      'keccak256',
      uri,
      ethers.BigNumber.from(version),
      overrides
    );
    const receipt = await provider.waitForTransaction(tx.hash, 1, 5 * 60 * 1000);
    if (!receipt || receipt.status !== 1) {
      throw new Error('Transaction failed on-chain');
    }

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
