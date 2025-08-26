
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
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-white to-gray-50 rounded-3xl border border-gray-200 shadow-sm cursor-not-allowed">
        {/* Premium Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/90 to-blue-50/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Held+ Required</h3>
            <p className="text-sm text-gray-600 mb-4">Unlock unlimited rotations</p>
            <Link
              href="/settings/premium"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              Upgrade Now
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
        
        {/* Blurred Content */}
        <div className="p-8 filter blur-sm">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-xl text-gray-900 mb-1 truncate">{rotation.name}</h3>
              <div className="flex items-center space-x-2">
                {rotation.isPublic ? (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-green-700 text-xs font-medium">Public</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full" />
                    <span className="text-gray-500 text-xs font-medium">Private</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {rotation.description && (
            <p className="text-gray-600 text-sm mb-6 leading-relaxed line-clamp-2">{rotation.description}</p>
          )}

          <div className="mb-6">
            <div className="flex items-center -space-x-4 mb-3">
              {rotation.objects.slice(0, 4).map((obj: HeldObject, index) => (
                <div 
                  key={obj.id} 
                  className="relative w-14 h-14 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full border-3 border-white shadow-lg overflow-hidden"
                  style={{ zIndex: 4 - index }}
                >
                  {obj.images.length > 0 ? (
                    <Image 
                      src={obj.images[0]} 
                      alt={obj.title} 
                      width={56} 
                      height={56} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <span className="text-gray-500 text-lg font-medium">?</span>
                    </div>
                  )}
                </div>
              ))}
              {rotation.objects.length > 4 && (
                <div className="relative w-14 h-14 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full border-3 border-white shadow-lg flex items-center justify-center">
                  <span className="text-blue-700 text-sm font-bold">+{rotation.objects.length - 4}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">
                {rotation.objects.length} object{rotation.objects.length !== 1 ? 's' : ''}
              </p>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(
                  rotation.createdAt instanceof Date
                    ? rotation.createdAt
                    : (rotation.createdAt && typeof rotation.createdAt === 'object' && 'toDate' in rotation.createdAt && typeof rotation.createdAt.toDate === 'function')
                      ? rotation.createdAt.toDate()
                      : new Date()
                )}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link href={`/rotations/${rotation.id}`}>
      <div className="group relative overflow-hidden bg-gradient-to-br from-white via-white to-gray-50 rounded-3xl border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-2">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Content */}
        <div className="relative p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-xl text-gray-900 mb-1 truncate group-hover:text-blue-900 transition-colors duration-200">{rotation.name}</h3>
              <div className="flex items-center space-x-2">
                {rotation.isPublic ? (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-green-700 text-xs font-medium">Public</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full" />
                    <span className="text-gray-500 text-xs font-medium">Private</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
              {canDelete && (
                <>
                  <button
                    className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center transition-all duration-200 transform hover:scale-105 shadow-md"
                    onClick={e => { e.preventDefault(); setConfirmOpen(true); }}
                    disabled={deleting}
                    title="Delete rotation"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  {confirmOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
                      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 transform animate-pulse">
                        <h3 className="text-xl font-semibold mb-3 text-gray-900">Confirm Delete</h3>
                        <p className="mb-6 text-gray-600">Are you sure you want to delete <span className="font-bold text-gray-900">{rotation.name}</span>? This cannot be undone.</p>
                        <div className="flex justify-end gap-3">
                          <button className="px-6 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors" onClick={e => { e.preventDefault(); setConfirmOpen(false); }}>Cancel</button>
                          <button className="px-6 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-colors shadow-lg" onClick={handleDelete} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete'}</button>
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
            <p className="text-gray-600 text-sm mb-6 leading-relaxed line-clamp-2">{rotation.description}</p>
          )}

          {/* Objects Preview - Enhanced */}
          <div className="mb-6">
            <div className="flex items-center -space-x-4 mb-3">
              {rotation.objects.slice(0, 4).map((obj: HeldObject, index) => (
                <div 
                  key={obj.id} 
                  className="relative w-14 h-14 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full border-3 border-white shadow-lg overflow-hidden transition-all duration-300 hover:scale-110 hover:z-10 hover:shadow-xl"
                  style={{ zIndex: 4 - index }}
                >
                  {obj.images.length > 0 ? (
                    <Image 
                      src={obj.images[0]} 
                      alt={obj.title} 
                      width={56} 
                      height={56} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <span className="text-gray-500 text-lg font-medium">?</span>
                    </div>
                  )}
                  {/* Subtle ring effect */}
                  <div className="absolute inset-0 rounded-full ring-2 ring-blue-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              ))}
              {rotation.objects.length > 4 && (
                <div className="relative w-14 h-14 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full border-3 border-white shadow-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                  <span className="text-blue-700 text-sm font-bold">+{rotation.objects.length - 4}</span>
                </div>
              )}
            </div>
            
            {/* Enhanced stats */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">
                {rotation.objects.length} object{rotation.objects.length !== 1 ? 's' : ''}
              </p>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(
                  rotation.createdAt instanceof Date
                    ? rotation.createdAt
                    : (rotation.createdAt && typeof rotation.createdAt === 'object' && 'toDate' in rotation.createdAt && typeof (rotation.createdAt as import('firebase/firestore').Timestamp).toDate === 'function')
                      ? (rotation.createdAt as import('firebase/firestore').Timestamp).toDate()
                      : new Date()
                )}</span>
              </div>
            </div>
          </div>

          {/* Hover indicator */}
          <div className="absolute bottom-4 right-4 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300 shadow-lg">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}

