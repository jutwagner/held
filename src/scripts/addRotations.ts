import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

// Firebase configuration (ensure this matches your Firebase project)
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Example rotation data
const rotations = [
  {
    id: 'rotation1',
    userId: 'user1',
    name: 'Sample Rotation 1',
    description: 'This is a sample rotation.',
    objectIds: ['object1', 'object2'],
    isPublic: true,
    slug: 'sample-rotation-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'rotation2',
    userId: 'user2',
    name: 'Sample Rotation 2',
    description: 'This is another sample rotation.',
    objectIds: ['object3', 'object4'],
    isPublic: false,
    slug: 'sample-rotation-2',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Function to add rotations to Firestore
const addRotations = async () => {
  try {
    const collectionRef = collection(db, 'rotations');
    for (const rotation of rotations) {
      await addDoc(collectionRef, rotation);
  // Debug log removed for production
    }
  // Debug log removed for production
  } catch (error) {
  // Error log removed for production
  }
};

addRotations();
