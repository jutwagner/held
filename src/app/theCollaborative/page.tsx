"use client";
import React, { useState, useEffect, useMemo } from 'react';
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
      <div className="relative h-64 bg-gray-50 flex items-center justify-center">
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
// 'use client' directive should be at the very top

export default function TheCollaborativePage() {
  const [posts, setPosts] = useState<HeldObject[]>([]);
  const [rotations, setRotations] = useState<Rotation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Define all possible categories
  const categories = [
    'Audio Equipment',
    'Photography', 
    'Fine Art',
    'Industrial Design',
    'Furniture',
    'Lighting',
    'Technology',
    'Musical Instruments',
    'Timepieces',
    'Fashion & Textiles',
    'Publications',
    'Miscellaneous'
  ];

  // Get unique categories from current data
  const availableCategories = useMemo(() => {
    const postCategories = posts.map(post => post.category).filter(Boolean);
    const rotationCategories = rotations.flatMap(rotation => 
      rotation.objectIds?.map(id => {
        const post = posts.find(p => p.id === id);
        return post?.category;
      }).filter(Boolean) || []
    );
    return [...new Set([...postCategories, ...rotationCategories])];
  }, [posts, rotations]);

  // Filter items based on selected category
  const filteredItems = useMemo(() => {
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

    if (!selectedCategory) {
      return combinedItems.sort((a, b) => b.sortDate - a.sortDate);
    }

    const filtered = combinedItems.filter(item => {
      if (item.type === 'post') {
        return item.category === selectedCategory;
      } else {
        // For rotations, check if any of their objects match the category
        return item.objectIds?.some(id => {
          const post = posts.find(p => p.id === id);
          return post?.category === selectedCategory;
        });
      }
    });

    return filtered.sort((a, b) => b.sortDate - a.sortDate);
  }, [posts, rotations, selectedCategory]);

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
          {/* Category Filter Pills */}
          {!loading && (posts.length > 0 || rotations.length > 0) && (
            <div className="mb-8">
              {/* Header with clear filter */}
              <div className="flex items-center justify-between mb-6">
                {selectedCategory && (
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="text-sm text-gray-500 hover:text-gray-700 underline flex items-center gap-1"
                  >
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                      <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    Clear filter
                  </button>
                )}
              </div>
              
              {/* Single row horizontal scrollable for all devices */}
              <div className="relative">
                <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
                  {categories.map((category) => {
                    const isAvailable = availableCategories.includes(category);
                    const isSelected = selectedCategory === category;
                    const count = filteredItems.filter(item => {
                      if (item.type === 'post') {
                        return item.category === category;
                      } else {
                        return item.objectIds?.some(id => {
                          const post = posts.find(p => p.id === id);
                          return post?.category === category;
                        });
                      }
                    }).length;

                    return (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(isSelected ? null : category)}
                        disabled={!isAvailable}
                        className={`
                          flex-shrink-0 relative px-4 py-2 rounded-lg text-sm font-small transition-all duration-200 whitespace-nowrap
                          ${isSelected 
                            ? 'bg-black text-white shadow-md' 
                            : isAvailable 
                              ? 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm hover:shadow-md' 
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }
                        `}
                      >
                        <span className="flex items-center gap-2">
                          {category}
                          {isAvailable && count > 0 && (
                            <span className={`
                              inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-medium
                              ${isSelected ? 'bg-white text-black' : 'bg-gray-200 text-gray-600'}
                            `}>
                              {count}
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
                
                {/* Gradient fade indicators for scroll */}
                <div className="absolute left-0 top-0 bottom-4 w-8 bg-gradient-to-r from-gray-100 to-transparent pointer-events-none"></div>
                <div className="absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-gray-100 to-transparent pointer-events-none"></div>
              </div>
            </div>
          )}

          {loading ? (
            <p className="text-center text-gray-500">Loading…</p>
          ) : posts.length === 0 && rotations.length === 0 ? (
            <p className="text-center text-gray-500">No shared content available.</p>
          ) : (
            <div className="space-y-6">
              {filteredItems.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <svg width="48" height="48" fill="none" viewBox="0 0 24 24" className="mx-auto">
                      <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {selectedCategory ? `No items in ${selectedCategory}` : 'No items found'}
                  </h3>
                  <p className="text-gray-500">
                    {selectedCategory 
                      ? 'Try selecting a different category or clear the filter.'
                      : 'No shared content available.'
                    }
                  </p>
                  {selectedCategory && (
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className="mt-4 text-sm text-gray-600 hover:text-gray-800 underline"
                    >
                      Clear filter
                    </button>
                  )}
                </div>
              ) : (
                filteredItems.map((item) => {
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
                })
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}