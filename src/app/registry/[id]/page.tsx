'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { HeldObject } from '@/types';
import { getObject, deleteObject, updateObject } from '@/lib/firebase-services';
import { formatDate, formatCurrency } from '@/lib/utils';
import { ArrowLeft, Edit, Trash2, Eye, EyeOff, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function ObjectDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [object, setObject] = useState<HeldObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    maker: '',
    condition: '',
    visibility: 'Public',
    tags: '',
    notes: '',
    year: undefined as number | undefined,
    shareInCollaborative: false, // New field
  });

  const objectId = params.id as string;

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
        shareInCollaborative: object.shareInCollaborative ?? false, // Ensure default value
      });
    }
  }, [object]);

  const loadObject = async () => {
    try {
      setLoading(true);
      const obj = await getObject(objectId);
      if (!obj) {
        setError('Object not found');
        return;
      }
      
      // Check if user owns this object
      if (obj.userId !== user?.uid) {
        setError('Access denied');
        return;
      }
      
      setObject(obj);
    } catch (error) {
      console.error('Error loading object:', error);
      setError('Failed to load object');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!object) return;
    
    try {
      setDeleting(true);
      await deleteObject(object.id);
      router.push('/registry');
    } catch (error) {
      console.error('Error deleting object:', error);
      setError('Failed to delete object');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!object) return;

    try {
      const { images, ...rest } = object;
      const updatedObject = {
        ...rest,
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()), // Convert tags string to array
        condition: formData.condition as 'excellent' | 'good' | 'fair' | 'poor', // Ensure correct type
        year: formData.year as number | undefined, // Ensure year is undefined if not provided
      };
      await updateObject(object.id, updatedObject);
      setObject({ ...object, ...updatedObject });
      setEditing(false);
    } catch (error) {
      console.error('Error saving object:', error);
      setError('Failed to save object');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        <Navigation />
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
        <Navigation />
        <div className="held-container py-24">
          <div className="text-center">
            <p className="text-gray-600">{error || 'Object not found'}</p>
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
      <Navigation />
      
      <div className="held-container py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col items-start w-full">
              <Button variant="ghost" asChild className="mb-2 pl-2 -ml-2">
                <Link href="/registry" className="flex items-center">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Registry
                </Link>
              </Button>
              {editing ? (
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="font-mono bg-gray-100 border border-gray-300 rounded px-2 py-1 w-full"
                />
              ) : (
                <h1 className="text-3xl font-serif font-medium mb-4">{object.title}</h1>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {object.isPublic && (
                <Button variant="outline" asChild>
                  <Link href={`/passport/${object.slug}`} target="_blank" className="whitespace-nowrap">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Passport
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
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Images */}
          <div>
            <h2 className="text-lg font-medium mb-4">Images</h2>
            {object.images.length > 0 ? (
              <div className="space-y-4">
                {object.images.map((image, index) => (
                  <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={image}
                      alt={`${object.title} - Image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">No images</p>
              </div>
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
                />
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="font-mono bg-gray-100 border border-gray-300 rounded px-2 py-1 w-full"
                />
                <input
                  type="text"
                  value={formData.maker}
                  onChange={(e) => setFormData({ ...formData, maker: e.target.value })}
                  className="font-mono bg-gray-100 border border-gray-300 rounded px-2 py-1 w-full"
                />
                <select
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  className="font-mono bg-gray-100 border border-gray-300 rounded px-2 py-1 w-full"
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
                <select
                  value={formData.visibility}
                  onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                  className="font-mono bg-gray-100 border border-gray-300 rounded px-2 py-1 w-full"
                >
                  <option value="Public">Public</option>
                  <option value="Private">Private</option>
                </select>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="font-mono bg-gray-100 border border-gray-300 rounded px-2 py-1 w-full"
                />
                <input
                  type="number"
                  value={formData.year || ''}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value ? parseInt(e.target.value, 10) : undefined })} // Ensure year is undefined if empty
                  className="font-mono bg-gray-100 border border-gray-300 rounded px-2 py-1 w-full"
                />
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="font-mono bg-gray-100 border border-gray-300 rounded px-2 py-1 w-full"
                />
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="shareInCollaborative"
                    checked={formData.shareInCollaborative}
                    onChange={(e) => setFormData({ ...formData, shareInCollaborative: e.target.checked })}
                    className="h-4 w-4 text-gray-900 focus:ring-gray-500 border-gray-300 rounded"
                  />
                  <label htmlFor="shareInCollaborative" className="text-sm text-gray-700">
                    Share in theCollaborative
                  </label>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-serif font-medium mb-4">{object.title}</h1>
                <p className="text-gray-600">{object.description}</p>
                <p className="text-gray-600">Maker: {object.maker}</p>
                <p className="text-gray-600">Condition: {object.condition}</p>
                <p className="flex items-center text-gray-600">
                  {object.isPublic ? (
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
                {Array.isArray(object.tags) && object.tags.length > 0 ? (
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
                  <p className="text-gray-500">No tags available</p>
                )}
                <p className="text-gray-600">Notes: {object.notes}</p>
                <p className="text-gray-600">
                  Share in theCollaborative: {object.shareInCollaborative ? 'Yes' : 'No'}
                </p>
              </>
            )}
            <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg font-mono">
              <p>Created: {new Date(object.createdAt).toLocaleDateString()}</p>
              <p>Updated: {new Date(object.updatedAt).toLocaleDateString()}</p>
              <p>ID: {object.id}</p>
              <p>Slug: {object.slug}</p>
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
