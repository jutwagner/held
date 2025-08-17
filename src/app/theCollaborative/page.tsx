"use client";

import { useEffect, useState } from 'react';
import { getPublicPosts } from '@/lib/firebase-services';
import PostCard from '@/components/PostCard';
import Navigation from '@/components/Navigation';
import type { HeldObject } from '@/types';
import { addRotation } from '@/scripts/addRotation';

export default function theCollaborativePage() {
  const [posts, setPosts] = useState<HeldObject[]>([]);

  useEffect(() => {
    async function fetchPosts() {
      const publicPosts = await getPublicPosts();
      const collaborativePosts = publicPosts.filter(post => post.shareInCollaborative);
      setPosts(collaborativePosts);
    }

    fetchPosts();
  }, []);

  useEffect(() => {
    addRotation();
  }, []);

  return (
    <>
      <Navigation />
      <header className="bg-white shadow">
        <div className="held-container py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">theCollaborative</h1>
          <p className="text-gray-500">Explore public posts from the collaborative</p>
        </div>
      </header>

      <main className="min-h-screen bg-gray-100">
        <div className="held-container py-8">
          {posts.length === 0 ? (
            <p className="text-center text-gray-500">No posts available.</p>
          ) : (
            <div className="space-y-6">
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