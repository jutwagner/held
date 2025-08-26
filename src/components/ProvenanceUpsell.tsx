'use client';

import React from 'react';
import { Award, Lock, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const ProvenanceUpsell: React.FC = () => {
  return (
    <div className="heldplus border-2 border-amber-200 rounded-xl p-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-200 to-orange-200 rounded-full opacity-20 transform translate-x-16 -translate-y-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-amber-100 to-orange-100 rounded-full opacity-30 transform -translate-x-12 translate-y-12"></div>
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg">
            <Award className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-serif font-semibold text-gray-900">Provenance Documentation</h3>
            <p className="text-amber-700 font-medium">Available with Held+ Premium</p>
          </div>
        </div>

        {/* Lock Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md border border-amber-200">
            <Lock className="h-8 w-8 text-amber-600" />
          </div>
        </div>

        {/* Features preview */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Premium Provenance Features
          </h4>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white bg-opacity-60 rounded-lg p-4 border border-amber-200">
              <h5 className="font-medium text-gray-900 mb-2">Complete Ownership History</h5>
              <p className="text-sm text-gray-600">Track the full chain of ownership with dates, notes, and transfer methods.</p>
            </div>
            
            <div className="bg-white bg-opacity-60 rounded-lg p-4 border border-amber-200">
              <h5 className="font-medium text-gray-900 mb-2">Certificate Management</h5>
              <p className="text-sm text-gray-600">Upload and manage certificates of authenticity with secure cloud storage.</p>
            </div>
            
            <div className="bg-white bg-opacity-60 rounded-lg p-4 border border-amber-200">
              <h5 className="font-medium text-gray-900 mb-2">Document Archive</h5>
              <p className="text-sm text-gray-600">Organize associated documents, receipts, and historical references.</p>
            </div>
            
            <div className="bg-white bg-opacity-60 rounded-lg p-4 border border-amber-200">
              <h5 className="font-medium text-gray-900 mb-2">Professional Presentation</h5>
              <p className="text-sm text-gray-600">Beautiful, museum-quality provenance display for sharing and documentation.</p>
            </div>
          </div>
        </div>

        {/* Testimonial-style quote */}
        <div className="bg-white bg-opacity-60 rounded-lg p-6 border border-amber-200 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-serif text-lg">"</span>
            </div>
            <div>
              <p className="text-gray-700 font-medium mb-2">
                "Provenance is everything in the collector's world. Held+ gives me the tools to document and share the complete story of each piece in my collection."
              </p>
              <p className="text-sm text-gray-600">— Premium Member</p>
            </div>
          </div>
        </div>

        {/* Pricing hint */}
        <div className="text-center mb-6">
          <p className="text-sm text-gray-600 mb-2">
            Starting at <span className="font-semibold text-gray-900">$9/month</span>
          </p>
          <p className="text-xs text-gray-500">
            Cancel anytime • 30-day money-back guarantee
          </p>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link href="/settings/premium">
            <Button className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold px-8 py-3 rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl">
              <Award className="h-4 w-4 mr-2" />
              Upgrade to Held+
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>

        {/* Value proposition */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-600">
            Join thousands of collectors who trust Held+ to preserve their collection's heritage
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProvenanceUpsell;
