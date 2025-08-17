import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function addRotation() {
  const rotationData = {
    userId: 'sampleUserId', // Replace with the actual user ID
    name: 'Sample Rotation',
    description: 'This is a sample rotation description.',
    objectIds: ['object1', 'object2'], // Replace with actual object IDs
    isPublic: true,
    slug: 'sample-rotation',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  console.log('Rotation Data:', rotationData); // Log the rotation data being sent to Firestore

  try {
    const docRef = await addDoc(collection(db, 'rotations'), rotationData);
    console.log('Rotation document created with ID:', docRef.id);
  } catch (error) {
    console.error('Error creating rotation document:', error);
  }
}
