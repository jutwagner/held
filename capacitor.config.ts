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
    overrideUserAgent: 'Held-iOS-App/1.0'
  },
  plugins: {
    Keyboard: {
      style: KeyboardStyle.Dark,
      resizeOnFullScreen: true
    }
  }
};

export default config;
