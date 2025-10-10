import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardStyle } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'com.held.app',
  appName: 'Held',
  webDir: '.next',
  server: {
    url: 'http://192.168.1.243:3000',
    cleartext: true,
    androidScheme: 'https'
  },
  ios: {
    scheme: 'App',
    webContentsDebuggingEnabled: true,
    allowsLinkPreview: false,
    scrollEnabled: true,
    contentInset: 'automatic',
    overrideUserAgent: 'Held-iOS-App/1.0',
    preferredContentMode: 'mobile',
    // Hide all Safari UI elements
    limitsNavigationsToAppBoundDomains: true,
    // Prevent showing Safari toolbar
    backgroundColor: '#ffffff'
  },
  plugins: {
    Keyboard: {
      style: KeyboardStyle.Dark,
      resizeOnFullScreen: true
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '612683552247-p7bgbhai2ed62i9b5tmpk6m2miqvcp08.apps.googleusercontent.com',
      forceCodeForRefreshToken: true
    }
  }
};

export default config;
