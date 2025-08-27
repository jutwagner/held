import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.held.app',
  appName: 'Held',
  webDir: '.next',
  server: {
    androidScheme: 'https',
    url: 'http://localhost:3001', // For development
    cleartext: true
  },
  ios: {
    scheme: 'Held'
  }
};

export default config;
