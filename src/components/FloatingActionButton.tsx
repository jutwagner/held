"use client";

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useState, useEffect } from 'react';

interface FloatingActionButtonProps {
  href: string;
  label: string;
}

export default function FloatingActionButton({ href, label }: FloatingActionButtonProps) {
  const [isCapacitor, setIsCapacitor] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      setIsCapacitor(true);
    }
  }, []);

  // Only show on mobile/Capacitor
  if (!isCapacitor) {
    return null;
  }

  return (
    <Link
      href={href}
      className="fixed bottom-20 right-4 z-50 md:hidden"
      style={{ marginBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
    >
      <button
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-900 text-white shadow-lg transition-all duration-200 hover:bg-gray-800 hover:scale-105 active:scale-95 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
        title={label}
        aria-label={label}
      >
        <Plus className="h-6 w-6" />
      </button>
    </Link>
  );
}
