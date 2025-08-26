import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { generateSlug } from '../src/lib/utils';

// Initialize Firebase Admin
const serviceAccount = require('../../held-62986-firebase-adminsdk-fbsvc-1800582075.json');
const app = initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore(app);

async function updateObjectSlugs() {
  try {
    console.log('Starting slug update for all objects...');
    
    // Get all objects
    const objectsSnapshot = await db.collection('objects').get();
    
    if (objectsSnapshot.empty) {
      console.log('No objects found in database');
      return;
    }
    
    console.log(`Found ${objectsSnapshot.size} objects to process`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const doc of objectsSnapshot.docs) {
      const data = doc.data();
      const title = data.title;
      
      if (!title) {
        console.log(`Skipping object ${doc.id} - no title`);
        skippedCount++;
        continue;
      }
      
      const generatedSlug = generateSlug(title);
      const existingSlug = data.slug;
      
      if (existingSlug === generatedSlug) {
        console.log(`Object ${doc.id} already has correct slug: ${existingSlug}`);
        skippedCount++;
        continue;
      }
      
      // Update the object with the new slug
      await doc.ref.update({
        slug: generatedSlug,
        updatedAt: new Date()
      });
      
      console.log(`Updated object ${doc.id}: "${title}" -> slug: ${generatedSlug}`);
      updatedCount++;
    }
    
    console.log(`\nSlug update complete!`);
    console.log(`Updated: ${updatedCount} objects`);
    console.log(`Skipped: ${skippedCount} objects`);
    
  } catch (error) {
    console.error('Error updating object slugs:', error);
  }
}

// Run the script
updateObjectSlugs().then(() => {
  console.log('Script completed');
  process.exit(0);
}).catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
