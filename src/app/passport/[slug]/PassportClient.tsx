'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { HeldObject } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { isHeldPlus } from '@/contexts/AuthContext';
import { getObjectBySlug } from '@/lib/firebase-services';
import { formatDate, formatCurrency } from '@/lib/utils';
import { ArrowLeft, Share2, Calendar, DollarSign, Tag, Award, X, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import passportSvg from '@/img/passport.svg';

export default function PassportClient() {
  const params = useParams();
  const slug = params?.slug as string;
  const { user } = useAuth();
  const [object, setObject] = useState<HeldObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (!slug) return;

    const fetchObject = async () => {
      try {
        setLoading(true);
        const objectData = await getObjectBySlug(slug);
        
        if (!objectData) {
          setError('Object not found');
          return;
        }

        setObject(objectData);
      } catch (err) {
        console.error('Error fetching object:', err);
        setError('Failed to load object');
      } finally {
        setLoading(false);
      }
    };

    fetchObject();
  }, [slug]);

  const copyToClipboard = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const shareToSocial = (platform: string) => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Check out this ${object?.title} on Held`);
    
    const urls = {
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    };
    
    if (urls[platform as keyof typeof urls]) {
      window.open(urls[platform as keyof typeof urls], '_blank', 'width=600,height=400');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading passport...</p>
        </div>
      </div>
    );
  }

  if (error || !object) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Object Not Found</h1>
          <p className="text-gray-600 mb-8">The passport you're looking for doesn't exist or has been made private.</p>
          <Link href="/" className="text-blue-600 hover:text-blue-800 underline">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const isPremiumUser = isHeldPlus(user);
  const hasProvenance = isPremiumUser && (object.serialNumber || object.acquisitionDate || object.certificateOfAuthenticity || object.chain?.length);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Held
            </Link>
            
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Passport Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <Image src={passportSvg} alt="Passport" width={32} height={32} />
            <div>
              <h1 className="text-4xl font-serif font-medium text-gray-900 mb-2">{object.title}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                {object.maker && <span>by {object.maker}</span>}
                {object.year && <span>• {object.year}</span>}
                {object.category && <span>• {object.category}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Images */}
        {object.images && object.images.length > 0 && (
          <div className="mb-12">
            <div className="grid gap-4">
              {object.images.length === 1 ? (
                <div className="aspect-[4/3] relative rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={object.images[0]}
                    alt={object.title}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {object.images.map((image, index) => (
                    <div key={index} className="aspect-[4/3] relative rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={image}
                        alt={`${object.title} - Image ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Details Grid */}
        <div className="grid md:grid-cols-2 gap-12 mb-12">
          {/* Basic Information */}
          <div>
            <h2 className="text-xl font-serif font-medium mb-6">Details</h2>
            <div className="space-y-4">
              {object.maker && (
                <div className="flex items-center gap-3">
                  <Tag className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600">Maker</div>
                    <div className="font-medium">{object.maker}</div>
                  </div>
                </div>
              )}
              
              {object.year && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600">Year</div>
                    <div className="font-medium">{object.year}</div>
                  </div>
                </div>
              )}
              
              {object.condition && (
                <div className="flex items-center gap-3">
                  <Award className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600">Condition</div>
                    <div className="font-medium capitalize">{object.condition}</div>
                  </div>
                </div>
              )}
              
              {object.value && (
                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600">Value</div>
                    <div className="font-medium">{formatCurrency(object.value)}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Additional Information */}
          <div>
            {object.tags && object.tags.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-serif font-medium mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {object.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {object.notes && (
              <div>
                <h3 className="text-lg font-serif font-medium mb-4">Notes</h3>
                <p className="text-gray-700 leading-relaxed">{object.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Provenance Section */}
        {hasProvenance && (
          <div className="border-t border-gray-200 pt-12">
            <h2 className="text-2xl font-serif font-medium mb-8 flex items-center gap-3">
              <Award className="h-6 w-6 text-amber-500" />
              Provenance
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              {object.serialNumber && (
                <div>
                  <div className="text-sm text-gray-600 mb-1">Serial Number</div>
                  <div className="font-medium font-mono text-lg">{object.serialNumber}</div>
                </div>
              )}
              
              {object.acquisitionDate && (
                <div>
                  <div className="text-sm text-gray-600 mb-1">Acquisition Date</div>
                  <div className="font-medium">{formatDate(new Date(object.acquisitionDate))}</div>
                </div>
              )}
              
              {object.certificateOfAuthenticity && (
                <div className="md:col-span-2">
                  <div className="text-sm text-gray-600 mb-3">Certificate of Authenticity</div>
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center gap-3">
                      <ExternalLink className="h-4 w-4 text-gray-400" />
                      <a
                        href={object.certificateOfAuthenticity}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        View Certificate
                      </a>
                    </div>
                  </div>
                </div>
              )}
              
              {object.chain && object.chain.length > 0 && (
                <div className="md:col-span-2">
                  <div className="text-sm text-gray-600 mb-4">Ownership History</div>
                  <div className="space-y-4">
                    {object.chain.map((entry, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">{entry.owner}</div>
                          {entry.acquiredAt && (
                            <div className="text-sm text-gray-600">
                              {formatDate(new Date(entry.acquiredAt))}
                            </div>
                          )}
                        </div>
                        {entry.notes && (
                          <div className="text-sm text-gray-600">{entry.notes}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="border-t border-gray-200 pt-12 mt-12">
          <div className="text-center text-gray-600">
            <p className="mb-2">Passport created with</p>
            <Link href="/" className="text-black font-serif text-lg hover:underline">
              Held
            </Link>
          </div>
        </footer>
      </main>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-serif font-medium">Share Passport</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={copyToClipboard}
                className="w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
              >
                <div className="font-medium">Copy Link</div>
                <div className="text-sm text-gray-600">Share this passport via link</div>
                {copySuccess && (
                  <div className="text-green-600 text-sm mt-1">Copied to clipboard!</div>
                )}
              </button>
              
              <button
                onClick={() => shareToSocial('twitter')}
                className="w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
              >
                <div className="font-medium">Share on Twitter</div>
                <div className="text-sm text-gray-600">Post to your Twitter feed</div>
              </button>
              
              <button
                onClick={() => shareToSocial('facebook')}
                className="w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
              >
                <div className="font-medium">Share on Facebook</div>
                <div className="text-sm text-gray-600">Post to your Facebook timeline</div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

