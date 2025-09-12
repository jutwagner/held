import { NextRequest, NextResponse } from 'next/server';
import { getUserByHandle } from '@/lib/firebase-services';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const handle = searchParams.get('handle');

  if (!handle) {
    return NextResponse.json({ error: 'Handle parameter required' }, { status: 400 });
  }

  try {
    console.log('[DEBUG] Looking for user with handle:', handle);
    const user = await getUserByHandle(handle);
    
    return NextResponse.json({
      success: true,
      handle,
      user: user ? {
        uid: user.uid,
        displayName: user.displayName,
        handle: user.handle,
        isPublicProfile: user.isPublicProfile,
        avatarUrl: user.avatarUrl,
        coverImage: user.coverImage
      } : null
    });
  } catch (error) {
    console.error('[DEBUG] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
