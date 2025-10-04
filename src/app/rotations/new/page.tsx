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
    notes: string;
  };

  const createPendingItem = (overrides: Partial<PendingItem> = {}): PendingItem => ({
    id: (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
      ? crypto.randomUUID()
      : `pending-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: '',
    category: '',
    image: null,
    previewUrl: null,
    notes: '',
    ...overrides,
  });

  const [addPanelOpen, setAddPanelOpen] = useState(false);
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([createPendingItem()]);
  const [modalError, setModalError] = useState<string>('');
  const [addingItems, setAddingItems] = useState(false);
  const [imageEditorOpen, setImageEditorOpen] = useState(false);
  const [editorFile, setEditorFile] = useState<File | null>(null);
  const [editorContext, setEditorContext] = useState<{ type: 'cover' } | { type: 'newItem'; index: number } | null>(null);
  const pendingItemsRef = useRef(pendingItems);
  const bulkUploadInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    pendingItemsRef.current = pendingItems;
  }, [pendingItems]);

  useEffect(() => {
    return () => {
      pendingItemsRef.current.forEach(item => releasePreview(item.previewUrl));
    };
  }, []);

  useEffect(() => {
    if (!addPanelOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [addPanelOpen]);

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
          const baseCategory = index >= 0 && index < next.length ? next[index]?.category ?? '' : '';
          next[index] = createPendingItem({
            title: titleFromFile,
            category: baseCategory,
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

  const handleItemFileSelect = (index: number, fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList).filter(Boolean) as File[];
    if (files.length === 0) return;

    if (files.length === 1) {
      setEditorContext({ type: 'newItem', index });
      setEditorFile(files[0]);
      setImageEditorOpen(true);
      return;
    }

    addFilesToPendingItems(files, index);
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

  const openAddPanel = () => {
    setModalError('');
    setAddPanelOpen(true);
  };

  const closeAddPanel = () => {
    setAddPanelOpen(false);
    setModalError('');
    resetPendingItems();
  };

  const handleAddNewItems = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || typeof user.uid !== 'string') return;

    const trimmedItems = pendingItems.map((item, index) => ({
      ...item,
      index,
      title: item.title.trim(),
      notes: item.notes.trim(),
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
          closeAddPanel();
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
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 full-bleed overflow-x-hidden">
        <div className="held-container held-container-wide py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button variant="ghost" asChild className="mr-4 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
            <Link href="/rotations">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <h1 className="text-3xl font-serif font-medium text-gray-900 dark:text-gray-100">Create Rotation</h1>
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

              {addPanelOpen && (
                <div className="fixed inset-0 z-50 flex bg-black/40 backdrop-blur-sm overflow-x-hidden">
                  <div className="flex h-full w-full flex-col bg-white shadow-2xl dark:bg-gray-950 overflow-x-hidden">
                    <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-6 py-4 dark:border-gray-800">
                      <button
                        type="button"
                        className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                        onClick={closeAddPanel}
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                      </button>
                      <div className="text-right">
                        <h2 className="text-2xl font-serif text-gray-900 dark:text-gray-100">Add items</h2>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        </p>
                      </div>
                    </div>
                    <form onSubmit={handleAddNewItems} className="flex flex-1 flex-col overflow-hidden">
                      <div className="flex-1 overflow-y-auto px-6 py-6">
                        <div
                          className="relative mb-8 rounded-3xl border-2 border-dashed border-gray-300 bg-gray-50/70 p-6 text-center transition hover:border-gray-400 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900/60 dark:hover:border-gray-500 dark:hover:bg-gray-900"
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const files = e.dataTransfer?.files;
                            if (files && files.length > 0) {
                              addFilesToPendingItems(files);
                            }
                          }}
                        >
                          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-black text-white shadow-sm dark:bg-gray-100 dark:text-gray-900">
                            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                              <path d="M12 5v14m7-7H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                          </div>
                          <h3 className="mt-4 text-xl font-light text-gray-900 dark:text-gray-100">Drop photos to auto-create entries</h3>
                          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            We&apos;ll make one entry per image and prefill titles from filenames. You can tweak titles and categories before saving.
                          </p>
                          <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
                            <Button
                              type="button"
                              onClick={() => bulkUploadInputRef.current?.click()}
                              className="rounded-full bg-black px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
                            >
                              Select from computer
                            </Button>
                            <span className="text-xs text-gray-500 dark:text-gray-400">JPG, PNG, HEIC up to 10MB</span>
                          </div>
                          <input
                            ref={bulkUploadInputRef}
                            type="file"
                            multiple
                            accept="image/*,.heic,.heif"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files.length > 0) {
                                addFilesToPendingItems(e.target.files);
                              }
                              e.target.value = '';
                            }}
                          />
                        </div>

                        {modalError && (
                          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                            {modalError}
                          </div>
                        )}

                        <div className="space-y-6">
                          {pendingItems.map((item, index) => {
                            const fileInputId = `rotation-pending-upload-${item.id}`;
                            return (
                              <div key={item.id} className="relative rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700/70 dark:bg-gray-900">
                                <button
                                  type="button"
                                  className="absolute right-4 top-4 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                                  onClick={() => removePendingItem(index)}
                                  disabled={pendingItems.length === 1}
                                >
                                  Remove entry
                                </button>
                                <div className="grid gap-6 p-6 lg:grid-cols-[260px,1fr]">
                                  <div className="space-y-3">
                                    <div className="text-xs font-semibold uppercase tracking-widest text-gray-500">Cover photo</div>
                                    <div
                                      className={`group relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border-2 border-dashed ${
                                        item.previewUrl ? 'border-transparent bg-gray-100 dark:bg-gray-800' : 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900'
                                      }`}
                                      onDragOver={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                      }}
                                      onDrop={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleItemFileSelect(index, e.dataTransfer?.files || null);
                                      }}
                                    >
                                      {item.previewUrl ? (
                                        <>
                                          <img
                                            src={item.previewUrl}
                                            alt={item.title || `Pending item ${index + 1}`}
                                            className="h-full w-full object-cover"
                                          />
                                          <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/35" />
                                          <div className="absolute inset-x-4 bottom-4 flex justify-between gap-2 opacity-0 transition group-hover:opacity-100">
                                            <Button
                                              type="button"
                                              size="sm"
                                              variant="outline"
                                              className="border-white bg-white/80 text-gray-800 hover:bg-white"
                                              onClick={() => {
                                                if (item.image) {
                                                  setEditorContext({ type: 'newItem', index });
                                                  setEditorFile(item.image);
                                                  setImageEditorOpen(true);
                                                } else {
                                                  document.getElementById(fileInputId)?.click();
                                                }
                                              }}
                                            >
                                              Edit photo
                                            </Button>
                                            <Button
                                              type="button"
                                              size="sm"
                                              variant="secondary"
                                              className="border-white bg-black/60 text-white hover:bg-black"
                                              onClick={() => setPendingItemField(index, 'image', null)}
                                            >
                                              Remove
                                            </Button>
                                          </div>
                                        </>
                                      ) : (
                                        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-sm text-gray-500">
                                          <svg className="h-8 w-8 text-gray-400" viewBox="0 0 24 24" fill="none">
                                            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                                            <path d="M9 13l3-3 3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                          </svg>
                                          <span>Drop or tap to add a photo</span>
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => document.getElementById(fileInputId)?.click()}
                                          >
                                            Select image
                                          </Button>
                                        </div>
                                      )}
                                      <input
                                        id={fileInputId}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                        onChange={(e) => {
                                          handleItemFileSelect(index, e.target.files);
                                          e.currentTarget.value = '';
                                        }}
                                      />
                                    </div>
                                  </div>
                                  <div className="space-y-5 min-w-0">
                                    <div>
                                      <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-gray-500">Title</label>
                                      <Input
                                        value={item.title}
                                        onChange={(e) => setPendingItemField(index, 'title', e.target.value)}
                                        placeholder="Album name"
                                      />
                                    </div>
                                    <div>
                                      <div className="mb-1 flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-gray-500">
                                        <span>Category</span>
                                        <button
                                          type="button"
                                          className="text-[11px] font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                          onClick={() => {
                                            const category = pendingItems[index].category;
                                            if (!category) return;
                                            setPendingItems(prev => prev.map((entry, i) => (i === index ? entry : { ...entry, category })));
                                          }}
                                        >
                                          Apply to rest
                                        </button>
                                      </div>
                                      <div className="relative">
                                        <div className="flex max-w-full gap-2 overflow-x-auto pb-2 pr-6 scrollbar-hide">
                                          {categoryOptions.map(cat => {
                                            const isActive = item.category === cat;
                                            return (
                                              <button
                                                key={`${item.id}-${cat}`}
                                              type="button"
                                              className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-xs font-medium transition ${
                                                isActive
                                                  ? 'border-gray-900 bg-gray-900 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900'
                                                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-gray-500'
                                              }`}
                                              onClick={() => setPendingItemField(index, 'category', cat)}
                                            >
                                              {cat}
                                            </button>
                                            );
                                          })}
                                        </div>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-white via-white/80 to-transparent dark:from-gray-900 dark:via-gray-900/80" />
                                      </div>
                                    </div>
                                    <div>
                                      <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-gray-500">Notes</label>
                                      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-3 text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                                        Add provenance details, editions, or stories later once the object is created.
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-gray-900/60">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setPendingItems(prev => [...prev, createPendingItem()])}
                            className="order-2 sm:order-1"
                          >
                            + Add blank entry
                          </Button>
                          <div className="order-1 flex justify-end gap-2 sm:order-2">
                            <Button type="button" variant="ghost" onClick={closeAddPanel}>
                              Cancel
                            </Button>
                            <Button type="submit" disabled={addingItems} className="bg-black text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200">
                              {addingItems ? 'Adding…' : 'Add Items'}
                            </Button>
                          </div>
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
                        openAddPanel();
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
                          openAddPanel();
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
