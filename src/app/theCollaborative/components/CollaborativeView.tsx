"use client";

import { useEffect, useMemo, useState } from 'react';
import { MobileBottomBar } from '@/components/Navigation';
import SleekPostCard from '@/components/SleekPostCard';
import type { Rotation } from '@/types';
import { subscribePublicPosts, subscribePublicRotations } from '@/lib/firebase-services';
import { useRotationCategories } from '@/hooks/useRotationCategories';
import CollaborativeRotationCard from './CollaborativeRotationCard';

interface CollaborativeViewProps {
  selectedCategory: string | null;
  onCategoryChange?: (category: string | null) => void;
  showFilters?: boolean;
}

export default function CollaborativeView({
  selectedCategory,
  onCategoryChange,
  showFilters = true,
}: CollaborativeViewProps) {
  const [rotations, setRotations] = useState<Rotation[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const rotationCategoryMap = useRotationCategories(rotations);

  useEffect(() => {
    try {
      const unsubscribePosts = subscribePublicPosts((publicPosts) => {
        try {
          const collaborativePosts = publicPosts.filter((post) => post.shareInCollaborative);
          setPosts(collaborativePosts);
          setLoading(false);
        } catch (error) {
          console.error('Error processing posts:', error);
          setPosts([]);
          setLoading(false);
        }
      });
      const unsubscribeRotations = subscribePublicRotations((publicRotations) => {
        try {
          setRotations(publicRotations);
        } catch (error) {
          console.error('Error processing rotations:', error);
          setRotations([]);
        }
      });

      return () => {
        try {
          unsubscribePosts();
          unsubscribeRotations();
        } catch (error) {
          console.error('Error unsubscribing:', error);
        }
      };
    } catch (error) {
      console.error('Error setting up subscriptions:', error);
      setLoading(false);
    }
  }, []);

  const availableCategories = useMemo(() => {
    try {
      const categories = new Set<string>();

      posts.forEach((post) => {
        if (post && post.category) {
          categories.add(post.category);
        }
      });

      rotations.forEach((rotation) => {
        if (rotation && rotation.id) {
          const rotationCategories = rotationCategoryMap[rotation.id] ?? [];
          rotationCategories.forEach((category) => categories.add(category));
        }
      });

      return Array.from(categories).sort((a, b) => a.localeCompare(b));
    } catch (error) {
      console.error('Error computing available categories:', error);
      return [];
    }
  }, [posts, rotations, rotationCategoryMap]);

  const activeCategoryLabel = useMemo(() => {
    if (!selectedCategory) {
      return null;
    }

    const match = availableCategories.find(
      (category) => category.toLowerCase() === selectedCategory.toLowerCase()
    );

    return match ?? selectedCategory;
  }, [selectedCategory, availableCategories]);

  const filteredEntries = useMemo(() => {
    try {
      const normalizeDate = (value: unknown): number => {
        if (!value) return 0;
        if (value instanceof Date) return value.getTime();
        if (typeof value === 'object' && value && 'toDate' in (value as any)) {
          try {
            const date = (value as any).toDate();
            if (date instanceof Date) return date.getTime();
          } catch {}
        }
        return 0;
      };

      const matchesCategory = (candidate: string | undefined | null) => {
        if (!selectedCategory) return true;
        return candidate?.toLowerCase() === selectedCategory.toLowerCase();
      };

      const rotationEntries = rotations
        .filter(rotation => {
          if (!rotation || !rotation.id) return false;
          if (!selectedCategory) return true;
          const categories = rotationCategoryMap[rotation.id] ?? [];
          return categories.some(category => matchesCategory(category));
        })
        .map(rotation => ({
          type: 'rotation' as const,
          createdAt: normalizeDate(rotation.createdAt),
          rotation,
        }));

      const postEntries = posts
        .filter(post => {
          if (!post) return false;
          return matchesCategory(post.category);
        })
        .map(post => ({
          type: 'post' as const,
          createdAt: normalizeDate(post.createdAt),
          post,
        }));

      return [...rotationEntries, ...postEntries]
        .sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error('Error filtering entries:', error);
      return [];
    }
  }, [rotations, posts, selectedCategory, rotationCategoryMap]);

  const handleCategoryFilter = (category: string | null) => {
    if (!onCategoryChange) return;
    onCategoryChange(category);
  };

  return (
    <div className="relative min-h-screen">
      <div className="full-bleed min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <div className="held-container held-container-wide full-bleed py-10">
        <div className="flex sm:flex-row justify-between items-start sm:items-center mb-10">
          <div>
            <h1 className="text-lg md:text-2xl font-serif tracking-tight mb-2 text-gray-900 dark:text-gray-100">
              theCollaborative
            </h1>
            <p className="text-gray-600/90 dark:text-gray-300/90">
              {activeCategoryLabel ? `${activeCategoryLabel} shared content` : 'shared Registry Rotations'}
            </p>
          </div>
        </div>

        {showFilters && availableCategories.length > 0 && (
          <div className="mb-8">
            <div className="relative">
              <div
                className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                <button
                  onClick={() => handleCategoryFilter(null)}
                  disabled={!onCategoryChange}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    !selectedCategory
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  } ${!onCategoryChange ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  All
                </button>
                {availableCategories.map((category) => {
                  const isActive =
                    selectedCategory && selectedCategory.toLowerCase() === category.toLowerCase();
                  return (
                    <button
                      key={category}
                      onClick={() => handleCategoryFilter(category)}
                      disabled={!onCategoryChange}
                      className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors capitalize ${
                        isActive
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                      } ${!onCategoryChange ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-center text-gray-500 dark:text-gray-400">Loading…</p>
        ) : filteredEntries.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400">
            {selectedCategory ? `No ${selectedCategory} content available.` : 'No shared content available.'}
          </p>
        ) : (
          <div className="columns-1 md:columns-2 gap-6 space-y-6">
            {filteredEntries.map(entry => {
              try {
                if (entry.type === 'rotation') {
                  return (
                    <div key={`rotation-${entry.rotation.id}`} className="break-inside-avoid mb-6">
                      <CollaborativeRotationCard
                        rotation={entry.rotation}
                        onDelete={() => setRotations(prev => prev.filter(r => r.id !== entry.rotation.id))}
                      />
                    </div>
                  );
                }
                return (
                  <div key={`post-${entry.post.id}`} className="break-inside-avoid mb-6">
                    <SleekPostCard post={entry.post} />
                  </div>
                );
              } catch (error) {
                console.error('Error rendering entry:', error, entry);
                return null;
              }
            })}
          </div>
        )}
        </div>
      </div>
      <MobileBottomBar />
    </div>
  );
}
