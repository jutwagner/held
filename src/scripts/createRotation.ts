import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const db = getFirestore();
const auth = getAuth();

async function createRotationDocument() {
  const user = auth.currentUser;

  if (!user) {
    console.error('User is not authenticated');
    return;
  }

  const rotationData = {
    userId: user.uid,
    name: 'Sample Rotation',
    description: 'This is a sample rotation description.',
    objectIds: ['object1', 'object2'], // Replace with actual object IDs
    isPublic: false,
    slug: 'sample-rotation',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  try {
    const docRef = await addDoc(collection(db, 'rotations'), rotationData);
    console.log('Rotation document created with ID:', docRef.id);
  } catch (error) {
    console.error('Error creating rotation document:', error);
  }
}

createRotationDocument();
