'use client';

import React from 'react';
import { Award, Lock, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const ProvenanceUpsell: React.FC = () => {
  return (
    <div className="heldplus border-2 border-amber-200 rounded-xl p-8 relative overflow-hidden">
      {/* Background decoration */}
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-gray-300 to-gray-600 rounded-full flex items-center justify-center shadow-lg">
            <span className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <img src="/held-seal.svg" alt="Held Seal" className="h-10 w-10" />
            </span>
          </div>
          <div>
            <h3 className="text-2xl font-serif font-semibold text-gray-900">Provenance</h3>
            <p className="text-grey-700 font-medium">Available with Held+ Premium</p>
          </div>
        </div>

        {/* Lock Icon * /}
        <div className="flex justify-center">
          <div className="w-16 h-16 sflex items-center justify-center">
            <img src="/held-seal-plus.svg" alt="Held+ Seal" className="h-16 w-16" />
          </div>
        </div>
        */}

        {/* Features preview */}
        <div className="mb-8">
          {/*}
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Premium Provenance Features
          </h4>
          */}
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white bg-opacity-60 rounded-lg p-4 border">
              <h5 className="font-medium text-gray-900 mb-2">Ownership History</h5>
              <p className="text-sm text-gray-600">Track the full chain of ownership with dates, notes, and transfer methods.</p>
            </div>
            
            <div className="bg-white bg-opacity-60 rounded-lg p-4 border">
              <h5 className="font-medium text-gray-900 mb-2">Certificate Management</h5>
              <p className="text-sm text-gray-600">Upload and manage certificates of authenticity with secure cloud storage.</p>
            </div>
            
            <div className="bg-white bg-opacity-60 rounded-lg p-4 border">
              <h5 className="font-medium text-gray-900 mb-2">Document Archive</h5>
              <p className="text-sm text-gray-600">Organize associated documents, receipts, and historical references.</p>
            </div>
            
            <div className="bg-white bg-opacity-60 rounded-lg p-4 border">
              <h5 className="font-medium text-gray-900 mb-2">Professional Presentation</h5>
              <p className="text-sm text-gray-600">Beautiful, museum-quality provenance display for sharing and documentation.</p>
            </div>
          </div>
        </div>

        {/* Testimonial-style quote */}
        <div className="bg-white bg-opacity-60 rounded-lg p-6 border mb-8 testimonial">
          <div className="flex items-center gap-4 testimonial">
            <div>
              <p className="text-gray-700 font-medium mb-2 testimonial">
                "Held+ gives me the tools to document and share each piece the assemblage of my collection."
              </p>
              <p className="text-sm text-gray-600">— Premium Member</p>
            </div>
          </div>
        </div>

        {/* Pricing hint */}
        <div className="text-center mb-6">
          <p className="text-sm text-gray-600 mb-2">
            Starting at <span className="font-semibold text-gray-900">$5/month</span>
          </p>
          <p className="text-xs text-gray-500">
            Cancel anytime
          </p>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link href="/settings/premium">
            <Button className="bg-black hover:from-amber-600 text-white font-semibold px-8 py-3 rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl">
              <Award className="h-4 w-4 mr-2" />
              Upgrade to Held+
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>

        {/* Value proposition */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-600">
            Join collectors who Use Held+ to preserve their collection's heritage
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProvenanceUpsell;
