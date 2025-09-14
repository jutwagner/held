'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HeldObject } from '@/types';
import { subscribeObjects, updateObjectAnchoring } from '@/lib/firebase-services';
import { anchorPassport, generatePassportURI } from '@/lib/blockchain-services';
import { Plus, Search, Eye, EyeOff, List, Columns, CheckCircle, Clock, Shield, Edit2, Save, X as XIcon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils';
import { debounce } from '@/lib/performance';

import { MobileBottomBar } from '@/components/Navigation';

export default function RegistryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [objects, setObjects] = useState<HeldObject[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingObjects, setLoadingObjects] = useState(true);
  const [showPublicOnly, setShowPublicOnly] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 9;
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [anchoringFilter, setAnchoringFilter] = useState<'all' | 'anchored' | 'pending' | 'not'>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [bulkBusy, setBulkBusy] = useState(false);
  const [showDocs, setShowDocs] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || typeof user.uid !== 'string') return;
    setLoadingObjects(true);
    // Subscribe to real-time updates with limit for better performance
    const unsubscribe = subscribeObjects(user.uid, (userObjects) => {
      setObjects(userObjects);
      setLoadingObjects(false);
    }, 100); // Limit to 100 objects initially
    return () => unsubscribe();
  }, [user]);

  // Debounced search to avoid excessive filtering
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      setSearchTerm(term);
    }, 300),
    []
  );

  // Memoized filtering for better performance
  const filteredObjects = useMemo(() => {
    let filtered = objects;

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(obj => 
        obj.title?.toLowerCase().includes(term) ||
        obj.maker?.toLowerCase().includes(term) ||
        obj.tags?.some(tag => tag.toLowerCase().includes(term))
      );
    }

    // Apply public filter
    if (showPublicOnly) {
      filtered = filtered.filter(obj => obj.isPublic);
    }

    // Apply anchoring filter
    if (anchoringFilter !== 'all') {
      filtered = filtered.filter(obj => {
        const anchored = !!obj.anchoring?.isAnchored;
        const pending = !!obj.anchoring?.txHash && !anchored;
        switch (anchoringFilter) {
          case 'anchored':
            return anchored;
          case 'pending':
            return pending;
          case 'not':
            return !anchored && !pending;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [objects, searchTerm, showPublicOnly, anchoringFilter]);

  useEffect(() => {
    setPage(1); // Reset to first page on filter change
  }, [searchTerm, showPublicOnly, anchoringFilter]);

  // loadObjects removed; now handled by subscribeObjects

  // Pagination for filtered objects
  const paginatedObjects = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return filteredObjects.slice(startIndex, startIndex + pageSize);
  }, [filteredObjects, page, pageSize]);

  const toggleSelection = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const startEdit = (obj: HeldObject) => {
    setEditingId(obj.id);
    setEditingTitle(obj.title);
  };

  const saveEdit = async (obj: HeldObject) => {
    try {
      await import('@/lib/firebase-services').then(mod => mod.updateObject(obj.id, { ...obj, title: editingTitle } as any));
      setEditingId(null);
    } catch (e) {
      console.error('Inline save failed', e);
    }
  };

  const anchorSelectedBasic = async () => {
    if (!user) return;
    setBulkBusy(true);
    try {
      const baseURL = window.location.origin;
      const tasks = Array.from(selected).map(async id => {
        const obj = objects.find(o => o.id === id);
        if (!obj) return;
        const uri = generatePassportURI(obj as any, baseURL);
        const version = (obj.anchoring?.version || 0) + 1 || 1;
        const res = await anchorPassport(obj as any, uri, version, 'core', 'async');
        await updateObjectAnchoring(obj.id, {
          isAnchored: false,
          version,
          txHash: res.txHash,
          digest: res.digest,
          uri,
        } as any);
      });
      await Promise.all(tasks);
      clearSelection();
    } catch (e) {
      console.error('Bulk anchor failed', e);
    } finally {
      setBulkBusy(false);
    }
  };

  const runWorker = async () => {
    try { await fetch('/api/anchor/worker'); } catch {}
  };



  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <MobileBottomBar />
        <div className="held-container held-container-wide py-10">
          {loading || !user ? (
            <div className="py-24">
                <div className="text-center">
                <p className="text-gray-600 dark:text-gray-300">Loading...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex  sm:flex-row justify-between items-start sm:items-center mb-10">
                <div>
                  <h1 className="text-4xl md:text-5xl font-serif tracking-tight mb-2 text-gray-900 dark:text-gray-100">Registry</h1>
                  <p className="text-gray-600/90 dark:text-gray-300/90">
                    {objects.length} object{objects.length !== 1 ? 's' : ''} in your collection
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-4 sm:mt-0">
                  <Button
                    variant={view === 'grid' ? 'default' : 'outline'}
                    onClick={() => setView('grid')}
                    title="Grid view"
                    className={view === 'grid' ? 'bg-gray-600 dark:bg-gray-400 text-white hover:bg-gray-700 dark:hover:bg-gray-300 border-transparent' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}
                  >
                    <Columns className="h-4 w-3 text-current" />
                  </Button>
                  <Button 
                  variant={view === 'table' ? 'default' : 'outline'} 
                  onClick={() => setView('table')} 
                  title="Table view"
                  className={view === 'table' ? 'bg-gray-600 dark:bg-gray-400 text-white hover:bg-gray-700 dark:hover:bg-gray-300 border-transparent' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}
                  >
                    <List className="h-4 w-3 text-current" />
                  </Button>
                  <Button asChild className="shadow-lg">
                    <Link href="/registry/new">
                      <Plus className="h-4 w-4 text-current" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <Input
                    placeholder="Search objects, makers, or tags..."
                    defaultValue={searchTerm}
                    onChange={(e) => debouncedSearch(e.target.value)}
                    className="pl-10 h-12 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-sm text-gray-900 dark:text-gray-100"
                  />
                </div>
                <Button
                  variant={showPublicOnly ? "default" : "outline"}
                  onClick={() => setShowPublicOnly(!showPublicOnly)}
                  className={`flex items-center h-12 ${
                    showPublicOnly 
                      ? 'bg-gray-600 dark:bg-gray-400 text-white hover:bg-gray-700 dark:hover:bg-gray-300' 
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {showPublicOnly ? 'Public Only' : 'All Objects'}
                </Button>
                </div>
                {/*
                <select
                  value={anchoringFilter}
                  onChange={(e) => setAnchoringFilter(e.target.value as any)}
                  className="h-12 border border-gray-200 bg-white px-3"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="anchored">Anchored</option>
                  <option value="not">Not Anchored</option>
                </select>
              

              {/* Status board * /}
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                {(() => {
                  const anchored = objects.filter(o => o.anchoring?.isAnchored).length;
                  const pending = objects.filter(o => !!o.anchoring?.txHash && !o.anchoring?.isAnchored).length;
                  const not = objects.length - anchored - pending;
                  return (
                    <>
                      <StatusCard label="Anchored" value={anchored} icon={CheckCircle} />
                      <StatusCard label="Pending" value={pending} icon={Clock} />
                      <StatusCard label="Not Anchored" value={not} icon={Shield} />
                       <div className="border border-gray-200 p-4 bg-white flex items-center justify-between">
                        <div>
                          <div className="text-sm text-gray-600">Anchoring Queue</div>
                          <div className="text-xs text-gray-500">Run worker to finalize pending</div>
                        </div>
                        <Button variant="outline" onClick={runWorker}>Run Now</Button>
                      </div>
                    </>
                  );
                })()}
              </div>
             
              {/* Documents manager toggle * /}
              <div className="flex items-center justify-between mb-6">
                <div className="text-sm text-gray-600">Documents Manager</div>
                <Button variant="outline" onClick={() => setShowDocs(!showDocs)}>{showDocs ? 'Hide' : 'Show'} Documents</Button>
              </div>
              {showDocs && <DocumentsManager objects={objects} />}

              {/* Bulk actions bar * /}
              {selected.size > 0 && (
                <div className="flex items-center justify-between border border-gray-200 bg-white p-3 mb-4">
                  <div className="text-sm text-gray-700">{selected.size} selected</div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={clearSelection}>Clear</Button>
                    <Button onClick={anchorSelectedBasic} disabled={bulkBusy}>{bulkBusy ? 'Anchoring...' : 'Anchor Basic'}</Button>
                  </div>
                </div>
              )}
*/}
              {/* Objects Grid with Pagination */}
              {loadingObjects ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-md border border-gray-200/80 dark:border-gray-700/80 shadow-lg p-6 min-h-[390px] flex flex-col justify-between animate-pulse">
                      <div className="aspect-square bg-gray-200/80 dark:bg-gray-700/80 rounded-xl mb-4" />
                      <div className="h-6 bg-gray-200/70 dark:bg-gray-700/70 rounded w-2/3 mb-2" />
                      <div className="h-4 bg-gray-100/80 dark:bg-gray-600/80 rounded w-1/2 mb-4" />
                      <div className="h-4 bg-gray-100/70 dark:bg-gray-600/70 rounded w-1/3" />
                    </div>
                  ))}
                </div>
              ) : filteredObjects.length === 0 ? (
                <div className="text-center py-12">
                  <div className="max-w-md mx-auto">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Plus className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">No objects found</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
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
                  {view === 'grid' ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {paginatedObjects.map((obj) => (
                          <div key={obj.id}>
                            <div className="flex items-center gap-2 mb-2">
                              {/* <input type="checkbox" checked={selected.has(obj.id)} onChange={() => toggleSelection(obj.id)} />
                             <Link href={`/registry/${obj.id}`} className="text-sm text-gray-600 underline">Edit</Link>*/}
                            </div>
                            <ObjectCard object={obj} />
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-center mt-8 gap-2">
                        <Button disabled={page === 1} onClick={() => setPage(page-1)} variant="outline">Previous</Button>
                        <span className="px-4 py-2 text-gray-600 dark:text-gray-300">Page {page} of {Math.ceil(filteredObjects.length/pageSize)}</span>
                        <Button disabled={page*pageSize >= filteredObjects.length} onClick={() => setPage(page+1)} variant="outline">Next</Button>
                      </div>
                    </>
                  ) : (
                    <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr className="text-left">
                            <th className="p-3"><input type="checkbox" onChange={(e) => {
                              if (e.target.checked) setSelected(new Set(paginatedObjects.map(o => o.id))); else clearSelection();
                            }} /></th>
                            <th className="p-3">Title</th>
                            <th className="p-3">Category</th>
                            <th className="p-3">Visibility</th>
                            <th className="p-3">Anchoring</th>
                            <th className="p-3">Prov.</th>
                            <th className="p-3">Updated</th>
                            <th className="p-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedObjects.map(obj => {
                            const anchored = !!obj.anchoring?.isAnchored;
                            const pending = !!obj.anchoring?.txHash && !anchored;
                            const prov = getProvenanceScore(obj);
                            return (
                              <tr key={obj.id} className="border-t border-gray-200 dark:border-gray-600">
                                <td className="p-3 align-top"><input type="checkbox" checked={selected.has(obj.id)} onChange={() => toggleSelection(obj.id)} /></td>
                                <td className="p-3 align-top">
                                  {editingId === obj.id ? (
                                    <div className="flex items-center gap-2">
                                      <input value={editingTitle} onChange={e => setEditingTitle(e.target.value)} className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2 py-1 w-full" />
                                      <button onClick={() => saveEdit(obj)} title="Save"><Save className="h-4 w-4" /></button>
                                      <button onClick={() => setEditingId(null)} title="Cancel"><XIcon className="h-4 w-4" /></button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-gray-900 dark:text-gray-100">{obj.title}</span>
                                      <button onClick={() => startEdit(obj)} title="Edit"><Edit2 className="h-3.5 w-3.5 text-gray-500" /></button>
                                    </div>
                                  )}
                                </td>
                                <td className="p-3 align-top text-gray-900 dark:text-gray-100">{obj.category || '-'}</td>
                                <td className="p-3 align-top text-gray-900 dark:text-gray-100">{obj.isPublic ? 'Public' : 'Private'}</td>
                                <td className="p-3 align-top">
                                  {anchored ? (
                                    <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle className="h-4 w-4" /> Anchored</span>
                                  ) : pending ? (
                                    <span className="inline-flex items-center gap-1 text-amber-700"><Clock className="h-4 w-4" /> Pending</span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-gray-500"><Shield className="h-4 w-4" /> Not Anchored</span>
                                  )}
                                </td>
                                <td className="p-3 align-top text-gray-900 dark:text-gray-100">{prov}%</td>
                                <td className="p-3 align-top text-gray-900 dark:text-gray-100">{obj.updatedAt ? new Date((obj.updatedAt as any).seconds ? (obj.updatedAt as any).seconds * 1000 : obj.updatedAt).toLocaleDateString() : '-'}</td>
                                <td className="p-3 align-top">
                                  <Link href={`/registry/${obj.id}`} className="text-blue-600 dark:text-blue-400 underline">Open</Link>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
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
        className="relative rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl border border-white/60 dark:border-gray-700/60 ring-1 ring-black/5 dark:ring-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.3)] hover:shadow-[0_24px_64px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_24px_64px_rgba(0,0,0,0.4)] h-[540px] md:h-[560px] flex flex-col transition-transform duration-300 hover:scale-[1.02] cursor-pointer group"
      >
        {/* Subtle top sheen */}
        <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-b from-white/50 dark:from-gray-800/50 to-transparent" />
        {/* Premium/Public Accent */}
        {object.isPublic && (
          <span className="absolute top-4 right-4 bg-gradient-to-r from-green-500 to-green-300 text-white text-[10px] font-semibold px-3 py-1 rounded-full shadow z-10 tracking-wide uppercase">Public</span>
        )}
        {/* Image */}
        <div className="relative aspect-square rounded-2xl overflow-hidden flex items-center 
        justify-center border border-white/70 dark:border-gray-700/70 ring-1 ring-black/5 dark:ring-white/5 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 dark:from-gray-700 dark:via-gray-600 dark:to-gray-500
        registry-item-image
        ">
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
            <div className="w-full h-full flex items-center justify-center ">
              <Image src="/img/placeholder.svg" alt="No image" width={48} height={48} className="w-12 h-12 opacity-40" loading="lazy" priority={false} />
            </div>
          )}
        </div>

        {/* Content */}
        <div className='p-5 md:p-6 flex-1 flex flex-col'>
          <h3 className="font-serif text-[22px] md:text-2xl font-semibold mb-1 line-clamp-1 text-gray-900 dark:text-gray-100 tracking-tight">{object.title}</h3>
          {object.maker ? (
            <p className="text-[15px] text-gray-700/90 dark:text-gray-300/90 mb-3 font-light">{object.maker}</p>
          ) : (
            <div className="h-5 mb-3" />
          )}

          {/* Compact chain display */}
          <div className="mt-1 text-xs text-gray-600/90 dark:text-gray-400/90">
            {Array.isArray(object.chain) && object.chain.length > 0 ? (
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-gray-500 dark:text-gray-400">Ownership:</span>
                {(object.chain.slice(0, 2)).map((owner, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded-full bg-white/70 dark:bg-gray-700/70 border border-white/60 dark:border-gray-600/60 ring-1 ring-black/5 dark:ring-white/5 font-mono text-[11px] text-gray-800 dark:text-gray-200">
                    {owner.owner || 'Unknown'}
                  </span>
                ))}
                {object.chain.length > 2 && (
                  <span className="px-2 py-0.5 rounded-full bg-white/70 dark:bg-gray-700/70 border border-white/60 dark:border-gray-600/60 ring-1 ring-black/5 dark:ring-white/5 font-mono text-[11px] text-gray-700 dark:text-gray-300">+{object.chain.length - 2} more</span>
                )}
              </div>
            ) : (
              <span className="text-gray-400 dark:text-gray-500 italic">No chain of ownership</span>
            )}
          </div>

        {/* Meta row */}
        <div className="flex items-center justify-between text-sm mt-4">
          <div className="flex items-center gap-2 border-none ">
            <span className="px-2.5 ring-1 ring-black/5 dark:ring-white/5 font-mono text-[12px] text-gray-800 dark:text-gray-200">
              {object.year && !isNaN(object.year) ? `${object.year}` : 'Year N/A'}
            </span>
            {typeof object.value !== 'undefined' && (
              <span className="px-2.5  ring-1 ring-black/5 dark:ring-white/5 border-none font-mono text-[12px] text-emerald-700 dark:text-emerald-400">
                {isNaN(object.value) ? 'Value N/A' : formatCurrency(object.value)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 border-none ext-gray-500">
            {object.isPublic ? (
              <span></span>
            ) : (
              <span className="inline-flex items-center gap-1 text-gray-400 dark:text-gray-500"><EyeOff className="h-4 w-4" /> Private</span>
            )}
          </div>
        </div>


          {/* Tags 
          <div className="mt-auto">
            {Array.isArray(object.tags) && object.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4 max-h-12 overflow-hidden">
                {object.tags.slice(0, 6).map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-white/70 text-xs text-gray-800 rounded-full border border-white/60 ring-1 ring-black/5 font-mono"
                  >
                    #{tag}
                  </span>
                ))}
                {object.tags.length > 6 && (
                  <span className="px-3 py-1 bg-white/70 text-xs text-gray-800 rounded-full border border-white/60 ring-1 ring-black/5 font-mono">
                    +{object.tags.length - 6}
                  </span>
                )}
              </div>
            )}
          </div>

*/}




        {/* Provenance completeness */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
            <span>Provenance</span>
            <span className="font-mono">{getProvenanceScore(object)}%</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-900 dark:bg-gray-100"
              style={{ width: `${getProvenanceScore(object)}%` }}
            />
          </div>
        </div>




        </div>
      </div>
    </Link>
  );
}

function StatusCard({ label, value, icon: Icon }: { label: string; value: number; icon: any }) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800 flex items-center justify-between">
      <div>
        <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
        <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{value}</div>
      </div>
      <Icon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
    </div>
  );
}

function DocumentsManager({ objects }: { objects: HeldObject[] }) {
  const docs = new Map<string, string[]>();
  for (const o of objects) {
    const url = o.certificateOfAuthenticity;
    if (url && typeof url === 'string') {
      const arr = docs.get(url) || [];
      arr.push(o.title);
      docs.set(url, arr);
    }
  }
  if (docs.size === 0) {
    return (
      <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 mb-8 text-sm text-gray-600 dark:text-gray-400">No documents found.</div>
    );
  }
  return (
    <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 mb-8">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr className="text-left">
            <th className="p-3 text-gray-900 dark:text-gray-100">Document</th>
            <th className="p-3 text-gray-900 dark:text-gray-100">Used By</th>
          </tr>
        </thead>
        <tbody>
          {Array.from(docs.entries()).map(([url, titles]) => (
            <tr key={url} className="border-t border-gray-200 dark:border-gray-600">
              <td className="p-3 align-top">
                <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline break-all">{url}</a>
              </td>
              <td className="p-3 align-top">
                <div className="flex flex-wrap gap-2">
                  {titles.map((t, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full bg-white/70 dark:bg-gray-700/70 border border-white/60 dark:border-gray-600/60 ring-1 ring-black/5 dark:ring-white/5 text-xs text-gray-800 dark:text-gray-200">{t}</span>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getProvenanceScore(o: HeldObject): number {
  let score = 0;
  let total = 4;
  if (o.serialNumber) score++;
  if (o.certificateOfAuthenticity) score++;
  if (Array.isArray(o.chain) && o.chain.length > 0) score++;
  if (o.acquisitionDate) score++;
  return Math.round((score / total) * 100);
}
