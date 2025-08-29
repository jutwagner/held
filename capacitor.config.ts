import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.held.app',
  appName: 'Held',
  webDir: '.next', // Use .next for dev server builds
  server: {
    url: 'http://192.168.1.243:3000',
    cleartext: true,
    androidScheme: 'https'
  },
  ios: {
    scheme: 'Held',
    // Configure webview to prevent Safari-like behavior
    webContentsDebuggingEnabled: false
  }
};

export default config;
