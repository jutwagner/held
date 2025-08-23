'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { isHeldPlus } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createObject } from '@/lib/firebase-services';
import { CreateObjectData } from '@/types';
import { ArrowLeft, Upload, X, Plus } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function NewObjectPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<CreateObjectData>({
    title: '',
    maker: '',
    year: undefined,
    value: undefined,
    category: '',
    condition: 'good',
    tags: [],
    notes: '',
    images: [],
    isPublic: false,
    shareInCollaborative: false, // New field
  });

  const [newTag, setNewTag] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || typeof user.uid !== 'string') return;

    if (!formData.title.trim() || !formData.category) {
      return;
    }

    setLoading(true);

    try {
      const result = await createObject(user.uid, formData);
      console.log('Object created:', result);
      router.push('/registry');
    } catch (err) {
      console.error('Error creating object:', err);
      if (err instanceof Error) {
        console.error('Error message:', err.message);
        if (err.stack) console.error('Stack:', err.stack);
      } else {
        console.error('Error details:', JSON.stringify(err));
      }
      alert('Failed to create object. See console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...files]
    }));
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="held-container py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button variant="ghost" asChild className="mr-4">
            <Link href="/registry">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Registry
            </Link>
          </Button>
          <h1 className="text-3xl font-serif font-medium">Add New Object</h1>
        </div>

        <div className="max-w-2xl">
          <div className="held-card p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error display removed */}

              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                  placeholder="e.g., Vintage Eames Lounge Chair"
                />
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  required
                  className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                >
                  <option value="" disabled>Select a category</option>
                  <option value="Audio">Audio</option>
                  <option value="Bicycles">Bicycles</option>
                  <option value="Photography">Photography</option>
                  <option value="Art">Art</option>
                  <option value="Design">Design</option>
                  <option value="Furniture">Furniture</option>
                  <option value="Lighting">Lighting</option>
                  <option value="Books">Books</option>
                  <option value="Watches">Watches</option>
                  <option value="Instruments">Instruments</option>
                  <option value="Fashion">Fashion</option>
                  <option value="Technology">Technology</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                </select>
              </div>

              {/* Maker */}
              <div>
                <label htmlFor="maker" className="block text-sm font-medium text-gray-700 mb-2">
                  Maker
                </label>
                <Input
                  id="maker"
                  value={formData.maker}
                  onChange={(e) => setFormData(prev => ({ ...prev, maker: e.target.value }))}
                  placeholder="e.g., Herman Miller, Charles & Ray Eames"
                />
              </div>

              {/* Year and Value */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
                    Year
                  </label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      year: e.target.value ? parseInt(e.target.value) : undefined 
                    }))}
                    placeholder="e.g., 1956"
                  />
                </div>
                <div>
                  <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-2">
                    Value
                  </label>
                  <Input
                    id="value"
                    type="number"
                    step="0.01"
                    value={formData.value || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      value: e.target.value ? parseFloat(e.target.value) : undefined 
                    }))}
                    placeholder="e.g., 5000.00"
                  />
                </div>
              </div>

              {/* Condition */}
              <div>
                <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-2">
                  Condition
                </label>
                <select
                  id="condition"
                  value={formData.condition}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    condition: e.target.value as CreateObjectData["condition"] 
                  }))}
                  className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" onClick={addTag} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-sm text-gray-700 rounded-full flex items-center gap-2"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add any additional notes about this object..."
                  rows={4}
                />
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Images
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">
                    Upload images of your object
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload">
                    <Button type="button" variant="outline" asChild>
                      <span>Choose Files</span>
                    </Button>
                  </label>
                </div>
                {formData.images.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                    {formData.images.map((file, index) => (
                      <div key={index} className="relative">
                        <Image
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          width={256}
                          height={128}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                  Make this object public (creates a shareable passport)
                </label>
              </div>

              {/* Share in theCollaborative */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="shareInCollaborative"
                  checked={formData.shareInCollaborative}
                  onChange={(e) => setFormData(prev => ({ ...prev, shareInCollaborative: e.target.checked }))}
                  className="h-4 w-4 text-gray-900 focus:ring-gray-500 border-gray-300 rounded"
                />
                <label htmlFor="shareInCollaborative" className="text-sm text-gray-700">
                  Share this object in theCollaborative
                </label>
              </div>
              {/* Held+ Provenance Section */}
              {isHeldPlus(user) ? (
                <div className="mt-8 border-t pt-8">
                  <h2 className="text-lg font-bold mb-4 text-blue-700">Provenance (Held+)</h2>
                  {/* ...existing provenance fields UI... */}
                  {/* Serial Number, Acquisition Date, COA, Origin, etc. */}
                  <Input
                    value={formData.serialNumber || ''}
                    onChange={e => setFormData(prev => ({ ...prev, serialNumber: e.target.value }))}
                    placeholder="Serial Number"
                  />
                  <Input
                    value={formData.acquisitionDate || ''}
                    onChange={e => setFormData(prev => ({ ...prev, acquisitionDate: e.target.value }))}
                    placeholder="Acquisition Date (YYYY-MM-DD)"
                  />
                  {/* COA image upload */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Certificate of Authenticity (Image or URL)</label>
                    <Input
                      value={formData.certificateOfAuthenticity || ''}
                      onChange={e => setFormData(prev => ({ ...prev, certificateOfAuthenticity: e.target.value }))}
                      placeholder="Certificate of Authenticity (URL or ref)"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // You should upload the file and get a URL, but for now just set a placeholder string
                          setFormData(prev => ({ ...prev, certificateOfAuthenticity: '[Image uploaded]' }));
                        }
                      }}
                      className="mt-2"
                    />
                  </div>
                  <Input
                    value={formData.origin || ''}
                    onChange={e => setFormData(prev => ({ ...prev, origin: e.target.value }))}
                    placeholder="Origin (place/manufacturer)"
                  />
                  <Input
                    value={formData.transferMethod || ''}
                    onChange={e => setFormData(prev => ({ ...prev, transferMethod: e.target.value }))}
                    placeholder="Transfer Method (sale, gift, etc.)"
                  />
                  <Input
                    value={formData.associatedDocuments ? formData.associatedDocuments.join(', ') : ''}
                    onChange={e => setFormData(prev => ({ ...prev, associatedDocuments: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                    placeholder="Associated Documents (comma separated URLs/refs)"
                  />
                  <Textarea
                    value={formData.provenanceNotes || ''}
                    onChange={e => setFormData(prev => ({ ...prev, provenanceNotes: e.target.value }))}
                    placeholder="Provenance Notes"
                    rows={2}
                  />
                  {/* Chain of Ownership - dynamic UI */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Chain of Ownership</label>
                    {Array.isArray(formData.chain) && formData.chain.length === 0 && (
                      <p className="text-gray-400 italic mb-2">No chain of ownership yet.</p>
                    )}
                    {(Array.isArray(formData.chain) ? formData.chain : []).map((owner, idx) => (
                      <div key={idx} className="flex gap-2 mb-2 items-center">
                        <Input
                          value={owner.owner || ''}
                          onChange={e => {
                            const updated = Array.isArray(formData.chain) ? [...formData.chain] : [];
                            updated[idx].owner = e.target.value;
                            setFormData(prev => ({ ...prev, chain: updated }));
                          }}
                          placeholder="Owner name"
                        />
                        <Input
                          type="date"
                          value={owner.acquiredAt || ''}
                          onChange={e => {
                            const updated = Array.isArray(formData.chain) ? [...formData.chain] : [];
                            updated[idx].acquiredAt = e.target.value;
                            setFormData(prev => ({ ...prev, chain: updated }));
                          }}
                          placeholder="Acquisition date"
                        />
                        <Input
                          value={owner.notes || ''}
                          onChange={e => {
                            const updated = Array.isArray(formData.chain) ? [...formData.chain] : [];
                            updated[idx].notes = e.target.value;
                            setFormData(prev => ({ ...prev, chain: updated }));
                          }}
                          placeholder="Notes"
                        />
                        <Button type="button" variant="outline" onClick={() => {
                          setFormData(prev => ({ ...prev, chain: Array.isArray(prev.chain) ? prev.chain.filter((_, i) => i !== idx) : [] }));
                        }}>Remove</Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={() => {
                      setFormData(prev => ({ ...prev, chain: [...(Array.isArray(prev.chain) ? prev.chain : []), { owner: '', acquiredAt: '', notes: '' }] }));
                    }}>
                      + Add Owner
                    </Button>
                  </div>
                  {/* Condition History - simple JSON for now */}
                  <Textarea
                    value={JSON.stringify(Array.isArray(formData.conditionHistory) ? formData.conditionHistory : [], null, 2)}
                    onChange={e => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        if (Array.isArray(parsed)) {
                          setFormData(prev => ({ ...prev, conditionHistory: parsed }));
                        }
                      } catch {
                        // ignore parse errors
                      }
                    }}
                    placeholder='Condition History (JSON: [{"date":"YYYY-MM-DD","condition":"good","notes":""}])'
                    rows={2}
                  />
                </div>
              ) : (
                <div className="mt-8 border-t pt-8 relative select-none">
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm" style={{ pointerEvents: 'auto' }}>
                    <span className="text-gray-700 text-base font-semibold mb-2">Held+ Provenance</span>
                    <Link
                      href="/settings/premium"
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition-all text-sm"
                      style={{ pointerEvents: 'auto' }}
                    >
                      Upgrade to Held+
                    </Link>
                    <span className="text-gray-500 text-xs mt-2">Unlock provenance tracking, chain of ownership, COA, and more.</span>
                  </div>
                  <div className="blur pointer-events-none select-none">
                    <h2 className="text-lg font-bold mb-4 text-blue-700">Provenance (Held+)</h2>
                    <Input disabled placeholder="Serial Number" />
                    <Input disabled placeholder="Acquisition Date (YYYY-MM-DD)" />
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Certificate of Authenticity (Image or URL)</label>
                      <Input disabled placeholder="Certificate of Authenticity (URL or ref)" />
                      <input type="file" disabled className="mt-2" />
                    </div>
                    <Input disabled placeholder="Origin (place/manufacturer)" />
                    <Input disabled placeholder="Transfer Method (sale, gift, etc.)" />
                    <Input disabled placeholder="Associated Documents (comma separated URLs/refs)" />
                    <Textarea disabled placeholder="Provenance Notes" rows={2} />
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Chain of Ownership</label>
                      <p className="text-gray-400 italic mb-2">No chain of ownership yet.</p>
                      <Button type="button" variant="outline" disabled>+ Add Owner</Button>
                    </div>
                    <Textarea disabled placeholder='Condition History (JSON: [{"date":"YYYY-MM-DD","condition":"good","notes":""}])' rows={2} />
                  </div>
                </div>
              )}

              {/* Submit */}
              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Creating...' : 'Add Object'}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/registry">Cancel</Link>
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
