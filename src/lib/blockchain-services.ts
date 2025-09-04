import { ethers } from 'ethers';
import { HeldObject } from '@/types';

// HeldAnchors contract configuration
export const HELD_ANCHORS_CONTRACT = {
  address: '0x2E9e8b1E508064415dbADFd2d27D65Ccb3CE5c18',
  abi: [
    {
      "anonymous": false,
      "inputs": [
        { "indexed": false, "internalType": "bytes32", "name": "passportId", "type": "bytes32" },
        { "indexed": false, "internalType": "bytes32", "name": "digest", "type": "bytes32" },
        { "indexed": false, "internalType": "string", "name": "algo", "type": "string" },
        { "indexed": false, "internalType": "string", "name": "uri", "type": "string" },
        { "indexed": false, "internalType": "uint256", "name": "version", "type": "uint256" }
      ],
      "name": "Anchored",
      "type": "event"
    },
    {
      "inputs": [
        { "internalType": "bytes32", "name": "passportId", "type": "bytes32" },
        { "internalType": "bytes32", "name": "digest", "type": "bytes32" },
        { "internalType": "string", "name": "algo", "type": "string" },
        { "internalType": "string", "name": "uri", "type": "string" },
        { "internalType": "uint256", "name": "version", "type": "uint256" }
      ],
      "name": "anchor",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]
};

// Polygon mainnet RPC endpoint
export const POLYGON_RPC_URL =
  process.env.NEXT_PUBLIC_POLYGON_RPC ||
  process.env.POLYGON_RPC ||
  process.env.POLYGON_RPC_URL ||
  'https://polygon-rpc.com';

// Generate a deterministic hash (digest) from Passport data
function toISO(input: any): string | undefined {
  try {
    if (!input) return undefined;
    if (input instanceof Date) return input.toISOString();
    if (typeof input === 'string') return input;
    if (typeof input === 'number') return new Date(input).toISOString();
    // Firestore Timestamp
    if (typeof input.toDate === 'function') return input.toDate().toISOString();
  } catch {}
  return undefined;
}

// Basic/core fields digest (for free users, auto-anchored)
export function generateCoreDigest(passport: HeldObject): string {
  const core = {
    id: passport.id,
    created: toISO((passport as any).created ?? passport.createdAt) || '',
    label: passport.title,
    type: passport.category,
  } as const;
  const json = JSON.stringify(core);
  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(json));
}

// Full/premium digest (richer metadata)
export function generateFullDigest(passport: HeldObject): string {
  const full = {
    id: passport.id,
    created: toISO((passport as any).created ?? passport.createdAt) || '',
    label: passport.title,
    type: passport.category,
    maker: passport.maker,
    year: passport.year,
    condition: passport.condition,
    serialNumber: passport.serialNumber,
    acquisitionDate: toISO(passport.acquisitionDate) || undefined,
    origin: passport.origin,
    chain: passport.chain,
    conditionHistory: passport.conditionHistory,
    associatedDocuments: passport.associatedDocuments,
    provenanceNotes: passport.provenanceNotes,
    images: passport.images,
    notes: passport.notes,
  };
  const json = JSON.stringify(full);
  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(json));
}

// Backward-compat wrapper; defaults to core digest
export function generatePassportDigest(passport: HeldObject, kind: 'core' | 'full' = 'core'): string {
  return kind === 'full' ? generateFullDigest(passport) : generateCoreDigest(passport);
}

// Generate a deterministic Passport ID
export function generatePassportId(passport: HeldObject): string {
  return ethers.utils.formatBytes32String(passport.id);
}

// Get Polygon provider
export function getPolygonProvider(): ethers.providers.JsonRpcProvider {
  return new ethers.providers.StaticJsonRpcProvider(POLYGON_RPC_URL, { name: 'matic', chainId: 137 });
}

// Get contract instance
export function getHeldAnchorsContract(signer?: ethers.Signer): ethers.Contract {
  const provider = getPolygonProvider();
  const contractSigner = signer || provider;
  return new ethers.Contract(
    HELD_ANCHORS_CONTRACT.address,
    HELD_ANCHORS_CONTRACT.abi,
    contractSigner
  );
}

