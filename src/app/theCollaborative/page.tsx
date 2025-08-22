"use client";
import React, { useState, useEffect } from 'react';
import { getPublicPosts, getPublicRotations } from '@/lib/firebase-services';
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
  const [tab, setTab] = useState<'registry' | 'rotations'>('registry');
  const [posts, setPosts] = useState<HeldObject[]>([]);
  const [rotations, setRotations] = useState<Rotation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    addRotation();
  }, []);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      if (tab === 'registry') {
        const publicPosts = await getPublicPosts();
        const collaborativePosts = publicPosts.filter(post => post.shareInCollaborative);
        setPosts(collaborativePosts);
      } else {
        const publicRotations = await getPublicRotations();
        setRotations(publicRotations);
      }
      setLoading(false);
    }
    fetchData();
  }, [tab]);

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
              <div className="flex gap-8 border-b border-gray-200 mt-2">
                <div
                  className={`pb-2 cursor-pointer font-serif text-base transition-colors ${tab === 'registry' ? 'border-b-2 border-gray-900 text-gray-900' : 'text-gray-500 hover:text-gray-800'}`}
                  onClick={() => setTab('registry')}
                >
                  Public Registry
                </div>
                <div
                  className={`pb-2 cursor-pointer font-serif text-base transition-colors ${tab === 'rotations' ? 'border-b-2 border-gray-900 text-gray-900' : 'text-gray-500 hover:text-gray-800'}`}
                  onClick={() => setTab('rotations')}
                >
                  Public Rotations
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      <main className="min-h-screen bg-gray-100">
        <div className="held-container py-8">
          {loading ? (
            <p className="text-center text-gray-500">Loading…</p>
          ) : tab === 'registry' ? (
            posts.length === 0 ? (
              <p className="text-center text-gray-500">No public registry items available.</p>
            ) : (
              <div className="space-y-6">
                {posts.map((post) => (
                  <div key={post.id} className="bg-white rounded-xl shadow p-4">
                    <PostCard post={post} />
                  </div>
                ))}
              </div>
            )
          ) : (
            rotations.length === 0 ? (
              <p className="text-center text-gray-500">No public rotations available.</p>
            ) : (
              <div className="space-y-6">
                {rotations.map((rotation) => (
                  <CollaborativeRotationCard
                    key={rotation.id}
                    rotation={rotation}
                    onDelete={() => setRotations((prev) => prev.filter(r => r.id !== rotation.id))}
                  />
                ))}
              </div>
            )
          )}
        </div>
      </main>
    </>
  );
}