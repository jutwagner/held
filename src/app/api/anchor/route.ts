import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { getWorkingPolygonProvider } from '@/lib/polygon-provider';
import { HELD_ANCHORS_CONTRACT, generateCoreDigest, generateFullDigest } from '@/lib/blockchain-services';
import { db } from '@/lib/firebase.admin';

type Body = {
  kind?: 'core' | 'full';
  passport: any; // Keep lax; server only uses select fields for digest
  uri?: string;
  version?: number;
  mode?: 'sync' | 'async'; // async returns quickly and confirms in background
  uid?: string; // User UID for authentication
};

export async function POST(req: NextRequest) {
  try {
    const { kind = 'core', passport, uri = '', version = 1, mode = 'sync', uid } = (await req.json()) as Body;

    if (!passport?.id) {
      return NextResponse.json({ error: 'Missing passport.id' }, { status: 400 });
    }

    if (!uid) {
      return NextResponse.json({ 
        error: 'Authentication required',
        details: 'You must be signed in to anchor passports'
      }, { status: 401 });
    }

    // Check if user has Held+ subscription
    try {
      const userDoc = await db.collection('users').doc(uid).get();
      const userData = userDoc.data();
      
      if (!userData?.premium?.active) {
        return NextResponse.json({ 
          error: 'Held+ subscription required',
          details: 'Enhanced blockchain anchoring is a Held+ feature. Please upgrade to anchor passports.'
        }, { status: 403 });
      }
    } catch (error) {
      console.error('[API/anchor] Error checking user subscription:', error);
      return NextResponse.json({ 
        error: 'Unable to verify subscription',
        details: 'Please try again or contact support'
      }, { status: 500 });
    }

    const pk = process.env.PRIVATE_KEY;
    if (!pk) {
      console.error('[API/anchor] PRIVATE_KEY not configured');
      return NextResponse.json({ 
        error: 'Server PRIVATE_KEY not configured',
        details: 'Blockchain anchoring is not enabled on this server. Please contact support to enable this feature.'
      }, { status: 500 });
    }

    // Normalize private key format (add 0x prefix if missing)
    let normalizedPk = pk;
    if (!pk.startsWith('0x')) {
      normalizedPk = `0x${pk}`;
    }
    
    // Validate private key format (should be 64 hex chars + 0x prefix = 66 total)
    if (normalizedPk.length !== 66 || !/^0x[0-9a-fA-F]{64}$/.test(normalizedPk)) {
      console.error('[API/anchor] Invalid PRIVATE_KEY format');
      return NextResponse.json({ 
        error: 'Invalid PRIVATE_KEY format',
        details: 'Private key must be a 64-character hex string (with or without 0x prefix)'
      }, { status: 500 }); 
    }

    let provider;
    try { 
      console.log('[API/anchor] Attempting to get working Polygon provider...');
      provider = await getWorkingPolygonProvider();
      // Lower internal polling frequency to reduce background RPC load
      try { (provider as any).pollingInterval = 10_000; } catch {}
      console.log('[API/anchor] Successfully connected to Polygon provider');
    } catch (error) {
      console.error('[API/anchor] Failed to get working Polygon provider:', error);
      
      // Provide more specific error details
      let errorDetails = 'Unable to connect to Polygon network';
      if (error instanceof Error) {
        if (error.message.includes('No working Polygon RPC endpoint found')) {
          errorDetails = 'All Polygon RPC endpoints are currently unavailable. This may be a temporary network issue.';
        } else if (error.message.includes('timeout')) {
          errorDetails = 'RPC endpoints are responding too slowly. Network may be congested.';
        } else {
          errorDetails = error.message;
        }
      }
      
      return NextResponse.json({ 
        error: 'Blockchain service unavailable',
        details: errorDetails
      }, { status: 500 });
    }

    const signer = new ethers.Wallet(normalizedPk, provider);
    const contract = new ethers.Contract(HELD_ANCHORS_CONTRACT.address, HELD_ANCHORS_CONTRACT.abi, signer);

    // Compute digest server-side
    const digest = kind === 'full' ? generateFullDigest(passport) : generateCoreDigest(passport);
    const passportId = ethers.utils.formatBytes32String(String(passport.id));

    console.log(`[API/anchor] Anchoring passport ${passport.id} with digest ${digest}`);

    // Propose fees for Polygon with fallback to legacy gasPrice if EIP-1559 data looks wrong
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
      console.log(`[API/anchor] Using legacy gasPrice=${ethers.utils.formatUnits(gasPrice, 'gwei')} gwei`);
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
      console.log(`[API/anchor] Using EIP-1559 maxPriority=${ethers.utils.formatUnits(maxPriorityFeePerGas, 'gwei')} gwei, maxFee=${ethers.utils.formatUnits(maxFeePerGas, 'gwei')} gwei`);
    }

    const tx = await contract.anchor(
      passportId,
      digest,
      'keccak256',
      uri,
      ethers.BigNumber.from(version),
      overrides
    );
    console.log(`[API/anchor] Transaction submitted: ${tx.hash}`);

    // If async mode, persist a background job and return immediately (202)
    if (mode === 'async') {
      try {
        await db.collection('anchorJobs').doc(tx.hash).set({
          objectId: String(passport.id),
          txHash: tx.hash,
          digest,
          version,
          uri,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'pending',
          attempts: 0,
          lastCheckedAt: null,
        });
      } catch (e) {
        console.warn('[API/anchor] Failed to persist anchor job (non-blocking):', e);
      }
      return NextResponse.json({ 
        txHash: tx.hash,
        digest,
        passportId,
        mode: 'async',
        message: 'Anchoring started. Confirmation will complete in background.'
      }, { status: 202 });
    }
    
    // Custom transaction confirmation handling to bypass ethers wait() issues
    let receipt;
    try {
      console.log(`[API/anchor] Waiting for transaction confirmation...`);
      // Use provider-level wait with explicit timeout to avoid indefinite polling
      // Timeout: 5 minutes
      receipt = await provider.waitForTransaction(tx.hash, 1, 5 * 60 * 1000);
      if (!receipt) {
        throw new Error('Transaction confirmation timeout');
      }
      if (!receipt || receipt.status !== 1) {
        throw new Error('Transaction failed on-chain');
      }
      console.log(`[API/anchor] Transaction confirmed in block: ${receipt.blockNumber}`);
    } catch (waitError) {
      console.warn(`[API/anchor] Ethers wait() failed, trying manual confirmation:`, waitError);
      
      // Manual confirmation using direct RPC calls
      try {
        let confirmations = 0;
        const maxAttempts = 30; // Wait up to 5 minutes
        let attempt = 0;
        
        while (confirmations < 1 && attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
          attempt++;
          
          try {
            // Get transaction receipt directly
            const response = await fetch(provider.connection.url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_getTransactionReceipt',
                params: [tx.hash],
                id: 1
              })
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.result && data.result.blockNumber) {
                const blockNumber = parseInt(data.result.blockNumber, 16);
                const status = parseInt(data.result.status, 16);
                
                if (status === 1) {
                  console.log(`[API/anchor] Manual confirmation successful, block: ${blockNumber}`);
                  receipt = {
                    blockNumber: blockNumber,
                    status: 1,
                    transactionHash: tx.hash
                  };
                  break;
                } else {
                  console.log(`[API/anchor] Transaction failed with status: ${status}`);
                  throw new Error('Transaction failed on-chain');
                }
              }
            }
          } catch (manualError) {
            console.log(`[API/anchor] Manual confirmation attempt ${attempt} failed:`, manualError);
          }
        }
        
        if (!receipt) {
          throw new Error('Transaction confirmation timeout');
        }
      } catch (manualError) {
        console.error(`[API/anchor] Manual confirmation failed:`, manualError);
        throw new Error(`Transaction submitted but confirmation failed: ${manualError instanceof Error ? manualError.message : String(manualError)}`);
      }
    }

    console.log(`[API/anchor] Successfully anchored passport ${passport.id}, tx: ${tx.hash}, block: ${receipt?.blockNumber}`);

    return NextResponse.json({ 
      txHash: tx.hash, 
      digest, 
      passportId, 
      blockNumber: receipt?.blockNumber 
    }, { status: 200 });
  } catch (err: any) {
    console.error('[API/anchor] Error:', err);
    
    // Provide more specific error messages
    let errorMessage = err?.message || 'Unknown error';
    let details = '';
    
    if (err?.code === 'INSUFFICIENT_FUNDS') {
      errorMessage = 'Insufficient MATIC for gas fees';
      details = 'The server wallet does not have enough MATIC to pay for transaction fees';
    } else if (err?.code === 'NONCE_EXPIRED') {
      errorMessage = 'Transaction nonce expired';
      details = 'Please try again';
    } else if (err?.code === 'REPLACEMENT_UNDERPRICED') {
      errorMessage = 'Gas price too low';
      details = 'Please try again with higher gas price';
    } else if (err?.message?.includes('network')) {
      errorMessage = 'Network error';
      details = 'Unable to connect to Polygon network. Please try again.';
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      details: details || err?.message || 'Unknown blockchain error'
    }, { status: 500 });
  }
}
export const runtime = 'nodejs';
