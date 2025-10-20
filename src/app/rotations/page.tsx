
"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { subscribeRotations, getRotationWithObjects } from '@/lib/firebase-services';
import type { RotationWithObjects } from '@/types';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { MobileBottomBar } from '@/components/Navigation';
import FloatingActionButton from '@/components/FloatingActionButton';
import SleekRotationCard from '@/components/SleekRotationCard';

export default function RotationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [rotationsWithObjects, setRotationsWithObjects] = useState<RotationWithObjects[]>([]);
  const [loadingRotations, setLoadingRotations] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => { setHydrated(true); }, []);

  useEffect(() => {
    if (!loading && !user && hydrated) {
      router.push('/auth/signin');
    }
  }, [user, loading, router, hydrated]);

  useEffect(() => {
    if (!user || !hydrated || typeof user.uid !== 'string') return;
    setLoadingRotations(true);
    // Subscribe to real-time updates for rotations
    const unsubscribe = subscribeRotations(user.uid, async (userRotations) => {
      // Load objects for each rotation
      const rotationsWithObjs = await Promise.all(
        userRotations.map(async (rotation) => {
          const rotationWithObjects = await getRotationWithObjects(rotation.id);
          return rotationWithObjects;
        })
      );
      setRotationsWithObjects(rotationsWithObjs.filter((r): r is RotationWithObjects => r !== null));
      setLoadingRotations(false);
    });
    return () => unsubscribe();
  }, [user, hydrated]);

  // loadRotations removed; now handled by subscribeRotations

  if (!hydrated || loading || !user) {
    return (
      <div className="relative min-h-screen">
        <div className="full-bleed min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
          <div className="held-container held-container-wide py-24">
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400">Loading...</p>
            </div>
          </div>
        </div>
        <MobileBottomBar />
        <FloatingActionButton href="/rotations/new" label="Add new rotation" />
      </div>
    );
  }

  // Premium logic for limiting usable rotations
  const isHeldPlus = !!user?.premium?.active;
  const maxFreeRotations = 3;

  return (
    <div className="relative min-h-screen">
      <div className="full-bleed min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <div className="held-container held-container-wide py-10">
        
              <div className="flex  sm:flex-row justify-between items-start sm:items-center mb-10">
                <div>

                <h1 className="text-lg md:text-2xl font-serif tracking-tight mb-1 mt-2 text-gray-900 dark:text-gray-100">  
                   Rotations</h1>
                  <p className="text-gray-600/90 dark:text-gray-300/90">
                  {rotationsWithObjects.length} Rotation{rotationsWithObjects.length !== 1 ? 's' : ''}
                  </p>



          </div>
          <Button asChild className="mt-4 sm:mt-0">

{/* 
            <Link href="/rotations/new"
             className="add-cta flex h-12 w-12 items-center justify-center rounded-lg border border-transparent bg-gray-900 text-white shadow-lg transition-colors hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
             title="Add Rotation"
            >
              <Plus className="h-4 w-4" />

                    

            </Link> */}
          </Button>
        </div>

        {/* Rotations Grid */}
        {loadingRotations ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 min-h-[390px] flex flex-col justify-between animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2" />
                <div className="h-4 bg-gray-100 dark:bg-gray-600 rounded w-1/2 mb-4" />
                <div className="h-4 bg-gray-100 dark:bg-gray-600 rounded w-1/3" />
                <div className="flex gap-2 mt-4">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : rotationsWithObjects.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">No rotations found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Start building your collection by adding your first rotation.
              </p>
              <Button asChild>
                <Link href="/rotations/new">Add Your First Rotation</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rotationsWithObjects.map((rotation, idx) => {
              // For non Held+ users, blur/disable extra rotations
              const isDisabled = !isHeldPlus && idx >= maxFreeRotations;
              return (
                <SleekRotationCard
                  key={rotation.id}
                  rotation={rotation}
                  disabled={isDisabled}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
    <MobileBottomBar />
    <FloatingActionButton href="/rotations/new" label="Add new rotation" />
    </div>
  );
}
