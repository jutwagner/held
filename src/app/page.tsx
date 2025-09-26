
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Package, RotateCcw, Eye } from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();
  const [hydrated, setHydrated] = React.useState(false);
  const [heroImg, setHeroImg] = useState<string | null>(null);
  useEffect(() => {
    setHydrated(true);
  // Pick a random hero image on mount (0.webp to 14.webp)
  const idx = Math.floor(Math.random() * 15); // 0 to 14 inclusive
  setHeroImg(`/img/hero/${idx}.webp`);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="held-container py-8 md:py-22">
        <div className="text-center max-w-3xl mx-auto">
          <div
            className="mx-auto mb-8 w-full"
            style={{
              maxWidth: '512px',
              height: '256px',
              background: heroImg ? 'none' : 'linear-gradient(90deg, #f3f3f3 25%, #e2e2e2 50%, #f3f3f3 75%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {heroImg && (
              <Image
                src={heroImg}
                alt="Hero"
                width={512}
                className="dark-invert"
                height={256}
                style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '0.75rem' }}
                priority
              />
            )}
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-medium mb-6 orientational text-gray-900 dark:text-gray-100">
            Quiet home for the things you hold.
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 mt-10 leading-loose">
            A way to catalog the things that matter to you, with no social pressure and no algorithms. Just your collection, your way.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {hydrated ? (
              user ? (
                <Button asChild size="lg">
                  <Link href="/registry">
                    Your Registry
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg">
                    <Link href="/auth/signup">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/auth/signin">Sign In</Link>
                  </Button>
                </>
              )
            ) : null}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="held-container py-16 md:py-24">
        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          {/* Registry */}
          <div className="text-center">
            <div className="w-26 h-26 flex items-center justify-center mx-auto mb-6">
              <Image src="/img/registry.svg" alt="Registry" width={28} height={28} className="h-8 w-8 text-gray-600" />
            </div>
            <h3 className="text-xl font-serif font-medium mb-4 text-gray-900 dark:text-gray-100">Registry</h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Your private, structured database for physical objects. Track makers, years, values, 
              and conditions with beautiful organization.
            </p>
          </div>

          {/* Passport */}
          <div className="text-center">
            <div className="w-26 h-26 flex items-center justify-center mx-auto mb-6">
              <Image src="/img/passport.svg" alt="Passport" width={28} height={28} className="h-8 w-8 text-gray-600" />
            </div>
            <h3 className="text-xl font-serif font-medium mb-4 text-gray-900 dark:text-gray-100">Passport</h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            Clean permalinks with metadata for discovery. When you want your favorite things seen, not just stored.</p>
          </div>

          {/* Rotation */}
          <div className="text-center">
            <div className="w-26 h-26 flex items-center justify-center mx-auto mb-6">
              <Image src="/img/rotations.svg" alt="Rotations" width={28} height={28} className="h-8 w-8 text-gray-600" />
            </div>
            <h3 className="text-xl font-serif font-medium mb-4 text-gray-900 dark:text-gray-100">Rotations</h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Time-specific snapshots of your collection. Grouped, seasonal setups, 
              themed collections, or current favorites.
            </p>
          </div>
        </div>
      </section>

      {/* Brand Statement */}
      <section className="held-container py-16 md:py-24 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-serif font-medium mb-6 text-gray-900 dark:text-gray-100">
            All the tools. Sharing is up to you.
          </h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            Held is designed for collectors, enthusiasts, and anyone who finds meaning in things. 
            Whether you&apos;re documenting family heirlooms, tracking your 
            design collection, or simply want a beautiful way to remember what you own.
          </p>
        </div>
      </section>

      {/* Footer is site-wide via layout */}
    </div>
  );
}
