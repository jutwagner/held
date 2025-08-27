# Held iOS App Setup Guide

## Option 1: Capacitor (Recommended)

### 1. Install Capacitor
```bash
cd held
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios
npx cap init
```

### 2. Configure capacitor.config.ts
```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.held.app',
  appName: 'Held',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  },
  ios: {
    scheme: 'Held'
  }
};

export default config;
```

### 3. Update next.config.js for static export
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
    domains: [
      'lh3.googleusercontent.com',
      'lh4.googleusercontent.com', 
      'lh5.googleusercontent.com',
      'lh6.googleusercontent.com'
    ]
  }
};

module.exports = nextConfig;
```

### 4. Build and sync
```bash
npm run build
npx cap add ios
npx cap sync
```

### 5. Open in Xcode
```bash
npx cap open ios
```

## Option 2: Expo + React Native WebView

### 1. Create Expo app
```bash
npx create-expo-app HeldMobile
cd HeldMobile
npx expo install react-native-webview
```

### 2. Simple WebView wrapper
```typescript
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <WebView 
        source={{ uri: 'https://your-held-app.vercel.app' }}
        style={{ flex: 1 }}
        allowsBackForwardNavigationGestures
        pullToRefreshEnabled
      />
    </SafeAreaView>
  );
}
```

## Option 3: Native iOS WKWebView

### Create iOS project with WKWebView pointing to your Next.js app

## Features You Can Add:

### Push Notifications
```typescript
// With Capacitor
import { PushNotifications } from '@capacitor/push-notifications';

PushNotifications.requestPermissions().then(result => {
  if (result.receive === 'granted') {
    PushNotifications.register();
  }
});
```

### Camera Integration
```typescript
// With Capacitor
import { Camera, CameraResultType } from '@capacitor/camera';

const takePicture = async () => {
  const image = await Camera.getPhoto({
    quality: 90,
    allowEditing: true,
    resultType: CameraResultType.Uri
  });
  
  // Use image.webPath in your registry upload
};
```

### Offline Storage
```typescript
// With Capacitor
import { Preferences } from '@capacitor/preferences';

const setName = async () => {
  await Preferences.set({
    key: 'name',
    value: 'Max',
  });
};
```

## App Store Considerations:

1. **Update your Firebase config** for iOS bundle ID
2. **Configure deep linking** for passport pages
3. **Add app icons and splash screens**
4. **Test on real devices** through TestFlight
5. **Handle offline scenarios** gracefully

## Next Steps:

1. Choose Capacitor (recommended)
2. Set up development environment
3. Configure Firebase for iOS
4. Test core features (auth, image upload, registry)
5. Add native features (camera, notifications)
6. Submit to App Store

## Benefits for Held:

- **Native app experience** with your existing web code
- **App Store presence** - better discoverability
- **Push notifications** for new messages/registry items
- **Native camera** integration for object photography
- **Offline browsing** of registry items
- **Native sharing** of passport pages
