"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import type { HeldObject, Rotation } from '@/types';
import { getObject } from '@/lib/firebase-services';

interface CollaborativeRotationCardProps {
  rotation: Rotation;
  onDelete: () => void;
}

export default function CollaborativeRotationCard({ rotation, onDelete }: CollaborativeRotationCardProps) {
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rotationObjects, setRotationObjects] = useState<HeldObject[]>([]);
  const [loadingObjects, setLoadingObjects] = useState(true);

  useEffect(() => {
    const fetchObjects = async () => {
      if (!rotation.objectIds || rotation.objectIds.length === 0) {
        setLoadingObjects(false);
        return;
      }
      try {
        const objects = await Promise.all(
          rotation.objectIds.map(async (objectId) => {
            try {
              return await getObject(objectId);
            } catch (error) {
              return null;
            }
          })
        );
        setRotationObjects(objects.filter(Boolean) as HeldObject[]);
      } catch (error) {
        // ignore fetch errors for individual objects
      } finally {
        setLoadingObjects(false);
      }
    };

    fetchObjects();
  }, [rotation.objectIds]);

  const handleDelete = async () => {
    setConfirmOpen(false);
    setDeleting(true);
    try {
      await import('@/lib/firebase-services').then((mod) => mod.deleteRotation(rotation.id));
      onDelete();
    } catch (err) {
      alert('Failed to delete rotation.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden">
      <div className="relative h-64 bg-gray-50 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
        <div className="absolute top-4 left-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-gray-900 shadow-md pad-top-rotation opacity-90">
          <Image src="/img/rotations.svg" alt="Rotation" width={24} height={24} className="h-6 w-6 dark:invert" />
        </div>
        {rotation.coverImage && (
          <Image
            src={rotation.coverImage}
            alt="Rotation Cover"
            fill
            className="absolute inset-0 w-full h-full object-cover z-0 opacity-80 blur-sm scale-105"
            style={{ objectFit: 'cover' }}
            priority
          />
        )}
        <div className="relative z-10 w-full flex items-center justify-center">
          {loadingObjects ? (
            <div className="flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : rotationObjects.length > 0 ? (
            <div className="flex items-center justify-center px-4">
              {rotationObjects.slice(0, 6).map((obj, index) => (
                <div key={obj.id} className="relative flex-shrink-0">
                  <div
                    className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-white shadow-xl bg-gray-200 dark:bg-gray-800 hover:scale-105 transition-transform duration-200 flex-shrink-0"
                    style={{
                      aspectRatio: '1',
                      marginLeft: index > 0 ? '-8px' : '0',
                      zIndex: 10 - index,
                    }}
                  >
                    {obj.images && obj.images.length > 0 ? (
                      <Image
                        src={obj.images[0]}
                        alt={obj.title}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                        style={{ aspectRatio: '1' }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center" style={{ aspectRatio: '1' }}>
                        <svg width="32" height="32" fill="none" viewBox="0 0 24 24" className="text-gray-500">
                          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                          <path d="M9 9h6v6H9z" stroke="currentColor" strokeWidth="2" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {index === 5 && rotationObjects.length > 6 && (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 absolute inset-0 bg-black bg-opacity-60 rounded-full flex items-center justify-center">
                      <span className="text-white text-xl font-bold font-serif">+{rotationObjects.length - 6}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="w-32 h-32 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center shadow-lg">
              <svg width="64" height="64" fill="none" viewBox="0 0 32 32" className="text-gray-400 dark:text-gray-500">
                <rect x="3" y="3" width="26" height="26" rx="4" stroke="currentColor" strokeWidth="2" />
                <path d="M12 12h8v8h-8z" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
          )}
        </div>
        {rotation.isPublic && (
          <div className="absolute top-3 right-3">
            <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">Public</span>
          </div>
        )}
      </div>

      <div className="p-6">
        <h3 className="font-serif font-bold text-xl mb-3 text-gray-900 dark:text-gray-100">{rotation.name}</h3>
        {rotation.description && (
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2 leading-relaxed">{rotation.description}</p>
        )}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-gray-400 dark:text-gray-500">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
              <path d="M9 9h6v6H9z" stroke="currentColor" strokeWidth="2" />
            </svg>
            <span className="font-medium">{rotation.objectIds?.length || 0} objects</span>
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500">
            {(() => {
              if (rotation.createdAt instanceof Date) {
                return rotation.createdAt.toLocaleDateString();
              }
              if (
                rotation.createdAt &&
                typeof rotation.createdAt === 'object' &&
                typeof (rotation.createdAt as any).toDate === 'function'
              ) {
                return (rotation.createdAt as any).toDate().toLocaleDateString();
              }
              return 'Recently created';
            })()}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <a
            href={`/rotations/${rotation.id}`}
            className="inline-flex items-center gap-2 bg-gray-900 dark:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path d="M5 12h14m-7-7l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            View Rotation
          </a>
        </div>
      </div>
      {rotation.isPublic && (
        <>
          <button
            className="absolute top-4 right-4 bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 transition disabled:opacity-50"
            onClick={() => setConfirmOpen(true)}
            disabled={deleting}
            title="Delete rotation"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
          {confirmOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-sm w-full">
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Confirm Delete</h3>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  Are you sure you want to delete <span className="font-bold">{rotation.name}</span>? This cannot be undone.
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    onClick={() => setConfirmOpen(false)}
                  >
                    Cancel
                  </button>
                  <button className="px-4 py-2 rounded bg-red-600 text-white" onClick={handleDelete} disabled={deleting}>
                    {deleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
