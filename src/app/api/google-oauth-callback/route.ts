import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { code, state, redirectUri } = await req.json();

    if (!code || !state) {
      return NextResponse.json({ error: 'Missing OAuth code or state' }, { status: 400 });
    }

    console.log('[OAuth API] Processing OAuth code exchange for:', { code: code.substring(0, 10) + '...', state });

    // Use Google's OAuth2 token endpoint to exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: process.env.FIREBASE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '', // We need the Google Client Secret
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('[OAuth API] Token exchange failed:', errorText);
      return NextResponse.json({ error: 'Token exchange failed' }, { status: 400 });
    }

    const tokenData = await tokenResponse.json();
    console.log('[OAuth API] Token exchange successful');

    // Return the tokens in the format expected by Firebase
    return NextResponse.json({
      credential: {
        accessToken: tokenData.access_token,
        idToken: tokenData.id_token,
      },
    });

  } catch (error) {
    console.error('[OAuth API] Google OAuth callback error:', error);
    return NextResponse.json({ error: 'OAuth exchange failed' }, { status: 500 });
  }
}
