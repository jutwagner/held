
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
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
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
                height={256}
                style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '0.75rem' }}
                priority
              />
            )}
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-medium mb-6">
            The quiet home for the things you hold
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
            A way to catalog and share the objects that matter to you. 
            No social pressure, no algorithms&mdash;just your collection, your way.
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
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="h-8 w-8 text-gray-600" />
            </div>
            <h3 className="text-xl font-serif font-medium mb-4">Registry</h3>
            <p className="text-gray-600 leading-relaxed">
              Your private, structured database for physical objects. Track makers, years, values, 
              and conditions with beautiful organization.
            </p>
          </div>

          {/* Passport */}
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Eye className="h-8 w-8 text-gray-600" />
            </div>
            <h3 className="text-xl font-serif font-medium mb-4">Passport</h3>
            <p className="text-gray-600 leading-relaxed">
              Public, shareable identity pages for any object. Clean permalinks with metadata 
              optimized for sharing and discovery.
            </p>
          </div>

          {/* Rotation */}
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <RotateCcw className="h-8 w-8 text-gray-600" />
            </div>
            <h3 className="text-xl font-serif font-medium mb-4">Rotation</h3>
            <p className="text-gray-600 leading-relaxed">
              Curated, time-specific snapshots of your collection. Share seasonal setups, 
              themed collections, or current favorites.
            </p>
          </div>
        </div>
      </section>

      {/* Brand Statement */}
      <section className="held-container py-16 md:py-24 border-t border-gray-200">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-serif font-medium mb-6">
            For people who care deeply about the objects they own
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Held is designed for collectors, enthusiasts, and anyone who finds meaning in their 
            physical possessions. Whether you&apos;re documenting family heirlooms, tracking your 
            design collection, or simply want a beautiful way to remember what you own, 
            Held provides the tools you need without the noise of social media.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="held-container py-12 border-t border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <h3 className="text-lg font-serif font-medium">Held</h3>
            <span className="text-xs font-mono text-gray-500">/held</span>
          </div>
          <div className="text-sm text-gray-500">
            © 2024 Held. The quiet home for the things you hold.
          </div>
        </div>
      </footer>
    </div>
  );
}
