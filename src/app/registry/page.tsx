'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HeldObject } from '@/types';
import { getObjects } from '@/lib/firebase-services';
import { Plus, Search, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

import { MobileBottomBar } from '@/components/Navigation';

export default function RegistryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [objects, setObjects] = useState<HeldObject[]>([]);
  const [filteredObjects, setFilteredObjects] = useState<HeldObject[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingObjects, setLoadingObjects] = useState(true);
  const [showPublicOnly, setShowPublicOnly] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadObjects();
    }
  }, [user]);

  useEffect(() => {
    filterObjects();
  }, [objects, searchTerm, showPublicOnly]);

  const loadObjects = async () => {
    if (!user || typeof user.uid !== 'string') return;

    try {
      setLoadingObjects(true);
      console.log('Loading objects for user:', user.uid); // Debug log
      const userObjects = await getObjects(user.uid);
      console.log('Loaded objects:', userObjects); // Debug log
      setObjects(userObjects);
    } catch {
      console.error('Error loading objects');
    } finally {
      setLoadingObjects(false);
    }
  };

  const filterObjects = () => {
    let filtered = objects;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(obj => 
        obj.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        obj.maker?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (Array.isArray(obj.tags) && obj.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
      );
    }

    // Filter by public/private
    if (showPublicOnly) {
      filtered = filtered.filter(obj => obj.isPublic);
    }

    setFilteredObjects(filtered);
  };



  if (loading || !user) {
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <MobileBottomBar />
      <div className="held-container py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-serif font-medium mb-2">Registry</h1>
            <p className="text-gray-600">
              {objects.length} object{objects.length !== 1 ? 's' : ''} in your collection
            </p>
          </div>
          <Button asChild className="mt-4 sm:mt-0">
            <Link href="/registry/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Object
            </Link>
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search objects, makers, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant={showPublicOnly ? "default" : "outline"}
            onClick={() => setShowPublicOnly(!showPublicOnly)}
            className="flex items-center"
          >
            {showPublicOnly ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
            {showPublicOnly ? 'Public Only' : 'All Objects'}
          </Button>
        </div>

        {/* Objects Grid */}
        {loadingObjects ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading your objects...</p>
          </div>
        ) : filteredObjects.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">No objects found</h3>
              <p className="text-gray-600 mb-6">
                {objects.length === 0 
                  ? "Start building your collection by adding your first object."
                  : "Try adjusting your search or filters."
                }
              </p>
              {objects.length === 0 && (
                <Button asChild>
                  <Link href="/registry/new">Add Your First Object</Link>
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredObjects.map((obj) => (
              <ObjectCard key={obj.id} object={obj} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ObjectCard({ object }: { object: HeldObject }) {
  const cardClassName = "bg-white rounded-lg shadow p-4 min-h-[390px] flex flex-col justify-between"; // Updated min height to 390px for consistent card sizes

  return (
    <Link href={`/registry/${object.id}`}>
      <div className={`${cardClassName} held-card p-6 hover:shadow-lg transition-shadow cursor-pointer`}>
        {/* Image */}
        <div className="aspect-square bg-gray-100 rounded-lg mb-4 overflow-hidden flex items-center justify-center">
          {object.images.length > 0 ? (
            <img
              src={object.images[0]}
              alt={object.title}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gray-400 text-sm">No image</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div>
          <h3 className="font-medium mb-1 line-clamp-1">{object.title}</h3>
          {object.maker && (
            <p className="text-sm text-gray-600 mb-2">{object.maker}</p>
          )}
          
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span className="font-mono">
              {object.year && !isNaN(object.year) ? `${object.year}` : "N/A"}
            </span>
            <div className="flex items-center space-x-2">
              {object.value && (
                <span className="font-mono">
                  {isNaN(object.value) ? "N/A" : formatCurrency(object.value)}
                </span>
              )}
              {object.isPublic ? (
                <Eye className="h-3 w-3" />
              ) : (
                <EyeOff className="h-3 w-3" />
              )}
            </div>
          </div>

          {/* Tags */}
          {Array.isArray(object.tags) && object.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {object.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded"
                >
                  {tag}
                </span>
              ))}
              {object.tags.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded">
                  +{object.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
