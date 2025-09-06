"use client";

import React from 'react';
import { useParams } from 'next/navigation';

export default function UserPage() {
  const params = useParams();
  const userId = String((params as any)?.userId ?? '');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 py-16">
      <div className="text-center max-w-lg">
        <h1 className="text-2xl font-light text-black mb-2">User: {userId}</h1>
        <p className="text-sm text-gray-600">User page coming soon.</p>
      </div>
    </div>
  );
}
