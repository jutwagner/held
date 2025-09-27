'use client';
import Image from 'next/image';

import { useEffect, useState } from 'react';
import { getFirestore } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getObject, getRotation, subscribeRotations, updateRotation, subscribeObjects } from '@/lib/firebase-services';
import { useAuth, isHeldPlus } from '@/contexts/AuthContext';
import Switch from '@/components/ui/switch';
import { HeldObject } from '@/types';
import type { RotationWithObjects } from '@/types';

// Firebase configuration (replace with your actual config)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// db is not used

function RotationPageClient({ id }: { id: string }) {
  const [rotation, setRotation] = useState<RotationWithObjects | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [objects, setObjects] = useState<HeldObject[]>([]);
  const [allObjects, setAllObjects] = useState<HeldObject[]>([]);
  const [editing, setEditing] = useState(false);
  const [selectionError, setSelectionError] = useState<string>('');
  const [form, setForm] = useState<{ name: string; description?: string; isPublic: boolean; objectIds: string[] }>({ name: '', description: '', isPublic: false, objectIds: [] });
  // Get current user from AuthContext
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!id || authLoading) return; // Wait for auth to be ready
    setLoading(true);
    async function fetchRotation() {
      try {
        const rot = await getRotation(id);
        if (!rot) {
          setError('Rotation not found');
          setLoading(false);
          return;
        }
        // If public, show it
        if (rot.isPublic === true) {
          setRotation({ ...rot, objects: [] });
          setForm({ name: rot.name || '', description: rot.description || '', isPublic: !!rot.isPublic, objectIds: Array.isArray((rot as any).objectIds) ? (rot as any).objectIds : [] });
          setLoading(false);
          return;
        }
        // If user owns it, subscribe for updates
        if (user && rot.userId === user.uid) {
          const unsubscribe = subscribeRotations(user.uid, (rots) => {
            const ownedRot = rots.find(r => r.id === id);
            if (ownedRot) {
              setRotation({ ...ownedRot, objects: [] });
              setForm({ name: ownedRot.name || '', description: ownedRot.description || '', isPublic: !!ownedRot.isPublic, objectIds: Array.isArray((ownedRot as any).objectIds) ? (ownedRot as any).objectIds : [] });
            } else {
              setError('Rotation not found');
            }
            setLoading(false);
          });
          return () => unsubscribe();
        } else {
          setError('You do not have permission to view this rotation');
          setLoading(false);
        }
      } catch (err) {
        setError('Error loading rotation');
        setLoading(false);
      }
    }
    fetchRotation();
  }, [id, user, authLoading]);

  useEffect(() => {
    const fetchObjects = async () => {
      if (Array.isArray(rotation?.objectIds)) {
        const fetchedObjects = await Promise.all(
          rotation.objectIds.map(async (id: string) => {
            const object = await getObject(id);
            return object;
          })
        );
        setObjects(fetchedObjects.filter((obj: HeldObject | null): obj is HeldObject => obj !== null));
      }
    };

    fetchObjects();
  }, [rotation?.objectIds]);

  // Load all user's objects for adding/removing when editing
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeObjects(user.uid, (list) => setAllObjects(list));
    return () => { if (typeof unsub === 'function') unsub(); };
  }, [user?.uid]);

  const canEdit = !!user && !!rotation && rotation.userId === user.uid && isHeldPlus(user);

  const toggleObject = (objectId: string) => {
    setForm(prev => {
      const isSelected = prev.objectIds.includes(objectId);
      if (isSelected) {
        setSelectionError('');
        return { ...prev, objectIds: prev.objectIds.filter(id => id !== objectId) };
      }
      if (prev.objectIds.length >= 7) {
        setSelectionError('You can only select up to 7 objects per rotation');
        return prev;
      }
      setSelectionError('');
      return { ...prev, objectIds: [...prev.objectIds, objectId] };
    });
  };

  async function saveEdits() {
    if (!rotation || !user) return;
    try {
      await updateRotation(rotation.id, { id: rotation.id, name: form.name, description: form.description, isPublic: form.isPublic, objectIds: form.objectIds });
      const updated = await getRotation(rotation.id);
      if (updated) setRotation({ ...(updated as any), objects });
      setEditing(false);
    } catch (e) {
      console.error('Failed to update rotation', e);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 animate-pulse">
        <header className="top-0 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur shadow-sm">
          <div className="held-container held-container-wide py-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-4">
                {[...Array(5)].map((_, idx) => (
                  <div key={idx} className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 dark:bg-gray-700 border-2 border-white dark:border-gray-800 shadow" />
                ))}
              </div>
              <div>
                <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 dark:bg-gray-700 rounded mb-2" />
                <div className="h-4 w-64 bg-gray-100 dark:bg-gray-600 dark:bg-gray-600 rounded" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full text-xs font-mono">&nbsp;</span>
            </div>
          </div>
        </header>
        <nav className="sticky top-25 z-20 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b border-gray-100 dark:border-gray-800 py-2 flex justify-center overflow-hidden px-4">
          {[...Array(5)].map((_, idx) => (
            <div 
              key={idx} 
              className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-blue-200 dark:border-blue-800 shadow flex-shrink-0" 
              style={{ 
                marginLeft: idx > 0 ? '-8px' : '0',
                aspectRatio: '1'
              }}
            />
          ))}
        </nav>
        <main className="held-container held-container-wide py-12">
          <div className="flex flex-col gap-16">
            {[...Array(2)].map((_, index) => (
              <section key={index} className="flex flex-col md:flex-row gap-8 items-center border-b border-gray-200 dark:border-gray-700 pb-16 scroll-mt-32">
                <div className="flex-shrink-0 w-full md:w-2/3 lg:w-1/2">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 flex flex-col items-center justify-center">
                    <div className="w-full max-w-3xl h-64 bg-gray-200 dark:bg-gray-700 dark:bg-gray-700 rounded-xl" />
                  </div>
                </div>
                <div className="flex-1 flex flex-col justify-center items-start w-full">
                  <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 dark:bg-gray-700 rounded mb-2" />
                  <div className="h-4 w-32 bg-gray-100 dark:bg-gray-600 dark:bg-gray-600 rounded mb-1" />
                  <div className="h-4 w-24 bg-gray-100 dark:bg-gray-600 dark:bg-gray-600 rounded mb-2" />
                  <div className="h-4 w-80 bg-gray-100 dark:bg-gray-600 dark:bg-gray-600 rounded mt-2" />
                  <div className="flex flex-wrap gap-2 mt-3">
                    {[...Array(4)].map((_, i) => (
                      <span key={i} className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full text-xs font-mono shadow">&nbsp;</span>
                    ))}
                  </div>
                </div>
              </section>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (!rotation) {
    return <p>No rotation data available</p>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      {/* Sticky Group Header */}
      <header className="top-0 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur shadow-sm relative overflow-hidden">
        {editing && (
          <div className="sticky top-0 z-40">
            <div className="bg-black dark:bg-gray-800 text-white px-6 sm:px-8 py-3 flex items-center justify-between">
              <div className="text-sm font-medium tracking-wide uppercase">Editing Rotation</div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 rounded bg-white dark:bg-gray-100 dark:bg-gray-600 text-black dark:text-gray-900 dark:text-gray-100 text-xs" onClick={() => setEditing(false)}>Cancel</button>
                <button className="px-3 py-1 rounded bg-white dark:bg-gray-100 dark:bg-gray-600 text-black dark:text-gray-900 dark:text-gray-100 text-xs" onClick={saveEdits}>Save</button>
              </div>
            </div>
          </div>
        )}




        {/* Cover Image Background - Integrated into header */}
        {rotation.coverImage && (
          <div className="absolute inset-0 z-0">
            <Image
              src={rotation.coverImage}
              alt="Rotation cover"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm" />
          </div>
        )}






        {/* Enhanced Header with Better Visual Hierarchy */}
        <div className="held-container held-container-wide py-8 relative z-10">
          <div className="flex flex-col gap-6">
            {/* Title and Description */}
            <div className="text-center md:text-left">
              {!editing ? (
                <>
                  <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-3 leading-tight">
                    {rotation.name || 'Unnamed Rotation'}
                  </h1>
                  <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
                    {rotation.description || 'No description available'}
                  </p>
                </>
              ) : (
                <div className="flex flex-col gap-4 max-w-2xl">
                  <input
                    className="border-0 border-b-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 outline-none bg-transparent text-4xl md:text-5xl font-serif font-bold tracking-tight w-full text-gray-900 dark:text-gray-100 pb-2"
                    value={form.name}
                    onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                    maxLength={80}
                    placeholder="Rotation name"
                  />
                  <textarea
                    className="border-0 border-b-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 outline-none bg-transparent w-full text-lg text-gray-700 dark:text-gray-300 pb-2 resize-none"
                    value={form.description || ''}
                    onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    placeholder="Add a description..."
                  />
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-700 dark:text-gray-300">Visibility:</span>
                    <div className="flex items-center gap-2">
                      <span className={`${form.isPublic ? 'text-gray-400' : 'text-gray-900 dark:text-gray-100 font-medium'}`}>Private</span>
                      <Switch checked={form.isPublic} onCheckedChange={(checked) => setForm(prev => ({ ...prev, isPublic: checked }))} />
                      <span className={`${form.isPublic ? 'text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-400'}`}>Public</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Stats and Actions Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {objects.length} {objects.length === 1 ? 'Object' : 'Objects'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {rotation.isPublic ? 'Public' : 'Private'}
                  </span>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                {canEdit && !editing && (
                  <button 
                    className="px-4 py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors shadow-sm"
                    onClick={() => setEditing(true)}
                  >
                    Edit Rotation
                  </button>
                )}
                {canEdit && editing && (
                  <div className="flex items-center gap-2">
                    <button 
                      className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => setEditing(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors shadow-sm"
                      onClick={saveEdits}
                    >
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Editing: Select Objects to include */}
      {editing && canEdit && (
        <div className="held-container held-container-wide mt-4">
          <div className="held-card p-6">
            <div className="flex items-baseline justify-between mb-2">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 dark:text-gray-100">Select Objects</h2>
              <span className="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-400">{form.objectIds.length}/7 selected</span>
            </div>
            {selectionError && (
              <div className="p-2 mb-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-400">{selectionError}</div>
            )}
            {allObjects.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400">You have no registry items yet. Add some in your registry.</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {allObjects.map(obj => {
                  const selected = form.objectIds.includes(obj.id);
                  return (
                    <button
                      key={obj.id}
                      type="button"
                      onClick={() => toggleObject(obj.id)}
                      className={`w-full text-left p-3 rounded border transition-colors flex items-center gap-3 ${selected ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden flex-shrink-0">
                        {obj.images?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={obj.images[0]} alt={obj.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">?</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{obj.title}</div>
                        {obj.maker && <div className="text-xs text-gray-500 truncate">{obj.maker}</div>}
                      </div>
                      {selected && (
                        <span className="text-xs px-2 py-1 rounded bg-gray-900 text-white">Selected</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Enhanced Object Navigation */}
      <nav className="sticky top-4rem z-20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 py-4 shadow-sm">
        <div className="held-container held-container-wide">
          <div className="flex items-center justify-center  px-4">
            {objects.map((object, idx) => (
              <button
                key={idx}
                onClick={() => {
                  const el = document.getElementById(`object-${idx}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className=" overflow-hidden w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-white dark:border-gray-600 shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-200 bg-white flex-shrink-0"
                style={{ 
                  marginLeft: idx > 0 ? '-8px' : '0',
                  aspectRatio: '1',
                  zIndex: 10 - idx
                }}
                title={object.title}
              >
                <Image 
                  src={object.images?.[0] || '/img/placeholder.svg'} 
                  alt={object.title} 
                  width={80} 
                  height={80} 
                  className="w-full h-full object-cover" 
                />
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="held-container held-container-wide py-12">
        {/* Deep dive into each object */}
        <div className="flex flex-col gap-16">
          {objects.map((object, index) => (
            <section id={`object-${index}`} key={index} className="flex flex-col md:flex-row gap-8 items-center border-b pb-16 scroll-mt-32">
              <div className="flex-shrink-0 w-full md:w-2/3 lg:w-1/2">
                <div className="bg-white rounded-xl shadow-sm flex flex-col items-center justify-center transition-all duration-300 hover:shadow-2xl">
                  <Image
                    src={object.images[0] || '/placeholder.png'}
                    alt={object.title}
                    width={640}
                    height={480}
                    className="w-full max-w-3xl rounded-xl object-contain"
                  />
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-center items-start w-full">
                <h3 className="text-3xl font-serif font-semibold mb-2 text-gray-900 dark:text-gray-100 tracking-tight">{object.title}</h3>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-1 font-mono">{object.maker || <span className="italic text-gray-400">Unknown Maker</span>}</p>
                <p className="text-base text-gray-500 mb-2 font-mono">{object.year || <span className="italic text-gray-400">Year Unknown</span>}</p>
                {object.notes && <p className="text-base text-gray-700 dark:text-gray-300 mt-2 whitespace-pre-line font-sans leading-relaxed">{object.notes}</p>}
                {Array.isArray(object.tags) && object.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {object.tags.slice(0, 6).map((tag, i) => (
                      <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-mono shadow">{tag}</span>
                    ))}
                    {object.tags.length > 6 && (
                      <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs font-mono">+{object.tags.length - 6} more</span>
                    )}
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}

export default RotationPageClient;
