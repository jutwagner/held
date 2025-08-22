# Held Deployment Guide

This guide will walk you through deploying Held to production using Firebase Hosting.

## Prerequisites

- Node.js 18.18.0 or higher
- Firebase account
- Domain name (optional, for custom domain)

## Step 1: Firebase Project Setup

1. **Create a Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Click "Add project"
   - Name your project (e.g., "held-app")
   - Follow the setup wizard

2. **Enable Authentication**
   - In Firebase Console, go to Authentication > Sign-in method
   - Enable "Email/Password" provider
   - Optionally enable other providers (Google, GitHub, etc.)

3. **Create Firestore Database**
   - Go to Firestore Database
   - Click "Create database"
   - Choose "Start in test mode" (we'll add security rules later)
   - Select a location close to your users

4. **Set up Storage**
   - Go to Storage
   - Click "Get started"
   - Choose "Start in test mode"
   - Select the same location as Firestore

## Step 2: Configure Security Rules

### Firestore Security Rules

Go to Firestore Database > Rules and replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Objects belong to users, but public objects can be read by anyone
    match /objects/{objectId} {
      allow read: if resource.data.isPublic == true || 
        (request.auth != null && resource.data.userId == request.auth.uid);
      allow write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    // Rotations belong to users, but public rotations can be read by anyone
    match /rotations/{rotationId} {
      allow read: if resource.data.isPublic == true || 
        (request.auth != null && resource.data.userId == request.auth.uid);
      allow write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

### Storage Security Rules

Go to Storage > Rules and replace with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /objects/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Step 3: Environment Configuration

1. **Get Firebase Config**
   - In Firebase Console, go to Project Settings
   - Scroll down to "Your apps" section
   - Click the web app icon (</>) to add a web app
   - Register your app and copy the config

2. **Create Environment File**
   ```bash
   cp env.example .env.local
   ```

3. **Update Environment Variables**
   Edit `.env.local` with your Firebase config:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

## Step 4: Firebase CLI Setup

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Initialize Firebase in your project**
   ```bash
   firebase init
   ```

4. **Select the following services:**
   - Hosting
   - Firestore
   - Storage

5. **Configure Hosting:**
   - Use existing project
   - Public directory: `out` (for static export)
   - Configure as single-page app: `No`
   - Set up automatic builds: `No`

## Step 5: Build Configuration

1. **Update next.config.ts for static export**
   ```typescript
   import type { NextConfig } from "next";
   import withPWA from 'next-pwa';

   const nextConfig: NextConfig = withPWA({
     output: 'export',
     trailingSlash: true,
     images: {
       unoptimized: true,
       domains: ['firebasestorage.googleapis.com'],
     },
     pwa: {
       dest: 'public',
       register: true,
       skipWaiting: true,
       disable: process.env.NODE_ENV === 'development'
     },
   });

   export default nextConfig;
   ```

2. **Update package.json scripts**
   ```json
   {
     "scripts": {
       "build": "next build",
       "export": "next build && next export",
       "deploy": "npm run build && firebase deploy"
     }
   }
   ```

## Step 6: Build and Deploy

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Build the project**
   ```bash
   npm run build
   ```

3. **Deploy to Firebase**
   ```bash
   firebase deploy
   ```

## Step 7: Custom Domain (Optional)

1. **Add custom domain in Firebase Console**
   - Go to Hosting > Custom domains
   - Click "Add custom domain"
   - Enter your domain name

2. **Configure DNS**
   - Add the provided DNS records to your domain registrar
   - Wait for DNS propagation (can take up to 48 hours)

## Step 8: Post-Deployment

1. **Test the application**
   - Visit your deployed URL
   - Test user registration and login
   - Test adding objects and creating rotations
   - Test public passport pages

2. **Monitor usage**
   - Check Firebase Console for usage metrics
   - Monitor Firestore and Storage usage
   - Set up billing alerts if needed

## Troubleshooting

### Common Issues

1. **Build errors**
   - Ensure Node.js version is 18.18.0+
   - Clear `.next` folder and node_modules
   - Run `npm install` again

2. **Firebase deployment errors**
   - Check Firebase CLI is logged in
   - Verify project ID in firebase.json
   - Ensure all environment variables are set

3. **Authentication issues**
   - Verify Firebase Auth is enabled
   - Check security rules are properly configured
   - Ensure environment variables are correct

4. **Image upload issues**
   - Check Storage security rules
   - Verify Storage is enabled in Firebase Console
   - Check CORS configuration if needed

### Performance Optimization

1. **Enable Firebase Performance Monitoring**
2. **Set up Firebase Analytics**
3. **Configure CDN caching headers**
4. **Optimize images before upload**

## Security Checklist

- [ ] Firestore security rules configured
- [ ] Storage security rules configured
- [ ] Authentication enabled
- [ ] Environment variables secured
- [ ] HTTPS enforced
- [ ] CORS configured properly

## Monitoring and Maintenance

1. **Regular backups**
   - Export Firestore data periodically
   - Backup Storage files

2. **Performance monitoring**
   - Monitor Firebase usage
   - Track user engagement
   - Optimize based on metrics

3. **Security updates**
   - Keep dependencies updated
   - Monitor Firebase security advisories
   - Regular security audits

## Support

For deployment issues:
- Check Firebase documentation
- Review Firebase Console logs
- Contact Firebase support if needed

---

Your Held app should now be live and ready for users!
