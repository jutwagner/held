
"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { subscribeRotations, getRotationWithObjects } from '@/lib/firebase-services';
import type { RotationWithObjects, HeldObject } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff, Calendar, Plus } from 'lucide-react';
import { formatDate } from '@/lib/utils';

import { MobileBottomBar } from '@/components/Navigation';

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
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        <div className="held-container py-24">
          <div className="text-center">
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Premium logic for limiting usable rotations
  const isHeldPlus = !!user?.premium?.active;
  const maxFreeRotations = 3;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <MobileBottomBar />
      <div className="held-container py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-serif font-medium mb-2">Rotations</h1>
            <p className="text-gray-600">
              {rotationsWithObjects.length} rotation{rotationsWithObjects.length !== 1 ? 's' : ''} in your collection
            </p>
          </div>
          <Button asChild className="mt-4 sm:mt-0">
            <Link href="/rotations/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Rotation
            </Link>
          </Button>
        </div>

        {/* Rotations Grid */}
        {loadingRotations ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6 min-h-[390px] flex flex-col justify-between animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-2/3 mb-2" />
                <div className="h-4 bg-gray-100 rounded w-1/2 mb-4" />
                <div className="h-4 bg-gray-100 rounded w-1/3" />
                <div className="flex gap-2 mt-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full" />
                  <div className="w-12 h-12 bg-gray-200 rounded-full" />
                  <div className="w-12 h-12 bg-gray-200 rounded-full" />
                  <div className="w-12 h-12 bg-gray-200 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : rotationsWithObjects.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">No rotations found</h3>
              <p className="text-gray-600 mb-6">
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
                <RotationCard
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
  );
}


// Reusable premium logic for disabling features

function RotationCard({ rotation, disabled = false }: { rotation: RotationWithObjects; disabled?: boolean }) {
  // All hooks must be called at the top level, unconditionally
  const { user } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const router = useRouter();
  const canDelete = user && (user.uid === rotation.userId || rotation.isPublic);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    setConfirmOpen(false);
    setDeleting(true);
    try {
      await import('@/lib/firebase-services').then(mod => mod.deleteRotation(rotation.id));
      router.refresh();
    } catch (err) {
      alert('Failed to delete rotation.');
    } finally {
      setDeleting(false);
    }
  };

  if (disabled) {
    return (
      <div className="held-card p-6 min-h-[390px] rounded-2xl bg-white shadow-xl transition-all duration-200 cursor-not-allowed relative" style={{ position: 'relative', pointerEvents: 'none', opacity: 1 }}>
        {/* Absolute CTA overlay, card is visible but not clickable */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10" style={{ pointerEvents: 'auto',  background: 'rgba(255,255,255,0.85)' }}>
          <div className="flex flex-col items-center">
            <span className="text-gray-700 text-base font-semibold mb-2">Held+</span> 
            <Link
              href="/settings/premium"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg  font-semibold shadow hover:bg-blue-700 transition-all text-sm"
              style={{ pointerEvents: 'auto' }}
            >
              Go
            </Link>
          </div>
        </div>
        {/* ...existing card content... */}
        <div className="flex items-center justify-between mb-4 blur">
          <h3 className="font-medium text-lg blur">{rotation.name}</h3>
          <div className="flex items-center space-x-2 blur">
            {rotation.isPublic ? <Eye className="h-4 w-4 text-green-600 blur" /> : <EyeOff className="h-4 w-4 text-gray-400" />}
          </div>
        </div>
        {rotation.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2 blur">{rotation.description}</p>
        )}
        <div className="mb-4 blur">
          <div className="flex -space-x-6 blur">
            {rotation.objects.slice(0, 4).map((obj: HeldObject) => (
              <div key={obj.id} className="w-16 h-16 bg-gray-100 rounded-full border-4 border-white shadow-lg ring-2 ring-blue-200 overflow-hidden transition-transform duration-200 hover:scale-105 hover:ring-blue-400">
                {obj.images.length > 0 ? (
                  <Image src={obj.images[0]} alt={obj.title} width={64} height={64} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-gray-400 text-base">?</span>
                  </div>
                )}
              </div>
            ))}
            {rotation.objects.length > 4 && (
              <div className="blur w-16 h-16 bg-gray-200 rounded-full border-4 border-white shadow-lg ring-2 ring-blue-200 flex items-center justify-center">
                <span className="text-gray-600 text-base font-medium">+{rotation.objects.length - 4}</span>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-2">{rotation.objects.length} object{rotation.objects.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center justify-between text-sm text-gray-500 blur">
          <div className="flex items-center space-x-1 blur">
            <Calendar className="h-3 w-3" />
            <span>{formatDate((rotation.createdAt instanceof Date ? rotation.createdAt : rotation.createdAt?.toDate?.()) ?? new Date())}</span>
          </div>
          {rotation.isPublic && <span className="text-green-600 text-xs">Public</span>}
        </div>
      </div>
    );
  }

  return (
    <Link href={`/rotations/${rotation.id}`}>
      <div className="held-card p-6 min-h-[390px] rounded-2xl bg-white shadow-xl hover:shadow-2xl transition-all duration-200 cursor-pointer hover:-translate-y-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-lg">{rotation.name}</h3>
          <div className="flex items-center space-x-2">
            {rotation.isPublic ? <Eye className="h-4 w-4 text-green-600" /> : <EyeOff className="h-4 w-4 text-gray-400" />}
            {/* Show delete button for own or public rotations */}
            {canDelete && (
              <>
                <button
                  className="ml-2 bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 transition disabled:opacity-50"
                  onClick={e => { e.preventDefault(); setConfirmOpen(true); }}
                  disabled={deleting}
                  title="Delete rotation"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
                {confirmOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
                      <h3 className="text-lg font-semibold mb-2">Confirm Delete</h3>
                      <p className="mb-4">Are you sure you want to delete <span className="font-bold">{rotation.name}</span>? This cannot be undone.</p>
                      <div className="flex justify-end gap-2">
                        <button className="px-4 py-2 rounded bg-gray-200" onClick={e => { e.preventDefault(); setConfirmOpen(false); }}>Cancel</button>
                        <button className="px-4 py-2 rounded bg-red-600 text-white" onClick={handleDelete} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete'}</button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        {/* Description */}
        {rotation.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{rotation.description}</p>
        )}
        {/* Objects Preview */}
        <div className="mb-4">
          <div className="flex -space-x-6">
            {rotation.objects.slice(0, 4).map((obj: HeldObject) => (
              <div key={obj.id} className="w-16 h-16 bg-gray-100 rounded-full border-4 border-white shadow-lg ring-2 ring-blue-200 overflow-hidden transition-transform duration-200 hover:scale-105 hover:ring-blue-400">
                {obj.images.length > 0 ? (
                  <Image src={obj.images[0]} alt={obj.title} width={64} height={64} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-gray-400 text-base">?</span>
                  </div>
                )}
              </div>
            ))}
            {rotation.objects.length > 4 && (
              <div className="w-16 h-16 bg-gray-200 rounded-full border-4 border-white shadow-lg ring-2 ring-blue-200 flex items-center justify-center">
                <span className="text-gray-600 text-base font-medium">+{rotation.objects.length - 4}</span>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-2">{rotation.objects.length} object{rotation.objects.length !== 1 ? 's' : ''}</p>
        </div>
        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>{formatDate((rotation.createdAt instanceof Date ? rotation.createdAt : rotation.createdAt?.toDate?.()) ?? new Date())}</span>
          </div>
          {rotation.isPublic && <span className="text-green-600 text-xs">Public</span>}
        </div>
      </div>
    </Link>
  );
}