// Anchor via server API (recommended; keeps PRIVATE_KEY server-side)
export async function anchorPassport(
  passport: HeldObject,
  uri: string,
  version: number = 1,
  kind: 'core' | 'full' = 'core',
  mode: 'sync' | 'async' = 'sync'
): Promise<{ txHash: string; digest: string; passportId: string; blockNumber?: number; mode?: 'sync' | 'async'; message?: string }> {
  try {
    const res = await fetch('/api/anchor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind,
        passport,
        uri,
        version,
        mode,
      }),
    });
    
    if (!res.ok) {
      let errorMessage = `Anchor API failed with ${res.status}`;
      try {
        const err = await res.json();
        errorMessage = err?.error || errorMessage;
      } catch {
        // If we can't parse the error response, use the status text
        errorMessage = res.statusText || errorMessage;
      }
      
      // Provide more specific error messages for common issues
      if (res.status === 500) {
        if (errorMessage.includes('No working Polygon RPC endpoint found')) {
          errorMessage = 'Blockchain service temporarily unavailable. Please try again later or contact support if the issue persists.';
        } else if (errorMessage.includes('PRIVATE_KEY not configured')) {
          errorMessage = 'Blockchain anchoring is not configured on this server. Please contact support to enable this feature.';
        } else if (errorMessage.includes('Invalid PRIVATE_KEY format')) {
          errorMessage = 'Server configuration error: Invalid private key format. Please contact support.';
        }
      }
      
      throw new Error(errorMessage);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Failed to anchor via API:', error);
    
    // Provide user-friendly error messages
    let userMessage = 'Failed to anchor Passport';
    if (error instanceof Error) {
      if (error.message.includes('Blockchain service temporarily unavailable')) {
        userMessage = error.message;
      } else if (error.message.includes('Blockchain anchoring is not configured')) {
        userMessage = error.message;
      } else if (error.message.includes('timeout') || error.message.includes('network')) {
        userMessage = 'Network timeout. Please check your connection and try again.';
      } else {
        userMessage = `Failed to anchor Passport: ${error.message}`;
      }
    }
    
    throw new Error(userMessage);
  }
}

// Check if blockchain anchoring is available
export async function isBlockchainAnchoringAvailable(): Promise<boolean> {
  try {
    const res = await fetch('/api/anchor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'core',
        passport: { id: 'test' },
        uri: 'test',
        version: 1,
      }),
    });
    
    // If we get a 500 with PRIVATE_KEY not configured, anchoring is not set up
    if (res.status === 500) {
      const error = await res.json().catch(() => ({}));
      return !error?.error?.includes('PRIVATE_KEY not configured');
    }
    
    return res.ok;
  } catch {
    return false;
  }
}

// Get blockchain service status information
export async function getBlockchainServiceStatus(): Promise<{
  isAvailable: boolean;
  status: 'configured' | 'not_configured' | 'unavailable' | 'unknown';
  message: string;
  details?: string;
}> {
  try {
    const res = await fetch('/api/anchor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'core',
        passport: { id: 'test' },
        uri: 'test',
        version: 1,
      }),
    });
    
    if (res.ok) {
      return {
        isAvailable: true,
        status: 'configured',
        message: 'Blockchain anchoring is available and working',
      };
    }
    
    if (res.status === 500) {
      const error = await res.json().catch(() => ({}));
      
      if (error?.error?.includes('PRIVATE_KEY not configured')) {
        return {
          isAvailable: false,
          status: 'not_configured',
          message: 'Blockchain anchoring is not configured',
          details: 'The PRIVATE_KEY environment variable is not set. Please configure blockchain anchoring to use this feature.',
        };
      }
      
      if (error?.error?.includes('No working Polygon RPC endpoint found')) {
        return {
          isAvailable: false,
          status: 'unavailable',
          message: 'Blockchain service is unavailable',
          details: 'Unable to connect to Polygon network. This may be a temporary issue.',
        };
      }
      
      return {
        isAvailable: false,
        status: 'unavailable',
        message: 'Blockchain service error',
        details: error?.error || 'Unknown error occurred',
      };
    }
    
    return {
      isAvailable: false,
      status: 'unknown',
      message: `Unexpected response: ${res.status}`,
      details: res.statusText,
    };
  } catch (error) {
    return {
      isAvailable: false,
      status: 'unknown',
      message: 'Unable to check blockchain service status',
      details: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// Verify a Passport's on-chain anchoring
export async function verifyPassportAnchoring(
  passport: HeldObject,
  expectedDigest?: string,
  kind: 'core' | 'full' = 'core'
): Promise<{ isAnchored: boolean; txHash?: string; blockNumber?: number }> {
  try {
    // If caller supplied digest, prefer server verify by recomputing to avoid mismatch
    const res = await fetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passport, kind }),
    });
    if (!res.ok) return { isAnchored: false };
    return await res.json();
  } catch (error) {
    console.error('Failed to verify Passport anchoring:', error);
    return { isAnchored: false };
  }
}

// Get the latest anchoring event for a Passport
export async function getLatestAnchoringEvent(
  passport: HeldObject
): Promise<{ digest: string; uri: string; version: number; txHash: string; blockNumber: number } | null> {
  try {
    const res = await fetch('/api/anchoring-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passport }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.latest ?? null;
  } catch (error) {
    console.error('Failed to get latest anchoring event:', error);
    return null;
  }
}

// Generate a URI for off-chain Passport data
export function generatePassportURI(passport: HeldObject, baseURL: string): string {
  return `${baseURL}/passport/${passport.slug}`;
}

// Get Polygon block explorer URL for a transaction
export function getPolygonExplorerURL(txHash: string): string {
  return `https://polygonscan.com/tx/${txHash}`;
}

// Get Polygon block explorer URL for a block
export function getPolygonBlockExplorerURL(blockNumber: number): string {
  return `https://polygonscan.com/block/${blockNumber}`;
}
