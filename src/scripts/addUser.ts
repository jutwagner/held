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
  // Debug log removed for production
  } catch (error) {
  // Error log removed for production
  }
}

addUser();
