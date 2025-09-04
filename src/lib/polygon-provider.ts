import { ethers } from 'ethers';

// Custom provider that bypasses ethers provider testing issues
class CustomPolygonProvider extends ethers.providers.StaticJsonRpcProvider {
  constructor(url: string) {
    super(url, { name: 'matic', chainId: 137 });
  }
  
  // Override getBlockNumber to use direct HTTP request if ethers fails
  async getBlockNumber(): Promise<number> {
    try {
      // Try the normal ethers method first
      return await super.getBlockNumber();
    } catch (error) {
      console.log(`[polygon-provider] Ethers getBlockNumber failed, trying direct HTTP:`, error instanceof Error ? error.message : String(error));
      
      // Fallback to direct HTTP request
      try {
        const response = await fetch(this.connection.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_blockNumber',
            params: [],
            id: 1
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.result) {
            const blockNumber = parseInt(data.result, 16);
            console.log(`[polygon-provider] Direct HTTP getBlockNumber successful: ${blockNumber}`);
            return blockNumber;
          }
        }
        throw new Error(`HTTP request failed: ${response.status}`);
      } catch (httpError) {
        console.error(`[polygon-provider] Direct HTTP also failed:`, httpError);
        throw error; // Re-throw the original error
      }
    }
  }

  // Override getNetwork to avoid potential RPC issues
  async getNetwork(): Promise<ethers.providers.Network> {
    try {
      return await super.getNetwork();
    } catch (error) {
      console.log(`[polygon-provider] Ethers getNetwork failed, returning default:`, error instanceof Error ? error.message : String(error));
      // Return default Polygon network info
      return {
        name: 'matic',
        chainId: 137
      };
    }
  }

  // Override getBlock to handle eth_getBlockByNumber issues
  async getBlock(blockHashOrBlockTag: string | number): Promise<ethers.providers.Block> {
    try {
      return await super.getBlock(blockHashOrBlockTag);
    } catch (error) {
      console.log(`[polygon-provider] Ethers getBlock failed for ${blockHashOrBlockTag}, trying direct HTTP:`, error instanceof Error ? error.message : String(error));
      
      try {
        const blockTag = typeof blockHashOrBlockTag === 'number' ? `0x${blockHashOrBlockTag.toString(16)}` : blockHashOrBlockTag;
        const response = await fetch(this.connection.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getBlockByNumber',
            params: [blockTag, false],
            id: 1
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.result) {
            // Create a minimal block object that ethers expects
            const block: any = {
              hash: data.result.hash,
              parentHash: data.result.parentHash,
              number: parseInt(data.result.number, 16),
              timestamp: parseInt(data.result.timestamp, 16),
              transactions: data.result.transactions || []
            };
            console.log(`[polygon-provider] Direct HTTP getBlock successful for block ${block.number}`);
            return block as ethers.providers.Block;
          }
        }
        throw new Error(`HTTP request failed: ${response.status}`);
      } catch (httpError) {
        console.error(`[polygon-provider] Direct HTTP getBlock also failed:`, httpError);
        throw error; // Re-throw the original error
      }
    }
  }

  // Override send to handle any other RPC method issues
  async send(method: string, params: any[]): Promise<any> {
    try {
      return await super.send(method, params);
    } catch (error) {
      console.log(`[polygon-provider] Ethers send failed for ${method}, trying direct HTTP:`, error instanceof Error ? error.message : String(error));
      
      try {
        const response = await fetch(this.connection.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: method,
            params: params,
            id: 1
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.result !== undefined) {
            console.log(`[polygon-provider] Direct HTTP send successful for ${method}`);
            return data.result;
          }
        }
        throw new Error(`HTTP request failed: ${response.status}`);
      } catch (httpError) {
        console.error(`[polygon-provider] Direct HTTP send also failed:`, httpError);
        throw error; // Re-throw the original error
      }
    }
  }

  // Special method to handle the specific eth_getBlockByNumber issue
  async getLatestBlock(): Promise<any> {
    try {
      const response = await fetch(this.connection.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getBlockByNumber',
          params: ['latest', false],
          id: 1
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.result) {
          console.log(`[polygon-provider] Direct HTTP getLatestBlock successful`);
          return data.result;
        }
      }
      throw new Error(`HTTP request failed: ${response.status}`);
    } catch (error) {
      console.error(`[polygon-provider] Direct HTTP getLatestBlock failed:`, error);
      throw error;
    }
  }
}

