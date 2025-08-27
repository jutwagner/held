'use client';

import React from 'react';
import { Award, Lock, ArrowRight, Calendar, FileText, Users, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const ProvenancePreview: React.FC = () => {
  return (
    <div className="border border-gray-200 rounded-lg p-8 bg-gray-50 relative">
      {/* Subtle premium indicator */}
      <div className="absolute top-4 right-4">
        <div className="flex items-center gap-2 text-xs text-amber-600 font-medium">
          <Award className="h-3 w-3" />
          Held+ Feature
        </div>
      </div>

      {/* Preview content */}
      <div className="space-y-6">
        <div>
          <h3 className="text-2xl font-light text-black tracking-tight mb-2">Provenance Documentation</h3>
          <p className="text-gray-600 text-sm">
            Complete ownership history and authentication records for serious collectors.
          </p>
        </div>

        {/* Mock form fields - disabled/grayed */}
        <div className="space-y-6 opacity-60">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-widest">
                Serial Number
              </label>
              <div className="border border-gray-200 bg-gray-100 p-3 rounded text-gray-400">
                Enter serial number...
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-widest">
                Acquisition Date
              </label>
              <div className="border border-gray-200 bg-gray-100 p-3 rounded text-gray-400 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Select date...
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-widest">
              Certificate of Authenticity
            </label>
            <div className="border-2 border-dashed border-gray-200 bg-gray-100 p-6 rounded text-center">
              <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Upload certificate image</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-widest">
              Ownership Chain
            </label>
            <div className="border border-gray-200 bg-gray-100 p-4 rounded">
              <div className="flex items-center gap-3 text-gray-400">
                <Users className="h-4 w-4" />
                <span className="text-sm">Track complete ownership history</span>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits list */}
        <div className="border-t border-gray-200 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <CheckCircle className="h-4 w-4 text-amber-500" />
              Complete ownership history
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <CheckCircle className="h-4 w-4 text-amber-500" />
              Certificate management
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <CheckCircle className="h-4 w-4 text-amber-500" />
              Document archive
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <CheckCircle className="h-4 w-4 text-amber-500" />
              Professional presentation
            </div>
          </div>
        </div>

        {/* Simple CTA */}
        <div className="text-center pt-4">
          <Link href="/settings/premium">
            <Button variant="outline" className="border-amber-500 text-amber-700 hover:bg-amber-50">
              <Award className="h-4 w-4 mr-2" />
              Learn More About Held+
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProvenancePreview;
