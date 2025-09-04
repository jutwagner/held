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
export const POLYGON_RPC_URL = 'https://polygon-rpc.com';

// Generate a deterministic hash (digest) from Passport data
export function generatePassportDigest(passport: HeldObject): string {
  // Create a deterministic representation of the core Passport data
  const coreData = {
    id: passport.id,
    title: passport.title,
    maker: passport.maker,
    year: passport.year,
    category: passport.category,
    condition: passport.condition,
    serialNumber: passport.serialNumber,
    acquisitionDate: passport.acquisitionDate,
    origin: passport.origin,
    // Include provenance chain if available
    chain: passport.chain,
    // Include condition history if available
    conditionHistory: passport.conditionHistory,
    // Include associated documents if available
    associatedDocuments: passport.associatedDocuments,
    // Include provenance notes if available
    provenanceNotes: passport.provenanceNotes,
  };

  // Convert to JSON string and hash using keccak256
  const dataString = JSON.stringify(coreData, Object.keys(coreData).sort());
  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(dataString));
}

// Generate a deterministic Passport ID
export function generatePassportId(passport: HeldObject): string {
  return ethers.utils.formatBytes32String(passport.id);
}

// Get Polygon provider
export function getPolygonProvider(): ethers.providers.JsonRpcProvider {
  return new ethers.providers.JsonRpcProvider(POLYGON_RPC_URL);
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

// Anchor a Passport on-chain
export async function anchorPassport(
  passport: HeldObject,
  uri: string,
  version: number = 1,
  signer?: ethers.Signer
): Promise<{ txHash: string; digest: string; passportId: string }> {
  try {
    const contract = getHeldAnchorsContract(signer);
    
    // Generate digest and passport ID
    const digest = generatePassportDigest(passport);
    const passportId = generatePassportId(passport);
    
    // Call the anchor function
    const tx = await contract.anchor(
      passportId,
      digest,
      'keccak256',
      uri,
      version
    );
    
    // Wait for transaction confirmation
    await tx.wait();
    
    return {
      txHash: tx.hash,
      digest,
      passportId
    };
  } catch (error) {
    console.error('Failed to anchor Passport:', error);
    throw new Error(`Failed to anchor Passport: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Verify a Passport's on-chain anchoring
export async function verifyPassportAnchoring(
  passport: HeldObject,
  expectedDigest?: string
): Promise<{ isAnchored: boolean; txHash?: string; blockNumber?: number }> {
  try {
    const contract = getHeldAnchorsContract();
    const digest = expectedDigest || generatePassportDigest(passport);
    const passportId = generatePassportId(passport);
    
    // Get past events for this Passport ID
    const events = await contract.queryFilter(
      contract.filters.Anchored(passportId, digest),
      0, // fromBlock
      'latest' // toBlock
    );
    
    if (events.length > 0) {
      const latestEvent = events[events.length - 1];
      return {
        isAnchored: true,
        txHash: latestEvent.transactionHash,
        blockNumber: latestEvent.blockNumber
      };
    }
    
    return { isAnchored: false };
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
    const contract = getHeldAnchorsContract();
    const passportId = generatePassportId(passport);
    
    // Get past events for this Passport ID
    const events = await contract.queryFilter(
      contract.filters.Anchored(passportId),
      0, // fromBlock
      'latest' // toBlock
    );
    
    if (events.length > 0) {
      const latestEvent = events[events.length - 1];
      const args = latestEvent.args;
      
      if (!args) {
        console.error('Event args are undefined');
        return null;
      }
      
      return {
        digest: args.digest,
        uri: args.uri,
        version: args.version.toNumber(),
        txHash: latestEvent.transactionHash,
        blockNumber: latestEvent.blockNumber
      };
    }
    
    return null;
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
