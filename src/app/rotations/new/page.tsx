'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createRotation, subscribeObjects, subscribeRotations } from '@/lib/firebase-services';
import { CreateRotationData, HeldObject } from '@/types';
import { ArrowLeft, Check, X } from 'lucide-react';
import Link from 'next/link';

export default function NewRotationPage() {
  const [error, setError] = useState<string>('');
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [objects, setObjects] = useState<HeldObject[]>([]);
  const [selectedObjects, setSelectedObjects] = useState<string[]>([]);
  const [rotationCount, setRotationCount] = useState<number>(0);

    const [formData, setFormData] = useState<CreateRotationData>({
      name: '',
      description: '',
      objectIds: [],
      isPublic: false,
    });
    const [coverImageFile, setCoverImageFile] = useState<File | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
const [newItemData, setNewItemData] = useState<{ title: string; category: string; image: File | null }>({ title: '', category: '', image: null });
const [addingItem, setAddingItem] = useState(false);
const categoryOptions = ['Audio','Photography','Art','Industrial Design','Furniture','Lighting','Tech','Instruments','Timepieces','Fashion','Books','Miscellaneous'];

const handleAddNewItem = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!user || typeof user.uid !== 'string') return;
  if (!newItemData.title.trim() || !newItemData.category) return;
  setAddingItem(true);
  try {
    const { createObject } = await import('@/lib/firebase-services');
    const item = await createObject(user.uid, {
      title: newItemData.title,
      category: newItemData.category,
      images: newItemData.image ? [newItemData.image] : [],
      maker: '', year: undefined, value: undefined, condition: 'good', tags: [], notes: '', isPublic: false, shareInCollaborative: false
    });
    setObjects(prev => [...prev, item]);
    setSelectedObjects(prev => [...prev, item.id]);
    setShowAddModal(false);
    setNewItemData({ title: '', category: '', image: null });
  } catch (err) {
    alert('Failed to add item');
  } finally {
    setAddingItem(false);
  }
};


  useEffect(() => {
    if (!user || typeof user.uid !== 'string') return;
    // Subscribe to user's objects
    const unsubscribeObjects = subscribeObjects(user.uid, (objs) => {
      setObjects(objs);
    });
    // Subscribe to user's rotations
    const unsubscribeRotations = subscribeRotations(user.uid, (rots) => {
      setRotationCount(rots.length);
    });
    return () => {
      unsubscribeObjects();
      unsubscribeRotations();
    };
  }, [user]);

  const isHeldPlus = !!user?.premium?.active;
  const maxFreeRotations = 3;
  const reachedLimit = !isHeldPlus && rotationCount >= maxFreeRotations;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || typeof user.uid !== 'string') return;
    if (reachedLimit) {
  setError('Upgrade to Held+ to create more than 3 rotations.');
      return;
    }
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    if (selectedObjects.length === 0) {
      setError('Please select at least one object');
      return;
    }
    if (selectedObjects.length > 7) {
      setError('You can only select up to 7 objects per rotation');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const rotationData = {
        ...formData,
        objectIds: selectedObjects,
      };
      await createRotation(user.uid, rotationData);
      router.push('/rotations');
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message || 'Failed to create rotation');
      } else {
        setError('Failed to create rotation');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleObject = (objectId: string) => {
    setSelectedObjects(prev => {
      if (prev.includes(objectId)) {
        return prev.filter(id => id !== objectId);
      } else {
        if (prev.length >= 7) {
          setError('You can only select up to 7 objects per rotation');
          return prev;
        }
        return [...prev, objectId];
      }
    });
    setError('');
  };

  const selectedObjectsList = objects.filter(obj => selectedObjects.includes(obj.id));

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="held-container py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button variant="ghost" asChild className="mr-4">
            <Link href="/rotations">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Rotations
            </Link>
          </Button>
          <h1 className="text-3xl font-serif font-medium">Create New Rotation</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div>
            <div className="held-card p-8">
              {reachedLimit && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md mb-4">
                  <p className="text-sm text-yellow-700 font-semibold">
                    This is cool. Get Held+
                  </p>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Field */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Rotation Name</label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Give your rotation a name..."
                    className="w-full border border-gray-300 rounded px-3 py-2 text-lg font-serif"
                    required
                  />
                </div>

                {/* Sexy Cover Image Upload */}
                <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition cursor-pointer group"
                  onClick={() => document.getElementById('coverImageInput')?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      setCoverImageFile(e.dataTransfer.files[0]);
                    }
                  }}
                >
                  <input
                    id="coverImageInput"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => setCoverImageFile(e.target.files?.[0] || null)}
                  />
                  {coverImageFile ? (
                    <div className="w-full flex flex-col items-center">
                      <img src={URL.createObjectURL(coverImageFile)} alt="Cover Preview" className="w-full h-40 object-cover rounded-lg border mb-2" />
                      <button type="button" className="text-xs text-red-500 underline" onClick={e => { e.stopPropagation(); setCoverImageFile(null); }}>Remove</button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-32 w-full">
                      <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5V19a2 2 0 002 2h14a2 2 0 002-2v-2.5M16.5 3.5a3.5 3.5 0 11-7 0m7 0A3.5 3.5 0 009 3.5m7.5 0V7m-7.5 0V3.5m0 0A3.5 3.5 0 003.5 7m0 0V3.5m0 0A3.5 3.5 0 007 3.5" /></svg>
                      <span className="text-gray-500 text-sm">Drag & drop or click to upload a cover image</span>
                    </div>
                  )}
                </div>
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe this rotation..."
                    rows={3}
                  />
                </div>

                {/* Public/Private */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                    className="h-4 w-4 text-gray-900 focus:ring-gray-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isPublic" className="text-sm text-gray-700">
                    Make this rotation public (creates a shareable page)
                  </label>
                </div>

                {/* Selected Objects Summary */}
                {selectedObjects.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selected Objects ({selectedObjects.length}/7)
                    </label>
                    <div className="space-y-2">
                      {selectedObjectsList.map((obj) => (
                        <div key={obj.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-200 rounded overflow-hidden">
                              {obj.images.length > 0 ? (
                                <img
                                  src={obj.images[0]}
                                  alt={obj.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <span className="text-gray-400 text-xs">?</span>
                                </div>
                              )}
                            </div>
                            <span className="text-sm font-medium">{obj.title}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleObject(obj.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Submit */}
                <div className="flex gap-4 pt-4">
                  <Button type="submit" disabled={loading || reachedLimit} className="flex-1">
                    {loading ? 'Creating...' : 'Create Rotation'}
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link href="/rotations">Cancel</Link>
                  </Button>
                </div>
              </form>

              {showAddModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
      <h2 className="text-2xl font-bold mb-4">Add New Item</h2>
      <form onSubmit={handleAddNewItem} className="space-y-4">
        <input
          type="text"
          placeholder="Title"
          value={newItemData.title}
          onChange={e => setNewItemData({ ...newItemData, title: e.target.value })}
          className="w-full border border-gray-300 rounded px-3 py-2"
          required
        />
        <div className="flex flex-wrap gap-2">
          {categoryOptions.map(cat => (
            <button
              key={cat}
              type="button"
              className={`pill px-4 py-2 border ${newItemData.category === cat ? 'bg-gray-900 text-white border-gray-900' : 'bg-gray-100 text-gray-900 border-gray-300'} transition-colors duration-200`}
              onClick={() => setNewItemData({ ...newItemData, category: cat })}
            >
              {cat}
            </button>
          ))}
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={e => setNewItemData({ ...newItemData, image: e.target.files?.[0] || null })}
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
          <Button type="submit" disabled={addingItem} className="bg-black text-white">{addingItem ? 'Adding...' : 'Add Item'}</Button>
        </div>
      </form>
    </div>
  </div>
)}
            </div>
          </div>

          {/* Object Selection */}
          <div>
            <div className="held-card p-8">
              <h2 className="text-lg font-medium mb-4">Select Objects</h2>
              <p className="text-sm text-gray-600 mb-6">
                Choose up to 7 objects from your registry to include in this rotation.
              </p>

              {objects.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No objects in your registry yet</p>
                  <Button asChild>
                    <Link href="/registry/new">Add Your First Object</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {objects.map((obj) => (
                    <div
                      key={obj.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedObjects.includes(obj.id)
                          ? 'border-gray-900 bg-gray-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleObject(obj.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded overflow-hidden">
                          {obj.images.length > 0 ? (
                            <img
                              src={obj.images[0]}
                              alt={obj.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-gray-400 text-xs">?</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{obj.title}</p>
                          {obj.maker && (
                            <p className="text-xs text-gray-500 truncate">{obj.maker}</p>
                          )}
                        </div>
                        {selectedObjects.includes(obj.id) && (
                          <Check className="h-4 w-4 text-gray-900" />
                        )}
                      </div>
                    </div>
                  ))}

                </div>
              )}
            </div>
                    {/* Add New Item Button below the panel */}
                    <div className="held-card p-6 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 cursor-pointer hover:border-black transition-all mt-6" onClick={() => setShowAddModal(true)}>
                      <span className="text-3xl text-gray-400">+</span>
                      <span className="font-semibold text-gray-700">Add New Item</span>
                    </div>
          </div>
        </div>
      </div>
    </div>
  );
}
