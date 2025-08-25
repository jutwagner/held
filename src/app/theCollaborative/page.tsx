"use client";
import React, { useState, useEffect } from 'react';
import { subscribePublicPosts, subscribePublicRotations, getObject } from '@/lib/firebase-services';
import PostCard from '@/components/PostCard';
import type { HeldObject, Rotation } from '@/types';
import { addRotation } from '@/scripts/addRotation';
import { MobileBottomBar } from '@/components/Navigation';
import Image from 'next/image';

// Child component for each rotation card to fix hook order
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

  // Fetch rotation objects
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
              console.error(`Failed to fetch object ${objectId}:`, error);
              return null;
            }
          })
        );

        const validObjects = objects.filter((obj): obj is HeldObject => obj !== null);
        setRotationObjects(validObjects);
      } catch (error) {
        console.error('Failed to fetch rotation objects:', error);
      } finally {
        setLoadingObjects(false);
      }
    };

    fetchObjects();
  }, [rotation.objectIds]);
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden">
      {/* Header with object images */}
      <div className="relative h-48 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        {loadingObjects ? (
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : rotationObjects.length > 0 ? (
          <div className="flex items-center justify-center gap-2 flex-wrap max-w-full px-4">
            {rotationObjects.slice(0, 6).map((obj, index) => (
              <div key={obj.id} className="relative">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-lg bg-gray-200">
                  {obj.images && obj.images.length > 0 ? (
                    <Image
                      src={obj.images[0]}
                      alt={obj.title}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" className="text-gray-500">
                        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                        <path d="M9 9h6v6H9z" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                  )}
                </div>
                {index === 5 && rotationObjects.length > 6 && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">+{rotationObjects.length - 6}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
            <svg width="48" height="48" fill="none" viewBox="0 0 32 32" className="text-white">
              <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2"/>
              <path d="M16 10v8" stroke="currentColor" strokeWidth="2"/>
              <circle cx="16" cy="22" r="1.5" fill="currentColor"/>
            </svg>
          </div>
        )}
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
            {rotation.createdAt instanceof Date 
              ? rotation.createdAt.toLocaleDateString()
              : 'Recently created'
            }
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <a 
            href={`/rotations/${rotation.id}`} 
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
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
// 'use client' directive should be at the very top

export default function TheCollaborativePage() {
  const [posts, setPosts] = useState<HeldObject[]>([]);
  const [rotations, setRotations] = useState<Rotation[]>([]);
  const [loading, setLoading] = useState(false);

  // useEffect(() => {
  //   addRotation();
  // }, []);

  useEffect(() => {
    setLoading(true);
    
    // Subscribe to both posts and rotations
    const unsubscribePosts = subscribePublicPosts((publicPosts) => {
      const collaborativePosts = publicPosts.filter(post => post.shareInCollaborative);
      setPosts(collaborativePosts);
    });
    
    const unsubscribeRotations = subscribePublicRotations((publicRotations) => {
      setRotations(publicRotations);
    });
    
    // Set loading to false after both subscriptions are set up
    setLoading(false);
    
    return () => {
      unsubscribePosts();
      unsubscribeRotations();
    };
  }, []);

  return (
    <>
      <MobileBottomBar />
      <header className="bg-white shadow">
        <div className="held-container py-8">
          {loading ? (
            <p className="text-center text-gray-500">Loading…</p>
          ) : (
            <>
              <h1 className="text-2xl font-serif font-bold mb-2 sm:mb-0">theCollaborative</h1>
              <p className="text-gray-600">A chronological feed of all shared registry items and rotations.</p>
            </>
          )}
        </div>
      </header>

      <main className="min-h-screen bg-gray-100">
        <div className="held-container py-8">
          {loading ? (
            <p className="text-center text-gray-500">Loading…</p>
          ) : posts.length === 0 && rotations.length === 0 ? (
            <p className="text-center text-gray-500">No shared content available.</p>
          ) : (
            <div className="space-y-6">
              {/* Combine posts and rotations into one chronological feed */}
              {(() => {
                // Create a combined array with proper date handling
                const combinedItems = [
                  ...posts.map(post => ({
                    ...post,
                    type: 'post' as const,
                    sortDate: post.createdAt instanceof Date 
                      ? post.createdAt.getTime() 
                      : (post.createdAt as any)?.toDate?.()?.getTime() || 0
                  })),
                  ...rotations.map(rotation => ({
                    ...rotation,
                    type: 'rotation' as const,
                    sortDate: rotation.createdAt instanceof Date 
                      ? rotation.createdAt.getTime() 
                      : (rotation.createdAt as any)?.toDate?.()?.getTime() || 0
                  }))
                ];

                // Sort by date (most recent first)
                const sortedItems = combinedItems.sort((a, b) => b.sortDate - a.sortDate);

                return sortedItems.map((item) => {
                  if (item.type === 'rotation') {
                    // This is a rotation
                    return (
                      <div key={item.id} className="bg-white rounded-xl shadow-sm">
                        <CollaborativeRotationCard
                          rotation={item}
                          onDelete={() => setRotations((prev) => prev.filter(r => r.id !== item.id))}
                        />
                      </div>
                    );
                  } else {
                    // This is a post
                    return (
                      <div key={item.id} className="bg-white rounded-xl shadow-sm">
                        <PostCard post={item} />
                      </div>
                    );
                  }
                });
              })()}
            </div>
          )}
        </div>
      </main>
    </>
  );
}