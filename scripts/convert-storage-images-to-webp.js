// Batch convert all Firebase Storage images to WebP and update Firestore references
// Usage: node scripts/convert-storage-images-to-webp.js

const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '<your-bucket>.appspot.com',
});
const db = admin.firestore();
const bucket = admin.storage().bucket();

async function convertImageToWebP(storagePath) {
  const tempFile = path.join('/tmp', path.basename(storagePath));
  const tempWebP = tempFile.replace(/\.[^.]+$/, '.webp');
  // Download image
  await bucket.file(storagePath).download({ destination: tempFile });
  // Convert to WebP
  await sharp(tempFile).webp({ quality: 92 }).toFile(tempWebP);
  // Upload WebP
  const webpStoragePath = storagePath.replace(/\.[^.]+$/, '.webp');
  await bucket.upload(tempWebP, { destination: webpStoragePath });
  // Clean up temp files
  await fs.unlink(tempFile);
  await fs.unlink(tempWebP);
  return webpStoragePath;
}

async function updateFirestoreReferences(collection, field) {
  const snapshot = await db.collection(collection).get();
  for (const doc of snapshot.docs) {
    const data = doc.data();
    let updated = false;
    if (Array.isArray(data[field])) {
      data[field] = data[field].map(url => {
        if (typeof url === 'string' && !url.endsWith('.webp')) {
          updated = true;
          return url.replace(/\.[^.]+(?=\?|$)/, '.webp');
        }
        return url;
      });
    } else if (typeof data[field] === 'string' && !data[field].endsWith('.webp')) {
      data[field] = data[field].replace(/\.[^.]+(?=\?|$)/, '.webp');
      updated = true;
    }
    if (updated) {
      await doc.ref.update({ [field]: data[field] });
      console.log(`Updated Firestore doc ${doc.id} in ${collection}`);
    }
  }
}

async function main() {
  // List all files in objects/ and coa/ folders
  const [files] = await bucket.getFiles({ prefix: 'objects/' });
  const [coaFiles] = await bucket.getFiles({ prefix: 'coa/' });
  const allFiles = [...files, ...coaFiles];
  for (const file of allFiles) {
    if (!file.name.endsWith('.webp') && (file.name.endsWith('.png') || file.name.endsWith('.jpg') || file.name.endsWith('.jpeg'))) {
      try {
        const webpPath = await convertImageToWebP(file.name);
        console.log(`Converted ${file.name} to ${webpPath}`);
      } catch (err) {
        console.error(`Failed to convert ${file.name}:`, err);
      }
    }
  }
  // Update Firestore references for objects and COA
  await updateFirestoreReferences('objects', 'images');
  await updateFirestoreReferences('objects', 'certificateOfAuthenticity');
  console.log('Migration complete.');
}

main().catch(console.error);
