
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
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <div className="held-container held-container-wide py-24">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Premium logic for limiting usable rotations
  const isHeldPlus = !!user?.premium?.active;
  const maxFreeRotations = 3;

  return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <MobileBottomBar />
        <div className="held-container held-container-wide py-10">
        
              <div className="flex  sm:flex-row justify-between items-start sm:items-center mb-10">
                <div>
                  <h1 className="text-4xl md:text-5xl font-serif tracking-tight mb-2 text-gray-900 dark:text-gray-100">Rotations</h1>
                  <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500/90 dark:text-gray-300/90">
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
      <div className="group relative bg-white rounded-2xl shadow-lg transition-all duration-300 cursor-not-allowed overflow-hidden min-h-[460px]" style={{ position: 'relative', pointerEvents: 'none', opacity: 1 }}>
        {/* Cover Image */}
        {rotation.coverImage && (
          <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 overflow-hidden">
            <Image
              src={rotation.coverImage}
              alt="Rotation Cover"
              fill
              className="object-cover opacity-60"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/20 to-transparent" />
          </div>
        )}
        
        {/* Decorative background for cards without cover images */}
        {!rotation.coverImage && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 -z-10" />
        )}
        
        {/* Decorative icon for cards without cover images */}
        {!rotation.coverImage && (
          <div className="absolute top-4 right-4 w-16 h-16 bg-white/90 dark:bg-gray-800/90 rounded-full flex items-center justify-center shadow-sm backdrop-blur-sm z-10">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-60" />
          </div>
        )}
        
        {/* Absolute CTA overlay, card is visible but not clickable */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-white/95 dark:bg-gray-900/95" style={{ pointerEvents: 'auto' }}>
          <div className="flex flex-col items-center">
            <span className="text-gray-700 dark:text-gray-300 text-base font-semibold mb-2">Held+</span> 
            <Link
              href="/settings/premium"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition-all text-sm"
              style={{ pointerEvents: 'auto' }}
            >
              Go
            </Link>
          </div>
        </div>
        
        {/* Card Content */}
        <div className={`p-6 ${!rotation.coverImage ? 'pt-8' : ''}`}>
          <div className="flex items-center justify-between mb-4 blur">
            <h3 className="font-semibold text-xl text-gray-900 blur">{rotation.name}</h3>
            <div className="flex items-center space-x-2 blur">
              {rotation.isPublic ? <Eye className="h-4 w-4 text-green-600 blur" /> : <EyeOff className="h-4 w-4 text-gray-400 dark:text-gray-500" />}
            </div>
          </div>
          {rotation.description && (
            <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500 text-sm mb-6 line-clamp-2 blur leading-relaxed">{rotation.description}</p>
          )}
          <div className="mb-6 blur">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
              <div className="flex justify-center items-center overflow-hidden px-2">
                {rotation.objects.slice(0, 5).map((obj: HeldObject, index) => (
                  <div 
                    key={obj.id} 
                    className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white rounded-full border-2 border-white shadow-lg ring-1 ring-gray-200 overflow-hidden transition-transform duration-200 hover:scale-110 hover:ring-blue-300 flex-shrink-0"
                    style={{ 
                      zIndex: 10 - index, 
                      marginLeft: index > 0 ? '-6px' : '0',
                      aspectRatio: '1',
                      minWidth: '40px',
                      minHeight: '40px'
                    }}
                  >
                    {obj.images.length > 0 ? (
                      <Image src={obj.images[0]} alt={obj.title} width={56} height={56} className="w-full h-full object-cover" style={{ aspectRatio: '1' }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ aspectRatio: '1' }}>
                        <span className="text-gray-400 dark:text-gray-500 text-xs sm:text-sm">?</span>
                      </div>
                    )}
                  </div>
                ))}
                {rotation.objects.length > 5 && (
                  <div 
                    className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gray-200 dark:bg-gray-700 rounded-full border-2 border-white shadow-lg ring-1 ring-gray-200 flex items-center justify-center flex-shrink-0"
                    style={{ 
                      zIndex: 5, 
                      marginLeft: '-6px',
                      aspectRatio: '1'
                    }}
                  >
                    <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm font-medium">+{rotation.objects.length - 5}</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500 mt-4 text-center font-medium">{rotation.objects.length} object{rotation.objects.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 blur">
            <div className="flex items-center space-x-2 blur">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(
                rotation.createdAt instanceof Date
                  ? rotation.createdAt
                  : (rotation.createdAt && typeof rotation.createdAt === 'object' && 'toDate' in rotation.createdAt && typeof rotation.createdAt.toDate === 'function')
                    ? rotation.createdAt.toDate()
                    : new Date()
              )}</span>
            </div>
            {rotation.isPublic && <span className="text-green-600 text-xs font-medium bg-green-50 px-2 py-1 rounded-full">Public</span>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link href={`/rotations/${rotation.id}`}>
      <div className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100 dark:border-gray-700 dark:border-gray-700 hover:border-gray-200 dark:border-gray-600 dark:hover:border-gray-600 min-h-[460px]">
        {/* Cover Image */}
        {rotation.coverImage && (
          <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 overflow-hidden">
            <Image
              src={rotation.coverImage}
              alt="Rotation Cover"
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/20 to-transparent" />
            {/* Public badge overlay */}
            {rotation.isPublic && (
              <div className="absolute top-3 right-3">
                <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium shadow-sm">Public</span>
              </div>
            )}
          </div>
        )}
        
        {/* Decorative background for cards without cover images */}
        {!rotation.coverImage && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 -z-10" />
        )}
        
        {/* Decorative icon for cards without cover images */}
        {!rotation.coverImage && (
          <div className="absolute top-4 right-4 w-16 h-16 bg-white/90 dark:bg-gray-800/90 rounded-full flex items-center justify-center shadow-sm backdrop-blur-sm z-10">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-60" />
          </div>
        )}
        
        {/* Card Content */}
        <div className={`p-6 ${!rotation.coverImage ? 'pt-8' : ''}`}>
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <h3 className="font-semibold text-xl text-gray-900 leading-tight">{rotation.name}</h3>
            <div className="flex items-center space-x-2">
              {!rotation.coverImage && (
                <div className="flex items-center space-x-1">
                  {rotation.isPublic ? <Eye className="h-4 w-4 text-green-600" /> : <EyeOff className="h-4 w-4 text-gray-400 dark:text-gray-500" />}
                </div>
              )}
              {/* Show delete button for own or public rotations */}
              {canDelete && (
                <>
                  <button
                    className="ml-2 bg-red-50 text-red-600 px-2 py-1 rounded-lg text-xs hover:bg-red-100 transition-colors disabled:opacity-50 border border-red-200"
                    onClick={e => { e.preventDefault(); setConfirmOpen(true); }}
                    disabled={deleting}
                    title="Delete rotation"
                  >
                    {deleting ? 'Deleting...' : 'Delete'}
                  </button>
                  {confirmOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-sm w-full">
                        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Confirm Delete</h3>
                        <p className="mb-4 text-gray-700 dark:text-gray-300">Are you sure you want to delete <span className="font-bold">{rotation.name}</span>? This cannot be undone.</p>
                        <div className="flex justify-end gap-2">
                          <button className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100" onClick={e => { e.preventDefault(); setConfirmOpen(false); }}>Cancel</button>
                          <button className="px-2 py-1 rounded bg-red-600 text-white" onClick={handleDelete} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete'}</button>
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
            <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500 text-sm mb-6 line-clamp-2 leading-relaxed">{rotation.description}</p>
          )}
          
          {/* Objects Preview - Enhanced with better visual weight */}
          <div className="mb-6">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
              <div className="flex justify-center items-center overflow-hidden px-2">
                {rotation.objects.slice(0, 5).map((obj: HeldObject, index) => (
                  <div 
                    key={obj.id} 
                    className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white rounded-full border-2 border-white shadow-lg ring-1 ring-gray-200 overflow-hidden transition-transform duration-200 hover:scale-110 hover:ring-blue-300 flex-shrink-0"
                    style={{ 
                      zIndex: 10 - index, 
                      marginLeft: index > 0 ? '-6px' : '0',
                      aspectRatio: '1',
                      minWidth: '40px',
                      minHeight: '40px'
                    }}
                  >
                    {obj.images.length > 0 ? (
                      <Image src={obj.images[0]} alt={obj.title} width={56} height={56} className="w-full h-full object-cover" style={{ aspectRatio: '1' }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ aspectRatio: '1' }}>
                        <span className="text-gray-400 dark:text-gray-500 text-xs sm:text-sm">?</span>
                      </div>
                    )}
                  </div>
                ))}
                {rotation.objects.length > 5 && (
                  <div className="w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-full border-3 border-white shadow-lg ring-2 ring-gray-200 flex items-center justify-center">
                    <span className="text-gray-600 dark:text-gray-400 dark:text-gray-500 text-sm font-medium">+{rotation.objects.length - 5}</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500 mt-4 text-center font-medium">{rotation.objects.length} object{rotation.objects.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(
                rotation.createdAt instanceof Date
                  ? rotation.createdAt
                  : (rotation.createdAt && typeof rotation.createdAt === 'object' && 'toDate' in rotation.createdAt && typeof (rotation.createdAt as import('firebase/firestore').Timestamp).toDate === 'function')
                    ? (rotation.createdAt as import('firebase/firestore').Timestamp).toDate()
                    : new Date()
              )}</span>
            </div>
            {!rotation.coverImage && rotation.isPublic && <span className="text-green-600 text-xs font-medium bg-green-50 px-2 py-1 rounded-full">Public</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}
