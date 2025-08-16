'use client';

import AddObjectFlow from '../../../../src/components/AddObjectFlow';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createObject } from '@/lib/firebase-services';
import { CreateObjectData } from '@/types';
import { ArrowLeft, Upload, X, Plus } from 'lucide-react';
import Link from 'next/link';

export default function NewObjectPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navigation />
      <div className="held-container py-8">
        <div className="flex items-center mb-8">
          <Button variant="ghost" asChild className="mr-4">
            <Link href="/registry">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Registry
            </Link>
          </Button>
          <h1 className="text-3xl font-serif font-medium">Add New Object</h1>
        </div>
        <div className="max-w-2xl mx-auto">
          {/* Fun, animated add object flow */}
          <div className="held-card p-8">
            <AddObjectFlow />
          </div>
        </div>
      </div>
    </div>
  );
}
