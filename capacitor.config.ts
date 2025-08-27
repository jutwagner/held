import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.held.app',
  appName: 'Held',
  webDir: 'out', // Use 'out' for static builds, '.next' for server builds
  server: {
    androidScheme: 'https'
  },
  ios: {
    scheme: 'Held'
  }
};

export default config;
