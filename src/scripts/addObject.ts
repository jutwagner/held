import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function addObject() {
  const objectData = {
    userId: 'sampleUserId', // Replace with actual user ID
    name: 'Sample Object',
    description: 'This is a sample object description.',
    isPublic: true,
    createdAt: new Date(),
  };

  try {
    const docRef = await addDoc(collection(db, 'objects'), objectData);
    console.log('Object document created with ID:', docRef.id);
  } catch (error) {
    console.error('Error creating object document:', error);
  }
}

addObject();
