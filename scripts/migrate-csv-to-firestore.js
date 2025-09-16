const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

// Firebase config - using same config as your app
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID || process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

async function migrateCSVToFirestore() {
  try {
    console.log('🚀 Starting CSV to Firestore migration...');
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // Read CSV file
    const csvPath = path.join(process.cwd(), 'public', 'list.csv');
    if (!fs.existsSync(csvPath)) {
      throw new Error('CSV file not found at public/list.csv');
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').slice(1); // Skip header
    
    const data = lines
      .filter(line => line.trim())
      .map(line => {
        const columns = line.split(',');
        return {
          category: columns[0]?.trim() || '',
          brand: columns[1]?.trim() || '',
          item: columns[2]?.trim() || '',
          era: columns[3]?.trim() || '',
          country: columns[4]?.trim() || '',
          type: columns[5]?.trim() || '',
          notes: columns[6]?.trim() || ''
        };
      })
      .filter(row => row.category && row.brand); // Only valid entries
    
    console.log(`📊 Found ${data.length} valid entries to migrate`);
    
    // Migrate to Firestore
    const brandsRef = collection(db, 'brands');
    let successCount = 0;
    let errorCount = 0;
    
    for (const row of data) {
      try {
        await addDoc(brandsRef, {
          category: row.category,
          brand: row.brand,
          item: row.item,
          era: row.era,
          country: row.country,
          type: row.type,
          notes: row.notes,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        successCount++;
        if (successCount % 100 === 0) {
          console.log(`✅ Migrated ${successCount} entries...`);
        }
      } catch (error) {
        console.error(`❌ Error migrating entry:`, row, error);
        errorCount++;
      }
    }
    
    console.log(`🎉 Migration complete!`);
    console.log(`✅ Successfully migrated: ${successCount} entries`);
    console.log(`❌ Errors: ${errorCount} entries`);
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateCSVToFirestore();
