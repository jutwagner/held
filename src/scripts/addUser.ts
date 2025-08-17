import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function addUser() {
  const userData = {
    userId: 'sampleUserId', // Replace with actual user ID
    name: 'Sample User',
    email: 'sampleuser@example.com',
    createdAt: new Date(),
  };

  try {
    const docRef = await addDoc(collection(db, 'users'), userData);
    console.log('User document created with ID:', docRef.id);
  } catch (error) {
    console.error('Error creating user document:', error);
  }
}

addUser();
