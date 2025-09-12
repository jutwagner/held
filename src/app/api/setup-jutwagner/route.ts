import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env as Record<string, string | undefined>;
  if (FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  } else {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }
}

const db = admin.firestore();

export async function POST(req: NextRequest) {
  try {
    console.log('Setting up jutwagner profile...');

    // Sample user data for jutwagner
    const jutwagnerUserData = {
      uid: 'jutwagner-uid-123',
      id: 'jutwagner-uid-123',
      name: 'Justin Wagner',
      displayName: 'Justin Wagner',
      handle: 'jutwagner',
      bio: 'Collector of fine objects and creator of digital experiences.',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
      coverImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=400&fit=crop',
      objectIds: [],
      isPublic: true,
      isPublicProfile: true,
      quarterlyReview: false,
      theme: 'light',
      typeTitleSerif: true,
      typeMetaMono: false,
      density: 'standard',
      notifications: {
        monthlyRotation: true,
        quarterlyReview: true,
        email: true,
        push: false,
        dms: true,
      },
      push: false,
      dms: true,
      premium: {
        active: true,
        plan: 'heldplus',
        since: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
        renewsAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
        cancelRequested: null,
      },
      backup: { enabled: true, lastRun: Date.now() - 7 * 24 * 60 * 60 * 1000 },
      security: {
        providers: ['password'],
        sessions: []
      },
      email: 'justin@example.com',
      createdAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)),
      updatedAt: admin.firestore.Timestamp.fromDate(new Date()),
    };

    // Create user document
    await db.collection('users').doc(jutwagnerUserData.uid).set(jutwagnerUserData);
    console.log('✅ User document created');

    // Sample objects for the registry
    const sampleObjects = [
      {
        userId: 'jutwagner-uid-123',
        title: 'Vintage Rolex Submariner',
        maker: 'Rolex',
        year: 1970,
        value: 15000,
        category: 'Watches',
        condition: 'excellent',
        tags: ['vintage', 'luxury', 'diving', 'swiss'],
        notes: 'Beautiful vintage Submariner with original dial and bezel.',
        images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop'],
        isPublic: true,
        slug: 'vintage-rolex-submariner-1970',
        createdAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
        updatedAt: admin.firestore.Timestamp.fromDate(new Date()),
        description: 'A classic 1970s Rolex Submariner in excellent condition.',
        shareInCollaborative: true,
      },
      {
        userId: 'jutwagner-uid-123',
        title: 'Herman Miller Eames Chair',
        maker: 'Herman Miller',
        year: 1956,
        value: 5000,
        category: 'Furniture',
        condition: 'good',
        tags: ['mid-century', 'design', 'classic', 'furniture'],
        notes: 'Authentic Eames lounge chair with ottoman.',
        images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop'],
        isPublic: true,
        slug: 'herman-miller-eames-chair-1956',
        createdAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 25 * 24 * 60 * 60 * 1000)),
        updatedAt: admin.firestore.Timestamp.fromDate(new Date()),
        description: 'Iconic mid-century modern design piece.',
        shareInCollaborative: true,
      },
      {
        userId: 'jutwagner-uid-123',
        title: 'Leica M3 Camera',
        maker: 'Leica',
        year: 1954,
        value: 2500,
        category: 'Cameras',
        condition: 'excellent',
        tags: ['photography', 'vintage', 'german', 'rangefinder'],
        notes: 'Classic Leica M3 with 50mm Summicron lens.',
        images: ['https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400&h=400&fit=crop'],
        isPublic: true,
        slug: 'leica-m3-camera-1954',
        createdAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)),
        updatedAt: admin.firestore.Timestamp.fromDate(new Date()),
        description: 'The legendary Leica M3 rangefinder camera.',
        shareInCollaborative: true,
      },
      {
        userId: 'jutwagner-uid-123',
        title: 'Stratocaster Electric Guitar',
        maker: 'Fender',
        year: 1965,
        value: 8000,
        category: 'Musical Instruments',
        condition: 'excellent',
        tags: ['guitar', 'vintage', 'fender', 'electric'],
        notes: 'Original 1965 Stratocaster with sunburst finish.',
        images: ['https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop'],
        isPublic: true,
        slug: 'fender-stratocaster-1965',
        createdAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)),
        updatedAt: admin.firestore.Timestamp.fromDate(new Date()),
        description: 'Classic 1965 Fender Stratocaster in excellent condition.',
        shareInCollaborative: true,
      },
      {
        userId: 'jutwagner-uid-123',
        title: 'Vintage Omega Speedmaster',
        maker: 'Omega',
        year: 1969,
        value: 12000,
        category: 'Watches',
        condition: 'excellent',
        tags: ['vintage', 'space', 'moonwatch', 'omega'],
        notes: 'Moon landing era Speedmaster Professional.',
        images: ['https://images.unsplash.com/photo-1523170335258-f5c4a7c8c4e0?w=400&h=400&fit=crop'],
        isPublic: true,
        slug: 'omega-speedmaster-1969',
        createdAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)),
        updatedAt: admin.firestore.Timestamp.fromDate(new Date()),
        description: 'The famous "Moonwatch" worn by astronauts.',
        shareInCollaborative: true,
      },
    ];

    // Create objects
    const objectIds: string[] = [];
    for (const objectData of sampleObjects) {
      const objectRef = await db.collection('objects').add(objectData);
      objectIds.push(objectRef.id);
      console.log(`✅ Object created: ${objectData.title}`);
    }

    // Sample rotations
    const sampleRotations = [
      {
        userId: 'jutwagner-uid-123',
        name: 'Vintage Watches',
        description: 'A curated collection of vintage timepieces from the golden age of watchmaking.',
        objectIds: [objectIds[0], objectIds[4]], // Rolex and Omega
        isPublic: true,
        slug: 'vintage-watches',
        createdAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)),
        updatedAt: admin.firestore.Timestamp.fromDate(new Date()),
        coverImage: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=400&fit=crop',
      },
      {
        userId: 'jutwagner-uid-123',
        name: 'Mid-Century Design',
        description: 'Iconic furniture and design objects from the mid-20th century.',
        objectIds: [objectIds[1]], // Eames Chair
        isPublic: true,
        slug: 'mid-century-design',
        createdAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)),
        updatedAt: admin.firestore.Timestamp.fromDate(new Date()),
        coverImage: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=400&fit=crop',
      },
      {
        userId: 'jutwagner-uid-123',
        name: 'Photography Equipment',
        description: 'Professional and vintage photography gear for the discerning photographer.',
        objectIds: [objectIds[2]], // Leica Camera
        isPublic: true,
        slug: 'photography-equipment',
        createdAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)),
        updatedAt: admin.firestore.Timestamp.fromDate(new Date()),
        coverImage: 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=600&h=400&fit=crop',
      },
    ];

    // Create rotations
    const rotationIds: string[] = [];
    for (const rotationData of sampleRotations) {
      const rotationRef = await db.collection('rotations').add(rotationData);
      rotationIds.push(rotationRef.id);
      console.log(`✅ Rotation created: ${rotationData.name}`);
    }

    // Update user with object IDs
    await db.collection('users').doc(jutwagnerUserData.uid).update({ objectIds });
    console.log('✅ User updated with object IDs');

    return NextResponse.json({
      success: true,
      message: 'jutwagner profile setup complete!',
      userId: jutwagnerUserData.uid,
      objectCount: objectIds.length,
      rotationCount: rotationIds.length,
      profileUrl: 'http://localhost:3000/user/jutwagner'
    });

  } catch (error) {
    console.error('❌ Error setting up profile:', error);
    return NextResponse.json(
      { error: 'Failed to setup profile', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
