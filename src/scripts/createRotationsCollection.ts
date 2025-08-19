import { db as adminDb } from '@/lib/firebase.admin';

// Initialize Firebase Admin SDK
// Firebase Admin SDK is initialized in lib/firebase.admin.ts
const db = adminDb;

// Sample rotation documents
const rotations = [
  {
    userId: 'user1',
    title: 'Rotation 1',
    items: ['item1', 'item2'],
    visibility: 'private',
    notes: 'This is the first rotation.',
  createdAt: new Date(),
  updatedAt: new Date(),
  },
  {
    userId: 'user2',
    title: 'Rotation 2',
    items: ['item3', 'item4'],
    visibility: 'public',
    notes: 'This is the second rotation.',
  createdAt: new Date(),
  updatedAt: new Date(),
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
  // Debug log removed for production
  } catch (error) {
  // Error log removed for production
  }
};

createRotationsCollection();
