import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from './firebase';

export async function signInWithGoogleCapacitor(): Promise<void> {
  return new Promise((resolve, reject) => {
    const capacitor = (window as any).Capacitor;
    if (!capacitor?.isNativePlatform?.()) {
      reject(new Error('Not a Capacitor app'));
      return;
    }

    console.log('[CapacitorGoogleAuth] Starting OAuth flow');

    // Construct the OAuth URL
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
    const redirectUri = 'com.held.app://__/auth/handler';
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent('email profile')}` +
      `&prompt=select_account`;

    console.log('[CapacitorGoogleAuth] Opening browser with OAuth URL');

    // Set up the listener BEFORE opening the browser
    const urlListener = App.addListener('appUrlOpen', async (event) => {
      console.log('[CapacitorGoogleAuth] App URL opened:', event.url);

      if (event.url.includes('code=')) {
        console.log('[CapacitorGoogleAuth] OAuth code received');

        // Remove the listener
        urlListener.remove();

        // Close the browser
        try {
          await Browser.close();
        } catch (error) {
          console.log('[CapacitorGoogleAuth] Browser already closed');
        }

        try {
          // Extract the authorization code from the URL
          const url = new URL(event.url.replace('com.held.app://', 'https://held-62986.firebaseapp.com/'));
          const code = url.searchParams.get('code');

          if (!code) {
            throw new Error('No authorization code received');
          }

          console.log('[CapacitorGoogleAuth] Exchanging code for tokens...');

          // Exchange the code for an access token
          // Note: This requires a backend endpoint or using Firebase's token exchange
          // For now, we'll use Firebase's standard redirect flow by navigating to the callback
          const callbackUrl = `https://held-62986.firebaseapp.com/__/auth/handler?${url.search.substring(1)}`;
          console.log('[CapacitorGoogleAuth] Navigating to Firebase callback:', callbackUrl);
          
          window.location.href = callbackUrl;
          
          resolve();
        } catch (error) {
          console.error('[CapacitorGoogleAuth] Error processing OAuth callback:', error);
          reject(error);
        }
      }
    });

    // Open the browser
    Browser.open({ 
      url: authUrl,
      windowName: '_self'
    }).catch((error) => {
      console.error('[CapacitorGoogleAuth] Failed to open browser:', error);
      urlListener.remove();
      reject(error);
    });
  });
}

