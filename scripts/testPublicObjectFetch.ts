
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Ensure dotenv runs before any other imports
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../src/lib/firebase';

async function testPublicObjectFetch(slug: string) {
  const objectsRef = collection(db, 'objects');
  const q = query(objectsRef, where('slug', '==', slug));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    const data = doc.data();
    console.log('[TEST] Object found:', data);
    if (data.isPublic === true) {
      console.log('[TEST] Object is public and accessible:', data);
    } else {
      console.warn('[TEST] Object is not public:', data);
    }
  } else {
    console.warn('[TEST] No object found for slug:', slug);
  }
}

// Replace 'hg' with your test slug

testPublicObjectFetch('hg').catch(console.error);
