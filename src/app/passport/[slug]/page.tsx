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

export default function PassportPage() {
  const { user } = useAuth();
  const params = useParams();
  const [object, setObject] = useState<HeldObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageModal, setImageModal] = useState<{ isOpen: boolean; src: string; alt: string }>({
    isOpen: false,
    src: '',
    alt: ''
  });

  const slug = params?.slug ? String(params.slug) : '';

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
      <header className="border-b-2 border-blue-200 bg-gradient-to-br from-blue-50 via-white to-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-8">
            <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 bg-white px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors shadow-sm">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Back to Held</span>
            </Link>
            <button
              onClick={handleShare}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 bg-white px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors shadow-sm"
            >
              <Share2 className="h-4 w-4" />
              <span className="text-sm font-medium">Share Passport</span>
            </button>
          </div>
          
          {/* Official Header */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-4 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-lg font-bold">H</span>
              </div>
              <h1 className="text-3xl font-serif font-bold text-gray-900">Held Passport</h1>
            </div>
            <p className="text-sm text-gray-600 font-mono tracking-wide">Official Collection Documentation</p>
            <div className="mt-4 flex items-center justify-center space-x-6 text-xs text-gray-500">
              <span>Public Record</span>
              <span>•</span>
              <span>Verifiable</span>
              <span>•</span>
              <span>Shareable</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative">
          {/* Watermark */}
          <div className="absolute inset-0 pointer-events-none opacity-5 z-0">
            <div className="absolute top-8 right-8 text-6xl font-serif font-bold text-gray-400 transform rotate-12">
              HELD
            </div>
          </div>
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

            {/* Provenance (Held+) */}
            {isHeldPlus(user) && (
              <>
                {(object.chain || object.certificateOfAuthenticity || object.serialNumber || object.acquisitionDate || object.origin || (object.conditionHistory && object.conditionHistory.length > 0) || object.transferMethod || object.associatedDocuments || object.provenanceNotes) && (
                  <div className="space-y-4 border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-bold mb-2 text-blue-700">Provenance</h3>
                    {object.chain && Array.isArray(object.chain) && object.chain.length > 0 && (
                      <div>
                        <span className="font-semibold">Chain of Ownership:</span>
                        <div className="mt-3 space-y-4">
                          {object.chain.map((entry, index) => (
                            <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-gray-900">{entry.owner}</h4>
                                <span className="text-sm text-gray-500 font-mono">
                                  {entry.acquiredAt ? new Date(entry.acquiredAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  }) : 'Date unknown'}
                                </span>
                              </div>
                              {entry.notes && (
                                <p className="text-sm text-gray-600 italic">"{entry.notes}"</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {object.certificateOfAuthenticity && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
                            <Award className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">Certificate of Authenticity</h4>
                            <p className="text-sm text-gray-500">Official documentation</p>
                          </div>
                        </div>
                        
                        {object.certificateOfAuthenticity.startsWith('http') ? (
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <Image
                                src={object.certificateOfAuthenticity || ''}
                                alt="Certificate of Authenticity"
                                width={80}
                                height={60}
                                className="rounded border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => setImageModal({
                                  isOpen: true,
                                  src: object.certificateOfAuthenticity || '',
                                  alt: 'Certificate of Authenticity'
                                })}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 rounded transition-all flex items-center justify-center">
                                <span className="text-white text-xs font-medium opacity-0 hover:opacity-100">Click to enlarge</span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() => setImageModal({
                                  isOpen: true,
                                  src: object.certificateOfAuthenticity || '',
                                  alt: 'Certificate of Authenticity'
                                })}
                                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                <ExternalLink className="h-4 w-4" />
                                View Full Size
                              </button>
                              <a
                                href={object.certificateOfAuthenticity}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 text-sm"
                              >
                                <ExternalLink className="h-4 w-4" />
                                Open in New Tab
                              </a>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-700">{object.certificateOfAuthenticity}</p>
                        )}
                      </div>
                    )}
                    {object.serialNumber && <div><span className="font-semibold">Serial Number:</span> <span className="text-gray-700">{object.serialNumber}</span></div>}
                    {object.acquisitionDate && <div><span className="font-semibold">Acquisition Date:</span> <span className="text-gray-700">{String(object.acquisitionDate)}</span></div>}
                    {object.origin && <div><span className="font-semibold">Origin:</span> <span className="text-gray-700">{object.origin}</span></div>}
                    {object.conditionHistory && object.conditionHistory.length > 0 && (
                      <div>
                        <span className="font-semibold">Condition History:</span>
                        <ul className="list-disc ml-6 text-gray-700">
                          {object.conditionHistory.map((entry, idx) => (
                            <li key={idx}>{String(entry.date)} - {entry.condition}{entry.notes ? ` (${entry.notes})` : ''}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {object.transferMethod && <div><span className="font-semibold">Transfer Method:</span> <span className="text-gray-700">{object.transferMethod}</span></div>}
                    {object.associatedDocuments && <div><span className="font-semibold">Associated Documents:</span> <span className="text-gray-700">{object.associatedDocuments}</span></div>}
                    {object.provenanceNotes && <div><span className="font-semibold">Provenance Notes:</span> <span className="text-gray-700">{object.provenanceNotes}</span></div>}
                  </div>
                )}
              </>
            )}

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

            {/* Sell on eBay Button */}
            <div className="pt-8 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>Held by {object.userId}</span>
                <span>{formatDate(object.createdAt)}</span>
              </div>
              {/* Compose full description for eBay pre-fill */}
              {(() => {
                const details = [
                  `Title: ${object.title}`,
                  object.maker ? `Maker: ${object.maker}` : '',
                  object.year ? `Year: ${object.year}` : '',
                  object.value ? `Value: $${object.value}` : '',
                  object.category ? `Category: ${object.category}` : '',
                  object.condition ? `Condition: ${object.condition}` : '',
                  Array.isArray(object.tags) && object.tags.length > 0 ? `Tags: ${object.tags.join(', ')}` : '',
                  object.notes ? `Notes: ${object.notes}` : '',
                  object.description ? `Description: ${object.description}` : '',
                  object.images && object.images.length > 0 ? `Images: ${object.images.join(', ')}` : '',
                ].filter(Boolean).join('\n');
                const ebayUrl = `https://www.ebay.com/sl/sell?title=${encodeURIComponent(object.title)}&desc=${encodeURIComponent(details)}&price=${encodeURIComponent(object.value || '')}`;
                return (
                  <a
                    href={ebayUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition-all text-sm"
                  >
                    Sell this item on eBay
                  </a>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-16 bg-gradient-to-r from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center">
                <span className="text-white text-lg font-bold">H</span>
              </div>
              <div>
                <h3 className="text-xl font-serif font-bold text-gray-900">Held</h3>
                <p className="text-xs font-mono text-gray-500">/held</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">The quiet home for the things you hold</p>
            <div className="flex items-center justify-center space-x-6 text-xs text-gray-500">
              <span>Official Collection Documentation</span>
              <span>•</span>
              <span>Generated on {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Image Modal */}
      {imageModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setImageModal({ isOpen: false, src: '', alt: '' })}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <X className="h-8 w-8" />
            </button>
            <Image
              src={imageModal.src}
              alt={imageModal.alt}
              width={800}
              height={600}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
