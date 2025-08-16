# Held

**The quiet home for the things you hold.**

A private, beautiful way to catalog and share the physical objects that matter to you. No social pressure, no algorithms—just your collection, your way.

## Features

### Registry
- Private, structured database for your physical objects
- Track makers, years, values, and conditions
- Add multiple images per object
- Tag and categorize your collection
- Full search and filtering capabilities

### Passport
- Public, shareable identity pages for any object
- Clean permalinks with metadata optimized for sharing
- Beautiful, minimalist design for showcasing your objects

### Rotation
- Curated, time-specific snapshots of up to 7 objects
- Share seasonal setups, themed collections, or current favorites
- Public or private visibility options

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, TailwindCSS
- **Backend**: Firebase (Auth, Firestore, Storage)
- **UI Components**: Radix UI, Lucide React icons
- **PWA**: Progressive Web App with offline support
- **Deployment**: Firebase Hosting

## Getting Started

### Prerequisites

- Node.js 18+ 
- Firebase account
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd held
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   - Create a new Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable Authentication (Email/Password)
   - Create a Firestore database
   - Set up Storage
   - Get your Firebase config from Project Settings

4. **Configure environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` with your Firebase configuration:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id


   
   ```

5. **Set up Firestore security rules**
   
   In your Firebase console, go to Firestore Database > Rules and update with:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Users can only access their own data
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       
       // Objects belong to users
       match /objects/{objectId} {
         allow read, write: if request.auth != null && 
           (resource.data.userId == request.auth.uid || resource.data.isPublic == true);
       }
       
       // Rotations belong to users
       match /rotations/{rotationId} {
         allow read, write: if request.auth != null && 
           (resource.data.userId == request.auth.uid || resource.data.isPublic == true);
       }
     }
   }
   ```

6. **Set up Storage security rules**
   
   In your Firebase console, go to Storage > Rules and update with:
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

7. **Run the development server**
   ```bash
   npm run dev
   ```

8. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Deployment

### Firebase Hosting

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Initialize Firebase Hosting**
   ```bash
   firebase init hosting
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

5. **Deploy**
   ```bash
   firebase deploy
   ```

### Environment Variables for Production

Make sure to set the same environment variables in your Firebase project:
- Go to Firebase Console > Project Settings > General
- Add environment variables in the "Environment configuration" section

## Project Structure

```
held/
├── src/
│   ├── app/                 # Next.js app router pages
│   │   ├── auth/           # Authentication pages
│   │   ├── registry/       # Registry pages
│   │   ├── passport/       # Public passport pages
│   │   └── rotations/      # Rotation pages
│   ├── components/         # React components
│   │   ├── ui/            # Reusable UI components
│   │   └── Navigation.tsx # Main navigation
│   ├── contexts/          # React contexts
│   ├── lib/               # Utility functions and services
│   └── types/             # TypeScript type definitions
├── public/                # Static assets
└── env.example           # Environment variables template
```

## Monetization Path

### Phase 1: Free Core
- Registry, Passport, and Rotation all free
- No ads, no spam — build trust and habit

### Phase 2: Premium Layer
- Unlimited Rotations (free users capped at 3 active)
- Advanced Passport features: more images per object, custom domains
- Private backup/export tools: CSV/JSON export, cloud backup
- Visual themes for Passports/Rotations

### Phase 3: High-Margin Add-ons
- Marketplace/Commissions: Facilitate buying/selling objects with provenance
- Affiliate partnerships: Curated tools/kits linked from Registry and Rotation
- Collectors' Network: Optional paid tier for connecting with other collectors

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@held.app or create an issue in this repository.

---

**Held** - The quiet home for the things you hold.
