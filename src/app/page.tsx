'use client';

import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Package, RotateCcw, Eye } from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navigation />
      
      {/* Hero Section */}
      <section className="held-container py-24 md:py-32">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-serif font-medium mb-6">
            The quiet home for the things you hold
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
            A private, beautiful way to catalog and share the physical objects that matter to you. 
            No social pressure, no algorithms—just your collection, your way.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Button asChild size="lg">
                <Link href="/registry">
                  View Your Registry
                  <ArrowRight className="ml-2 h-4 w-4" />
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
            )}
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
            physical possessions. Whether you're documenting family heirlooms, tracking your 
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
