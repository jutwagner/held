// Email Template Testing Script
// Run this in browser console on your signup page

async function testEmailTemplate() {
  try {
    console.log('🧪 Testing email verification...');
    
    // Create a test account
    const testEmail = `test+${Date.now()}@gmail.com`;
    const testPassword = 'TestPassword123!';
    
    console.log(`📧 Creating test account: ${testEmail}`);
    
    // Fill out signup form programmatically
    document.querySelector('input[type="email"]').value = testEmail;
    document.querySelector('input[type="password"]').value = testPassword;
    document.querySelector('input[placeholder*="name"]').value = 'Test User';
    document.querySelector('input[placeholder*="delete"]').value = 'delete';
    
    // Submit form
    document.querySelector('button[type="submit"]').click();
    
    console.log('✅ Test account created! Check your email inbox.');
    console.log('📱 Email should arrive within 1-2 minutes');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testEmailTemplate();

