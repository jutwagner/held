'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { HeldObject } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { isHeldPlus } from '@/contexts/AuthContext';
import { getObjectBySlug } from '@/lib/firebase-services';
import { formatDate, formatCurrency } from '@/lib/utils';
import { ArrowLeft, Share2, Calendar, DollarSign, Tag, Award, X, ExternalLink, Shield, Crown, Sparkles, CheckCircle, Send } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import passportSvg from '@/img/passport.svg';
import BlockchainAnchoring from '@/components/BlockchainAnchoring';
import { getPolygonExplorerURL } from '@/lib/blockchain-services';
import { Button } from '@/components/ui/button';

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
          <div className="w-12 h-12 border border-black border-t-transparent rounded-full animate-spin mx-auto mb-8"></div>
          <p className="text-black text-lg font-light tracking-wide">Loading</p>
        </div>
      </div>
    );
  }

  if (error || !object) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="text-4xl font-light text-black mb-8 tracking-wide">Not Found</h1>
          <p className="text-black mb-12 text-lg font-light">The passport you're looking for doesn't exist or has been made private.</p>
          <Link href="/" className="inline-flex items-center gap-4 text-black hover:text-gray-600 text-lg font-light tracking-wide border-b border-black hover:border-gray-600 pb-1 transition-colors">
            <ArrowLeft className="h-5 w-5" />
            Return
          </Link>
        </div>
      </div>
    );
  }

  const isPremiumUser = isHeldPlus(user);
  const hasProvenance = isPremiumUser && (object.serialNumber || object.acquisitionDate || object.certificateOfAuthenticity || object.chain?.length);

  return (
    <div className="min-h-screen bg-white light-mode-only">
      {/* Header */}
      <header className="w-full bg-white border-b border-gray-200 overflow-visible">
        <div className="w-full px-5 sm:px-10 py-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <Link
              href={user ? "/registry" : "/"}
              className="flex items-center gap-3 text-black hover:text-gray-600 transition-colors font-light tracking-wide text-base"
            >
              {user ? '← Back to Registry' : '← Back to Held'}
            </Link>
            
            <div className="flex items-center gap-3 flex-wrap">
              {object.openToSale && (
                user && user.uid !== object.userId ? (
                  <Link href={`/settings/messages`} className="inline-flex items-center gap-2 px-4 py-2.5 text-sm rounded-full bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 shadow-sm">
                    <Send className="h-4 w-4" /> Message
                  </Link>
                ) : !user ? (
                  <Link href={`/auth/signin?message=${encodeURIComponent('Sign in to message this seller')}`} className="inline-flex items-center gap-2 px-4 py-2.5 text-sm rounded-full bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 shadow-sm">
                    <Send className="h-4 w-4" /> Message
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-2 px-4 py-2.5 text-sm rounded-full bg-green-50 text-green-700 border border-green-200 shadow-sm">
                    <Send className="h-4 w-4" /> Open to sale
                  </span>
                )
              )}
              <button
                onClick={() => setShowShareModal(true)}
                className="bg-black text-white px-6 py-2.5 font-light tracking-wide text-sm hover:bg-gray-800 transition-colors rounded-lg shadow-sm"
              >
                Share
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
                <Image src={passportSvg} alt="Passport" width={40} height={40} className="hidden md:inline-block opacity-100 float-left mr-5 mt-5" />
        {/* Passport Header */}
        <div className="mb-10 sm:mb-16">
          <div className="flex flex-col md:flex-row items-stretch md:items-baseline justify-between gap-4 md:gap-0">
            <div className="flex-1 w-full">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-light text-black leading-tight tracking-tight mb-2 sm:mb-4 text-center md:text-left">
                {object.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-3 md:gap-6 text-sm text-black justify-center md:justify-start text-center md:text-left w-full">
                {object.maker && (
                  <span className="font-light tracking-wide">
                    {object.maker}
                  </span>
                )}
                {object.year && (
                  <span className="font-light tracking-wide">
                    {object.year}
                  </span>
                )}
                {object.category && (
                  <span className="font-light tracking-wide capitalize">
                    {object.category}
                  </span>
                )}
              </div>
            </div>
            
            <div className="md:ml-12 mt-2 md:mt-0 self-center md:self-auto">
              <div className="border border-black p-3 sm:p-4 text-center">
                <div className="text-xs uppercase tracking-widest text-black mb-1">Passport</div>
                <div className="text-lg font-light text-black">#{object.id?.slice(-8) || '00000000'}</div>
                {object.anchoring?.isAnchored && (
                  <div className=" text-xs text-black border-black pt-2">
                    {object.anchoring?.txHash ? (
                      <div className="flex flex-col items-center gap-1">
                        <Image src="/img/Polygon.svg" alt="Polygon" width={18} height={18} />
                        <a
                          href={getPolygonExplorerURL(object.anchoring.txHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:no-underline"
                          title={object.anchoring.txHash}
                        >
                          Anchored on Polygon
                        </a>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <span>Anchored on Polygon</span>
                        <Image src="/img/Polygon.svg" alt="Polygon" width={18} height={18} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Full Width */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Left Column - Images */}
          <div>
            {object.images && object.images.length > 0 && (
              <div className="space-y-4">
                {object.images.length === 1 ? (
                  <div
                    className="w-full bg-white border border-gray-200 overflow-hidden rounded-lg flex items-center justify-center min-h-[260px] sm:min-h-[360px] lg:min-h-[420px] max-h-[80vh]"
                  >
                    <Image
                      src={object.images[0]}
                      alt={object.title}
                      width={1600}
                      height={1600}
                      className="w-auto max-w-full h-auto max-h-[80vh] object-contain"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {object.images.map((image, index) => (
                      <div
                        key={index}
                        className="w-full bg-white border border-gray-200 overflow-hidden rounded-lg flex items-center justify-center min-h-[260px] sm:min-h-[360px] lg:min-h-[420px] max-h-[80vh]"
                      >
                        <Image
                          src={image}
                          alt={`${object.title} - Image ${index + 1}`}
                          width={1600}
                          height={1600}
                          className="w-auto max-w-full h-auto max-h-[80vh] object-contain"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Details & Content */}
          <div>
            {/* Object Details */}
            <div className="mb-10 sm:mb-16">
              <h2 className="text-lg sm:text-xl font-light text-black mb-6 sm:mb-8 tracking-wide pb-2">Details</h2>
              
              <div className="space-y-6">
                {object.maker && (
                  <div className="grid grid-cols-3 gap-6">
                    <div className="text-xs text-gray-500 uppercase tracking-widest">Maker</div>
                    <div className="col-span-2 text-base text-black font-light">{object.maker}</div>
                  </div>
                )}
                
                {object.year && (
                  <div className="grid grid-cols-3 gap-6">
                    <div className="text-xs text-gray-500 uppercase tracking-widest">Year</div>
                    <div className="col-span-2 text-base text-black font-light">{object.year}</div>
                  </div>
                )}
                
                {object.condition && (
                  <div className="grid grid-cols-3 gap-6">
                    <div className="text-xs text-gray-500 uppercase tracking-widest">Condition</div>
                    <div className="col-span-2 text-base text-black font-light capitalize">{object.condition}</div>
                  </div>
                )}
                
                {object.value && (
                  <div className="grid grid-cols-3 gap-6">
                    <div className="text-xs text-gray-500 uppercase tracking-widest">Value</div>
                    <div className="col-span-2 text-base text-black font-light">{formatCurrency(object.value)}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Tags 
            {object.tags && object.tags.length > 0 && (
              <div className="mb-10 sm:mb-16">
                <h3 className="text-sm font-light text-black mb-3 sm:mb-4 tracking-wide uppercase">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {object.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="text-sm text-white font-bold tracking-wide bg-gray-400 px-3 py-1 rounded-xlg"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}*/}

            {/* Notes */}
            {object.notes && (
              <div className="mb-10 sm:mb-16">
                <h3 className="text-sm font-light text-black mb-4 tracking-wide uppercase">Notes</h3>
                <div className="text-black font-light leading-relaxed text-base">
                  {object.notes}
                </div>
              </div>
            )}

            {/* Blockchain Verification */}
            <div className="mb-10 sm:mb-16">
              <h2 className="text-lg sm:text-xl font-light text-black mb-6 sm:mb-8 tracking-wide">Verification</h2>
              <BlockchainAnchoring 
                passport={object} 
                onAnchoringUpdate={(anchoring) => {
                  setObject(prev => prev ? { ...prev, anchoring } : null);
                }}
              />
            </div>

            {/* Enhanced Provenance */}
            {hasProvenance && (
              <div className="mb-10 sm:mb-16">
                <h2 className="text-lg sm:text-xl font-light text-black mb-6 sm:mb-8 tracking-wide  pb-2">Provenance</h2>
                
                <div className="space-y-8">
                  {object.serialNumber && (
                    <div className="grid grid-cols-3 gap-8">
                      <div className="text-xs text-gray-500 uppercase tracking-widest">Serial Number</div>
                      <div className="col-span-2 font-mono text-base text-black font-light">{object.serialNumber}</div>
                    </div>
                  )}
                  
                  {object.acquisitionDate && (
                    <div className="grid grid-cols-3 gap-8">
                      <div className="text-xs text-gray-500 uppercase tracking-widest">Acquisition Date</div>
                      <div className="col-span-2 text-base text-black font-light">{formatDate(new Date(object.acquisitionDate))}</div>
                    </div>
                  )}
                  
                  {object.certificateOfAuthenticity && (
                    <div className="grid grid-cols-3 gap-8">
                      <div className="text-xs text-gray-500 uppercase tracking-widest">Certificate</div>
                      <div className="col-span-2">
                        <a
                          href={object.certificateOfAuthenticity}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-black hover:text-gray-600 font-light tracking-wide text-base border-b border-black hover:border-gray-600 pb-1 transition-colors"
                        >
                          View Certificate
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {object.chain && object.chain.length > 0 && (
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-widest mb-6">Ownership History</div>
                      <div className="space-y-6">
                        {object.chain.map((entry, index) => (
                          <div key={index} className="border-l-2 border-black pl-6">
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-base text-black font-light">{entry.owner}</div>
                              {entry.acquiredAt && (
                                <div className="text-sm text-gray-600 font-light">
                                  {formatDate(new Date(entry.acquiredAt))}
                                </div>
                              )}
                            </div>
                            {entry.notes && (
                              <div className="text-sm text-gray-600 font-light">{entry.notes}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-black pt-10 sm:pt-16 mt-12 sm:mt-20">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link href="/" className="inline-block">
              <img src="/held-logomark.svg" alt="Held" className="h-10 w-10 opacity-80 hover:opacity-100 transition-opacity" />
            </Link>
            <p className="text-gray-600 font-light tracking-wide text-sm text-center sm:text-left">
              Immutable blockchain verification • Professional provenance tracking
            </p>
          </div>
        </footer>
      </main>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-12 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-12">
              <h3 className="text-2xl font-light text-black tracking-wide">Share</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-black hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              <button
                onClick={copyToClipboard}
                className="w-full p-6 border border-black text-left transition-colors hover:bg-gray-50"
              >
                <div className="font-light text-xl text-black">Copy Link</div>
                <div className="text-sm text-gray-600 font-light">Share this passport via link</div>
                {copySuccess && (
                  <div className="text-black text-sm mt-2 font-light">Copied to clipboard</div>
                )}
              </button>
              
              <button
                onClick={() => shareToSocial('twitter')}
                className="w-full p-6 border border-black text-left transition-colors hover:bg-gray-50"
              >
                <div className="font-light text-xl text-black">Twitter</div>
                <div className="text-sm text-gray-600 font-light">Post to your feed</div>
              </button>
              
              <button
                onClick={() => shareToSocial('facebook')}
                className="w-full p-6 border border-black text-left transition-colors hover:bg-gray-50"
              >
                <div className="font-light text-xl text-black">Facebook</div>
                <div className="text-sm text-gray-600 font-light">Post to your timeline</div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
