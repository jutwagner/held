import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { getWorkingPolygonProvider } from '@/lib/polygon-provider';
import { HELD_ANCHORS_CONTRACT, generateCoreDigest, generateFullDigest } from '@/lib/blockchain-services';

type Body = {
  kind?: 'core' | 'full';
  passport: any; // Keep lax; server only uses select fields for digest
  uri?: string;
  version?: number;
};

export async function POST(req: NextRequest) {
  try {
    const { kind = 'core', passport, uri = '', version = 1 } = (await req.json()) as Body;

    if (!passport?.id) {
      return NextResponse.json({ error: 'Missing passport.id' }, { status: 400 });
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

    const tx = await contract.anchor(passportId, digest, 'keccak256', uri, ethers.BigNumber.from(version));
    console.log(`[API/anchor] Transaction submitted: ${tx.hash}`);
    
    // Custom transaction confirmation handling to bypass ethers wait() issues
    let receipt;
    try {
      console.log(`[API/anchor] Waiting for transaction confirmation...`);
      receipt = await tx.wait();
      console.log(`[API/anchor] Transaction confirmed in block: ${receipt?.blockNumber}`);
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
