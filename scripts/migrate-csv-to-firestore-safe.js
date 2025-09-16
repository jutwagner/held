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

// Function to clean and validate data for Firestore
function cleanData(data) {
  return {
    category: String(data.category || '').trim().substring(0, 100), // Limit length
    brand: String(data.brand || '').trim().substring(0, 100),
    item: String(data.item || '').trim().substring(0, 100),
    era: String(data.era || '').trim().substring(0, 50),
    country: String(data.country || '').trim().substring(0, 50),
    type: String(data.type || '').trim().substring(0, 50),
    notes: String(data.notes || '').trim().substring(0, 500),
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

// Function to parse CSV line properly (handles commas in quoted fields)
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

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
        const columns = parseCSVLine(line);
        return {
          category: columns[0] || '',
          brand: columns[1] || '',
          item: columns[2] || '',
          era: columns[3] || '',
          country: columns[4] || '',
          type: columns[5] || '',
          notes: columns[6] || ''
        };
      })
      .filter(row => row.category && row.brand); // Only valid entries
    
    console.log(`📊 Found ${data.length} valid entries to migrate`);
    
    // Migrate to Firestore with batching and error handling
    const brandsRef = collection(db, 'brands');
    let successCount = 0;
    let errorCount = 0;
    const batchSize = 10; // Process in smaller batches
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      for (const row of batch) {
        try {
          const cleanRow = cleanData(row);
          
          // Validate required fields
          if (!cleanRow.category || !cleanRow.brand) {
            console.warn(`⚠️ Skipping invalid row:`, row);
            errorCount++;
            continue;
          }
          
          await addDoc(brandsRef, cleanRow);
          successCount++;
          
          if (successCount % 50 === 0) {
            console.log(`✅ Migrated ${successCount} entries...`);
          }
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error(`❌ Error migrating entry:`, row, error.message);
          errorCount++;
        }
      }
      
      // Longer delay between batches
      if (i + batchSize < data.length) {
        console.log(`⏳ Processed ${i + batchSize} entries, pausing...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
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
