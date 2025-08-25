"use client";
import React, { useState, useEffect } from 'react';
import { subscribePublicPosts, subscribePublicRotations } from '@/lib/firebase-services';
import PostCard from '@/components/PostCard';
import type { HeldObject, Rotation } from '@/types';
import { addRotation } from '@/scripts/addRotation';
import { MobileBottomBar } from '@/components/Navigation';

// Child component for each rotation card to fix hook order
function CollaborativeRotationCard({ rotation, onDelete }: { rotation: Rotation; onDelete: () => void }) {
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
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
  return (
    <div className="bg-white rounded-lg shadow p-6 flex flex-col justify-between hover:shadow-lg transition-shadow cursor-pointer relative">
      <h3 className="font-serif font-medium text-lg mb-2">{rotation.name}</h3>
      <p className="text-gray-600 text-sm mb-2 line-clamp-2">{rotation.description}</p>
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
        <span>{rotation.objectIds?.length || 0} objects</span>
        {rotation.isPublic && <span className="text-green-600">Public</span>}
      </div>
      <a href={`/rotations/${rotation.id}`} className="mt-2 text-blue-600 hover:underline text-sm">View Rotation</a>
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
              {[...posts, ...rotations]
                .sort((a, b) => {
                  const aDate = 'createdAt' in a ? (a.createdAt instanceof Date ? a.createdAt.getTime() : 0) : 0;
                  const bDate = 'createdAt' in b ? (b.createdAt instanceof Date ? b.createdAt.getTime() : 0) : 0;
                  return bDate - aDate; // Most recent first
                })
                .map((item) => {
                  if ('objectIds' in item) {
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
                })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}