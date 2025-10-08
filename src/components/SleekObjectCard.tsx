import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { HeldObject } from '@/types';
import { formatCurrency } from '@/lib/utils';

function getProvenanceScore(o: HeldObject): number {
  let score = 0;
  let total = 4;
  if (o.serialNumber) score++;
  if (o.certificateOfAuthenticity) score++;
  if (Array.isArray(o.chain) && o.chain.length > 0) score++;
  if (o.acquisitionDate) score++;
  return Math.round((score / total) * 100);
}

export default function SleekObjectCard({ object }: { object: HeldObject }) {
  return (
    <Link href={`/registry/${object.id}`}>
      <div
        className="relative rounded-2xl overflow-hidden h-[540px] md:h-[560px] flex flex-col transition-all duration-300 hover:scale-[1.02] cursor-pointer group shadow-[0_12px_40px_rgba(0,0,0,0.15)] hover:shadow-[0_24px_64px_rgba(0,0,0,0.25)]"
        style={{ 
          willChange: 'transform',
          borderRadius: '1rem',
          transform: 'translateZ(0)'
        }}
      >
        {/* Full-bleed background image */}
        <div className="absolute inset-0">
          {object.images.length > 0 ? (
            <Image
              src={object.images[0]}
              alt={object.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
              priority={false}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/img/placeholder.svg';
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 dark:from-gray-700 dark:via-gray-600 dark:to-gray-500 flex items-center justify-center">
              <Image src="/img/placeholder.svg" alt="No image" width={48} height={48} className="w-12 h-12 opacity-40" loading="lazy" priority={false} />
            </div>
          )}
          
          {/* Subtle blur gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20" />
          
          {/* Dark gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        </div>

        {/* Public badge */}
        {object.isPublic && (
          <div className="absolute top-4 right-4 z-20">
            <span className="bg-green-500/90 backdrop-blur-sm text-white text-[10px] font-semibold px-3 py-1 rounded-full shadow-lg tracking-wide uppercase">
              Public
            </span>
          </div>
        )}

        {/* Content overlay */}
        <div className="relative z-10 flex flex-col justify-end h-full p-6">
          {/* Title and maker */}
          <div className="mb-4">
            <h3 className="font-serif text-2xl md:text-3xl font-bold mb-2 text-white leading-tight tracking-tight">
              {object.title}
            </h3>
            {object.maker && (
              <p className="text-white/90 text-lg font-light mb-3">
                {object.maker}
              </p>
            )}
          </div>

          {/* Meta information */}
          <div className="flex items-center gap-3 mb-4">
            {object.year && !isNaN(object.year) && (
              <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm font-medium rounded-full border border-white/30">
                {object.year}
              </span>
            )}
            {typeof object.value !== 'undefined' && (
              <span className="px-3 py-1 bg-emerald-500/90 backdrop-blur-sm text-white text-sm font-medium rounded-full border border-emerald-400/30">
                {isNaN(object.value) ? 'Value N/A' : formatCurrency(object.value)}
              </span>
            )}
            {!object.isPublic && (
              <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white/80 text-sm font-medium rounded-full border border-white/20">
                Private
              </span>
            )}
          </div>

          {/* Tags */}
          {Array.isArray(object.tags) && object.tags.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {object.tags.slice(0, 4).map((tag, idx) => (
                  <span 
                    key={idx} 
                    className="px-2 py-1 bg-white/20 backdrop-blur-sm text-white/90 text-xs font-medium rounded-full border border-white/30"
                  >
                    {tag}
                  </span>
                ))}
                {object.tags.length > 4 && (
                  <span className="px-2 py-1 bg-white/20 backdrop-blur-sm text-white/90 text-xs font-medium rounded-full border border-white/30">
                    +{object.tags.length - 4}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Provenance progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-white/90 mb-2">
              <span className="font-medium">Provenance</span>
              <span className="font-mono text-white">{getProvenanceScore(object)}%</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
              <div
                className="h-full bg-white/80 rounded-full transition-all duration-500"
                style={{ width: `${getProvenanceScore(object)}%` }}
              />
            </div>
          </div>

          {/* Ownership chain (if available) */}
          {Array.isArray(object.chain) && object.chain.length > 0 && (
            <div className="text-xs text-white/80">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-white/70">Ownership:</span>
                {(object.chain.slice(0, 2)).map((owner, idx) => (
                  <span key={idx} className="px-2 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full border border-white/30">
                    {owner.owner || 'Unknown'}
                  </span>
                ))}
                {object.chain.length > 2 && (
                  <span className="px-2 py-1 bg-white/20 backdrop-blur-sm text-white/80 text-xs font-medium rounded-full border border-white/30">
                    +{object.chain.length - 2} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
