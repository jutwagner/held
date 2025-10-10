// Native Google Auth using Capacitor Google Auth plugin
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from './firebase';

// Initialize the plugin
export function initializeGoogleAuth() {
  if (typeof window !== 'undefined') {
    const capacitor = (window as any).Capacitor;
    if (capacitor?.isNativePlatform?.()) {
      console.log('[Native Google Auth] Initializing Google Auth plugin');
      GoogleAuth.initialize({
        clientId: '612683552247-p7bgbhai2ed62i9b5tmpk6m2miqvcp08.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
      });
    }
  }
}

// Sign in with Google using the native plugin
export async function signInWithGoogleNative() {
  try {
    console.log('[Native Google Auth] Starting Google sign-in flow');
    
    // Sign in with the native Google Auth plugin
    const result = await GoogleAuth.signIn();
    console.log('[Native Google Auth] Google sign-in successful:', {
      email: result.email,
      name: result.name,
    });
    
    // Get the ID token
    const idToken = result.authentication.idToken;
    if (!idToken) {
      throw new Error('No ID token received from Google');
    }
    
    // Create a Firebase credential with the token
    const credential = GoogleAuthProvider.credential(idToken);
    
    // Sign in to Firebase with the credential
    console.log('[Native Google Auth] Signing in to Firebase with Google credential');
    const userCredential = await signInWithCredential(auth, credential);
    
    console.log('[Native Google Auth] Firebase sign-in successful:', {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
    });
    
    return userCredential;
  } catch (error: any) {
    console.error('[Native Google Auth] Error during Google sign-in:', error);
    throw error;
  }
}

// Check if we're in a Capacitor native environment
export function isNativeEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  const capacitor = (window as any).Capacitor;
  return Boolean(capacitor?.isNativePlatform?.());
}

