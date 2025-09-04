'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HeldObject } from '@/types';
import { subscribeObjects } from '@/lib/firebase-services';
import { Plus, Search, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils';

import { MobileBottomBar } from '@/components/Navigation';

export default function RegistryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [objects, setObjects] = useState<HeldObject[]>([]);
  const [filteredObjects, setFilteredObjects] = useState<HeldObject[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingObjects, setLoadingObjects] = useState(true);
  const [showPublicOnly, setShowPublicOnly] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 9;

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || typeof user.uid !== 'string') return;
    setLoadingObjects(true);
    // Subscribe to real-time updates
    const unsubscribe = subscribeObjects(user.uid, (userObjects) => {
      setObjects(userObjects);
      setLoadingObjects(false);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    filterObjects();
    setPage(1); // Reset to first page on filter change
  }, [objects, searchTerm, showPublicOnly]);

  // loadObjects removed; now handled by subscribeObjects

  const filterObjects = () => {
    let filtered = objects;
    if (searchTerm) {
      filtered = filtered.filter(obj => 
        obj.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        obj.maker?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (Array.isArray(obj.tags) && obj.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
      );
    }
    if (showPublicOnly) {
      filtered = filtered.filter(obj => obj.isPublic);
    }
    setFilteredObjects(filtered);
  };



  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        <MobileBottomBar />
        <div className="held-container held-container-wide py-10">
          {loading || !user ? (
            <div className="py-24">
              <div className="text-center">
                <p className="text-gray-600">Loading...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10">
                <div>
                  <h1 className="text-4xl md:text-5xl font-serif tracking-tight mb-2">Registry</h1>
                  <p className="text-gray-600/90">
                    {objects.length} object{objects.length !== 1 ? 's' : ''} in your collection
                  </p>
                </div>
                <Button asChild className="mt-4 sm:mt-0 shadow-lg">
                  <Link href="/registry/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Object
                  </Link>
                </Button>
              </div>

              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search objects, makers, or tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-12 bg-white/70 backdrop-blur-sm border border-gray-200 shadow-sm"
                  />
                </div>
                <Button
                  variant={showPublicOnly ? "default" : "outline"}
                  onClick={() => setShowPublicOnly(!showPublicOnly)}
                  className="flex items-center h-12"
                >
                  {showPublicOnly ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
                  {showPublicOnly ? 'Public Only' : 'All Objects'}
                </Button>
              </div>

              {/* Objects Grid with Pagination */}
              {loadingObjects ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="rounded-2xl bg-white/50 backdrop-blur-md border border-gray-200/80 shadow-lg p-6 min-h-[390px] flex flex-col justify-between animate-pulse">
                      <div className="aspect-square bg-gray-200/80 rounded-xl mb-4" />
                      <div className="h-6 bg-gray-200/70 rounded w-2/3 mb-2" />
                      <div className="h-4 bg-gray-100/80 rounded w-1/2 mb-4" />
                      <div className="h-4 bg-gray-100/70 rounded w-1/3" />
                    </div>
                  ))}
                </div>
              ) : filteredObjects.length === 0 ? (
                <div className="text-center py-12">
                  <div className="max-w-md mx-auto">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Plus className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No objects found</h3>
                    <p className="text-gray-600 mb-6">
                      {objects.length === 0 
                        ? "Start building your collection by adding your first object."
                        : "Try adjusting your search or filters."
                      }
                    </p>
                    {objects.length === 0 && (
                      <Button asChild>
                        <Link href="/registry/new">Add Your First Object</Link>
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredObjects.slice((page-1)*pageSize, page*pageSize).map((obj) => (
                      <ObjectCard key={obj.id} object={obj} />
                    ))}
                  </div>
                  <div className="flex justify-center mt-8 gap-2">
                    <Button disabled={page === 1} onClick={() => setPage(page-1)} variant="outline">Previous</Button>
                    <span className="px-4 py-2 text-gray-600">Page {page} of {Math.ceil(filteredObjects.length/pageSize)}</span>
                    <Button disabled={page*pageSize >= filteredObjects.length} onClick={() => setPage(page+1)} variant="outline">Next</Button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function ObjectCard({ object }: { object: HeldObject }) {
  return (
    <Link href={`/registry/${object.id}`}>
      <div
        className="relative rounded-3xl bg-white/50 backdrop-blur-xl border border-white/60 ring-1 ring-black/5 shadow-[0_12px_40px_rgba(0,0,0,0.08)] hover:shadow-[0_24px_64px_rgba(0,0,0,0.12)] min-h-[400px] flex flex-col justify-between p-6 md:p-8 transition-all duration-300 hover:scale-[1.02] cursor-pointer overflow-hidden group"
      >
        {/* Subtle top sheen */}
        <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-b from-white/50 to-transparent" />
        {/* Premium/Public Accent */}
        {object.isPublic && (
          <span className="absolute top-4 right-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-[10px] font-semibold px-3 py-1 rounded-full shadow z-10 tracking-wide uppercase">Public</span>
        )}
        {/* Image */}
        <div className="relative aspect-square rounded-2xl mb-6 overflow-hidden flex items-center justify-center border border-white/70 ring-1 ring-black/5 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300">
          {object.images.length > 0 ? (
            <Image
              src={object.images[0]}
              alt={object.title}
              width={256}
              height={256}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              loading="lazy"
              priority={false}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/img/placeholder.svg';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Image src="/img/placeholder.svg" alt="No image" width={48} height={48} className="w-12 h-12 opacity-40" loading="lazy" priority={false} />
            </div>
          )}
        </div>

        {/* Content */}
        <div>
          <h3 className="font-serif text-[22px] md:text-2xl font-semibold mb-1 line-clamp-1 text-gray-900 tracking-tight">{object.title}</h3>
          {object.maker && (
            <p className="text-[15px] text-gray-700/90 mb-3 font-light">{object.maker}</p>
          )}

          {/* Compact chain display */}
          <div className="mt-1 text-xs text-gray-600/90">
            {Array.isArray(object.chain) && object.chain.length > 0 ? (
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-gray-500">Ownership:</span>
                {(object.chain.slice(0, 2)).map((owner, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded-full bg-white/70 border border-white/60 ring-1 ring-black/5 font-mono text-[11px] text-gray-800">
                    {owner.owner || 'Unknown'}
                  </span>
                ))}
                {object.chain.length > 2 && (
                  <span className="px-2 py-0.5 rounded-full bg-white/70 border border-white/60 ring-1 ring-black/5 font-mono text-[11px] text-gray-700">+{object.chain.length - 2} more</span>
                )}
              </div>
            ) : (
              <span className="text-gray-400 italic">No chain of ownership</span>
            )}
          </div>

          {/* Meta row */}
          <div className="flex items-center justify-between text-sm mt-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-white/70 border border-white/60 ring-1 ring-black/5 font-mono text-[12px] text-gray-800">
                {object.year && !isNaN(object.year) ? `${object.year}` : 'Year N/A'}
              </span>
              {typeof object.value !== 'undefined' && (
                <span className="px-2.5 py-1 rounded-full bg-white/70 border border-white/60 ring-1 ring-black/5 font-mono text-[12px] text-emerald-700">
                  {isNaN(object.value) ? 'Value N/A' : formatCurrency(object.value)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              {object.isPublic ? (
                <span className="inline-flex items-center gap-1 text-blue-600"><Eye className="h-4 w-4" /> Public</span>
              ) : (
                <span className="inline-flex items-center gap-1 text-gray-400"><EyeOff className="h-4 w-4" /> Private</span>
              )}
            </div>
          </div>

          {/* Tags */}
          {Array.isArray(object.tags) && object.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {object.tags.slice(0, 4).map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-white/70 text-xs text-gray-800 rounded-full border border-white/60 ring-1 ring-black/5 font-mono"
                >
                  #{tag}
                </span>
              ))}
              {object.tags.length > 4 && (
                <span className="px-3 py-1 bg-white/70 text-xs text-gray-800 rounded-full border border-white/60 ring-1 ring-black/5 font-mono">
                  +{object.tags.length - 4}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
