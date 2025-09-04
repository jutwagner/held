import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { getWorkingPolygonProvider } from '@/lib/polygon-provider';

export async function GET(req: NextRequest) {
  try {
    const provider = await getWorkingPolygonProvider();
    // Reduce background polling
    try { (provider as any).pollingInterval = 10_000; } catch {}

    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();
    const feeData = await provider.getFeeData();

    const pkRaw = process.env.PRIVATE_KEY;
    if (!pkRaw) {
      return NextResponse.json({
        success: false,
        message: 'PRIVATE_KEY not configured on server',
        data: {
          provider: (provider as any).connection?.url,
          chainId: network.chainId,
          name: network.name,
          blockNumber,
          feeData: serializeFeeData(feeData)
        }
      }, { status: 200 });
    }

    // Normalize PK
    const normalizedPk = pkRaw.startsWith('0x') ? pkRaw : `0x${pkRaw}`;
    let wallet: ethers.Wallet;
    try {
      wallet = new ethers.Wallet(normalizedPk, provider);
    } catch (e) {
      return NextResponse.json({ success: false, message: 'Invalid PRIVATE_KEY format', error: e instanceof Error ? e.message : String(e) }, { status: 200 });
    }

    const address = await wallet.getAddress();
    const balance = await provider.getBalance(address);
    const nonceLatest = await provider.getTransactionCount(address, 'latest');
    const noncePending = await provider.getTransactionCount(address, 'pending');

    return NextResponse.json({
      success: true,
      message: 'Account debug info',
      data: {
        provider: (provider as any).connection?.url,
        chainId: network.chainId,
        name: network.name,
        blockNumber,
        address,
        balance: {
          wei: balance.toString(),
          matic: ethers.utils.formatEther(balance)
        },
        nonce: {
          latest: nonceLatest,
          pending: noncePending
        },
        feeData: serializeFeeData(feeData)
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Failed to collect debug info',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function serializeFeeData(fd: ethers.providers.FeeData) {
  const toGwei = (v?: ethers.BigNumber | null) => (v ? ethers.utils.formatUnits(v, 'gwei') : null);
  return {
    gasPrice: {
      wei: fd.gasPrice?.toString() ?? null,
      gwei: toGwei(fd.gasPrice)
    },
    maxFeePerGas: {
      wei: fd.maxFeePerGas?.toString() ?? null,
      gwei: toGwei(fd.maxFeePerGas)
    },
    maxPriorityFeePerGas: {
      wei: fd.maxPriorityFeePerGas?.toString() ?? null,
      gwei: toGwei(fd.maxPriorityFeePerGas)
    }
  };
}

export const runtime = 'nodejs';

