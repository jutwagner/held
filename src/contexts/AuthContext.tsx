
'use client';
// Global Held+ membership checker
export function isHeldPlus(user: UserDoc | null | undefined): boolean {
  return !!user && !!user.premium && user.premium.active === true && (user.premium.plan === 'plus' || user.premium.plan === 'heldplus');
}

import React, { createContext, useContext, useEffect, useState } from 'react';
// import type { Dispatch, SetStateAction } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithRedirect, getRedirectResult, signInWithPopup } from 'firebase/auth';
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
  signInWithGoogle: () => Promise<void>;
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
  const signInWithGoogle = async (): Promise<void> => {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      // For mobile apps, only use popup (no redirect to Safari)
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
    } catch (error) {
      console.error('Google sign-in error:', error);
      // Check if it's a popup blocked error
      if (error.code === 'auth/popup-blocked') {
        throw new Error('Popup was blocked. Please allow popups for this app.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in was cancelled.');
      } else {
        throw new Error('Google sign-in failed. This feature requires proper Firebase iOS configuration.');
      }
    }
  };

  useEffect(() => {
    // Handle Google OAuth redirect result
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          // Create user in DB if not exists
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
      } catch (error) {
        console.error('Google redirect sign-in error:', error);
      }
    };

    handleRedirectResult();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
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
        setUser(userData);
        if (typeof window !== 'undefined') {
          localStorage.setItem('held_user', JSON.stringify(userData));
        }
        
        // Initialize presence tracking with delay to ensure user is fully set up
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
        
        // Clean up presence tracking
        if (presenceCleanup) {
          presenceCleanup();
          setPresenceCleanup(null);
        }
      }
      setLoading(false);
    });
    return unsubscribe;
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
    await signOut(auth);
  };

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    signIn,
    signUp,
    logout,
    signInWithGoogle,
    setUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {hydrated ? children : null}
    </AuthContext.Provider>
  );
};
