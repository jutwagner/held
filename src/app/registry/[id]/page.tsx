'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth, isHeldPlus } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { HeldObject } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import passportSvg from '@/img/passport.svg';
import ProvenanceSection from '@/components/ProvenanceSection';
import ProvenanceUpsell from '@/components/ProvenanceUpsell';

export default function ObjectDetailPage() { 
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [object, setObject] = useState<HeldObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const editFormRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    maker: '',
    condition: '',
    visibility: 'Public',
    tags: '',
    notes: '',
    year: undefined as number | undefined,
    shareInCollaborative: false,
    category: '',
    images: [] as string[],
    // Provenance fields
    serialNumber: '',
    acquisitionDate: '',
    certificateOfAuthenticity: '',
    certificateImage: '',
    certificateUrl: '',
    origin: '',
    transferMethod: '',
    associatedDocuments: [] as string[],
    provenanceNotes: '',
    chain: [] as Array<{ owner: string; acquiredAt?: string; notes?: string }>,
  });

  const objectId = params?.id as string;

  useEffect(() => {
    if (!objectId) return;
    setLoading(true);
    import('@/lib/firebase-services').then(mod => mod.getObject(objectId)).then(obj => {
      setObject(obj ?? null);
      setLoading(false);
    }).catch(err => {
      setError('Failed to load object');
      setLoading(false);
    });
  }, [objectId]);

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
        // Provenance fields
        serialNumber: object.serialNumber || '',
        acquisitionDate: typeof object.acquisitionDate === 'string' ? object.acquisitionDate : '',
        certificateOfAuthenticity: object.certificateOfAuthenticity || '',
        certificateImage: '',
        certificateUrl: '',
        origin: object.origin || '',
        transferMethod: object.transferMethod || '',
        associatedDocuments: Array.isArray(object.associatedDocuments) ? object.associatedDocuments : [],
        provenanceNotes: object.provenanceNotes || '',
        chain: Array.isArray(object.chain) ? object.chain.map(entry => ({
          owner: entry.owner,
          acquiredAt: typeof entry.acquiredAt === 'string' ? entry.acquiredAt : entry.acquiredAt?.toISOString() || '',
          notes: entry.notes
        })) : [],
      });
    }
  }, [object]);

  function handleSave() {
    async function doSave() {
      try {
        setLoading(true);
        const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
        await import('@/lib/firebase-services').then(mod => mod.updateObject(objectId, {
          id: objectId,
          title: formData.title,
          maker: formData.maker,
          condition: formData.condition as 'excellent' | 'good' | 'fair' | 'poor',
          isPublic: formData.visibility === 'Public',
          tags: tagsArray,
          notes: formData.notes,
          year: formData.year,
          shareInCollaborative: formData.shareInCollaborative,
          images: formData.images,
          // Provenance fields
          serialNumber: formData.serialNumber,
          acquisitionDate: formData.acquisitionDate,
          certificateOfAuthenticity: formData.certificateOfAuthenticity,
          origin: formData.origin,
          transferMethod: formData.transferMethod,
          associatedDocuments: formData.associatedDocuments,
          provenanceNotes: formData.provenanceNotes,
          chain: formData.chain,
        }));
        setEditing(false);
      } catch (err) {
        setError('Failed to save changes.');
      } finally {
        setLoading(false);
      }
    }
    doSave();
  }

  const handleDelete = async () => {
    if (!object || !user || object.userId !== user.uid) return;
    
    setDeleting(true);
    try {
      await import('@/lib/firebase-services').then(mod => mod.deleteObject(objectId));
      router.push('/registry');
    } catch (err) {
      console.error('Failed to delete object:', err);
      alert('Failed to delete object. Please try again.');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-8 py-16">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !object) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-8 py-16">
          <div className="text-center">
            <p className="text-red-600">{error || 'Object not found'}</p>
            <Button asChild className="mt-4">
              <Link href="/registry">Back to Registry</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Edit Mode Banner */}
      {editing && (
        <div className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-4 sm:px-8 shadow-xl border-b border-blue-500 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="w-8 h-8 bg-blue-500/80 rounded-full flex items-center justify-center flex-shrink-0">
                <Edit className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-white">Edit Mode Active</p>
                <p className="text-blue-100 text-sm hidden sm:block">Make changes to your registry entry</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
              <Button
                onClick={handleSave}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 sm:px-6 py-2 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 text-sm sm:text-base"
              >
                {loading ? 'Saving...' : 'Save'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setEditing(false)}
                className="bg-white/90 hover:bg-white text-blue-600 border-white hover:border-blue-100 px-3 sm:px-4 py-2 rounded-lg transition-all duration-200 text-sm sm:text-base"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto px-8 py-16">
        {/* Header */}
        <div className="mb-20">
          <div className="flex items-center justify-between mb-12">
            <Button variant="ghost" asChild className="p-0 h-auto text-black hover:bg-transparent">
              <Link href="/registry" className="flex items-center gap-3 text-sm font-medium tracking-wide uppercase">
                <ArrowLeft className="h-4 w-4" />
                Registry
              </Link>
            </Button>
            
            
            {/* Action Buttons */}
            {object && user && object.userId === user.uid && (
              <div className="flex items-center space-x-4">
                {object.isPublic && (
                  <Button variant="outline" asChild className="border-black text-black hover:bg-black hover:text-white rounded-lg font-light tracking-wide">
                    <Link href={`/passport/${object.slug || object.id}`} target="_blank" className="whitespace-nowrap flex items-center">
                      <Image src={passportSvg} alt="Passport" width={16} height={16} className="mr-2" />
                      Passport
                    </Link>
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setEditing(!editing);
                    if (!editing) {
                      // Scroll to edit form after a brief delay to allow state update
                      setTimeout(() => {
                        editFormRef.current?.scrollIntoView({ 
                          behavior: 'smooth', 
                          block: 'start' 
                        });
                      }, 100);
                    }
                  }}
                  className="border-black text-black hover:bg-black hover:text-white rounded-lg font-light tracking-wide"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {editing ? 'Cancel' : 'Edit'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={deleting}
                  className="border-gray-300 text-gray-500 hover:border-red-300 hover:text-red-600 rounded-lg font-light tracking-wide"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleting ? 'Removing...' : ''}
                </Button>
              </div>
            )}
          </div>
          
          <div className="mb-16">
            <h1 className="text-6xl md:text-7xl font-light text-black mb-6 tracking-tighter leading-none">
              {object.title || <span className="text-gray-400">Untitled</span>}
            </h1>
            {object.maker && (
              <p className="text-lg text-gray-600 font-light tracking-wide">
                {object.maker}
                {object.year && `, ${object.year}`}
              </p>
            )}
          </div>
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-20">
          {/* Visual Documentation */}
          <div>
            <div className="mb-12">
            </div>
            
            {object.images && object.images.length > 0 ? (
              <div className="space-y-8">
                {object.images.map((image, index) => (
                  <div key={index} className="w-full bg-white border border-gray-200 overflow-hidden group">
                    <Image
                      src={image}
                      alt={`${object.title} - Image ${index + 1}`}
                      width={800}
                      height={1200}
                      className="w-full transition-transform duration-300 group-hover:scale-[1.02]"
                      style={{ objectFit: 'contain', width: '100%', height: 'auto', maxWidth: '100%' }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="aspect-square bg-white border border-gray-200 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-2">
                    No Images
                  </div>
                  <p className="text-gray-500 font-light">Visual documentation not available</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Specifications */}
          <div className="space-y-12">
            <div className="mb-12">
              <div className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-4">
                Specifications
              </div>
              
            </div>
            
            <div className="space-y-8">
              {object.description && (
                <div>
                  <div className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-2">
                    Description
                  </div>
                  <p className="text-lg text-black font-light leading-relaxed">{object.description}</p>
                </div>
              )}
              
              {object.maker && (
                <div>
                  <div className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-2">
                    Manufacturer
                  </div>
                  <p className="text-lg text-black font-light">{object.maker}</p>
                </div>
              )}
              
              {object.condition && (
                <div>
                  <div className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-2">
                    Physical Condition
                  </div>
                  <p className="text-lg text-black font-light capitalize">{object.condition}</p>
                </div>
              )}
              
              {object.category && (
                <div>
                  <div className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-2">
                    Classification
                  </div>
                  <p className="text-lg text-black font-light">{object.category}</p>
                </div>
              )}
              
              {object.year && (
                <div>
                  <div className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-2">
                    Year of Production
                  </div>
                  <p className="text-lg text-black font-light">{object.year}</p>
                </div>
              )}
              
              {object.tags && object.tags.length > 0 && (
                <div>
                  <div className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-2">
                    Keywords
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {object.tags.map((tag, index) => (
                      <span key={index} className="inline-block bg-gray-100 text-black px-3 py-1 text-sm border border-gray-200">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {object.notes && (
                <div>
                  <div className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-2">
                    Additional Notes
                  </div>
                  <p className="text-lg text-black font-light leading-relaxed">{object.notes}</p>
                </div>
              )}
              
              <div className="pt-8 border-t border-gray-100">
                <div className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-4">
                  Visibility
                </div>
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${object.isPublic ? 'bg-black' : 'bg-gray-300'}`}></div>
                    <span className="text-black font-light">
                      {object.isPublic ? 'Public' : 'Private'}
                    </span>
                  </div>
                  
                  {object.shareInCollaborative && (
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full bg-black"></div>
                      <span className="text-black font-light">Collaborative</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Edit Form */}
        {editing && (
          <div ref={editFormRef} className="mt-20 bg-white border border-gray-200 p-16 shadow-lg rounded-lg">
            <div className="mb-12">
              <div className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-4">
                Edit 
              </div>
              <h2 className="text-4xl font-light text-black tracking-tight">Modify Details</h2>
            </div>
            
            <div className="space-y-12">
              {/* Title */}
              <div>
                <label className="text-xs font-medium text-black mb-4 uppercase tracking-widest">
                  Object Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full text-xl py-6 border-0 border-b border-gray-300 focus:border-black focus:ring-0 rounded-none bg-transparent placeholder-gray-400"
                  placeholder="Eames Lounge Chair and Ottoman"
                />
              </div>
              
              {/* Maker and Year */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                <div>
                  <label className="text-xs font-medium text-black mb-4 uppercase tracking-widest">
                    Manufacturer
                  </label>
                  <input
                    type="text"
                    value={formData.maker}
                    onChange={(e) => setFormData({...formData, maker: e.target.value})}
                    className="w-full text-xl py-6 border-0 border-b border-gray-300 focus:border-black focus:ring-0 rounded-none bg-transparent placeholder-gray-400"
                    placeholder="Herman Miller, Apple, Rolex"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-black mb-4 uppercase tracking-widest">
                    Year
                  </label>
                  <input
                    type="number"
                    value={formData.year || ''}
                    onChange={(e) => setFormData({...formData, year: e.target.value ? parseInt(e.target.value) : undefined})}
                    className="w-full text-xl py-6 border-0 border-b border-gray-300 focus:border-black focus:ring-0 rounded-none bg-transparent placeholder-gray-400"
                    placeholder="1956"
                  />
                </div>
              </div>
              
              {/* Condition */}
              <div>
                <label className="text-xs font-medium text-black mb-6 uppercase tracking-widest">
                  Physical Condition
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {['excellent', 'good', 'fair', 'poor'].map((condition) => (
                    <button
                      key={condition}
                      type="button"
                      onClick={() => setFormData({...formData, condition})}
                      className={`py-4 px-6 border text-left text-sm font-light tracking-wide ${
                        formData.condition === condition
                          ? 'border-black bg-black text-white'
                          : 'bg-white text-black hover:border-gray-400'
                      }`}
                    >
                      {condition.charAt(0).toUpperCase() + condition.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Tags */}
              <div>
                <label className="text-xs font-medium text-black mb-4 uppercase tracking-widest">
                  Keywords
                </label>
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({...formData, tags: e.target.value})}
                    className="flex-1 text-lg py-4 border-0 border-b border-gray-300 focus:border-black focus:ring-0 rounded-none bg-transparent placeholder-gray-400"
                    placeholder="vintage, rare, handmade"
                  />
                </div>
              </div>
              
              {/* Notes */}
              <div>
                <label className="text-xs font-medium text-black mb-4 uppercase tracking-widest">
                  Additional Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={4}
                  className="w-full resize-none border border-gray-200 focus:border-black focus:ring-0 rounded-none bg-transparent placeholder-gray-400 text-base leading-relaxed"
                  placeholder="Additional details, provenance notes..."
                />
              </div>
              
              {/* Visibility */}
              <div className="space-y-6 pt-8 border-t border-gray-100">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.visibility === 'Public'}
                    onChange={(e) => setFormData({...formData, visibility: e.target.checked ? 'Public' : 'Private'})}
                    className="h-4 w-4 text-black focus:ring-0 border-gray-300 rounded-none"
                  />
                  <label className="ml-3 text-black font-light text-sm tracking-wide">
                    Public Visibility
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.shareInCollaborative}
                    onChange={(e) => setFormData({...formData, shareInCollaborative: e.target.checked})}
                    className="h-4 w-4 text-black focus:ring-0 border-gray-300 rounded-none"
                  />
                  <label className="ml-3 text-black font-light text-sm tracking-wide">
                    Collaborative Sharing
                  </label>
                </div>
              </div>
            </div>
            
            {/* Save Button */}
            <div className="mt-16 pt-8 border-t border-gray-100 flex justify-end">
              <Button
                onClick={handleSave}
                className="bg-black hover:bg-gray-800 text-white font-light tracking-wide px-12 py-3 rounded-none"
              >
                Save Changes
              </Button>
            </div>
          </div>
        )}
        
        {/* Provenance Section */}
        {isHeldPlus(user) && (
          <div className="mt-20">
            <ProvenanceSection 
              data={{
                serialNumber: formData.serialNumber,
                acquisitionDate: formData.acquisitionDate,
                certificateOfAuthenticity: formData.certificateOfAuthenticity,
                certificateImage: formData.certificateImage,
                certificateUrl: formData.certificateUrl,
                origin: formData.origin,
                transferMethod: formData.transferMethod,
                associatedDocuments: formData.associatedDocuments,
                provenanceNotes: formData.provenanceNotes,
                chain: formData.chain,
              }}
              onChange={(provenanceData) => {
                setFormData(prev => ({
                  ...prev,
                  ...provenanceData,
                  associatedDocuments: Array.isArray(provenanceData.associatedDocuments) 
                    ? provenanceData.associatedDocuments
                    : []
                }));
              }}
            />
            
            {/* Provenance Save Button */}
            <div className="mt-8 flex justify-end">
              <Button
                onClick={handleSave}
                className="bg-black hover:bg-gray-800 text-white font-light tracking-wide px-8 py-3 rounded-none"
              >
                Save Provenance
              </Button>
            </div>
          </div>
        )}
        
        {/* Provenance Upsell for non-premium users */}
        {!isHeldPlus(user) && (
          <div className="mt-20">
            <ProvenanceUpsell />
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Delete Object</h3>
              <p className="mb-6 text-gray-600">
                Are you sure you want to delete <span className="font-bold text-gray-900">"{object?.title}"</span>? 
                This action cannot be undone and will permanently remove this object from your registry.
              </p>
              <div className="flex justify-center gap-3">
                <Button 
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="px-6 py-2 rounded-xl border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-6 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white"
                >
                  {deleting ? 'Deleting...' : 'Delete Forever'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
