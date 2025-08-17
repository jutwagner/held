import type { RotationWithObjects } from '@/types';
"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Rotation, HeldObject } from '@/types';
import { getRotations, getRotationWithObjects } from '@/lib/firebase-services';
import { Plus, RotateCcw, Eye, EyeOff, Calendar } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

export default function RotationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [rotations, setRotations] = useState<Rotation[]>([]);
  import type { RotationWithObjects } from '@/types';
  const [rotationsWithObjects, setRotationsWithObjects] = useState<RotationWithObjects[]>([]);
  const [loadingRotations, setLoadingRotations] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadRotations();
    }
  }, [user]);

  const loadRotations = async () => {
    if (!user) return;
    
    try {
      setLoadingRotations(true);
      const userRotations = await getRotations(user.uid);
      setRotations(userRotations);
      // Load objects for each rotation
      const rotationsWithObjs = await Promise.all(
        userRotations.map(async (rotation) => {
          const rotationWithObjects = await getRotationWithObjects(rotation.id);
          return rotationWithObjects;
        })
      );
      setRotationsWithObjects(rotationsWithObjs.filter(Boolean));
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error loading rotations:', error.message);
      } else {
        console.error('Error loading rotations');
      }
    } finally {
      setLoadingRotations(false);
    }
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
      <Navigation />
      
      <div className="held-container py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-serif font-medium mb-2">Rotations</h1>
            <p className="text-gray-600">
              Curated snapshots of your collection
            </p>
          </div>
          <Button asChild className="mt-4 sm:mt-0">
            <Link href="/rotations/new">
              <Plus className="h-4 w-4 mr-2" />
              Create Rotation
            </Link>
          </Button>
        </div>

        {/* Rotations Grid */}
        {loadingRotations ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading your rotations...</p>
          </div>
        ) : rotationsWithObjects.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <RotateCcw className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">No rotations yet</h3>
              <p className="text-gray-600 mb-6">
                Create your first rotation to showcase a curated selection of your objects.
              </p>
              <Button asChild>
                <Link href="/rotations/new">Create Your First Rotation</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rotationsWithObjects.map((rotation) => (
              <RotationCard key={rotation.id} rotation={rotation} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RotationCard({ rotation }: { rotation: RotationWithObjects }) {
  return (
    <Link href={`/rotations/${rotation.id}`}>
      <div className="held-card p-6 hover:shadow-lg transition-shadow cursor-pointer">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-lg">{rotation.name}</h3>
          <div className="flex items-center space-x-2">
            {rotation.isPublic ? (
              <Eye className="h-4 w-4 text-green-600" />
            ) : (
              <EyeOff className="h-4 w-4 text-gray-400" />
            )}
          </div>
        </div>

        {/* Description */}
        {rotation.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {rotation.description}
          </p>
        )}

        {/* Objects Preview */}
        <div className="mb-4">
          <div className="flex -space-x-2">
            {rotation.objects.slice(0, 4).map((obj: HeldObject, index: number) => (
              <div
                key={obj.id}
                className="w-12 h-12 bg-gray-100 rounded-full border-2 border-white overflow-hidden"
              >
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
            ))}
            {rotation.objects.length > 4 && (
              <div className="w-12 h-12 bg-gray-200 rounded-full border-2 border-white flex items-center justify-center">
                <span className="text-gray-600 text-xs font-medium">
                  +{rotation.objects.length - 4}
                </span>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {rotation.objects.length} object{rotation.objects.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(rotation.createdAt)}</span>
          </div>
          {rotation.isPublic && (
            <span className="text-green-600 text-xs">Public</span>
          )}
        </div>
      </div>
    </Link>
  );
}
