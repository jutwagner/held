'use client';

import { useEffect, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { HeldObject } from '@/types';
import { subscribeObjects, updateObject } from '@/lib/firebase-services';
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Edit, Trash2, ExternalLink } from 'lucide-react';
import passportSvg from '@/img/passport.svg';

export default function ObjectDetailPage() { 
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [imageProgress, setImageProgress] = useState<{ [key: string]: number }>({});

  async function handleImageUpload(file: File) {
    setUploading(true);
    setUploadError('');
    setImageProgress(prev => ({ ...prev, [file.name]: 0 }));
    try {
      const imageRef = ref(storage, `objects/${user?.uid}/${Date.now()}_${file.name}`);
      // Use uploadBytesResumable for progress
      const uploadTask = uploadBytesResumable(imageRef, file);
      await new Promise<string>((resolve, reject) => {
        uploadTask.on('state_changed',
          (snapshot: import('firebase/storage').UploadTaskSnapshot) => {
            const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            setImageProgress(prev => ({ ...prev, [file.name]: percent }));
          },
          (error: Error) => {
            setUploadError('Image upload failed.');
            setImageProgress(prev => ({ ...prev, [file.name]: 0 }));
            reject(error);
          },
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            setFormData(prev => ({ ...prev, images: [...prev.images, url] }));
            setImageProgress(prev => ({ ...prev, [file.name]: 100 }));
            resolve(url);
          }
        );
      });
    } catch (err) {
      setUploadError('Image upload failed.');
    } finally {
      setUploading(false);
    }
  }
  const [editing, setEditing] = useState(false);
  const { user } = useAuth();
  const params = useParams();
  const pathname = usePathname();
  const [object, setObject] = useState<HeldObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  interface FormData {
  title: string;
  description: string;
  maker: string;
  condition: string;
  visibility: string;
  tags: string;
  notes: string;
  year: number | undefined;
  shareInCollaborative: boolean;
  category: string;
  images: string[];
  chain?: string;
  certificateOfAuthenticity?: string;
  }

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    maker: '',
    condition: '',
    visibility: 'Public',
    tags: '',
    notes: '',
    year: undefined,
    shareInCollaborative: false,
    category: '',
    images: [],
    chain: '',
    certificateOfAuthenticity: '',
  });
  const objectId = params?.id as string;

  useEffect(() => {
    if (!objectId) return;
    setLoading(true);
    // Fetch object by ID (one-time fetch)
    import('@/lib/firebase-services').then(mod => mod.getObject(objectId)).then(obj => {
      setObject(obj ?? null);
      setLoading(false);
    });
  }, [objectId]);

  function handleSave() {
    async function doSave() {
      try {
        setLoading(true);
        // Convert tags to array
        const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
        let chainArr: any[] = [];
        try {
          chainArr = formData.chain ? JSON.parse(formData.chain) : [];
        } catch {
          chainArr = [];
        }
        await updateObject(objectId, {
          id: objectId,
          ...formData,
          condition: formData.condition as 'excellent' | 'good' | 'fair' | 'poor',
          tags: tagsArray,
          chain: chainArr,
          certificateOfAuthenticity: formData.certificateOfAuthenticity || '',
        });
  // Object loading now handled by subscribeObjects
        setEditing(false);
      } catch (err) {
        setError('Failed to save changes.');
      } finally {
        setLoading(false);
      }
    }
    doSave();
  }
            // ...rest of component logic...
  // ...inside the main return statement, where editing UI is rendered...
  {editing && (
    <div className="bg-white rounded-xl shadow-lg p-6 animate-fade-in transition-all duration-300">
      <div className="grid grid-cols-1 gap-5">
        <div>
          <label htmlFor="title" className="block text-sm font-semibold mb-1 text-gray-700">Title</label>
          <input
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="bg-gray-50 border border-gray-300 rounded px-3 py-2 w-full text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Object title"
          />
        </div>
        <div>
          <label htmlFor="maker" className="block text-sm font-semibold mb-1 text-gray-700">Maker</label>
          <input
            id="maker"
            type="text"
            value={formData.maker}
            onChange={(e) => setFormData({ ...formData, maker: e.target.value })}
            className="bg-gray-50 border border-gray-300 rounded px-3 py-2 w-full text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Herman Miller"
          />
        </div>
        <div>
          <label htmlFor="condition" className="block text-sm font-semibold mb-1 text-gray-700">Condition</label>
          <select
            id="condition"
            value={formData.condition}
            onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
            className="bg-gray-50 border border-gray-300 rounded px-3 py-2 w-full text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="excellent">Excellent</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
          </select>
        </div>
        <div>
          <label htmlFor="visibility" className="block text-sm font-semibold mb-1 text-gray-700">Visibility</label>
          <select
            id="visibility"
            value={formData.visibility}
            onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
            className="bg-gray-50 border border-gray-300 rounded px-3 py-2 w-full text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Public">Public</option>
            <option value="Private">Private</option>
          </select>
        </div>
        <div>
          <label htmlFor="tags" className="block text-sm font-semibold mb-1 text-gray-700">Tags</label>
          <input
            id="tags"
            type="text"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            className="bg-gray-50 border border-gray-300 rounded px-3 py-2 w-full text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Comma separated tags"
          />
        </div>
        <div>
          <label htmlFor="year" className="block text-sm font-semibold mb-1 text-gray-700">Year</label>
          <input
            id="year"
            type="number"
            value={formData.year || ''}
            onChange={(e) => setFormData({ ...formData, year: e.target.value ? parseInt(e.target.value, 10) : undefined })}
            className="bg-gray-50 border border-gray-300 rounded px-3 py-2 w-full text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 1956"
          />
        </div>
        <div>
          <label htmlFor="notes" className="block text-sm font-semibold mb-1 text-gray-700">Notes</label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="bg-gray-50 border border-gray-300 rounded px-3 py-2 w-full text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Add any notes about this object..."
            rows={3}
          />
        </div>
        <div className="flex items-center space-x-2 mt-2">
          <input
            type="checkbox"
            id="shareInCollaborative"
            checked={formData.shareInCollaborative}
            onChange={(e) => setFormData({ ...formData, shareInCollaborative: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="shareInCollaborative" className="text-sm text-gray-700">
            In theCollaborative
          </label>
        </div>
      </div>
    </div>
  )}
  useEffect(() => {
    if (user && objectId) {
  // Object loading now handled by subscribeObjects
    }
  }, [user, objectId]);

  useEffect(() => {
    if (object) {
      setFormData({
        title: object.title,
        description: object.description || '',
        maker: object.maker || '',
        condition: object.condition || 'fair',
        visibility: object.isPublic ? 'Public' : 'Private',
        tags: Array.isArray(object.tags) ? object.tags.join(', ') : '',
        notes: object.notes || '',
        year: object.year ?? undefined,
        shareInCollaborative: object.shareInCollaborative ?? false,
        category: object.category || '',
        images: object.images || [],
        chain: object.chain ? JSON.stringify(object.chain, null, 2) : '',
        certificateOfAuthenticity: object.certificateOfAuthenticity || '',
      });
    }
  }, [object]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        <div className="held-container py-24">
          <div className="text-center">
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }
  if (error || !object) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        <div className="held-container py-24">
          <div className="text-center">
            <p className="text-red-600 font-mono">{error || 'Object not found'}</p>
            {error && (
              <pre className="bg-gray-100 text-xs text-red-700 p-2 rounded mt-2 overflow-x-auto">
                {error}
              </pre>
            )}
            <Button asChild className="mt-4">
              <Link href="/registry">Back to Registry</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="held-container py-8">
        {/* Header - always show title, never double header */}
        {!(pathname && pathname.includes('/edit')) && (
          <div className="flex items-center justify-between mb-8">
            <div className="flex flex-col items-start w-full">
              <Button variant="ghost" asChild className="mb-2 pl-2 -ml-2">
                <Link href="/registry" className="flex items-center">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Registry
                </Link>
              </Button>
              <h1 className="text-2xl font-bold text-gray-900 mb-1 font-serif">
                {formData.title || <span className="text-gray-400 italic">Untitled Object</span>}
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              {object && user && object.userId === user.uid && (
                <>
                    {object && object.isPublic && (
                      <Button variant="outline" asChild>
                        <Link href={`/passport/${object.slug}`} target="_blank" className="whitespace-nowrap flex items-center">
                          <Image src={passportSvg} alt="Passport" width={20} height={20} className="mr-2" />
                          Passport
                        </Link>
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => setEditing(!editing)}>
                      <Edit className="h-4 w-4 mr-2" />
                      {editing ? 'Cancel' : 'Edit'}
                    </Button>
                    <Button
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      onClick={async () => {
                        setLoading(true);
                        setError('');
                        try {
                          await import('@/lib/firebase-services').then(mod => mod.deleteObject(objectId));
                          window.location.href = '/registry';
                        } catch (err) {
                          setError('Failed to delete object.');
                        } finally {
                          setLoading(false);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                </>
              )}
  {/* ...existing code... */}
            </div>
          </div>
        )}
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Images */}
          <div>
            <h2 className="text-lg font-medium mb-4">Images</h2>
            {editing ? (
              <div className="space-y-4">
                {formData.images.length > 0 ? (
                  formData.images.map((image, index) => (
                    <div key={index} className="relative w-full bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center group" style={{ minHeight: 260 }}>
                      <Image
                        src={image}
                        alt={`Image ${index + 1}`}
                        width={800}
                        height={1200}
                        className="w-full rounded-xl transition-transform duration-200 group-hover:scale-105"
                        style={{ objectFit: 'contain', width: '100%', height: 'auto', maxWidth: '100%', borderRadius: '0.75rem' }}
                      />
                      <button
                        type="button"
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600 opacity-80 group-hover:opacity-100 transition-opacity"
                        onClick={() => setFormData({ ...formData, images: formData.images.filter((_, i) => i !== index) })}
                        aria-label="Delete image"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">No images</p>
                  </div>
                )}
                <div
                  className={`mt-4 border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors duration-200 ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'}`}
                  onDragOver={e => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={e => { e.preventDefault(); setDragActive(false); }}
                  onDrop={e => {
                    e.preventDefault(); setDragActive(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                  onClick={() => document.getElementById('image-upload-input')?.click()}
                  tabIndex={0}
                  role="button"
                  aria-label="Upload image"
                >
                  <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" className="mb-2 text-blue-500" viewBox="0 0 24 24"><path d="M12 16v-8m0 0l-4 4m4-4l4 4"/><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                  <span className="text-gray-700 font-medium">Drag & drop or click to upload</span>
                  <input
                    id="image-upload-input"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                  />
                  {uploading && <p className="text-blue-600 mt-2">Uploading...</p>}
                  {uploadError && <p className="text-red-600 mt-2">{uploadError}</p>}
                </div>
              </div>
            ) : (
              object && object.images.length > 0 ? (
                <div className="space-y-4">
                  {object.images.map((image, index) => (
                    <div key={index} className="w-full bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center" style={{ minHeight: 260 }}>
                      <Image
                        src={image}
                        alt={`${object.title} - Image ${index + 1}`}
                        width={800}
                        height={1200}
                        className="w-full rounded-xl"
                        style={{ objectFit: 'contain', width: '100%', height: 'auto', maxWidth: '100%', borderRadius: '0.75rem' }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">No images</p>
                </div>
              )
            )}
          </div>
          {/* Details */}
          <div className="space-y-6">
            {editing ? (
              <>
                <label className="block text-sm font-semibold mb-1 text-gray-700">Description</label>
                <textarea
                  className="bg-gray-50 border border-gray-300 rounded px-3 py-2 w-full text-base focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description"
                  rows={3}
                />
                <label className="block text-sm font-semibold mb-1 text-gray-700">Maker</label>
                <input
                  className="bg-gray-50 border border-gray-300 rounded px-3 py-2 w-full text-base focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                  value={formData.maker}
                  onChange={e => setFormData({ ...formData, maker: e.target.value })}
                  placeholder="Maker"
                />
                <label className="block text-sm font-semibold mb-1 text-gray-700">Condition</label>
                <select
                  className="bg-gray-50 border border-gray-300 rounded px-3 py-2 w-full text-base focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                  value={formData.condition}
                  onChange={e => setFormData({ ...formData, condition: e.target.value })}
                >
                  <option value="">Condition</option>
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
                <label className="block text-sm font-semibold mb-1 text-gray-700">Category</label>
                <input
                  className="bg-gray-50 border border-gray-300 rounded px-3 py-2 w-full text-base focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Category"
                />
                <label className="block text-sm font-semibold mb-1 text-gray-700">Tags</label>
                <input
                  className="bg-gray-50 border border-gray-300 rounded px-3 py-2 w-full text-base focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                  value={formData.tags}
                  onChange={e => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="Comma separated tags"
                />
                <label className="block text-sm font-semibold mb-1 text-gray-700">Notes</label>
                <textarea
                  className="bg-gray-50 border border-gray-300 rounded px-3 py-2 w-full text-base focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notes"
                  rows={2}
                />
                <label className="block text-sm font-semibold mb-1 text-gray-700">Year</label>
                <input
                  className="bg-gray-50 border border-gray-300 rounded px-3 py-2 w-full text-base focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                  type="number"
                  value={formData.year || ''}
                  onChange={e => setFormData({ ...formData, year: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                  placeholder="Year"
                />
                <div className="flex items-center space-x-4 mt-2 mb-2">
                  <label className="flex items-center cursor-pointer">
                    <span className="mr-2 text-sm text-gray-700">Public</span>
                    <input
                      type="checkbox"
                      checked={formData.visibility === 'Public'}
                      onChange={e => setFormData({ ...formData, visibility: e.target.checked ? 'Public' : 'Private' })}
                      className="sr-only"
                    />
                    <span className={`relative inline-block w-10 h-6 rounded-full transition bg-gray-300 ${formData.visibility === 'Public' ? 'bg-blue-500' : ''}`}>
                      <span className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${formData.visibility === 'Public' ? 'translate-x-4' : ''}`}></span>
                    </span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <span className="mr-2 text-sm text-gray-700">Share in Collaborative</span>
                    <input
                      type="checkbox"
                      checked={formData.shareInCollaborative}
                      onChange={e => setFormData({ ...formData, shareInCollaborative: e.target.checked })}
                      className="sr-only"
                    />
                    <span className={`relative inline-block w-10 h-6 rounded-full transition bg-gray-300 ${formData.shareInCollaborative ? 'bg-blue-500' : ''}`}>
                      <span className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${formData.shareInCollaborative ? 'translate-x-4' : ''}`}></span>
                    </span>
                  </label>
                </div>
                {/* Provenance (Held+) */}
                {user?.premium?.active && user?.premium?.plan === 'plus' && (
                  <>
                    <label className="block text-sm font-semibold mb-1 text-gray-700">Chain of Ownership</label>
                    <textarea
                      className="bg-gray-50 border border-gray-300 rounded px-3 py-2 w-full text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                      value={formData.chain || ''}
                      onChange={e => setFormData({ ...formData, chain: e.target.value })}
                      placeholder='[{"owner":"Name","acquiredAt":"YYYY-MM-DD","notes":""}]'
                      rows={2}
                    />
                    <label className="block text-sm font-semibold mb-1 text-gray-700">Certificate of Authenticity (COA)</label>
                    <input
                      className="bg-gray-50 border border-gray-300 rounded px-3 py-2 w-full text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                      value={formData.certificateOfAuthenticity || ''}
                      onChange={e => setFormData({ ...formData, certificateOfAuthenticity: e.target.value })}
                      placeholder='COA URL or description'
                    />
                  </>
                )}
              </>
            ) : (
              <>
                <p className="text-gray-600">{object?.description || <span className="text-gray-400 italic">Description</span>}</p>
                <p className="text-gray-600">Maker: {object?.maker || <span className="text-gray-400 italic">Maker</span>}</p>
                <p className="text-gray-600">Condition: {object?.condition || <span className="text-gray-400 italic">Condition</span>}</p>
                <p className="text-gray-600">Category: {object?.category || <span className="text-gray-400 italic">Category</span>}</p>
                <p className="flex items-center text-gray-600">
                  <span className="flex items-center mr-4">
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1 text-blue-500" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M2.05 12a9.94 9.94 0 0 1 19.9 0 9.94 9.94 0 0 1-19.9 0z"/></svg>
                    {object?.isPublic ? (
                      <span className="text-green-600">Public</span>
                    ) : (
                      <span className="text-red-600">Private</span>
                    )}
                  </span>
                  <span className="flex items-center">
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1 text-blue-500" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M2.05 12a9.94 9.94 0 0 1 19.9 0 9.94 9.94 0 0 1-19.9 0z"/></svg>
                    {object?.shareInCollaborative ? (
                      <span className="text-green-600">Shared in Collaborative</span>
                    ) : (
                      <span className="text-gray-500">Not Shared</span>
                    )}
                  </span>
                </p>
                {Array.isArray(object?.tags) && object.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {object.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Tags</p>
                )}
                <p className="text-gray-600">Notes: {object?.notes || <span className="text-gray-400 italic">Notes</span>}</p>
                <p className="text-gray-600">Year: {object?.year || <span className="text-gray-400 italic">Year</span>}</p>
                <p className="text-gray-600">
                  In theCollaborative: {object?.shareInCollaborative ? 'Yes' : 'No'}
                </p>
                {/* Provenance (Held+) */}
                {user?.premium?.active && user?.premium?.plan === 'plus' && (
                  <>
                    {/* Chain of Ownership (always visible) */}
                    <div className="mt-2">
                      <span className="font-semibold text-xs text-blue-700">Chain of Ownership:</span>
                      {Array.isArray(object?.chain) && object.chain.length > 0 ? (
                        <ul className="mt-1 mb-2 text-xs text-gray-700">
                          {object.chain.map((owner, idx) => (
                            <li key={idx} className="flex gap-2 items-center">
                              <span className="font-mono">{owner.owner || <span className="text-gray-400 italic">Unknown</span>}</span>
                              <span className="text-gray-500">{owner.acquiredAt ? `(${owner.acquiredAt})` : ''}</span>
                              {owner.notes && <span className="text-gray-400">{owner.notes}</span>}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-gray-400 italic ml-2">No chain of ownership</span>
                      )}
                    </div>
                    {/* Certificate of Authenticity (always visible) */}
                    <div className="mt-2">
                      <span className="font-semibold text-xs text-blue-700">COA:</span>
                      {object?.certificateOfAuthenticity ? (
                        typeof object.certificateOfAuthenticity === 'string' && object.certificateOfAuthenticity.startsWith('http') ? (
                          <a href={object.certificateOfAuthenticity} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline ml-2">View Certificate</a>
                        ) : typeof object.certificateOfAuthenticity === 'string' ? (
                          <span className="ml-2">{object.certificateOfAuthenticity}</span>
                        ) : (
                          <span className="ml-2">[Image uploaded]</span>
                        )
                      ) : (
                        <span className="text-gray-400 italic ml-2">No certificate</span>
                      )}
                    </div>
                  </>
                )}
                <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg font-mono">
                  <p>Created: {object ? new Date(object.createdAt).toLocaleDateString() : ''}</p>
                  <p>Updated: {object ? new Date(object.updatedAt).toLocaleDateString() : ''}</p>
                  <p>ID: {object?.id}</p>
                  <p>Slug: {object?.slug}</p>
                </div>
              </>
            )}
          </div>
        </div>
        {/* Inline Editing Section */}
        {editing && (
          <div className="flex justify-end mt-4">
            <button
              onClick={handleSave}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Save
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
