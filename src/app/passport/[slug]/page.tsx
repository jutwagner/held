'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { HeldObject } from '@/types';
import { getObjectBySlug } from '@/lib/firebase-services';
import { formatDate, formatCurrency } from '@/lib/utils';
import { ArrowLeft, Share2, Calendar, DollarSign, Tag } from 'lucide-react';
import Link from 'next/link';

export default function PassportPage() {
  const params = useParams();
  const [object, setObject] = useState<HeldObject | null>(null);
  const [loading, setLoading] = useState(true);

  const slug = params.slug as string;

  useEffect(() => {
    if (slug) {
      console.log('[DEBUG] PassportPage slug:', slug);
      loadObject();
    }
  }, [slug]);

  const loadObject = async () => {
    try {
      setLoading(true);
      const obj = await getObjectBySlug(slug);
      console.log('[DEBUG] PassportPage getObjectBySlug result:', obj);
      if (!obj) {
        return;
      }
      setObject(obj);
    } catch (error) {
      console.error('Error loading object:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: object?.title || 'Held Object',
          text: `Check out this ${object?.title} on Held`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 py-24">
          <div className="text-center">
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

    if (!object) {
      return (
        <div className="min-h-screen bg-white">
          <div className="max-w-4xl mx-auto px-4 py-24">
            <div className="text-center">
              <p className="text-gray-600">Object not found</p>
            <Link href="/" className="text-gray-900 hover:underline mt-4 inline-block">
              Return to Held
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back to Held</span>
            </Link>
            <button
              onClick={handleShare}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <Share2 className="h-4 w-4" />
              <span className="text-sm">Share</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Images */}
          <div>
            {object.images.length > 0 ? (
              <div className="space-y-4">
                {object.images.map((image, index) => (
                  <div key={index} className="w-full bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center" style={{ minHeight: 260 }}>
                    <img
                      src={image}
                      alt={`${object.title} - Image ${index + 1}`}
                      className="w-full rounded-xl"
                      style={{ objectFit: 'contain', width: '100%', height: 'auto', maxWidth: '100%', borderRadius: '0.75rem' }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">No images available</p>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="space-y-8">
            {/* Title and Maker */}
            <div>
              <h1 className="text-4xl font-serif font-medium mb-4">{object.title}</h1>
              {object.maker && (
                <p className="text-xl text-gray-600">{object.maker}</p>
              )}
            </div>

            {/* Details */}
            <div className="space-y-4">
              {object.year && (
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <span className="font-mono text-gray-900">{object.year}</span>
                </div>
              )}
              
              {object.value && (
                <div className="flex items-center space-x-3">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                  <span className="font-mono text-gray-900">{formatCurrency(object.value)}</span>
                </div>
              )}
              
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-700">Condition:</span>
                <span className="text-gray-900 capitalize">{object.condition}</span>
              </div>
            </div>

            {/* Tags */}
            {Array.isArray(object.tags) && object.tags.length > 0 && (
              <div>
                <div className="flex items-center space-x-3 mb-3">
                  <Tag className="h-5 w-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Tags</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {object.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-sm text-gray-700 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {object.notes && (
              <div>
                <h3 className="text-lg font-medium mb-3">Notes</h3>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{object.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="pt-8 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Held by {object.userId}</span>
                <span>{formatDate(object.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-16">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <h3 className="text-lg font-serif font-medium">Held</h3>
              <span className="text-xs font-mono text-gray-500">/held</span>
            </div>
            <p className="text-sm text-gray-600">The quiet home for the things you hold</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
