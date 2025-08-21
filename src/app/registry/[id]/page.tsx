'use client';

import { useEffect, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { HeldObject } from '@/types';
import { getObject, updateObject } from '@/lib/firebase-services';
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Edit, Trash2, ExternalLink } from 'lucide-react';

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
          (snapshot: any) => {
            const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            setImageProgress(prev => ({ ...prev, [file.name]: percent }));
          },
          (error: any) => {
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
  });
  const objectId = params?.id as string;

  async function loadObject() {
    try {
      setLoading(true);
      setError('');
      const obj = await getObject(objectId);
      setObject(obj);
    } catch (error: unknown) {
      let errorMsg = 'Failed to load object.';
      if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMsg += ` ${(error as { message?: string }).message}`;
      } else {
        errorMsg += ` ${(error as string)}`;
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  function handleSave() {
    async function doSave() {
      try {
        setLoading(true);
        // Convert tags to array
        const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
        await updateObject(objectId, {
          id: objectId,
          ...formData,
          condition: formData.condition as 'excellent' | 'good' | 'fair' | 'poor',
          tags: tagsArray,
        });
        await loadObject();
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
      loadObject();
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
              {object!.isPublic && (
                <Button variant="outline" asChild>
                  <Link href={`/passport/${object!.slug}`} target="_blank" className="whitespace-nowrap flex items-center">
                    <Image src={require('@/img/passport.svg')} alt="Passport" width={20} height={20} className="mr-2" />
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
                onClick={() => setEditing(false)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Images */}
          <div>
            <h2 className="text-lg font-medium mb-4">Images</h2>
            {editing ? (
              <div className="space-y-4">
                {formData.images && formData.images.length > 0 ? (
                  formData.images.map((image: string, index: number) => (
                    <div key={index} className="relative w-full bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center" style={{ minHeight: 260 }}>
                      <Image
                        src={image}
                        alt={`Image ${index + 1}`}
                        width={800}
                        height={1200}
                        className="w-full rounded-xl"
                        style={{ objectFit: 'contain', width: '100%', height: 'auto', maxWidth: '100%', borderRadius: '0.75rem' }}
                      />
                      <button
                        type="button"
                        className="absolute top-2 right-2 bg-red-500 text-white rounded px-2 py-1 text-xs shadow hover:bg-red-600"
                        onClick={() => {
                          const newImages = formData.images.filter((_: string, i: number) => i !== index);
                          setFormData({ ...formData, images: newImages });
                        }}
                      >Remove</button>
                    </div>
                  ))
                ) : (
                  <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center">
                    <p className="text-gray-500">No images</p>
                  </div>
                )}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Add or Replace Image</label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'}`}
                    onDragOver={e => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={e => { e.preventDefault(); setDragActive(false); }}
                    onDrop={async e => {
                      e.preventDefault(); setDragActive(false);
                      const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
                      for (const file of files) {
                        await handleImageUpload(file);
                      }
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      disabled={uploading}
                      onChange={async (e) => {
                        const files = Array.from(e.target.files ?? []).filter(f => f.type.startsWith('image/'));
                        for (const file of files) {
                          await handleImageUpload(file);
                        }
                      }}
                    />
                    <span className="block mt-2 text-gray-500">Drag & drop or select images to upload</span>
                  </div>
                  {uploading && (
                    <div className="mt-2 space-y-1">
                      {Object.entries(imageProgress).map(([name, percent]) => (
                        <div key={name} className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{name}</span>
                          <div className="w-32 h-2 bg-gray-200 rounded">
                            <div className="h-2 bg-blue-500 rounded" style={{ width: `${percent}%` }}></div>
                          </div>
                          <span className="text-xs text-gray-700">{percent}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {uploadError && <p className="text-red-600 mt-2">{uploadError}</p>}
                </div>
              </div>
            ) : (
              <>
                {object!.images.length > 0 ? (
                  <div className="space-y-4">
                    {object!.images.map((image, index) => (
                      <div key={index} className="w-full bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center" style={{ minHeight: 260 }}>
                        <Image
                          src={image}
                          alt={`${object!.title} - Image ${index + 1}`}
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
                )}
              </>
            )}
          </div>
          {/* Details */}
          <div className="space-y-6">
            {editing ? (
              <>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="font-mono bg-gray-100 border border-gray-300 rounded px-2 py-1 w-full"
                  placeholder={formData.title ? '' : 'Title'}
                />
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="font-mono bg-gray-100 border border-gray-300 rounded px-2 py-1 w-full"
                  placeholder={formData.description ? '' : 'Description'}
                />
                <input
                  type="text"
                  value={formData.maker}
                  onChange={(e) => setFormData({ ...formData, maker: e.target.value })}
                  className="font-mono bg-gray-100 border border-gray-300 rounded px-2 py-1 w-full"
                  placeholder={formData.maker ? '' : 'Maker'}
                />
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-sm text-gray-700">Condition:</span>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                    className="font-mono bg-gray-100 border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-sm text-gray-700">Public</span>
                  <button
                    type="button"
                    aria-label="Toggle Public/Private"
                    className={`relative inline-flex h-6 w-12 rounded-full transition-colors duration-300 focus:outline-none ${formData.visibility === 'Public' ? 'bg-blue-500' : 'bg-gray-300'}`}
                    onClick={() => setFormData({ ...formData, visibility: formData.visibility === 'Public' ? 'Private' : 'Public' })}
                  >
                    <span className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow transition-transform duration-300 ${formData.visibility === 'Public' ? 'translate-x-6' : ''}`}></span>
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="font-mono bg-gray-100 border border-gray-300 rounded px-2 py-1 w-full"
                  placeholder={formData.tags ? '' : 'Tags'}
                />
                <input
                  type="number"
                  value={formData.year || ''}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                  className="font-mono bg-gray-100 border border-gray-300 rounded px-2 py-1 w-full"
                  placeholder={formData.year ? '' : 'Year'}
                />
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="font-mono bg-gray-100 border border-gray-300 rounded px-2 py-1 w-full"
                  placeholder={formData.notes ? '' : 'Notes'}
                />
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-sm text-gray-700">Collaborative</span>
                  <button
                    type="button"
                    aria-label="Toggle Collaborative"
                    className={`relative inline-flex h-6 w-12 rounded-full transition-colors duration-300 focus:outline-none ${formData.shareInCollaborative ? 'bg-blue-500' : 'bg-gray-300'}`}
                    onClick={() => setFormData({ ...formData, shareInCollaborative: !formData.shareInCollaborative })}
                  >
                    <span className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow transition-transform duration-300 ${formData.shareInCollaborative ? 'translate-x-6' : ''}`}></span>
                  </button>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-sm text-gray-700">Category</span>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="font-mono bg-gray-100 border border-gray-300 rounded px-2 py-1 w-full"
                  >
                    <option value="">Select category</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Lighting">Lighting</option>
                    <option value="Art">Art</option>
                    <option value="Decor">Decor</option>
                    <option value="Textiles">Textiles</option>
                    <option value="Books">Books</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </>
            ) : (
              <>
                <p className="text-gray-600">{object!.description || <span className="text-gray-400 italic">No description</span>}</p>
                <p className="text-gray-600">Maker: {object!.maker || <span className="text-gray-400 italic">No maker</span>}</p>
                <p className="text-gray-600">Condition: {object!.condition || <span className="text-gray-400 italic">No condition</span>}</p>
                <p className="text-gray-600">Category: {object!.category || <span className="text-gray-400 italic">No category</span>}</p>
                <p className="flex items-center text-gray-600">
                  {object!.isPublic ? (
                    <span className="text-green-600 flex items-center">
                      <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm3.707 6.293a1 1 0 00-1.414 0L9 11.586 7.707 10.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 000-1.414z" />
                      </svg>
                      Public
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center">
                      <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm3.707 6.293a1 1 0 00-1.414 0L9 11.586 7.707 10.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 000-1.414z" />
                      </svg>
                      Private
                    </span>
                  )}
                </p>
                {Array.isArray(object!.tags) && object!.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {object!.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No tags available</p>
                )}
                <p className="text-gray-600">Notes: {object!.notes || <span className="text-gray-400 italic">No notes</span>}</p>
                <p className="text-gray-600">
                  In theCollaborative: {object!.shareInCollaborative ? 'Yes' : 'No'}
                </p>
              </>
            )}
            <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg font-mono">
              <p>Created: {new Date(object!.createdAt).toLocaleDateString()}</p>
              <p>Updated: {new Date(object!.updatedAt).toLocaleDateString()}</p>
              <p>ID: {object!.id}</p>
              <p>Slug: {object!.slug}</p>
            </div>





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