function parseRpcList(): string[] {
  const raw = process.env.POLYGON_RPC || process.env.POLYGON_RPC_URL || '';
  const fromEnv = raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  const alchemyKey = process.env.ALCHEMY_API_KEY;
  const infuraId = process.env.INFURA_PROJECT_ID || process.env.INFURA_API_KEY;
  const fromVendors: string[] = [];
  if (alchemyKey) fromVendors.push(`https://polygon-mainnet.g.alchemy.com/v2/${alchemyKey}`);
  if (infuraId) fromVendors.push(`https://polygon-mainnet.infura.io/v3/${infuraId}`);
  
  // Updated list of more reliable public RPC endpoints
  const defaults = [
    'https://polygon.llamarpc.com',
    'https://polygon.rpc.blxrbdn.com',
    'https://polygon.meowrpc.com',
    'https://rpc-mainnet.maticvigil.com',
    'https://polygon-rpc.com',
    'https://rpc.ankr.com/polygon',
    'https://1rpc.io/matic',
    'https://polygon-bor-rpc.publicnode.com',
    'https://polygon.blockpi.network/v1/rpc/public',
    'https://polygon.drpc.org',
    'https://polygon-mainnet.public.blastapi.io',
    'https://rpc-mainnet.matic.network',
  ];
  
  // Deduplicate preserving order
  const seen = new Set<string>();
  const list = [...fromEnv, ...fromVendors, ...defaults].filter(u => (seen.has(u) ? false : (seen.add(u), true)));
  
  // Debug logging
  console.log('[polygon-provider] Environment variables:');
  console.log(`  POLYGON_RPC: ${process.env.POLYGON_RPC || 'not set'}`);
  console.log(`  POLYGON_RPC_URL: ${process.env.POLYGON_RPC_URL || 'not set'}`);
  console.log(`  ALCHEMY_API_KEY: ${alchemyKey ? 'set' : 'not set'}`);
  console.log(`  INFURA_PROJECT_ID: ${infuraId ? 'set' : 'not set'}`);
  console.log(`[polygon-provider] Parsed RPC list: ${list.length} endpoints`);
  console.log(`  From env: ${fromEnv.length}, From vendors: ${fromVendors.length}, Defaults: ${defaults.length}`);
  
  return list;
}

async function testProvider(p: ethers.providers.JsonRpcProvider, timeoutMs = 5000): Promise<boolean> {
  const startTime = Date.now();
  try {
    console.log(`[polygon-provider] Testing provider with ${timeoutMs}ms timeout...`);
    
    const race = Promise.race([
      p.getBlockNumber(),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), timeoutMs)),
    ]);
    
    const blockNumber = await race;
    const duration = Date.now() - startTime;
    
    console.log(`[polygon-provider] ✅ Provider test successful in ${duration}ms, block: ${blockNumber}`);
    return true;
  } catch (error) {
    const duration = Date.now() - startTime;
    if (error instanceof Error && error.message === 'timeout') {
      console.log(`[polygon-provider] ⏰ Provider test timed out after ${timeoutMs}ms`);
    } else {
      console.log(`[polygon-provider] ❌ Provider test failed after ${duration}ms:`, error instanceof Error ? error.message : String(error));
    }
    return false;
  }
}

export async function getWorkingPolygonProvider(): Promise<ethers.providers.JsonRpcProvider> {
  console.log('[polygon-provider] Getting working Polygon provider...');
  
  // Force use a working RPC endpoint instead of the failing Alchemy one
  const workingEndpoints = [
    'https://polygon.llamarpc.com',
    'https://polygon.rpc.blxrbdn.com',
    'https://polygon.meowrpc.com',
    'https://rpc-mainnet.maticvigil.com',
    'https://polygon-rpc.com',
    'https://rpc.ankr.com/polygon',
    'https://1rpc.io/matic',
    'https://polygon-bor-rpc.publicnode.com',
    'https://polygon.blockpi.network/v1/rpc/public',
    'https://polygon.drpc.org',
    'https://polygon-mainnet.public.blastapi.io',
    'https://rpc-mainnet.matic.network'
  ];

  for (const endpoint of workingEndpoints) {
    try {
      console.log(`[polygon-provider] Testing endpoint: ${endpoint}`);
      const provider = new CustomPolygonProvider(endpoint);
      const isWorking = await testProvider(provider, 10000);
      if (isWorking) {
        console.log(`[polygon-provider] Found working endpoint: ${endpoint}`);
        return provider;
      }
    } catch (error) {
      console.log(`[polygon-provider] Endpoint ${endpoint} failed:`, error);
    }
  }

  throw new Error('No working Polygon RPC endpoint found after testing all endpoints.');
}
