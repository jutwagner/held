import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, serverTimestamp } from 'firebase-admin/firestore';
import adminConfig from '@/lib/firebase.admin'; // Adjusted to use the alias

// Initialize Firebase Admin SDK
initializeApp({
  credential: cert(adminConfig),
});

const db = getFirestore();

// Sample rotation documents
const rotations = [
  {
    userId: 'user1',
    title: 'Rotation 1',
    items: ['item1', 'item2'],
    visibility: 'private',
    notes: 'This is the first rotation.',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
  {
    userId: 'user2',
    title: 'Rotation 2',
    items: ['item3', 'item4'],
    visibility: 'public',
    notes: 'This is the second rotation.',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
];

const createRotationsCollection = async () => {
  try {
    const batch = db.batch();
    const collectionRef = db.collection('rotations');

    rotations.forEach((rotation) => {
      const docRef = collectionRef.doc();
      batch.set(docRef, rotation);
    });

    await batch.commit();
    console.log('Rotations collection created successfully.');
  } catch (error) {
    console.error('Error creating rotations collection:', error);
  }
};

createRotationsCollection();
