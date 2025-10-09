'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HeldObject } from '@/types';
import { subscribeObjects, updateObjectAnchoring } from '@/lib/firebase-services';
import { anchorPassport, generatePassportURI } from '@/lib/blockchain-services';
import { Plus, Search, Eye, EyeOff, List, Clock, Shield, Edit2, Save, X as XIcon, ChevronUp, ChevronDown } from 'lucide-react';
import AnchorIcon from '@/components/AnchorIcon';
import Link from 'next/link';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils';
import { debounce } from '@/lib/performance';
import TagList from '@/components/TagList';
import SleekObjectCard from '@/components/SleekObjectCard';

import { MobileBottomBar } from '@/components/Navigation';

function getProvenanceScore(o: HeldObject): number {
  let score = 0;
  let total = 4;
  if (o.serialNumber) score++;
  if (o.certificateOfAuthenticity) score++;
  if (Array.isArray(o.chain) && o.chain.length > 0) score++;
  if (o.acquisitionDate) score++;
  return Math.round((score / total) * 100);
}

export default function RegistryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [objects, setObjects] = useState<HeldObject[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingObjects, setLoadingObjects] = useState(true);
  const [showPublicOnly, setShowPublicOnly] = useState(false);
  // Removed pagination - show all objects
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [sortField, setSortField] = useState<'title' | 'category' | 'isPublic' | 'updatedAt' | 'provenance' | 'anchoring'>('updatedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [anchoringFilter, setAnchoringFilter] = useState<'all' | 'anchored' | 'pending' | 'not'>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [bulkBusy, setBulkBusy] = useState(false);
  const [showDocs, setShowDocs] = useState(false);

  // Load view preference from localStorage
  useEffect(() => {
    const savedView = localStorage.getItem('held-registry-view') as 'grid' | 'table';
    if (savedView && (savedView === 'grid' || savedView === 'table')) {
      setView(savedView);
    }
  }, []);

  // Save view preference to localStorage when changed
  const handleViewChange = (newView: 'grid' | 'table') => {
    setView(newView);
    localStorage.setItem('held-registry-view', newView);
  };

  // Handle column sorting
  const handleSort = (field: typeof sortField) => {
    console.log('🎯 HANDLE SORT CLICKED:', field);
    if (sortField === field) {
      const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      console.log('📊 Same field, changing direction to:', newDirection);
      setSortDirection(newDirection);
    } else {
      console.log('🆕 New field:', field, 'setting direction to asc');
      setSortField(field);
      setSortDirection('asc');
    }
  };

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
    }, 1000); // High limit to show all objects
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

    // Apply sorting - create new array to ensure React detects change
    if (sortField !== 'updatedAt' || sortDirection !== 'desc') {
      console.log('🔄 SORTING:', { sortField, sortDirection, objectCount: filtered.length });
    }
    
    const sorted = [...filtered].sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortField) {
        case 'title':
          aVal = (a.title || '').toLowerCase();
          bVal = (b.title || '').toLowerCase();
          break;
        case 'category':
          aVal = (a.category || '').toLowerCase();
          bVal = (b.category || '').toLowerCase();
          break;
        case 'isPublic':
          aVal = a.isPublic ? 1 : 0;
          bVal = b.isPublic ? 1 : 0;
          break;
        case 'anchoring':
          const aAnchoringState = a.anchoring?.isAnchored ? 2 : a.anchoring?.txHash ? 1 : 0;
          const bAnchoringState = b.anchoring?.isAnchored ? 2 : b.anchoring?.txHash ? 1 : 0;
          aVal = aAnchoringState;
          bVal = bAnchoringState;
          break;
        case 'updatedAt':
          aVal = a.updatedAt ? (typeof a.updatedAt === 'object' && 'seconds' in a.updatedAt ? a.updatedAt.seconds : new Date(a.updatedAt).getTime()) : 0;
          bVal = b.updatedAt ? (typeof b.updatedAt === 'object' && 'seconds' in b.updatedAt ? b.updatedAt.seconds : new Date(b.updatedAt).getTime()) : 0;
          break;
        case 'provenance':
          aVal = getProvenanceScore(a);
          bVal = getProvenanceScore(b);
          break;
        default:
          return 0;
      }
      
      const result = sortDirection === 'asc' 
        ? (aVal < bVal ? -1 : aVal > bVal ? 1 : 0)
        : (aVal > bVal ? -1 : aVal < bVal ? 1 : 0);
      
      // Debug logging for first few comparisons
      if (filtered.length > 0 && Math.random() < 0.1) {
        console.log(`🔍 COMPARE: "${aVal}" vs "${bVal}" = ${result} (${sortField}, ${sortDirection})`);
      }
      
      return result;
    });

    return sorted;
  }, [objects, searchTerm, showPublicOnly, anchoringFilter, sortField, sortDirection]);

  useEffect(() => {
    // No pagination reset needed
  }, [searchTerm, showPublicOnly, anchoringFilter]);

  // loadObjects removed; now handled by subscribeObjects

  // Show all filtered objects (no pagination)
  const displayedObjects = filteredObjects;

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
    try {
      await fetch('/api/anchor/worker');
    } catch (error) {
      console.error('Failed to trigger anchor worker', error);
    }
  };



  return (
    <>
      <div className="relative min-h-screen">
        <div className="full-bleed min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
          <div className="held-container held-container-wide py-10">
          {loading || !user ? (
            <RegistrySkeleton />
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
                <div className="flex items-center gap-3 mt-4 sm:mt-0">
                  <button
                    type="button"
                    onClick={() => handleViewChange('grid')}
                    title="Grid view"
                    className={`grid-view flex h-12 w-12 items-center justify-center rounded-lg border transition-colors ${
                      view === 'grid'
                        ? 'bg-gray-900 text-white border-transparent shadow-lg dark:bg-gray-100 dark:text-gray-900'
                        : 'bg-transparent border-gray-300 text-gray-500 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'
                    }`}
                    aria-pressed={view === 'grid'}
                  >
                    <Image src="/grid.svg" alt="Grid" width={20} height={20} className={`h-5 w-5 ${
                      view === 'grid'
                        ? 'active'
                        : 'not-active'
                    }`}
                    />
                    <span className="sr-only">Grid view</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleViewChange('table')}
                    title="Table view"
                    className={`list-view flex h-12 w-12 items-center justify-center rounded-lg border transition-colors ${
                      view === 'table'
                        ? 'bg-gray-900 text-white border-transparent shadow-lg dark:bg-gray-100 dark:text-gray-900'
                        : 'bg-transparent border-gray-300 text-gray-500 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'
                    }`}
                    aria-pressed={view === 'table'}
                  >
                    
                    <Image src="/list.svg" alt="Grid" width={20} height={20} className={`h-5 w-5 ${
                      view === 'table'
                        ? 'active'
                        : 'not-active'
                    }`}
                    />
                    <span className="sr-only">Table view</span>
                  </button>
                  <Link
                    href="/registry/new"
                    className="round-full add-cta flex h-12 w-12 items-center justify-center border border-transparent bg-gray-900 text-white shadow-lg transition-colors hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
                    title="Add object"
                  >
                    <Plus className="h-5 w-5" />
                    <span className="sr-only">Add object</span>
                  </Link>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="flex flex-row gap-3 mb-10">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <Input
                    placeholder="Search objects, makers, or tags..."
                    defaultValue={searchTerm}
                    onChange={(e) => debouncedSearch(e.target.value)}
                    className="pl-4 h-12 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-sm text-gray-900 dark:text-gray-100"
                  />
                </div>
                {/*
                <Button
                  variant={showPublicOnly ? "default" : "outline"}
                  onClick={() => setShowPublicOnly(!showPublicOnly)}
                  className={`flex items-center justify-center h-12 w-12 ${
                    showPublicOnly 
                      ? 'bg-gray-600 dark:bg-gray-400 text-white hover:bg-gray-700 dark:hover:bg-gray-300' 
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  title={showPublicOnly ? 'Show All Objects' : 'Show Public Only'}
                >
                  <Image src="/img/Globe.svg" alt="Public" width={20} height={20} className="h-5 w-5" />
                </Button>
                */}
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
                      <StatusCard label="Anchored" value={anchored} icon={AnchorIcon} />
                      <StatusCard label="Pending" value={pending} icon={Clock} />
                      <StatusCard label="Not Anchored" value={not} icon={Shield} />
                       <div className="border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900 flex items-center justify-between">
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">Anchoring Queue</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Run worker to finalize pending</div>
                        </div>
                        <Button variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800" onClick={runWorker}>Run Now</Button>
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
                        {displayedObjects.map((obj) => (
                          <div key={obj.id}>
                            <div className="flex items-center gap-2 mb-2">
                              {/* <input type="checkbox" checked={selected.has(obj.id)} onChange={() => toggleSelection(obj.id)} />
                             <Link href={`/registry/${obj.id}`} className="text-sm text-gray-600 underline">Edit</Link>*/}
                            </div>
                            <SleekObjectCard object={obj} />
                          </div>
                        ))}
                      </div>
                      {/* Pagination removed - showing all objects */}
                    </>
                  ) : (
                    <div className="relative">
                      <div className="overflow-x-auto -mr-4 pr-4 sm:-mr-6 sm:pr-6 lg:-mr-8 lg:pr-8 xl:mr-0 xl:pr-0 border-none">
                        <div className="min-w-[1024px]  backdrop-blur-xl ">
                          <table className="w-full">
                            <thead className="">
                            <tr>
                              <th className="py-4 text-left">
                                <button
                                  onClick={() => handleSort('title')}
                                  className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                                >
                                  Item
                                  {sortField === 'title' && (
                                    sortDirection === 'asc' ? 
                                    <ChevronUp className="h-4 w-4" /> : 
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </button>
                              </th>
                              <th className="px-6 py-4 text-left">
                                <button
                                  onClick={() => handleSort('category')}
                                  className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                                >
                                  Category
                                  {sortField === 'category' && (
                                    sortDirection === 'asc' ? 
                                    <ChevronUp className="h-4 w-4" /> : 
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </button>
                              </th>
                              <th className="px-3 py-4 text-left">
                                <button
                                  onClick={() => handleSort('isPublic')}
                                  className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                                >
                                  Public
                                  {sortField === 'isPublic' && (
                                    sortDirection === 'asc' ? 
                                    <ChevronUp className="h-4 w-4" /> : 
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </button>
                              </th>
                              <th className="px-3 py-4 text-left">
                                <button
                                  onClick={() => handleSort('anchoring')}
                                  className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                                >
                                  Anchor
                                  {sortField === 'anchoring' && (
                                    sortDirection === 'asc'
                                      ? <ChevronUp className="h-4 w-4" />
                                      : <ChevronDown className="h-4 w-4" />
                                  )}
                                </button>
                              </th>
                              <th className="px-3 py-4 text-left">
                                <button
                                  onClick={() => handleSort('provenance')}
                                  className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                                >
                                  Provenance
                                  {sortField === 'provenance' && (
                                    sortDirection === 'asc' ? 
                                    <ChevronUp className="h-4 w-4" /> : 
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </button>
                              </th>
                              <th className="px-3 py-4 text-left">
                                <button
                                  onClick={() => handleSort('updatedAt')}
                                  className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                                >
                                  Date
                                  {sortField === 'updatedAt' && (
                                    sortDirection === 'asc' ? 
                                    <ChevronUp className="h-4 w-4" /> : 
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </button>
                              </th>
                              <th className="py-4 text-left font-semibold text-gray-700 dark:text-gray-200">
                                
                              </th>
                          </tr>
                        </thead>
                          <tbody className="divide-y divide-gray-200/50 dark:divide-gray-600/50">
                            {displayedObjects.map((obj, index) => {
                            const anchored = !!obj.anchoring?.isAnchored;
                            const pending = !!obj.anchoring?.txHash && !anchored;
                            const prov = getProvenanceScore(obj);
                            return (
                                <tr key={`${obj.id}-${sortField}-${sortDirection}-${index}`} className="hover:bg-white/70 dark:hover:bg-gray-700/50 transition-colors">
                                  <td className="py-4">
                                  {editingId === obj.id ? (
                                    <div className="flex items-center gap-2">
                                        <input 
                                          value={editingTitle} 
                                          onChange={e => setEditingTitle(e.target.value)} 
                                          className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-1.5 w-full focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all" 
                                        />
                                        <button 
                                          onClick={() => saveEdit(obj)} 
                                          title="Save"
                                          className="p-1.5 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 transition-colors"
                                        >
                                          <Save className="h-4 w-4" />
                                        </button>
                                        <button 
                                          onClick={() => setEditingId(null)} 
                                          title="Cancel"
                                          className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                                        >
                                          <XIcon className="h-4 w-4" />
                                        </button>
                                      </div>
                                    ) : (
                                      <Link href={`/registry/${obj.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                                        {/* Thumbnail Image */}
                                        <div className="w-14 h-14 shadow-lg rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                                          {obj.images && obj.images.length > 0 ? (
                                            <Image
                                              src={obj.images[0]}
                                              alt={obj.title}
                                              width={50}
                                              height={50}
                                              className="w-full h-full object-cover"
                                              loading="lazy"
                                              onError={(e) => {
                                                e.currentTarget.onerror = null;
                                                e.currentTarget.src = '/img/placeholder.svg';
                                              }}
                                            />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                              <Image 
                                                src="/img/placeholder.svg" 
                                                alt="No image" 
                                                width={20} 
                                                height={20} 
                                                className="w-5 h-5 opacity-40" 
                                              />
                                            </div>
                                          )}
                                        </div>
                                        <span className="font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{obj.title}</span>
                                      </Link>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                                    {obj.category || 'Uncategorized'}
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center justify-center">
                                      {!obj.isPublic && (
                                        <Image
                                          src="/img/lock.svg"
                                          alt="Private"
                                          width={20}
                                          height={20}
                                          className="h-5 w-5"
                                        />
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center justify-center">
                                      {anchored && <AnchorIcon className="h-4 w-4 text-black-300" />}
                                      {!anchored && pending && (
                                        <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                      <div className="h-2 w-16 rounded-full overflow-hidden bg-[#EEEEEE] dark:bg-gray-800">
                                        <div 
                                          className="h-full transition-all duration-300 bg-black dark:bg-gray-100"
                                          style={{ width: `${prov}%` }}
                                        />
                                      </div>
                                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[3rem]">
                                        {prov}%
                                      </span>
                                    </div>
                                </td>
                                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                    {obj.updatedAt ? new Date((obj.updatedAt as any).seconds ? (obj.updatedAt as any).seconds * 1000 : obj.updatedAt).toLocaleDateString() : '-'}
                                </td>
                                  <td className="py-4">
                                    <Link 
                                      href={`/registry/${obj.id}`} 
                                      className="inline-flex items-center px-3 py-1.5 round-full text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                    >
                                      Open
                                    </Link>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        </table>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
      <MobileBottomBar />
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
            ) : ''}
          </div>

        {/* Meta row */}
        <div className="flex items-center justify-between text-sm mt-4">
          <div className="flex items-center gap-2 border-none ">
            
            {object.year && !isNaN(object.year) ? <span className="px-2.5 ring-1 ring-black/5 dark:ring-white/5 font-mono text-[12px] text-gray-800 dark:text-gray-200">${object.year}</span> : ''}
         
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
              <span className="inline-flex items-center gap-1 text-gray-400 dark:text-gray-500">Private</span>
            )}
          </div>
        </div>


        <div className="mt-4">
          {Array.isArray(object.tags) && object.tags.length > 0 && (
            <TagList tags={object.tags} limit={6} size="xs" />
          )}
        </div>




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

function RegistrySkeleton() {
  return (
    <div className="py-10 animate-pulse space-y-10">
      <div className="flex flex-col sm:flex-row justify-between gap-6">
        <div className="space-y-3">
          <div className="h-10 w-48 rounded-lg bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gray-200 dark:bg-gray-700" />
          <div className="h-12 w-12 rounded-xl bg-gray-200 dark:bg-gray-700" />
          <div className="h-12 w-12 rounded-xl bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 h-12 rounded-xl bg-gray-200 dark:bg-gray-700" />
        <div className="h-12 w-12 rounded-xl bg-gray-200 dark:bg-gray-700" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm p-6 space-y-4"
          >
            <div className="h-40 rounded-xl bg-gray-200 dark:bg-gray-800" />
            <div className="h-6 w-3/4 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-800" />
            <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="h-10 w-full rounded-lg bg-gray-200 dark:bg-gray-800" />
          </div>
        ))}
      </div>
    </div>
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
