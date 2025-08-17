'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getFirestore, doc, getDoc, DocumentData } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import Navigation from '@/components/Navigation';
import { getObject } from '@/lib/firebase-services';
import { HeldObject } from '@/types';

// Firebase configuration (replace with your actual config)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function RotationPageClient({ id }: { id: string }) {
  const [rotation, setRotation] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [objects, setObjects] = useState<HeldObject[]>([]);

  // Move conditional rendering below hooks

  useEffect(() => {
    console.log('Rotation ID:', id);
    if (id) {
      const fetchRotation = async () => {
        try {
          console.log('Fetching rotation data for ID:', id);
          const docRef = doc(db, 'rotations', id as string);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            console.log('Rotation data:', docSnap.data());
            setRotation(docSnap.data());
          } else {
            console.error('Rotation not found');
            setError('Rotation not found');
          }
        } catch (err) {
          console.error('Error fetching rotation:', err);
          setError('Failed to fetch rotation');
        } finally {
          setLoading(false);
        }
      };

      fetchRotation();
    }
  }, [id]);

  useEffect(() => {
    const fetchObjects = async () => {
      if (Array.isArray(rotation?.objectIds)) {
        const fetchedObjects = await Promise.all(
          rotation.objectIds.map(async (id) => {
            const object = await getObject(id);
            return object;
          })
        );
        setObjects(fetchedObjects.filter((obj): obj is HeldObject => obj !== null));
      }
    };

    fetchObjects();
  }, [rotation?.objectIds]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (!rotation) {
    console.error('Rotation data is null or undefined');
    return <p>No rotation data available</p>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navigation />
      <header className="bg-white shadow">
        <div className="held-container py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{rotation.name || 'Unnamed Rotation'}</h1>
          <p className="text-gray-500">{rotation.description || 'No description available'}</p>
        </div>
      </header>

      <main className="held-container py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-medium mb-4">Details</h2>
          <p className="text-gray-600 mb-4">Public: {rotation.isPublic ? 'Yes' : 'No'}</p>
          <p className="text-gray-600">Object IDs:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {objects.map((object, index) => (
              <div key={index} className="border rounded-lg p-4">
                <img
                  src={object.images[0] || '/placeholder.png'}
                  alt={object.title}
                  className="w-full h-48 object-cover rounded-md mb-2"
                />
                <h3 className="text-lg font-medium mb-1">{object.title}</h3>
                <p className="text-sm text-gray-600">{object.maker || 'Unknown Maker'}</p>
                <p className="text-sm text-gray-600">{object.year || 'Year Unknown'}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-medium mb-4">Additional Information</h2>
          <p className="text-gray-600">More details can go here...</p>
        </div>
      </main>
    </div>
  );
}

export default RotationPageClient;
