"use client";

import { useEffect, useState } from 'react';
import { getPublicPosts, getPublicRotations } from '@/lib/firebase-services';
import PostCard from '@/components/PostCard';
import type { HeldObject, Rotation } from '@/types';
import { addRotation } from '@/scripts/addRotation';

import { MobileBottomBar } from '@/components/Navigation';

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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rotations.map((rotation) => (
                  <div key={rotation.id} className="bg-white rounded-lg shadow p-6 flex flex-col justify-between hover:shadow-lg transition-shadow cursor-pointer">
                    <h3 className="font-serif font-medium text-lg mb-2">{rotation.name}</h3>
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">{rotation.description}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                      <span>{rotation.objectIds?.length || 0} objects</span>
                      {rotation.isPublic && <span className="text-green-600">Public</span>}
                    </div>
                    <a href={`/rotations/${rotation.id}`} className="mt-2 text-blue-600 hover:underline text-sm">View Rotation</a>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </main>
    </>
  );
}