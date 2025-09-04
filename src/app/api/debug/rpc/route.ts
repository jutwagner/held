import { NextRequest, NextResponse } from 'next/server';
import { getWorkingPolygonProvider } from '@/lib/polygon-provider';

export async function GET(req: NextRequest) {
  try {
    console.log('[API/debug/rpc] Testing RPC connectivity...');
    
    const provider = await getWorkingPolygonProvider();
    const blockNumber = await provider.getBlockNumber();
    const network = await provider.getNetwork();
    
    console.log('[API/debug/rpc] RPC test successful');
    
    return NextResponse.json({
      success: true,
      message: 'RPC connection successful',
      data: {
        blockNumber: blockNumber.toString(),
        chainId: network.chainId,
        name: network.name,
        provider: provider.connection.url
      }
    });
  } catch (error) {
    console.error('[API/debug/rpc] RPC test failed:', error);
    
    return NextResponse.json({
      success: false,
      message: 'RPC connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export const runtime = 'nodejs';

