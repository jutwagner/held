import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.held.app',
  appName: 'Held',
  webDir: '.next',
  server: {
    url: 'http://192.168.1.243:3000',
    cleartext: true
  },
  ios: {
    scheme: 'Held',
    webContentsDebuggingEnabled: true,
    allowsLinkPreview: false,
    scrollEnabled: true,
    contentInset: 'automatic',
    overrideUserAgent: 'Held-iOS-App/1.0'
  },
  plugins: {
    Keyboard: {
      resize: 'ionic',
      style: 'dark',
      resizeOnFullScreen: true
    }
  }
};

export default config;
