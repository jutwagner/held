const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = getFirestore();

// Replace with your actual user UID
const USER_UID = 'QAGPo22ka5QaSj1xb7aT1f3X64x1';

async function addPremium() {
  const userRef = db.collection('users').doc(USER_UID);
  await userRef.set({
    premium: {
      active: true,
      plan: 'heldplus',
      since: Date.now(),
      renewsAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
    },
  }, { merge: true });
  console.log('Premium field added to user:', USER_UID);
}

addPremium().catch(console.error);
