'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createUser, getUser } from '@/lib/firebase-services';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
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
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        // Check if user exists in our database
        let userData = await getUser(firebaseUser.uid);
        
        if (!userData) {
          // Create new user in our database
          const userDataToCreate: Omit<User, 'createdAt' | 'updatedAt'> = {
            uid: firebaseUser.uid,
            email: firebaseUser.email!,
            ...(firebaseUser.displayName ? { displayName: firebaseUser.displayName } : {}),
            ...(firebaseUser.photoURL ? { photoURL: firebaseUser.photoURL } : {}),
          };
          userData = await createUser(userDataToCreate);
        }
        
        setUser(userData);
      } else {
        setUser(null);
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

  const value = {
    user,
    firebaseUser,
    loading,
    signIn,
    signUp,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
