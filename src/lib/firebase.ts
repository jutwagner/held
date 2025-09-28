import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, browserLocalPersistence, browserSessionPersistence, inMemoryPersistence, indexedDBLocalPersistence, browserPopupRedirectResolver } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const envApiKey = process.env.FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const envProjectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const envStorageBucket = process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const envMessagingSenderId =
  process.env.FIREBASE_MESSAGING_SENDER_ID || process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const envAppId = process.env.FIREBASE_APP_ID || process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

const envAuthDomain = process.env.FIREBASE_AUTH_DOMAIN || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const proxyAuthDomain =
  process.env.FIREBASE_AUTH_PROXY_DOMAIN || process.env.NEXT_PUBLIC_FIREBASE_AUTH_PROXY_DOMAIN;

const localAuthDomain =
  process.env.FIREBASE_AUTH_LOCAL_DOMAIN ||
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_LOCAL_DOMAIN ||
  proxyAuthDomain;

const isProduction = process.env.NODE_ENV === 'production';
const resolvedAuthDomain = (isProduction ? envAuthDomain : localAuthDomain) || envAuthDomain || proxyAuthDomain;

const firebaseConfig = {
  apiKey: envApiKey,
  authDomain: resolvedAuthDomain,
  projectId: envProjectId,
  storageBucket: envStorageBucket,
  messagingSenderId: envMessagingSenderId,
  appId: envAppId,
};

// Runtime check for missing env vars
const missingVars = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);
if (missingVars.length > 0) {
  throw new Error(
    `Missing Firebase environment variables: ${missingVars.join(', ')}.\n` +
    'Check your .env.local file or Vercel project settings.'
  );
}


// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Debug Firebase configuration
console.log('[DEBUG] Firebase config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  storageBucket: firebaseConfig.storageBucket
});

// Initialize Firebase Auth with layered persistence
let authInstance;
if (typeof window === 'undefined') {
  authInstance = getAuth(app);
} else {
  try {
    authInstance = initializeAuth(app, {
      persistence: [
        browserLocalPersistence,
        browserSessionPersistence,
        indexedDBLocalPersistence,
        inMemoryPersistence,
      ],
      popupRedirectResolver: browserPopupRedirectResolver,
    });
    console.log('[Auth] initializeAuth with layered persistence succeeded');
  } catch (error) {
    console.warn('[Auth] initializeAuth failed, falling back to getAuth', error);
    authInstance = getAuth(app);
  }
}

export const auth = authInstance;
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
