'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { subscribePublicObjectsByTag } from '@/lib/firebase-services';
import { HeldObject } from '@/types';
import { Button } from '@/components/ui/button';

interface TagFeedClientProps {
  tag: string;
}

export default function TagFeedClient({ tag }: TagFeedClientProps) {
  const [objects, setObjects] = useState<HeldObject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribePublicObjectsByTag(tag, (list) => {
      setObjects(list);
      setLoading(false);
    });
    return () => {
      unsubscribe?.();
    };
  }, [tag]);

  const title = useMemo(() => `Objects tagged “${tag}”`, [tag]);

  return (
    <div className="full-bleed min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-black text-gray-900 dark:text-gray-100">
      <div className="held-container held-container-wide py-12">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/registry" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 inline-flex items-center gap-2">
              <span className="text-lg">←</span>
              Back to Registry
            </Link>
            <h1 className="mt-4 text-3xl sm:text-4xl font-light tracking-tight">{title}</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              A public feed of shared objects carrying the “{tag}” tag.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/registry">Create your own</Link>
          </Button>
        </div>

        {loading ? (
          <div className="py-24 flex justify-center text-gray-500 dark:text-gray-400">Loading…</div>
        ) : objects.length === 0 ? (
          <div className="py-24 text-center text-gray-500 dark:text-gray-400">
            <p className="text-lg">No public objects are tagged “{tag}” yet.</p>
            <p className="mt-2 text-sm">Share something with this tag from your registry to see it here.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {objects.map((object) => (
              <Link
                key={object.id}
                href={`/registry/${object.id}`}
                className="group rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden flex flex-col hover:border-gray-400 dark:hover:border-gray-600 transition"
              >
                <div className="aspect-[4/3] bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                  {object.images && object.images.length > 0 ? (
                    <Image
                      src={object.images[0]}
                      alt={object.title || 'Tagged object'}
                      width={600}
                      height={450}
                      className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="text-gray-400 dark:text-gray-500 text-sm">No image</div>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 truncate">{object.title || 'Untitled object'}</h2>
                  {object.maker && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{object.maker}</p>
                  )}
                  {object.category && (
                    <p className="text-xs uppercase tracking-widest text-gray-400 dark:text-gray-500">{object.category}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
