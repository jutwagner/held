const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs } = require('firebase/firestore');

// Firebase config - using same config as your app
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID || process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

async function testFirestoreConnection() {
  try {
    console.log('🔍 Testing Firestore connection...');
    console.log('Firebase Config:', {
      projectId: firebaseConfig.projectId,
      authDomain: firebaseConfig.authDomain,
      // Don't log sensitive keys
    });
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // Test with a simple document
    const testData = {
      category: 'Test',
      brand: 'Test Brand',
      item: 'Test Item',
      era: '2020s',
      country: 'USA',
      type: 'Test Type',
      notes: 'Test notes',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('📝 Adding test document...');
    const brandsRef = collection(db, 'brands');
    const docRef = await addDoc(brandsRef, testData);
    console.log('✅ Test document added with ID:', docRef.id);
    
    // Try to read it back
    console.log('📖 Reading test document...');
    const snapshot = await getDocs(brandsRef);
    console.log('✅ Found', snapshot.size, 'documents in brands collection');
    
    snapshot.forEach(doc => {
      console.log('Document:', doc.id, '=>', doc.data());
    });
    
    console.log('🎉 Firestore connection test successful!');
    
  } catch (error) {
    console.error('💥 Firestore connection test failed:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
  }
}

// Run test
testFirestoreConnection();
