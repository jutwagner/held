'use client';
import Image from 'next/image';

import { useEffect, useState } from 'react';
import { getFirestore } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getObject, getRotation, subscribeRotations } from '@/lib/firebase-services';
import { useAuth } from '@/contexts/AuthContext';
import { HeldObject } from '@/types';
import type { RotationWithObjects } from '@/types';

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
// db is not used

function RotationPageClient({ id }: { id: string }) {
  const [rotation, setRotation] = useState<RotationWithObjects | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [objects, setObjects] = useState<HeldObject[]>([]);
  // Get current user from AuthContext
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!id || authLoading) return; // Wait for auth to be ready
    setLoading(true);
    async function fetchRotation() {
      try {
        const rot = await getRotation(id);
        if (!rot) {
          setError('Rotation not found');
          setLoading(false);
          return;
        }
        // If public, show it
        if (rot.isPublic === true) {
          setRotation({ ...rot, objects: [] });
          setLoading(false);
          return;
        }
        // If user owns it, subscribe for updates
        if (user && rot.userId === user.uid) {
          const unsubscribe = subscribeRotations(user.uid, (rots) => {
            const ownedRot = rots.find(r => r.id === id);
            if (ownedRot) {
              setRotation({ ...ownedRot, objects: [] });
            } else {
              setError('Rotation not found');
            }
            setLoading(false);
          });
          return () => unsubscribe();
        } else {
          setError('You do not have permission to view this rotation');
          setLoading(false);
        }
      } catch (err) {
        setError('Error loading rotation');
        setLoading(false);
      }
    }
    fetchRotation();
  }, [id, user, authLoading]);

  useEffect(() => {
    const fetchObjects = async () => {
      if (Array.isArray(rotation?.objectIds)) {
        const fetchedObjects = await Promise.all(
          rotation.objectIds.map(async (id: string) => {
            const object = await getObject(id);
            return object;
          })
        );
        setObjects(fetchedObjects.filter((obj: HeldObject | null): obj is HeldObject => obj !== null));
      }
    };

    fetchObjects();
  }, [rotation?.objectIds]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 animate-pulse">
        <header className="top-0 z-30 bg-white/90 backdrop-blur shadow-sm">
          <div className="held-container py-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-4">
                {[...Array(5)].map((_, idx) => (
                  <div key={idx} className="w-12 h-12 rounded-full bg-gray-200 border-2 border-white shadow" />
                ))}
              </div>
              <div>
                <div className="h-8 w-48 bg-gray-200 rounded mb-2" />
                <div className="h-4 w-64 bg-gray-100 rounded" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-mono">&nbsp;</span>
            </div>
          </div>
        </header>
        <nav className="sticky top-25 z-20 bg-white/90 backdrop-blur border-b border-gray-100 py-2 flex gap-2 justify-center">
          {[...Array(5)].map((_, idx) => (
            <div key={idx} className="w-20 h-20 rounded-full bg-gray-200 border-2 border-blue-200 shadow" />
          ))}
        </nav>
        <main className="held-container py-12">
          <div className="flex flex-col gap-16">
            {[...Array(2)].map((_, index) => (
              <section key={index} className="flex flex-col md:flex-row gap-8 items-center border-b pb-16 scroll-mt-32">
                <div className="flex-shrink-0 w-full md:w-2/3 lg:w-1/2">
                  <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col items-center justify-center">
                    <div className="w-full max-w-3xl h-64 bg-gray-200 rounded-xl" />
                  </div>
                </div>
                <div className="flex-1 flex flex-col justify-center items-start w-full">
                  <div className="h-8 w-64 bg-gray-200 rounded mb-2" />
                  <div className="h-4 w-32 bg-gray-100 rounded mb-1" />
                  <div className="h-4 w-24 bg-gray-100 rounded mb-2" />
                  <div className="h-4 w-80 bg-gray-100 rounded mt-2" />
                  <div className="flex flex-wrap gap-2 mt-3">
                    {[...Array(4)].map((_, i) => (
                      <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-mono shadow">&nbsp;</span>
                    ))}
                  </div>
                </div>
              </section>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (!rotation) {
    return <p>No rotation data available</p>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Sticky Group Header */}
      <header className="top-0 z-30 bg-white/90 backdrop-blur  shadow-sm">
        <div className="held-container py-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-4">
              {objects.slice(0, 5).map((object, idx) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  key={idx}
                  src={object.images[0] || '/placeholder.png'}
                  alt={object.title}
                  className="w-12 h-12 rounded-full border-2 border-white shadow"
                  style={{ zIndex: 10 - idx }}
                />
              ))}
              {objects.length > 5 && (
                <span className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-xs font-mono text-gray-600 border-2 border-white shadow">+{objects.length - 5}</span>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-serif font-bold tracking-tight text-gray-900 mb-1">{rotation.name || 'Unnamed Rotation'}</h1>
              <p className="text-gray-500 text-base font-mono">{rotation.description || 'No description available'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-mono">{objects.length} object{objects.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </header>

      {/* Floating Object Nav */}
      <nav className="sticky top-25 z-20 bg-white/90 backdrop-blur border-b border-gray-100 py-2 flex gap-2 justify-center">
        {objects.map((object, idx) => (
          <button
            key={idx}
            onClick={() => {
              const el = document.getElementById(`object-${idx}`);
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="w-20 h-20 rounded-full overflow-hidden border-2 border-blue-200 shadow hover:scale-110 transition-transform duration-200 bg-white"
            title={object.title}
          >
            <Image src={object.images[0] || '/placeholder.png'} alt={object.title} width={80} height={80} className="w-full h-full object-cover" />
          </button>
        ))}
      </nav>

      <main className="held-container py-12">
        {/* Deep dive into each object */}
        <div className="flex flex-col gap-16">
          {objects.map((object, index) => (
            <section id={`object-${index}`} key={index} className="flex flex-col md:flex-row gap-8 items-center border-b pb-16 scroll-mt-32">
              <div className="flex-shrink-0 w-full md:w-2/3 lg:w-1/2">
                <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col items-center justify-center transition-all duration-300 hover:shadow-2xl">
                  <Image
                    src={object.images[0] || '/placeholder.png'}
                    alt={object.title}
                    width={640}
                    height={480}
                    className="w-full max-w-3xl rounded-xl object-contain"
                    style={{ maxHeight: '480px', background: '#f8fafc' }}
                  />
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-center items-start w-full">
                <h3 className="text-3xl font-serif font-semibold mb-2 text-gray-900 tracking-tight">{object.title}</h3>
                <p className="text-lg text-gray-600 mb-1 font-mono">{object.maker || <span className="italic text-gray-400">Unknown Maker</span>}</p>
                <p className="text-base text-gray-500 mb-2 font-mono">{object.year || <span className="italic text-gray-400">Year Unknown</span>}</p>
                {object.notes && <p className="text-base text-gray-700 mt-2 whitespace-pre-line font-sans leading-relaxed">{object.notes}</p>}
                {Array.isArray(object.tags) && object.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {object.tags.slice(0, 6).map((tag, i) => (
                      <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-mono shadow">{tag}</span>
                    ))}
                    {object.tags.length > 6 && (
                      <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-mono">+{object.tags.length - 6} more</span>
                    )}
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}

export default RotationPageClient;
