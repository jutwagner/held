
'use client';
// Global Held+ membership checker
export function isHeldPlus(user: UserDoc | null | undefined): boolean {
  return !!user && !!user.premium && user.premium.active === true && (user.premium.plan === 'plus' || user.premium.plan === 'heldplus');
}

import React, { createContext, useContext, useEffect, useState } from 'react';
// import type { Dispatch, SetStateAction } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  signInWithPopup,
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createUser, getUser, initializePresence } from '@/lib/firebase-services';
import type { UserDoc } from '@/types';

import type { Dispatch, SetStateAction } from 'react';
interface AuthContextType {
  user: UserDoc | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<'redirect' | 'popup'>;
  signInWithApple: () => Promise<'redirect' | 'popup'>;
  setUser: Dispatch<SetStateAction<UserDoc | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Always start with null for SSR safety
  const [user, setUser] = useState<UserDoc | null>(null);
  // Hydration guard: only render children after client hydration
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [presenceCleanup, setPresenceCleanup] = useState<(() => void) | null>(null);

    // Google Sign-In - use redirect for mobile compatibility
  const signInWithGoogle = async (): Promise<'redirect' | 'popup'> => {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    provider.setCustomParameters({ prompt: 'select_account' });

    // Prefer redirect for iOS and hybrid environments to avoid popup issues
    const ua = typeof window !== 'undefined' ? window.navigator.userAgent || '' : '';
    const isiOSSafariStandalone = typeof window !== 'undefined' && (window.navigator as any)?.standalone === true;
    const isIOSDevice = /iPhone|iPad|iPod/.test(ua);
    const capacitor = typeof window !== 'undefined' ? (window as any).Capacitor : undefined;
    const isCapacitorNative = Boolean(capacitor?.isNativePlatform?.());
    const isStandalonePWA = isiOSSafariStandalone || (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches);
    const shouldUseRedirect = isIOSDevice || isStandalonePWA || isCapacitorNative;
    try {
      if (shouldUseRedirect) {
        console.log('[Auth] Using signInWithRedirect flow');
        await signInWithRedirect(auth, provider);
        return 'redirect';
      }

      const result = await signInWithPopup(auth, provider);
      if (result?.user) {
        const userData = await getUser(result.user.uid);
        if (!userData) {
          await createUser({
            uid: result.user.uid,
            email: result.user.email!,
            displayName: result.user.displayName || '',
            avatarUrl: result.user.photoURL || '',
          });
        }
      }
      return 'popup';
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      const message = String(error?.message || '');
      const code = String(error?.code || '');
      // Fallback to redirect on common popup/network/redirect mismatches
      const shouldRedirect =
        code === 'auth/popup-blocked' ||
        code === 'auth/cancelled-popup-request' ||
        code === 'auth/operation-not-supported-in-this-environment' ||
        message.includes('redirect_uri_mismatch') ||
        message.includes('Access blocked: This app’s request is invalid');
      if (shouldRedirect) {
        console.log('[Auth] Falling back to redirect because of error code/message', { code, message });
        await signInWithRedirect(auth, provider);
        return 'redirect';
      }
      if (code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in was cancelled.');
      }
      throw new Error('Google sign-in failed. Please try again.');
    }
  };

