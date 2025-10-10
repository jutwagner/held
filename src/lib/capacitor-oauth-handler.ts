// Conditional imports for Capacitor plugins
let App: any;
let Browser: any;

if (typeof window !== 'undefined') {
  try {
    App = require('@capacitor/app').App;
    Browser = require('@capacitor/browser').Browser;
  } catch (error) {
    console.log('[OAuth] Capacitor plugins not available in web environment');
  }
}

let authListenerRegistered = false;

export function setupCapacitorOAuthHandler() {
  if (typeof window === 'undefined') return;

  const capacitor = (window as any).Capacitor;
  if (!capacitor?.isNativePlatform?.()) {
    console.log('[OAuth] Not a Capacitor app, skipping deep link setup');
    return;
  }

  if (!App || !Browser) {
    console.log('[OAuth] Capacitor plugins not available, skipping deep link setup');
    return;
  }

  if (authListenerRegistered) {
    console.log('[OAuth] Handler already registered, skipping');
    return;
  }

  console.log('[OAuth] Setting up Capacitor deep link handler');

  // Listen for app URL opens (from OAuth redirects)
  App.addListener('appUrlOpen', async (event) => {
    console.log('[OAuth] App URL opened:', event.url);
    
    // Check if this is a Firebase auth handler callback (OAuth flow completion)
    if (event.url.includes('__/auth/handler') || 
        ((event.url.startsWith('com.held.app://') || event.url.startsWith('held-62986://') || event.url.startsWith('https://held-62986.firebaseapp.com')) &&
         (event.url.includes('?code=') || event.url.includes('&state=')))) {
      
      console.log('[OAuth] Detected Firebase OAuth callback');
      
      // Close any open browser window
      try {
        await Browser.close();
        console.log('[OAuth] Browser closed successfully');
      } catch (error) {
        console.log('[OAuth] Browser close failed (may already be closed):', error);
      }
      
      // Navigate to the Firebase auth handler URL so Firebase can process the OAuth callback
      console.log('[OAuth] Navigating to Firebase auth handler URL');
      
      // Small delay to ensure browser is closed, then navigate
      setTimeout(() => {
        window.location.href = event.url;
      }, 500);
    }
  });

  authListenerRegistered = true;
  console.log('[OAuth] Deep link handler registered');
}

