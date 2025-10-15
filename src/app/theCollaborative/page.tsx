"use client";

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { subscribePublicPosts, subscribePublicRotations } from '@/lib/firebase-services';
import SleekPostCard from '@/components/SleekPostCard';
import CollaborativeRotationCard from './components/CollaborativeRotationCard';
import type { HeldObject, Rotation } from '@/types';

export default function TheCollaborativePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [posts, setPosts] = useState<HeldObject[]>([]);
  const [rotations, setRotations] = useState<Rotation[]>([]);
  const [loading, setLoading] = useState(true);

  const selectedCategory = searchParams.get('category');

  // Subscribe to posts and rotations
  useEffect(() => {
    try {
      let postsLoaded = false;
      let rotationsLoaded = false;

      const checkLoading = () => {
        if (postsLoaded && rotationsLoaded) {
          setLoading(false);
        }
      };

      const postsUnsubscribe = subscribePublicPosts((publicPosts) => {
        try {
          const collaborativePosts = publicPosts.filter((post) => post.shareInCollaborative);
          setPosts(collaborativePosts);
          postsLoaded = true;
          checkLoading();
        } catch (error) {
          console.error('Error processing posts:', error);
          setPosts([]);
          postsLoaded = true;
          checkLoading();
        }
      });

      const rotationsUnsubscribe = subscribePublicRotations((publicRotations) => {
        try {
          setRotations(publicRotations);
          rotationsLoaded = true;
          checkLoading();
        } catch (error) {
          console.error('Error processing rotations:', error);
          setRotations([]);
          rotationsLoaded = true;
          checkLoading();
        }
      });

      return () => {
        try {
          postsUnsubscribe();
          rotationsUnsubscribe();
        } catch (error) {
          console.error('Error unsubscribing:', error);
        }
      };
    } catch (error) {
      console.error('Error setting up subscription:', error);
      setLoading(false);
    }
  }, []);

  // Get available categories from posts
  const availableCategories = useMemo(() => {
    try {
      const categories = new Set<string>();
      posts.forEach((post) => {
        if (post.category) {
          categories.add(post.category);
        }
      });
      return Array.from(categories).sort();
    } catch (error) {
      console.error('Error calculating available categories:', error);
      return [];
    }
  }, [posts]);

  // Filter posts by category
  const filteredPosts = useMemo(() => {
    try {
      if (!selectedCategory) return posts;
      return posts.filter((post) => post.category === selectedCategory);
    } catch (error) {
      console.error('Error filtering posts:', error);
      return posts;
    }
  }, [posts, selectedCategory]);

  // Combine posts and rotations into a single feed
  const combinedEntries = useMemo(() => {
    try {
      const entries: Array<{ type: 'post' | 'rotation'; data: HeldObject | Rotation; id: string }> = [];
      
      filteredPosts.forEach((post) => {
        entries.push({ type: 'post', data: post, id: `post-${post.id}` });
      });
      
      rotations.forEach((rotation) => {
        entries.push({ type: 'rotation', data: rotation, id: `rotation-${rotation.id}` });
      });

      // Sort by creation date (newest first)
      entries.sort((a, b) => {
        const dateA = a.data.createdAt instanceof Date 
          ? a.data.createdAt 
          : (a.data.createdAt && typeof a.data.createdAt === 'object' && 'toDate' in a.data.createdAt && typeof a.data.createdAt.toDate === 'function')
            ? a.data.createdAt.toDate()
            : new Date();
        const dateB = b.data.createdAt instanceof Date 
          ? b.data.createdAt 
          : (b.data.createdAt && typeof b.data.createdAt === 'object' && 'toDate' in b.data.createdAt && typeof b.data.createdAt.toDate === 'function')
            ? b.data.createdAt.toDate()
            : new Date();
        return dateB.getTime() - dateA.getTime();
      });

      return entries;
    } catch (error) {
      console.error('Error combining entries:', error);
      return [];
    }
  }, [filteredPosts, rotations]);

  const handleCategoryChange = (category: string | null) => {
    const params = new URLSearchParams(searchParams.toString());

    if (category) {
      params.set('category', category);
    } else {
      params.delete('category');
    }

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 full-bleed">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex sm:flex-row justify-between items-start sm:items-center mb-10">
          <div>
            <h1 className="text-lg md:text-2xl font-serif  tracking-tight mb-2 text-gray-900 dark:text-gray-100">
              theCollaborative
            </h1>
            <p className="text-gray-600/90 dark:text-gray-300/90">
              Shared Collection Items
            </p>
          </div>
        </div>

        {/* Category Filter Pills */}
        {availableCategories.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            <button
              onClick={() => handleCategoryChange(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                !selectedCategory
                  ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              All
            </button>
            {availableCategories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <p className="text-center text-gray-500 dark:text-gray-400">Loading…</p>
        ) : combinedEntries.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400">
            No shared content available.
          </p>
        ) : (
          <div className="columns-1 md:columns-2 gap-6 space-y-6">
            {combinedEntries.map((entry) => (
              <div key={entry.id} className="break-inside-avoid mb-6 rounded-2xl">
                {entry.type === 'post' ? (
                  <SleekPostCard post={entry.data as HeldObject} />
                ) : (
                  <CollaborativeRotationCard 
                    rotation={entry.data as Rotation} 
                    onDelete={() => {
                      // Rotation will be removed automatically via subscription
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