  const signInWithApple = async (): Promise<'redirect' | 'popup'> => {
    const provider = new OAuthProvider('apple.com');
    provider.addScope('email');
    provider.addScope('name');
    if (typeof navigator !== 'undefined') {
      provider.setCustomParameters({ locale: navigator.language || 'en_US' });
    }

    const ua = typeof window !== 'undefined' ? window.navigator.userAgent || '' : '';
    const isiOSSafariStandalone = typeof window !== 'undefined' && (window.navigator as any)?.standalone === true;
    const isIOSDevice = /iPhone|iPad|iPod/.test(ua);
    const capacitor = typeof window !== 'undefined' ? (window as any).Capacitor : undefined;
    const isCapacitorNative = Boolean(capacitor?.isNativePlatform?.());
    const isStandalonePWA = isiOSSafariStandalone || (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches);
    const shouldUseRedirect = isIOSDevice || isStandalonePWA || isCapacitorNative;

    try {
      if (shouldUseRedirect) {
        console.log('[Auth] Using Apple signInWithRedirect flow');
        await signInWithRedirect(auth, provider);
        return 'redirect';
      }

      const result = await signInWithPopup(auth, provider);
      if (result?.user) {
        const profile = (result.additionalUserInfo?.profile ?? {}) as Record<string, unknown>;
        const givenName = typeof profile.given_name === 'string' ? profile.given_name : '';
        const familyName = typeof profile.family_name === 'string' ? profile.family_name : '';
        const fallbackName = `${givenName} ${familyName}`.trim();
        const resolvedDisplayName = result.user.displayName || fallbackName;
        const resolvedEmail = result.user.email || (typeof profile.email === 'string' ? profile.email : '');

        const userData = await getUser(result.user.uid);
        if (!userData) {
          await createUser({
            uid: result.user.uid,
            email: resolvedEmail,
            displayName: resolvedDisplayName,
            avatarUrl: result.user.photoURL || '',
          });
        }
      }
      return 'popup';
    } catch (error: any) {
      console.error('Apple sign-in error:', error);
      const message = String(error?.message || '');
      const code = String(error?.code || '');
      const shouldRedirect =
        code === 'auth/popup-blocked' ||
        code === 'auth/cancelled-popup-request' ||
        code === 'auth/operation-not-supported-in-this-environment' ||
        message.includes('redirect_uri_mismatch');
      if (shouldRedirect) {
        console.log('[Auth] Falling back to redirect because of Apple error code/message', { code, message });
        await signInWithRedirect(auth, provider);
        return 'redirect';
      }
      if (code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in was cancelled.');
      }
      throw new Error('Apple sign-in failed. Please try again.');
    }
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const init = async () => {
      try {
        const result = await getRedirectResult(auth);
        console.log('[Auth] getRedirectResult returned', result?.user ? 'user' : result === null ? 'null' : 'no user');
        if (typeof window !== 'undefined') {
          const redirectStorageKey = `firebase:redirectEvent:${auth.app.options.apiKey}:${auth.app.name}`;
          const sessionValue = window.sessionStorage.getItem(redirectStorageKey);
          const localValue = window.localStorage.getItem(redirectStorageKey);
          console.log('[Auth] Redirect storage key contents:', redirectStorageKey, {
            session: sessionValue,
            local: localValue,
          });
          console.log('[Auth] Current location after redirect:', window.location.href);
        }
        if (result?.user) {
          const existing = await getUser(result.user.uid);
          if (!existing) {
            await createUser({
              uid: result.user.uid,
              email: result.user.email!,
              displayName: result.user.displayName || '',
              avatarUrl: result.user.photoURL || '',
            });
          }
        }
      } catch (error) {
        console.error('Google redirect sign-in error:', error);
      }

      const existingAuthUser = auth.currentUser;
      if (existingAuthUser) {
        console.log('[Auth] Found currentUser after redirect');
        let userData = await getUser(existingAuthUser.uid);
        if (!userData) {
          userData = await createUser({
            uid: existingAuthUser.uid,
            email: existingAuthUser.email || '',
            displayName: existingAuthUser.displayName || '',
            avatarUrl: existingAuthUser.photoURL || '',
          });
        }
        setUser(userData);
        setFirebaseUser(existingAuthUser);
        setLoading(false);
      }

      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        setFirebaseUser(firebaseUser);
        if (firebaseUser) {
          let userData = await getUser(firebaseUser.uid);
          if (!userData) {
            userData = await createUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName: firebaseUser.displayName || '',
              avatarUrl: firebaseUser.photoURL || '',
            });
          }
          console.log('[DEBUG] AuthContext setUser called with:', userData);
          console.log('[DEBUG] User premium status:', userData?.premium);
          setUser(userData);
          if (typeof window !== 'undefined') {
            localStorage.setItem('held_user', JSON.stringify(userData));
          }

          setTimeout(() => {
            const cleanup = initializePresence(firebaseUser.uid);
            setPresenceCleanup(() => cleanup);
          }, 2000);
        } else {
          console.log('[DEBUG] AuthContext setUser called with: null');
          setUser(null);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('held_user');
          }

          if (presenceCleanup) {
            presenceCleanup();
            setPresenceCleanup(null);
          }
        }
        setLoading(false);
      });
    };

    init();

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'code' in error) {
        const code = (error as { code: string }).code;
        if (code === 'auth/user-not-found') {
          throw new Error('No user found with this email.');
        } else if (code === 'auth/wrong-password') {
          throw new Error('Incorrect password.');
        } else {
          throw new Error('Failed to sign in. Please try again later.');
        }
      } else {
        throw new Error('Failed to sign in. Please try again later.');
      }
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await createUser({
        uid: result.user.uid,
        email: result.user.email!,
        displayName,
        avatarUrl: result.user.photoURL || '',
      });
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'code' in error) {
        const code = (error as { code: string }).code;
        if (code === 'auth/email-already-in-use') {
          throw new Error('Email is already in use.');
        } else {
          throw new Error('Failed to create account. Please try again later.');
        }
      } else {
        throw new Error('Failed to create account. Please try again later.');
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } finally {
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  };

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    signIn,
    signUp,
    logout,
    signInWithGoogle,
    signInWithApple,
    setUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {hydrated ? children : null}
    </AuthContext.Provider>
  );
};
