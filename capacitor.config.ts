import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.held.app',
  appName: 'Held',
  webDir: '.next', // Use .next for dev server builds
  server: {
    url: 'http://192.168.1.243:3000',
    cleartext: true,
    androidScheme: 'https',
    // Add timeout and connection settings
    hostname: '192.168.1.243',
    iosScheme: 'http'
  },
  ios: {
    scheme: 'Held',
    // Enable web debugging to see actual errors instead of minified ones
    webContentsDebuggingEnabled: true,
    // Native iOS webview configuration
    allowsLinkPreview: false,
    scrollEnabled: true,
    // Disable Safari-like behaviors
    preferences: {
      ScrollEnabled: true,
      AllowInlineMediaPlayback: true,
      MediaPlaybackRequiresUserAction: false,
      DisallowOverscroll: true
    }
  }
};

export default config;
