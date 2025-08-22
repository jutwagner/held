"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

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
  chain?: string; // JSON string for now
  serialNumber?: string;
  acquisitionDate?: string;
  certificateOfAuthenticity?: string;
  origin?: string;
  conditionHistory?: string; // JSON string for now
  transferMethod?: string;
  associatedDocuments?: string;
  provenanceNotes?: string;
};

const EditObjectPage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const objectId = params.get('id');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<UpdateObjectData | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [coaFile, setCoaFile] = useState<File | null>(null);

  useEffect(() => {
    async function fetchObject() {
      if (!objectId) return;
      setLoading(true);
      try {
        const obj = await import('@/lib/firebase-services').then(mod => mod.getObject(objectId));
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
            chain: obj.chain ? JSON.stringify(obj.chain, null, 2) : '',
            serialNumber: obj.serialNumber || '',
            acquisitionDate: typeof obj.acquisitionDate === 'string' ? obj.acquisitionDate : (obj.acquisitionDate instanceof Date ? obj.acquisitionDate.toISOString().slice(0, 10) : ''),
            certificateOfAuthenticity: obj.certificateOfAuthenticity || '',
            origin: obj.origin || '',
            conditionHistory: obj.conditionHistory ? JSON.stringify(obj.conditionHistory, null, 2) : '',
            transferMethod: obj.transferMethod || '',
            associatedDocuments: Array.isArray(obj.associatedDocuments) ? obj.associatedDocuments.join(', ') : '',
            provenanceNotes: obj.provenanceNotes || '',
          });
        }
      } catch {
        setFormData(null);
      } finally {
        setLoading(false);
      }
    }
    fetchObject();
  }, [objectId]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploading(true);
    setUploadError(null);
    try {
      // Optionally compress/convert images here
      setFormData(prev => prev ? { ...prev, images: [...prev.images, ...files.map(f => URL.createObjectURL(f))] } : prev);
    } catch (err) {
      setUploadError('Image upload failed');
    } finally {
      setUploading(false);
    }
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
      await import('@/lib/firebase-services').then(mod => mod.updateObject(objectId, {
        ...formData,
        id: objectId,
        condition: formData.condition as 'excellent' | 'good' | 'fair' | 'poor',
        chain: formData.chain ? JSON.parse(formData.chain) : [],
        serialNumber: formData.serialNumber,
        acquisitionDate: formData.acquisitionDate,
        certificateOfAuthenticity: coaUrl,
        origin: formData.origin,
        conditionHistory: formData.conditionHistory ? JSON.parse(formData.conditionHistory) : [],
        transferMethod: formData.transferMethod,
        associatedDocuments: (formData.associatedDocuments ?? '').split(',').map(s => s.trim()).filter(Boolean),
        provenanceNotes: formData.provenanceNotes,
      }));
      router.push(`/registry/${objectId}`);
    } catch (err) {
      setUploadError('Failed to save changes');
    } finally {
      setLoading(false);
    }
  };

  if (!formData) return <div className="held-container py-8">Loading…</div>;

  return (
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
                <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                <select id="category" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} required className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent">
                  <option value="" disabled>Select category</option>
                  <option value="Furniture">Furniture</option>
                  <option value="Lighting">Lighting</option>
                  <option value="Art">Art</option>
                  <option value="Decor">Decor</option>
                  <option value="Textiles">Textiles</option>
                  <option value="Books">Books</option>
                  <option value="Other">Other</option>
                </select>
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
                  {formData.images.length > 0 ? (
                    formData.images.map((image, idx) => (
                      <div key={idx} className="relative w-full bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center" style={{ minHeight: 180 }}>
                        <img src={image} alt={`Image ${idx + 1}`} className="w-full rounded-xl" style={{ objectFit: 'contain', width: '100%', height: 'auto', maxWidth: '100%', borderRadius: '0.75rem' }} />
                        <button type="button" className="absolute top-2 right-2 bg-red-500 text-white rounded px-2 py-1 text-xs shadow hover:bg-red-600" onClick={() => setFormData({ ...formData, images: formData.images.filter((_, i) => i !== idx) })}>Remove</button>
                      </div>
                    ))
                  ) : (
                    <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center">
                      <p className="text-gray-500">No images</p>
                    </div>
                  )}
                  <div className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'}`}
                    onDragOver={e => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={e => { e.preventDefault(); setDragActive(false); }}
                    onDrop={e => { e.preventDefault(); setDragActive(false); /* TODO: handle image upload */ }}>
                    <input type="file" accept="image/*" multiple className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" disabled={uploading} onChange={e => { /* TODO: handle image upload */ }} />
                    <span className="block mt-2 text-gray-500">Drag & drop or select images to upload</span>
                  </div>
                  {uploading && <p className="text-blue-600 mt-2">Uploading...</p>}
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
                  value={formData.associatedDocuments || ''}
                  onChange={e => setFormData({ ...formData, associatedDocuments: e.target.value })}
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
                  {(() => {
                    let chainArr: any[] = [];
                    try { chainArr = formData.chain ? JSON.parse(formData.chain) : []; } catch { chainArr = []; }
                    return (
                      <>
                        {chainArr.length === 0 && (
                          <p className="text-gray-400 italic mb-2">No chain of ownership yet.</p>
                        )}
                        {chainArr.map((owner, idx) => (
                          <div key={idx} className="flex gap-2 mb-2 items-center">
                            <Input
                              value={owner.owner || ''}
                              onChange={e => {
                                const updated = [...chainArr];
                                updated[idx].owner = e.target.value;
                                setFormData(prev => prev ? { ...prev, chain: JSON.stringify(updated, null, 2) } : prev);
                              }}
                              placeholder="Owner name"
                            />
                            <Input
                              type="date"
                              value={owner.acquiredAt || ''}
                              onChange={e => {
                                const updated = [...chainArr];
                                updated[idx].acquiredAt = e.target.value;
                                setFormData(prev => prev ? { ...prev, chain: JSON.stringify(updated, null, 2) } : prev);
                              }}
                              placeholder="Acquisition date"
                            />
                            <Input
                              value={owner.notes || ''}
                              onChange={e => {
                                const updated = [...chainArr];
                                updated[idx].notes = e.target.value;
                                setFormData(prev => prev ? { ...prev, chain: JSON.stringify(updated, null, 2) } : prev);
                              }}
                              placeholder="Notes"
                            />
                            <Button type="button" variant="outline" onClick={() => {
                              const updated = chainArr.filter((_, i) => i !== idx);
                              setFormData(prev => prev ? { ...prev, chain: JSON.stringify(updated, null, 2) } : prev);
                            }}>Remove</Button>
                          </div>
                        ))}
                        <Button type="button" variant="outline" onClick={() => {
                          const updated = [...chainArr, { owner: '', acquiredAt: '', notes: '' }];
                          setFormData(prev => prev ? { ...prev, chain: JSON.stringify(updated, null, 2) } : prev);
                        }}>
                          + Add Owner
                        </Button>
                      </>
                    );
                  })()}
                </div>
                <Textarea
                  value={formData.conditionHistory || ''}
                  onChange={e => setFormData({ ...formData, conditionHistory: e.target.value })}
                  placeholder='Condition History (JSON: [{"date":"YYYY-MM-DD","condition":"good","notes":""}])'
                  rows={2}
                />
              </div>
              <div className="flex justify-end mt-8">
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

// Removed DisplayObjectDetails, now handled in main form

export default EditObjectPage;