import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// export async function addRotation() {
//   const rotationData = {
//     userId: 'sampleUserId', // Replace with the actual user ID
//     name: 'Sample Rotation',
//     description: 'This is a sample rotation description.',
//     objectIds: ['object1', 'object2'], // Replace with actual object IDs
//     isPublic: true,
//     slug: 'sample-rotation',
//     createdAt: Timestamp.now(),
//     updatedAt: Timestamp.now(),
//   };
//
//   // Debug log removed for production
//
//   try {
//     await addDoc(collection(db, 'rotations'), rotationData);
//   // Debug log removed for production
//     } catch {
//     // Handle error appropriately
//   }
// }
