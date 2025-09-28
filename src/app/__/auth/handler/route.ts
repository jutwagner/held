import { NextResponse } from 'next/server';

export function GET(request: Request) {
  const { search } = new URL(request.url);
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '';
  if (!authDomain) {
    return NextResponse.json({ error: 'Firebase auth domain not configured' }, { status: 500 });
  }
  const target = new URL(`https://${authDomain}/__/auth/handler${search}`);
  return NextResponse.redirect(target);
}

export function POST(request: Request) {
  const { search } = new URL(request.url);
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '';
  if (!authDomain) {
    return NextResponse.json({ error: 'Firebase auth domain not configured' }, { status: 500 });
  }
  const target = new URL(`https://${authDomain}/__/auth/handler${search}`);
  return NextResponse.redirect(target);
}
