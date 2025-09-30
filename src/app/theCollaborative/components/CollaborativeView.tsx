"use client";

import { useEffect, useMemo, useState } from 'react';
import { MobileBottomBar } from '@/components/Navigation';
import PostCard from '@/components/PostCard';
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
    const unsubscribePosts = subscribePublicPosts((publicPosts) => {
      const collaborativePosts = publicPosts.filter((post) => post.shareInCollaborative);
      setPosts(collaborativePosts);
      setLoading(false);
    });
    const unsubscribeRotations = subscribePublicRotations((publicRotations) => {
      setRotations(publicRotations);
    });

    return () => {
      unsubscribePosts();
      unsubscribeRotations();
    };
  }, []);

  const availableCategories = useMemo(() => {
    const categories = new Set<string>();

    posts.forEach((post) => {
      if (post.category) {
        categories.add(post.category);
      }
    });

    rotations.forEach((rotation) => {
      const rotationCategories = rotationCategoryMap[rotation.id] ?? [];
      rotationCategories.forEach((category) => categories.add(category));
    });

    return Array.from(categories).sort((a, b) => a.localeCompare(b));
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

  const filteredContent = useMemo(() => {
    if (!selectedCategory) {
      return { rotations, posts };
    }

    const targetCategory = selectedCategory.toLowerCase();

    const filteredRotations = rotations.filter((rotation) => {
      const categories = rotationCategoryMap[rotation.id] ?? [];
      return categories.some((category) => category.toLowerCase() === targetCategory);
    });

    const filteredPosts = posts.filter(
      (post) => post.category?.toLowerCase() === targetCategory
    );

    return { rotations: filteredRotations, posts: filteredPosts };
  }, [rotations, posts, selectedCategory, rotationCategoryMap]);

  const handleCategoryFilter = (category: string | null) => {
    if (!onCategoryChange) return;
    onCategoryChange(category);
  };

  return (
    <div className="relative min-h-screen">
      <div className="full-bleed min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <div className="held-container held-container-wide py-10">
        <div className="flex sm:flex-row justify-between items-start sm:items-center mb-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-serif tracking-tight mb-2 text-gray-900 dark:text-gray-100">
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
        ) : filteredContent.rotations.length === 0 && filteredContent.posts.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400">
            {selectedCategory ? `No ${selectedCategory} content available.` : 'No shared content available.'}
          </p>
        ) : (
          <div className="space-y-6">
            {filteredContent.rotations.map((rotation) => (
              <CollaborativeRotationCard
                key={rotation.id}
                rotation={rotation}
                onDelete={() => setRotations((prev) => prev.filter((r) => r.id !== rotation.id))}
              />
            ))}
            {filteredContent.posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
        </div>
      </div>
      <MobileBottomBar />
    </div>
  );
}
