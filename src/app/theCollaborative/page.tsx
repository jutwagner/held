"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { subscribePublicPosts, subscribePublicRotations, getObject } from '@/lib/firebase-services';
import PostCard from '@/components/PostCard';
import type { HeldObject, Rotation } from '@/types';
import { addRotation } from '@/scripts/addRotation';
import { MobileBottomBar } from '@/components/Navigation';
import Image from 'next/image';

function CollaborativeRotationCard({ rotation, onDelete }: { rotation: Rotation; onDelete: () => void }) {
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rotationObjects, setRotationObjects] = useState<HeldObject[]>([]);
  const [loadingObjects, setLoadingObjects] = useState(true);

  const handleDelete = async () => {
    setConfirmOpen(false);
    setDeleting(true);
    try {
      await import('@/lib/firebase-services').then(mod => mod.deleteRotation(rotation.id));
      onDelete();
    } catch (err) {
      alert('Failed to delete rotation.');
    } finally {
      setDeleting(false);
    }
  };

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
        // handle error
      } finally {
        setLoadingObjects(false);
      }
    };
    fetchObjects();
  }, [rotation.objectIds]);

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden">
      {/* Header with object images */}
      <div className="relative h-64 bg-gray-50 flex items-center justify-center overflow-hidden">
        {/* Cover image background */}
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
            <div className="flex items-center justify-center gap-4 flex-wrap max-w-full px-6">
              {rotationObjects.slice(0, 6).map((obj, index) => (
                <div key={obj.id} className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-3 border-white shadow-xl bg-gray-200 hover:scale-105 transition-transform duration-200">
                    {obj.images && obj.images.length > 0 ? (
                      <Image
                        src={obj.images[0]}
                        alt={obj.title}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                        <svg width="32" height="32" fill="none" viewBox="0 0 24 24" className="text-gray-500">
                          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                          <path d="M9 9h6v6H9z" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  {index === 5 && rotationObjects.length > 6 && (
                    <div className="absolute inset-0 bg-black bg-opacity-60 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">+{rotationObjects.length - 6}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center shadow-lg">
              <svg width="64" height="64" fill="none" viewBox="0 0 32 32" className="text-gray-400">
                <rect x="3" y="3" width="26" height="26" rx="4" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 12h8v8h-8z" stroke="currentColor" strokeWidth="2"/>
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

      {/* Content */}
      <div className="p-6">
        <h3 className="font-serif font-bold text-xl mb-3 text-gray-900">{rotation.name}</h3>
        {rotation.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">{rotation.description}</p>
        )}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-gray-400">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M9 9h6v6H9z" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <span className="font-medium">{rotation.objectIds?.length || 0} objects</span>
          </div>
          <div className="text-xs text-gray-400">
            {(() => {
              if (rotation.createdAt instanceof Date) {
                return rotation.createdAt.toLocaleDateString();
              }
              if (rotation.createdAt && typeof rotation.createdAt === 'object' && typeof (rotation.createdAt as any).toDate === 'function') {
                return (rotation.createdAt as any).toDate().toLocaleDateString();
              }
              return 'Recently created';
            })()}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <a 
            href={`/rotations/${rotation.id}`} 
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path d="M5 12h14m-7-7l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            View Rotation
          </a>
        </div>
      </div>
      {/* Delete button for public rotations */}
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
              <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
                <h3 className="text-lg font-semibold mb-2">Confirm Delete</h3>
                <p className="mb-4">Are you sure you want to delete <span className="font-bold">{rotation.name}</span>? This cannot be undone.</p>
                <div className="flex justify-end gap-2">
                  <button className="px-4 py-2 rounded bg-gray-200" onClick={() => setConfirmOpen(false)}>Cancel</button>
                  <button className="px-4 py-2 rounded bg-red-600 text-white" onClick={handleDelete} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete'}</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function TheCollaborativePage() {
  const [rotations, setRotations] = useState<Rotation[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribePosts = subscribePublicPosts((publicPosts) => {
      const collaborativePosts = publicPosts.filter(post => post.shareInCollaborative);
      setPosts(collaborativePosts);
    });
    const unsubscribeRotations = subscribePublicRotations((publicRotations) => {
      setRotations(publicRotations);
    });
    setLoading(false);
    return () => {
      unsubscribePosts();
      unsubscribeRotations();
    };
  }, []);

  return (
    <>
      <div className="held-container py-8">
        <h1 className="text-3xl font-serif font-medium mb-2">theCollaborative</h1>
        <p className="text-gray-600">A feed of shared Registry Rotations.</p>
      </div>
      <main className="min-h-screen bg-gray-100">
        <div className="held-container py-8">
          {loading ? (
            <p className="text-center text-gray-500">Loading…</p>
          ) : rotations.length === 0 && posts.length === 0 ? (
            <p className="text-center text-gray-500">No shared content available.</p>
          ) : (
            <div className="space-y-6">
              {rotations.map((rotation) => (
                <CollaborativeRotationCard
                  key={rotation.id}
                  rotation={rotation}
                  onDelete={() => setRotations((prev) => prev.filter(r => r.id !== rotation.id))}
                />
              ))}
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}