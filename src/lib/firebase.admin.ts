import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
  try {
    // Use applicationDefault() which will use GOOGLE_APPLICATION_CREDENTIALS
    initializeApp({
      credential: applicationDefault(),
      projectId: 'held-62986',
    });
    console.log('[Firebase Admin] Initialized successfully with default credentials');
  } catch (error) {
    console.error('[Firebase Admin] Failed to initialize:', error);
    throw error;
  }
}

const db = getFirestore();

export { db };
