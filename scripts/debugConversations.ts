import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
const serviceAccount = require('../../held-62986-firebase-adminsdk-fbsvc-1800582075.json');
const app = initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore(app);

async function debugConversations() {
  try {
    console.log('=== Debugging Conversations ===');
    
    // Get all conversations
    const conversationsSnapshot = await db.collection('conversations').get();
    console.log(`Found ${conversationsSnapshot.size} conversations`);
    
    for (const doc of conversationsSnapshot.docs) {
      const data = doc.data();
      console.log(`\nConversation ${doc.id}:`);
      console.log('  Participants:', data.participants);
      console.log('  Last Message:', data.lastMessage);
      
      // Get messages for this conversation
      const messagesSnapshot = await db.collection('messages')
        .where('conversationId', '==', doc.id)
        .get();
      
      console.log(`  Messages (${messagesSnapshot.size}):`);
      messagesSnapshot.docs.forEach(msgDoc => {
        const msgData = msgDoc.data();
        console.log(`    - ${msgData.senderId}: "${msgData.text}"`);
      });
    }
    
    console.log('\n=== User IDs found ===');
    const allUserIds = new Set();
    conversationsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      data.participants?.forEach((p: string) => allUserIds.add(p));
    });
    
    console.log(Array.from(allUserIds));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugConversations();

