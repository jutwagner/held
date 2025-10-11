'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import type { RotationWithObjects, HeldObject } from '@/types';

interface SleekRotationCardProps {
  rotation: RotationWithObjects;
  disabled?: boolean;
}

export default function SleekRotationCard({ rotation, disabled = false }: SleekRotationCardProps) {
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
      <div 
        className="group relative rounded-2xl overflow-hidden cursor-not-allowed aspect-[4/5]"
        style={{ 
          willChange: 'transform',
          borderRadius: '1rem',
          transform: 'translateZ(0)',
          pointerEvents: 'none',
          opacity: 1 
        }}
      >
        {/* Background Image */}
        <div className="absolute inset-0">
          {rotation.coverImage ? (
            <Image
              src={rotation.coverImage}
              alt={rotation.name}
              fill
              className="object-cover opacity-60"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600" />
          )}
        </div>

        {/* Dark Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />

        {/* Public Badge */}
        {rotation.isPublic && (
          <div className="absolute top-4 left-4 z-20">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-full text-xs font-medium text-gray-900 dark:text-gray-100 shadow-lg border border-white/20">
              <Eye className="h-3 w-3" />
              Public
            </span>
          </div>
        )}

        {/* Held+ Upgrade Overlay */}
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md" 
          style={{ pointerEvents: 'auto' }}
        >
          <div className="flex flex-col items-center">
            <span className="text-gray-700 dark:text-gray-300 text-base font-semibold mb-3">Held+</span>
            <Link
              href="/settings/premium"
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold shadow-lg hover:bg-blue-700 transition-all text-sm"
              style={{ pointerEvents: 'auto' }}
            >
              Upgrade
            </Link>
          </div>
        </div>

        {/* Content (Blurred) */}
        <div className="relative z-10 flex flex-col justify-end h-full p-6 blur-sm">
          <h3 className="text-2xl font-semibold text-white mb-2 line-clamp-2">{rotation.name}</h3>
          
          {rotation.description && (
            <p className="text-white/90 text-sm mb-4 line-clamp-2">{rotation.description}</p>
          )}

          {/* Registry Objects Circles */}
          <div className="mb-4">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <div className="flex justify-center items-center px-2">
                {rotation.objects.slice(0, 5).map((obj: HeldObject, index) => (
                  <div 
                    key={obj.id} 
                    className="w-12 h-12 bg-white rounded-full border-2 border-white shadow-lg overflow-hidden flex-shrink-0"
                    style={{ 
                      zIndex: 10 - index, 
                      marginLeft: index > 0 ? '-8px' : '0',
                    }}
                  >
                    {obj.images.length > 0 ? (
                      <Image 
                        src={obj.images[0]} 
                        alt={obj.title} 
                        width={48} 
                        height={48} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <span className="text-gray-400 text-xs">?</span>
                      </div>
                    )}
                  </div>
                ))}
                {rotation.objects.length > 5 && (
                  <div 
                    className="w-12 h-12 bg-white/90 rounded-full border-2 border-white shadow-lg flex items-center justify-center flex-shrink-0"
                    style={{ 
                      zIndex: 5, 
                      marginLeft: '-8px',
                    }}
                  >
                    <span className="text-gray-700 text-xs font-semibold">+{rotation.objects.length - 5}</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-white/90 mt-3 text-center font-medium">
                {rotation.objects.length} object{rotation.objects.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Footer Meta */}
          <div className="flex items-center justify-between text-xs text-white/75">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
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
    );
  }

  return (
    <Link href={`/rotations/${rotation.id}`}>
      <div 
        className="group relative rounded-2xl overflow-hidden cursor-pointer aspect-[4/5] hover:shadow-2xl transition-shadow duration-300"
        style={{ 
          willChange: 'transform',
          borderRadius: '1rem',
          transform: 'translateZ(0)'
        }}
      >
        {/* Background Image */}
        <div className="absolute inset-0">
          {rotation.coverImage ? (
            <Image
              src={rotation.coverImage}
              alt={rotation.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600" />
          )}
        </div>

        {/* Dark Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />

        {/* Public Badge */}
        {rotation.isPublic && (
          <div className="absolute top-4 left-4 z-20">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-full text-xs font-medium text-gray-900 dark:text-gray-100 shadow-lg border border-white/20">
              <Eye className="h-3 w-3" />
              Public
            </span>
          </div>
        )}

        {/* Delete Button */}
        {canDelete && (
          <div className="absolute top-4 right-4 z-20">
            <button
              className="px-3 py-1.5 bg-red-500/90 hover:bg-red-600/90 backdrop-blur-sm text-white rounded-lg text-xs font-medium shadow-lg transition-colors disabled:opacity-50 border border-red-400/30"
              onClick={(e) => { 
                e.preventDefault(); 
                e.stopPropagation();
                setConfirmOpen(true); 
              }}
              disabled={deleting}
              title="Delete rotation"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        )}

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-end h-full p-6">
          <h3 className="text-2xl font-semibold text-white mb-2 line-clamp-2 drop-shadow-lg">
            {rotation.name}
          </h3>
          
          {rotation.description && (
            <p className="text-white/90 text-sm mb-4 line-clamp-2 drop-shadow-md">
              {rotation.description}
            </p>
          )}

          {/* Registry Objects Circles */}
          <div className="mb-4">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 transition-all duration-300 group-hover:bg-white/15">
              <div className="flex justify-center items-center px-2">
                {rotation.objects.slice(0, 5).map((obj: HeldObject, index) => (
                  <div 
                    key={obj.id} 
                    className="w-12 h-12 bg-white rounded-full border-2 border-white shadow-lg overflow-hidden flex-shrink-0 transition-transform duration-200 hover:scale-110"
                    style={{ 
                      zIndex: 10 - index, 
                      marginLeft: index > 0 ? '-8px' : '0',
                    }}
                  >
                    {obj.images.length > 0 ? (
                      <Image 
                        src={obj.images[0]} 
                        alt={obj.title} 
                        width={48} 
                        height={48} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <span className="text-gray-400 text-xs">?</span>
                      </div>
                    )}
                  </div>
                ))}
                {rotation.objects.length > 5 && (
                  <div 
                    className="w-12 h-12 bg-white/90 rounded-full border-2 border-white shadow-lg flex items-center justify-center flex-shrink-0"
                    style={{ 
                      zIndex: 5, 
                      marginLeft: '-8px',
                    }}
                  >
                    <span className="text-gray-700 text-xs font-semibold">+{rotation.objects.length - 5}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Meta */}
          <div className="flex items-center justify-between text-xs text-white/75 drop-shadow-md">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
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

        {/* Confirm Delete Modal */}
        {confirmOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <div 
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                Confirm Delete
              </h3>
              <p className="mb-6 text-gray-700 dark:text-gray-300">
                Are you sure you want to delete <span className="font-bold">{rotation.name}</span>? This cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button 
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium transition-colors"
                  onClick={(e) => { 
                    e.preventDefault(); 
                    e.stopPropagation();
                    setConfirmOpen(false); 
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors disabled:opacity-50"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}


