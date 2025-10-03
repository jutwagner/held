"use client";

import React, { useState, useEffect } from 'react';
import { subscribeObjects } from '@/lib/firebase-services';
import type { HeldObject } from '@/types';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import ImageEditorModal from '@/components/images/ImageEditorModal';

type UpdateObjectData = {
  title: string;
  category: string;
  maker: string;
  year?: number;
  value?: number;
  condition: string;
  tags: string[];
  notes: string;
  images: string[];
  isPublic: boolean;
  shareInCollaborative: boolean;
  chain?: Array<{ owner: string; acquiredAt?: string; notes?: string }>;
  serialNumber?: string;
  acquisitionDate?: string;
  certificateOfAuthenticity?: string;
  origin?: string;
  conditionHistory?: Array<{ date: string; condition: string; notes?: string }>;
  associatedDocuments?: string[];
  provenanceNotes?: string;
  transferMethod?: string;
  anchorOnChain?: boolean;
};

type EditableImage = {
  id: string;
  preview: string;
  file?: File;
  existingUrl?: string;
};

export default function EditObjectPage() {
  const { user } = useAuth();
  const params = useSearchParams();
  const objectId = params?.get('id');
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<UpdateObjectData | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [coaFile, setCoaFile] = useState<File | null>(null);
  const [images, setImages] = useState<EditableImage[]>([]);
  const [imageEditorOpen, setImageEditorOpen] = useState(false);
  const [editorFile, setEditorFile] = useState<File | null>(null);
  const [editorQueue, setEditorQueue] = useState<File[]>([]);
  const [editorQueueIndex, setEditorQueueIndex] = useState(0);
  const [editingImageId, setEditingImageId] = useState<string | null>(null);

  useEffect(() => {
    setFormData(prev => prev ? { ...prev, images: images.map(img => img.existingUrl || img.preview) } : prev);
  }, [images]);

  useEffect(() => {
    if (!objectId) return;
    setLoading(true);
    const unsubscribe = subscribeObjects(objectId, (objs: HeldObject[]) => {
      const obj = objs.find((o: HeldObject) => o.id === objectId);
      if (obj) {
        setFormData({
          title: obj.title || '',
          category: obj.category || '',
          maker: obj.maker || '',
          year: obj.year,
          value: obj.value,
          condition: obj.condition || 'good',
          tags: Array.isArray(obj.tags) ? obj.tags : [],
          notes: obj.notes || '',
          images: obj.images || [],
          isPublic: obj.isPublic || false,
          shareInCollaborative: obj.shareInCollaborative || false,
          chain: Array.isArray(obj.chain)
            ? obj.chain.map(c => ({
                owner: c.owner || '',
                acquiredAt:
                  typeof c.acquiredAt === 'string'
                    ? c.acquiredAt
                    : c.acquiredAt instanceof Date
                    ? c.acquiredAt.toISOString().slice(0, 10)
                    : '',
                notes: c.notes || ''
              }))
            : [],
          serialNumber: obj.serialNumber || '',
          acquisitionDate: typeof obj.acquisitionDate === 'string' ? obj.acquisitionDate : (obj.acquisitionDate instanceof Date ? obj.acquisitionDate.toISOString().slice(0, 10) : ''),
          certificateOfAuthenticity: obj.certificateOfAuthenticity || '',
          origin: obj.origin || '',
          conditionHistory: Array.isArray(obj.conditionHistory)
            ? obj.conditionHistory.map(ch => ({ date: typeof ch.date === 'string' ? ch.date : (ch.date instanceof Date ? ch.date.toISOString().slice(0, 10) : ''), condition: ch.condition, notes: ch.notes }))
            : [],
          associatedDocuments: Array.isArray(obj.associatedDocuments) ? obj.associatedDocuments : [],
          provenanceNotes: obj.provenanceNotes || '',
          transferMethod: obj.transferMethod || '',
          anchorOnChain: obj.anchoring?.isAnchored || false,
        });
        setImages(prev => {
          prev.forEach(img => {
            if (img.file && img.preview.startsWith('blob:')) {
              URL.revokeObjectURL(img.preview);
            }
          });
          return (obj.images || []).map((url, idx) => ({
            id: `${obj.id || 'image'}-${idx}`,
            preview: url,
            existingUrl: url,
          }));
        });
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [objectId]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(file => file.type.startsWith('image/'));
    if (files.length === 0) {
      return;
    }
    setUploadError(null);
    openEditorWithFiles(files);
    e.target.value = '';
  };

  const closeEditor = () => {
    setImageEditorOpen(false);
    setEditorFile(null);
    setEditorQueue([]);
    setEditorQueueIndex(0);
    setEditingImageId(null);
  };

  const advanceQueue = () => {
    if (editingImageId) {
      closeEditor();
      return;
    }
    const nextIndex = editorQueueIndex + 1;
    if (nextIndex < editorQueue.length) {
      setEditorQueueIndex(nextIndex);
      setEditorFile(editorQueue[nextIndex]);
    } else {
      closeEditor();
    }
  };

  const openEditorWithFiles = (files: File[], targetId: string | null = null) => {
    if (!files.length) {
      return;
    }
    setEditorQueue(files);
    setEditorQueueIndex(0);
    setEditorFile(files[0]);
    setEditingImageId(targetId);
    setImageEditorOpen(true);
  };

  const processEditedFile = (file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setImages(prev => {
      let replaced = false;
      const next = prev.map(item => {
        if (editingImageId && item.id === editingImageId) {
          if (item.file && item.preview.startsWith('blob:')) {
            URL.revokeObjectURL(item.preview);
          }
          replaced = true;
          return {
            ...item,
            file,
            preview: previewUrl,
          };
        }
        return item;
      });

      if (editingImageId && replaced) {
        return next;
      }

      const newItem: EditableImage = {
        id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `image-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        file,
        preview: previewUrl,
      };
      return [...next, newItem];
    });

    advanceQueue();
  };

  const handleEditorApply = (file: File) => {
    processEditedFile(file);
  };

  const handleEditorUseOriginal = (file: File) => {
    processEditedFile(file);
  };

  const handleEditImage = async (imageId: string) => {
    const target = images.find(img => img.id === imageId);
    if (!target) return;
    let file = target.file;
    if (!file && target.existingUrl) {
      try {
        const response = await fetch(target.existingUrl);
        const blob = await response.blob();
        const extension = blob.type && blob.type.includes('/') ? blob.type.split('/')[1] : 'jpg';
        file = new File([blob], `image-${imageId}.${extension}`, { type: blob.type || 'image/jpeg' });
      } catch (error) {
        console.error('Failed to load image for editing:', error);
        setUploadError('Unable to load image for editing.');
        return;
      }
    }

    if (file) {
      openEditorWithFiles([file], imageId);
    }
  };

  const removeImage = (imageId: string) => {
    setImages(prev => {
      const next = prev.filter(img => img.id !== imageId);
      const removed = prev.find(img => img.id === imageId);
      if (removed && removed.file && removed.preview.startsWith('blob:')) {
        URL.revokeObjectURL(removed.preview);
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData || !objectId) return;
    setLoading(true);
    try {
      let coaUrl = formData.certificateOfAuthenticity;
      if (coaFile) {
        const { uploadCOAImage } = await import('@/lib/firebase-services');
        coaUrl = await uploadCOAImage(coaFile, objectId);
      }
      const imagesNeedingUpload = images.filter(img => img.file);
      let uploadedImageUrls: string[] = [];
      if (imagesNeedingUpload.length > 0 && user?.uid) {
        const { uploadImages } = await import('@/lib/firebase-services');
        uploadedImageUrls = await uploadImages(imagesNeedingUpload.map(img => img.file!) , user.uid);
      }
      let uploadIndex = 0;
      const finalImages = images.map(img => {
        if (img.file) {
          const url = uploadedImageUrls[uploadIndex++] || img.preview;
          return url;
        }
        return img.existingUrl || img.preview;
      });
      await import('@/lib/firebase-services').then(mod => mod.updateObject(objectId, {
        ...formData,
        id: objectId,
        condition: formData.condition as 'excellent' | 'good' | 'fair' | 'poor',
        chain: formData.chain ?? [],
        serialNumber: formData.serialNumber,
        acquisitionDate: formData.acquisitionDate,
        certificateOfAuthenticity: coaUrl,
        origin: formData.origin,
        conditionHistory: formData.conditionHistory ?? [],
        transferMethod: formData.transferMethod,
        associatedDocuments: formData.associatedDocuments ?? [],
        provenanceNotes: formData.provenanceNotes,
        anchorOnChain: formData.anchorOnChain,
        images: finalImages,
      }));
      router.push(`/registry/${objectId}`);
    } catch (err) {
      console.error('Failed to save changes:', err);
      setUploadError('Failed to save changes: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  if (!formData) return <div className="held-container py-8">Loading…</div>;

  return (
    <>
      <ImageEditorModal
        open={imageEditorOpen}
        file={editorFile}
        fileName={editorFile?.name}
        onClose={closeEditor}
        onApply={handleEditorApply}
        onUseOriginal={handleEditorUseOriginal}
      />
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        <div className="held-container py-8">
          <div className="flex items-center mb-8">
            <Button variant="ghost" asChild className="mr-4">
              <Link href="/registry">Back to Registry</Link>
            </Button>
            <h1 className="text-3xl font-serif font-medium">Edit Object</h1>
          </div>
          <div className="max-w-2xl">
            <div className="held-card p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
                <Input id="title" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required placeholder="Object title" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {['Art','Auto','Bicycle','Books','Ephemera','Everyday Carry','Fashion','Furniture','HiFi','Industrial Design','Instruments','Lighting','Miscellaneous','Moto','Movie','Music','Photography','Tech','Timepieces','Vintage'].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      className={`pill px-4 py-2 border ${formData.category === cat ? 'bg-gray-900 text-white border-gray-900' : 'bg-gray-100 text-gray-900 border-gray-300'} transition-colors duration-200`}
                      onClick={() => setFormData({ ...formData, category: cat })}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="maker" className="block text-sm font-semibold text-gray-700 mb-2">Maker</label>
                <Input id="maker" value={formData.maker} onChange={e => setFormData({ ...formData, maker: e.target.value })} placeholder="e.g., Herman Miller" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="year" className="block text-sm font-semibold text-gray-700 mb-2">Year</label>
                  <Input id="year" type="number" value={formData.year || ''} onChange={e => setFormData({ ...formData, year: e.target.value ? parseInt(e.target.value) : undefined })} placeholder="e.g., 1956" />
                </div>
                <div>
                  <label htmlFor="value" className="block text-sm font-semibold text-gray-700 mb-2">Value</label>
                  <Input id="value" type="number" step="0.01" value={formData.value || ''} onChange={e => setFormData({ ...formData, value: e.target.value ? parseFloat(e.target.value) : undefined })} placeholder="$" />
                </div>
              </div>
              <div>
                <label htmlFor="condition" className="block text-sm font-semibold text-gray-700 mb-2">Condition</label>
                <select id="condition" value={formData.condition} onChange={e => setFormData({ ...formData, condition: e.target.value })} className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent">
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map((tag, idx) => (
                    <span key={idx} className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded flex items-center gap-1">
                      {tag}
                      <button type="button" className="ml-1 text-red-500 hover:text-red-700" onClick={() => setFormData({ ...formData, tags: formData.tags.filter((_, i) => i !== idx) })}>&times;</button>
                    </span>
                  ))}
                </div>
                <Input
                  type="text"
                  value={''}
                  placeholder="Add tag and press Enter"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      setFormData({ ...formData, tags: [...formData.tags, e.currentTarget.value.trim()] });
                      e.currentTarget.value = '';
                      e.preventDefault();
                    }
                  }}
                />
              </div>
              <div>
                <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                <Textarea id="notes" value={formData.notes || ''} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Add any notes about this object..." />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Images</label>
                <div className="space-y-2">
                  {images.length > 0 ? (
                    images.map((image) => (
                      <div key={image.id} className="relative w-full bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center" style={{ minHeight: 180 }}>
                        <img src={image.preview} alt="Object image" className="w-full rounded-xl" style={{ objectFit: 'contain', width: '100%', height: 'auto', maxWidth: '100%', borderRadius: '0.75rem' }} />
                        <div className="absolute top-2 right-2 flex gap-2">
                          <button type="button" className="bg-white/90 text-gray-700 rounded px-2 py-1 text-xs shadow hover:bg-white" onClick={() => void handleEditImage(image.id)}>
                            Edit
                          </button>
                          <button type="button" className="bg-red-500 text-white rounded px-2 py-1 text-xs shadow hover:bg-red-600" onClick={() => removeImage(image.id)}>
                            Remove
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center">
                      <p className="text-gray-500">No images</p>
                    </div>
                  )}
                  <div
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'}`}
                    onDragOver={e => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={e => { e.preventDefault(); setDragActive(false); }}
                    onDrop={e => {
                      e.preventDefault();
                      setDragActive(false);
                      const files = Array.from(e.dataTransfer?.files || []).filter(file => file.type.startsWith('image/'));
                      if (files.length) {
                        openEditorWithFiles(files);
                      }
                    }}
                    onClick={() => document.getElementById('edit-image-upload-input')?.click()}
                  >
                    <input
                      id="edit-image-upload-input"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    <span className="block mt-2 text-gray-500">Drag & drop or select images to upload</span>
                  </div>
                  {imageEditorOpen && <p className="text-blue-600 mt-2">Adjusting image…</p>}
                  {uploadError && <p className="text-red-600 mt-2">{uploadError}</p>}
                </div>
              </div>
              <div className="flex items-center gap-6 mt-4">
                <span className="text-sm text-gray-700">Public</span>
                <button type="button" aria-label="Toggle Public/Private" className={`relative inline-flex h-6 w-12 rounded-full transition-colors duration-300 focus:outline-none ${formData.isPublic ? 'bg-blue-500' : 'bg-gray-300'}`} onClick={() => setFormData({ ...formData, isPublic: !formData.isPublic })}>
                  <span className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow transition-transform duration-300 ${formData.isPublic ? 'translate-x-6' : ''}`}></span>
                </button>
                <span className="text-sm text-gray-700">Collaborative</span>
                <button type="button" aria-label="Toggle Collaborative" className={`relative inline-flex h-6 w-12 rounded-full transition-colors duration-300 focus:outline-none ${formData.shareInCollaborative ? 'bg-blue-500' : 'bg-gray-300'}`} onClick={() => setFormData({ ...formData, shareInCollaborative: !formData.shareInCollaborative })}>
                  <span className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow transition-transform duration-300 ${formData.shareInCollaborative ? 'translate-x-6' : ''}`}></span>
                </button>
              </div>
              {/* Provenance Fields */}
              <div className="mt-8 grid grid-cols-1 gap-4">
                <Input
                  value={formData.serialNumber || ''}
                  onChange={e => setFormData({ ...formData, serialNumber: e.target.value })}
                  placeholder="Serial Number"
                />
                <Input
                  value={formData.acquisitionDate || ''}
                  onChange={e => setFormData({ ...formData, acquisitionDate: e.target.value })}
                  placeholder="Acquisition Date (YYYY-MM-DD)"
                />
                {/* COA image upload */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Certificate of Authenticity (Image or URL)</label>
                  <Input
                    value={typeof formData.certificateOfAuthenticity === 'string' ? formData.certificateOfAuthenticity : ''}
                    onChange={e => setFormData({ ...formData, certificateOfAuthenticity: e.target.value })}
                    placeholder="Certificate of Authenticity (URL or ref)"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setCoaFile(file);
                      }
                    }}
                    className="mt-2"
                  />
                </div>
                <Input
                  value={formData.origin || ''}
                  onChange={e => setFormData({ ...formData, origin: e.target.value })}
                  placeholder="Origin (place/manufacturer)"
                />
                <Input
                  value={formData.transferMethod || ''}
                  onChange={e => setFormData({ ...formData, transferMethod: e.target.value })}
                  placeholder="Transfer Method (sale, gift, etc.)"
                />
                <Input
                  value={formData.associatedDocuments ? formData.associatedDocuments.join(', ') : ''}
                  onChange={e => setFormData({ ...formData, associatedDocuments: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  placeholder="Associated Documents (comma separated URLs/refs)"
                />
                <Textarea
                  value={formData.provenanceNotes || ''}
                  onChange={e => setFormData({ ...formData, provenanceNotes: e.target.value })}
                  placeholder="Provenance Notes"
                  rows={2}
                />
                {/* Chain of Ownership - dynamic UI */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Chain of Ownership</label>
                  {formData.chain && formData.chain.length > 0 ? (
                    <ul className="space-y-2">
                      {formData.chain.map((entry, idx) => (
                        <li key={idx} className="flex gap-2 items-center">
                          <Input
                            value={entry.owner}
                            onChange={e => {
                              const updated = [...formData.chain!];
                              updated[idx].owner = e.target.value;
                              setFormData({ ...formData, chain: updated });
                            }}
                            placeholder="Owner"
                          />
                          <Input
                            value={entry.acquiredAt}
                            onChange={e => {
                              const updated = [...formData.chain!];
                              updated[idx].acquiredAt = e.target.value;
                              setFormData({ ...formData, chain: updated });
                            }}
                            placeholder="Date (YYYY-MM-DD)"
                          />
                          <Button type="button" variant="destructive" onClick={() => setFormData({ ...formData, chain: formData.chain!.filter((_, i) => i !== idx) })}>Remove</Button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">No chain of ownership entries</p>
                  )}
                  <Button type="button" variant="outline" className="mt-2" onClick={() => setFormData({ ...formData, chain: [...(formData.chain ?? []), { owner: '', acquiredAt: '', notes: '' }] })}>Add Entry</Button>
                </div>
                
                {/* Blockchain Anchoring Section */}
                <div className="mt-8 border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Blockchain Anchoring</h3>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm font-medium text-purple-900">Anchor on Polygon</p>
                        <p className="text-xs text-purple-700">
                          Immutable provenance verification on the blockchain
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <input
                          type="checkbox"
                          id="anchorOnChain"
                          checked={formData.anchorOnChain || false}
                          onChange={(e) => setFormData({ ...formData, anchorOnChain: e.target.checked })}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-purple-300 rounded"
                        />
                        <label htmlFor="anchorOnChain" className="text-sm font-medium text-purple-900">
                          Enable Anchoring
                        </label>
                      </div>
                    </div>
                    <div className="text-xs text-purple-700">
                      <p className="mb-2">When enabled, this Passport will be:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Cryptographically hashed and stored on Polygon</li>
                        <li>Immutable and verifiable by anyone</li>
                        <li>Updated with each edit to maintain provenance</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end mt-8">
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </>
  );
}
