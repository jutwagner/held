"use client";
import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import type { SectionKey } from './SectionNav';
import { ChevronLeft, LogOut } from 'lucide-react';

interface SettingsTopNavProps {
  section: SectionKey;
}

export default function SettingsTopNav({ section }: SettingsTopNavProps) {
  const { user, logout } = useAuth();

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const baseSections = [
    { key: 'profile', label: 'Profile' },
    { key: 'messages', label: 'Messages' },
    { key: 'premium', label: 'Held+' },
    { key: 'danger', label: 'Danger' },
  ];

  return (
    <div className="full-bleed bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="relative py-4">
        {/* Back button - absolutely positioned at left edge */}
        <Link 
          href={`/user/${user?.handle || ''}`}
          className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors z-20"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Link>

        {/* Middle items - centered horizontally */}
        <div className="flex justify-center items-center">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {baseSections.map((item) => (
              <Link
                key={item.key}
                href={`/settings/${item.key === 'profile' ? '' : item.key}`}
                className={`flex-shrink-0 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                  section === item.key
                    ? 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Sign Out button - absolutely positioned at right edge */}
        <button
          onClick={handleSignOut}
          className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors z-20"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
