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
    webContentsDebuggingEnabled: true,
    allowsLinkPreview: false,
    scrollEnabled: true,
    // Most aggressive webview configuration
    preferences: {
      ScrollEnabled: true,
      AllowInlineMediaPlayback: true,
      MediaPlaybackRequiresUserAction: false,
      DisallowOverscroll: true,
      KeyboardDisplayRequiresUserAction: false,
      SuppressesIncrementalRendering: false,
      AllowsAirPlayForMediaPlayback: false,
      AllowsPictureInPictureMediaPlayback: false,
      IgnoresViewportScaleLimits: true,
      AllowsBackForwardNavigationGestures: false
    },
    // Force content insets
    contentInset: { top: 60, bottom: 0, left: 0, right: 0 },
    // Override user agent to prevent Safari detection
    overrideUserAgent: 'Held-iOS-App/1.0',
    // Disable automatic adjustments
    automaticallyAdjustsScrollIndicatorInsets: false,
    contentInsetAdjustmentBehavior: 'never'
  }
};

export default config;
