'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, isHeldPlus } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createRotation, subscribeObjects, subscribeRotations, FREE_REGISTRY_OBJECT_LIMIT } from '@/lib/firebase-services';
import { CreateRotationData, HeldObject } from '@/types';
import { ArrowLeft, Check, X } from 'lucide-react';
import ImageEditorModal from '@/components/images/ImageEditorModal';
import Link from 'next/link';

export default function NewRotationPage() {
  const [error, setError] = useState<string>('');
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [objects, setObjects] = useState<HeldObject[]>([]);
  const [selectedObjects, setSelectedObjects] = useState<string[]>([]);
  const [rotationCount, setRotationCount] = useState<number>(0);
  const [objectCount, setObjectCount] = useState<number>(0);

    const [formData, setFormData] = useState<CreateRotationData>({
      name: '',
      description: '',
      objectIds: [],
      isPublic: false,
    });
    const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
    const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);

  const categoryOptions = useMemo(
    () => ['Art','Auto','Bicycle','Books','Ephemera','Everyday Carry','Fashion','Furniture','HiFi','Industrial Design','Instruments','Lighting','Miscellaneous','Moto','Movie','Music','Photography','Tech','Timepieces','Vintage'],
    []
  );

  type PendingItem = {
    id: string;
    title: string;
    category: string;
    image: File | null;
    previewUrl: string | null;
  };

  const createPendingItem = (overrides: Partial<PendingItem> = {}): PendingItem => ({
    id: (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
      ? crypto.randomUUID()
      : `pending-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: '',
    category: '',
    image: null,
    previewUrl: null,
    ...overrides,
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([createPendingItem()]);
  const [modalError, setModalError] = useState<string>('');
  const [addingItems, setAddingItems] = useState(false);
  const [imageEditorOpen, setImageEditorOpen] = useState(false);
  const [editorFile, setEditorFile] = useState<File | null>(null);
  const [editorContext, setEditorContext] = useState<{ type: 'cover' } | { type: 'newItem'; index: number } | null>(null);
  const pendingItemsRef = useRef(pendingItems);

  useEffect(() => {
    pendingItemsRef.current = pendingItems;
  }, [pendingItems]);

  useEffect(() => {
    return () => {
      pendingItemsRef.current.forEach(item => releasePreview(item.previewUrl));
    };
  }, []);

  const releasePreview = (url: string | null) => {
    if (url) {
      URL.revokeObjectURL(url);
    }
  };

  const resetPendingItems = () => {
    pendingItems.forEach(item => releasePreview(item.previewUrl));
    setPendingItems([createPendingItem()]);
    setModalError('');
  };

  const setPendingItemField = (index: number, field: keyof PendingItem, value: string | File | null) => {
    setPendingItems(prev => prev.map((item, idx) => {
      if (idx !== index) return item;
      if (field === 'image') {
        releasePreview(item.previewUrl);
        if (value instanceof File) {
          const previewUrl = URL.createObjectURL(value);
          return { ...item, image: value, previewUrl };
        }
        return { ...item, image: null, previewUrl: null };
      }
      if (field === 'previewUrl') {
        // handled when image is set
        return item;
      }
      return { ...item, [field]: value } as PendingItem;
    }));
  };

  const generateTitleFromFile = (file: File) => {
    const withoutExt = file.name.replace(/\.[^.]+$/, '');
    const spaced = withoutExt.replace(/[-_]+/g, ' ').trim();
    if (!spaced) return '';
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
  };

  const addFilesToPendingItems = (fileList: FileList | File[], targetIndex?: number) => {
    const files = Array.from(fileList || []).filter(Boolean) as File[];
    if (files.length === 0) return;

    setPendingItems(prev => {
      const next = [...prev];
      const applyFileToIndex = (file: File, index: number) => {
        const titleFromFile = generateTitleFromFile(file);
        const previewUrl = URL.createObjectURL(file);
        const existing = next[index];
        if (existing) {
          releasePreview(existing.previewUrl);
          next[index] = {
            ...existing,
            image: file,
            previewUrl,
            title: existing.title || titleFromFile,
          };
        } else {
          next[index] = createPendingItem({
            title: titleFromFile,
            category: keepExistingCategory && existing ? existing.category : '',
            image: file,
            previewUrl,
          });
        }
      };

      if (typeof targetIndex === 'number' && targetIndex >= 0) {
        applyFileToIndex(files[0], targetIndex);
        const baseCategory = next[targetIndex]?.category ?? '';
        files.slice(1).forEach(file => {
          const titleFromFile = generateTitleFromFile(file);
          const previewUrl = URL.createObjectURL(file);
          next.push(createPendingItem({ title: titleFromFile, category: baseCategory, image: file, previewUrl }));
        });
        return next;
      }

      let firstOpenIndex = next.findIndex(item => !item.image && !item.title);
      files.forEach((file, fileIdx) => {
        if (fileIdx === 0 && firstOpenIndex !== -1) {
          applyFileToIndex(file, firstOpenIndex);
          firstOpenIndex = next.findIndex(item => !item.image && !item.title);
        } else {
          const titleFromFile = generateTitleFromFile(file);
          const previewUrl = URL.createObjectURL(file);
          next.push(createPendingItem({ title: titleFromFile, image: file, previewUrl }));
        }
      });
      return next;
    });
  };

  const removePendingItem = (index: number) => {
    setPendingItems(prev => {
      if (prev.length === 1) {
        releasePreview(prev[0].previewUrl);
        return [createPendingItem()];
      }
      const next = [...prev];
      const [removed] = next.splice(index, 1);
      releasePreview(removed.previewUrl);
      return next;
    });
  };

  const handleAddNewItems = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || typeof user.uid !== 'string') return;

    const trimmedItems = pendingItems.map((item, index) => ({
      ...item,
      index,
      title: item.title.trim(),
    }));

    const validItems = trimmedItems.filter(item => item.title && item.category);

    if (validItems.length === 0) {
      setModalError('Add at least one item with a title and category.');
      return;
    }

    if (!plusMember && objectCount + validItems.length > FREE_REGISTRY_OBJECT_LIMIT) {
      setModalError(`Adding ${validItems.length} item${validItems.length === 1 ? '' : 's'} will exceed the free limit of ${FREE_REGISTRY_OBJECT_LIMIT}.`);
      return;
    }

    if (selectedObjects.length + validItems.length > 7) {
      setModalError('You can only include up to 7 objects in a rotation. Deselect a few before adding more.');
      return;
    }

    setAddingItems(true);
    setModalError('');
    try {
      const { createObject } = await import('@/lib/firebase-services');
      const created: { object: HeldObject; sourceIndex: number }[] = [];

      for (const item of validItems) {
        try {
          const newObject = await createObject(user.uid, {
            title: item.title,
            category: item.category,
            images: item.image ? [item.image] : [],
            maker: '',
            year: undefined,
            value: undefined,
            condition: 'good',
            tags: [],
            notes: '',
            isPublic: false,
            shareInCollaborative: false,
          });
          created.push({ object: newObject, sourceIndex: item.index });
        } catch (err) {
          const errorCode = typeof err === 'object' && err && 'code' in err ? (err as { code?: string }).code : undefined;
          if (errorCode === 'REGISTRY_FREE_LIMIT_REACHED' || (err instanceof Error && err.message === 'REGISTRY_FREE_LIMIT_REACHED')) {
            setModalError(`Reached the free registry item limit of ${FREE_REGISTRY_OBJECT_LIMIT}. Upgrade to Held+ to add more.`);
          } else {
            setModalError('Failed to add one of the items. Please try again.');
          }
          break;
        }
      }

      if (created.length > 0) {
        setObjects(prev => {
          const existingIds = new Set(prev.map(item => item.id));
          const additions = created
            .map(entry => entry.object)
            .filter(item => !existingIds.has(item.id));
          return [...prev, ...additions];
        });
        setSelectedObjects(prev => {
          const existing = new Set(prev);
          const additions = created
            .map(entry => entry.object.id)
            .filter(id => !existing.has(id));
          return [...prev, ...additions];
        });

        if (created.length === validItems.length) {
          resetPendingItems();
          setShowAddModal(false);
        } else {
          setPendingItems(prev => {
            const createdIndices = new Set(created.map(entry => entry.sourceIndex));
            return prev.map((item, idx) => {
              if (!createdIndices.has(idx)) {
                return item;
              }
              releasePreview(item.previewUrl);
              return createPendingItem();
            });
          });
        }
      }
    } finally {
      setAddingItems(false);
    }
  };

  useEffect(() => {
    if (!coverImageFile) {
      setCoverPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(coverImageFile);
    setCoverPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [coverImageFile]);

  const closeEditor = () => {
    setImageEditorOpen(false);
    setEditorFile(null);
    setEditorContext(null);
  };

  const handleEditorApplyFile = (file: File) => {
    if (!editorContext) {
      closeEditor();
      return;
    }

    if (editorContext.type === 'cover') {
      setCoverImageFile(file);
    } else {
      setPendingItemField(editorContext.index, 'image', file);
    }
    closeEditor();
  };

  const handleEditorUseOriginal = (file: File) => {
    handleEditorApplyFile(file);
  };


  useEffect(() => {
    if (!user || typeof user.uid !== 'string') return;
    // Subscribe to user's objects
    const unsubscribeObjects = subscribeObjects(user.uid, (objs) => {
      setObjects(objs);
      setObjectCount(objs.length);
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

  const plusMember = isHeldPlus(user);
  const maxFreeRotations = 3;
  const reachedLimit = !plusMember && rotationCount >= maxFreeRotations;

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
      let coverImageUrl: string | undefined;
      
      // Upload cover image if provided
      if (coverImageFile) {
        const { uploadImages } = await import('@/lib/firebase-services');
        const imageUrls = await uploadImages([coverImageFile], user.uid);
        coverImageUrl = imageUrls[0];
      }
      
      const rotationData = {
        ...formData,
        objectIds: selectedObjects,
        coverImage: coverImageUrl,
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
    <>
      <ImageEditorModal
        open={imageEditorOpen}
        file={editorFile}
        fileName={editorFile?.name}
        onClose={closeEditor}
        onApply={handleEditorApplyFile}
        onUseOriginal={handleEditorUseOriginal}
      />
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <div className="held-container held-container-wide py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button variant="ghost" asChild className="mr-4 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
            <Link href="/rotations">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Rotations
            </Link>
          </Button>
          <h1 className="text-3xl font-serif font-medium text-gray-900 dark:text-gray-100">Create New Rotation</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div>
            <div className="held-card p-8">
              {reachedLimit && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md mb-4">
                  <p className="text-sm text-yellow-700 dark:text-yellow-400 font-semibold">
                    This is cool. Get Held+
                  </p>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Field */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rotation Name</label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Give your rotation a name..."
                    className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-lg font-serif bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    required
                  />
                </div>

                {/* Sexy Cover Image Upload */}
                <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer group"
                  onClick={() => document.getElementById('coverImageInput')?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      setEditorContext({ type: 'cover' });
                      setEditorFile(e.dataTransfer.files[0]);
                      setImageEditorOpen(true);
                    }
                  }}
                >
                  <input
                    id="coverImageInput"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => {
                      const file = e.target.files?.[0] || null;
                      if (file) {
                        setEditorContext({ type: 'cover' });
                        setEditorFile(file);
                        setImageEditorOpen(true);
                      } else {
                        setCoverImageFile(null);
                      }
                      e.target.value = '';
                    }}
                  />
                  {coverImageFile ? (
                    <div className="w-full flex flex-col items-center">
                      {coverPreviewUrl ? (
                        <img src={coverPreviewUrl} alt="Cover Preview" className="w-full h-40 object-cover rounded-lg border mb-2" />
                      ) : (
                        <div className="w-full h-40 flex items-center justify-center text-sm text-gray-500">Loading…</div>
                      )}
                      <div className="flex gap-3">
                        <button
                          type="button"
                          className="text-xs text-gray-600 dark:text-gray-300 underline"
                          onClick={e => {
                            e.stopPropagation();
                            if (coverImageFile) {
                              setEditorContext({ type: 'cover' });
                              setEditorFile(coverImageFile);
                              setImageEditorOpen(true);
                            }
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="text-xs text-red-500 dark:text-red-400 underline"
                          onClick={e => {
                            e.stopPropagation();
                            setCoverImageFile(null);
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-32 w-full">
                      <svg className="w-8 h-8 text-gray-400 dark:text-gray-500 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5V19a2 2 0 002 2h14a2 2 0 002-2v-2.5M16.5 3.5a3.5 3.5 0 11-7 0m7 0A3.5 3.5 0 009 3.5m7.5 0V7m-7.5 0V3.5m0 0A3.5 3.5 0 003.5 7m0 0V3.5m0 0A3.5 3.5 0 007 3.5" /></svg>
                      <span className="text-gray-500 dark:text-gray-400 text-sm">Drag & drop or click to upload a cover image</span>
                    </div>
                  )}
                </div>
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                    className="h-4 w-4 text-gray-900 dark:text-gray-100 focus:ring-gray-500 dark:focus:ring-gray-400 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                  />
                  <label htmlFor="isPublic" className="text-sm text-gray-700 dark:text-gray-300">
                    Make this rotation public (creates a shareable page)
                  </label>
                </div>

                {/* Selected Objects Summary */}
                {selectedObjects.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Selected Objects ({selectedObjects.length}/7)
                    </label>
                    <div className="space-y-2">
                      {selectedObjectsList.map((obj) => (
                        <div key={obj.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                              {obj.images.length > 0 ? (
                                <img
                                  src={obj.images[0]}
                                  alt={obj.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <span className="text-gray-400 dark:text-gray-500 text-xs">?</span>
                                </div>
                              )}
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{obj.title}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleObject(obj.id)}
                            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
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
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
      <h2 className="text-2xl font-bold mb-4">Add New Items</h2>
      {modalError && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {modalError}
        </div>
      )}
      <form onSubmit={handleAddNewItems} className="space-y-6">
        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1">
          {pendingItems.map((item, index) => (
            <div key={item.id} className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Title</label>
                    <Input
                      value={item.title}
                      onChange={e => setPendingItemField(index, 'title', e.target.value)}
                      placeholder="Album name"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Category</label>
                    <div className="flex flex-wrap gap-2">
                      {categoryOptions.map(cat => (
                        <button
                          key={`${item.id}-${cat}`}
                          type="button"
                          className={`pill px-3 py-1 text-xs border ${item.category === cat ? 'bg-gray-900 text-white border-gray-900' : 'bg-gray-100 text-gray-900 border-gray-300'} transition-colors duration-200`}
                          onClick={() => setPendingItemField(index, 'category', cat)}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Photo</label>
                    <div className="flex flex-col gap-3">
                      {item.previewUrl ? (
                        <div
                          className="relative w-full rounded-md border border-gray-200"
                          onDragOver={e => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onDrop={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            const fileList = e.dataTransfer?.files;
                            if (fileList && fileList.length > 0) {
                              if (fileList.length === 1) {
                                setEditorContext({ type: 'newItem', index });
                                setEditorFile(fileList[0]);
                                setImageEditorOpen(true);
                              } else {
                                addFilesToPendingItems(fileList, index);
                              }
                            }
                          }}
                        >
                          <img src={item.previewUrl} alt={`${item.title || 'Preview'}`} className="h-36 w-full rounded-md object-cover" />
                          <div className="absolute inset-x-2 bottom-2 flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (item.image) {
                                  setEditorContext({ type: 'newItem', index });
                                  setEditorFile(item.image);
                                  setImageEditorOpen(true);
                                }
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setPendingItemField(index, 'image', null)}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <label
                          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-500 hover:border-gray-400"
                          onDragOver={e => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onDrop={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            const fileList = e.dataTransfer?.files;
                            if (fileList && fileList.length > 0) {
                              if (fileList.length === 1) {
                                setEditorContext({ type: 'newItem', index });
                                setEditorFile(fileList[0]);
                                setImageEditorOpen(true);
                              } else {
                                addFilesToPendingItems(fileList, index);
                              }
                            }
                          }}
                        >
                          <span>Drag & drop or click to upload (multiple supported)</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={e => {
                              const fileList = e.target.files;
                              if (fileList && fileList.length > 0) {
                                if (fileList.length === 1) {
                                  setEditorContext({ type: 'newItem', index });
                                  setEditorFile(fileList[0]);
                                  setImageEditorOpen(true);
                                } else {
                                  addFilesToPendingItems(fileList, index);
                                }
                              }
                              e.target.value = '';
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removePendingItem(index)}
                  disabled={pendingItems.length === 1}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => setPendingItems(prev => [...prev, createPendingItem()])}
          >
            + Add another item
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => { resetPendingItems(); setShowAddModal(false); }}>Cancel</Button>
            <Button type="submit" disabled={addingItems} className="bg-black text-white">
              {addingItems ? 'Adding…' : 'Add Items'}
            </Button>
          </div>
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
                    <div
                      className="held-card p-6 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 cursor-pointer hover:border-black transition-all mt-6"
                      onClick={() => {
                        setModalError('');
                        setShowAddModal(true);
                        setPendingItems(prev => (prev.length === 0 ? [createPendingItem()] : prev));
                      }}
                      onDragOver={e => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        const fileList = e.dataTransfer?.files;
                        if (fileList && fileList.length > 0) {
                          setModalError('');
                          setShowAddModal(true);
                          setPendingItems(prev => (prev.length === 0 ? [createPendingItem()] : prev));
                          addFilesToPendingItems(fileList);
                        }
                      }}
                    >
                      <span className="text-3xl text-gray-400">+</span>
                      <span className="font-semibold text-gray-700">Add New Items</span>
                    </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
