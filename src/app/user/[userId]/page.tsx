'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { HeldObject } from '@/types';
import { getObjects } from '@/lib/firebase-services';

export default function PublicUserPage() {
  const { user } = useAuth();
  const params = useParams();
  const userId = params?.userId as string;
  const [objects, setObjects] = useState<HeldObject[]>([]);
  const [showPublic, setShowPublic] = useState(true);

  useEffect(() => {
    if (userId) {
      getObjects(userId).then(setObjects);
    }
  }, [userId]);

  const filteredObjects = showPublic ? objects.filter(obj => obj.isPublic) : objects;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navigation />
      <div className="held-container py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-serif font-medium">User Collection</h1>
          <Button onClick={() => setShowPublic(v => !v)}>
            {showPublic ? 'Show All' : 'Show Public Only'}
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredObjects.map(obj => (
            <div key={obj.id} className="held-card p-6">
              <h2 className="font-serif text-xl font-medium mb-2">{obj.title}</h2>
              <p className="text-gray-600 text-sm mb-2">{obj.maker}</p>
              <p className="text-gray-500 text-xs mb-2">{obj.category}</p>
              <p className="text-gray-700 text-sm mb-2">{obj.notes}</p>
              {obj.images && obj.images.length > 0 && (
                <img src={obj.images[0]} alt={obj.title} className="w-full h-48 object-contain rounded mb-2" />
              )}
              {obj.isPublic && <span className="text-green-600 text-xs">Public</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
