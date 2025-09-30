"use client";
import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import type { SectionKey } from './SectionNav';
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react';

interface SettingsTopNavProps {
  section: SectionKey;
}

export default function SettingsTopNav({ section }: SettingsTopNavProps) {
  const { user, logout } = useAuth();
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
    // { key: 'account', label: 'Account' },
    // { key: 'data', label: 'Data' },
    // { key: 'notifications', label: 'Notifications' },
    { key: 'danger', label: 'Danger' },
  ];

  const navItems = [
    ...baseSections.map((sectionDef) => ({
      type: 'link' as const,
      ...sectionDef,
      href: `/settings/${sectionDef.key === 'profile' ? '' : sectionDef.key}`,
    })),
    {
      type: 'action' as const,
      key: 'signout',
      label: 'Sign Out',
    },
  ];

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    
    const scrollAmount = 150;
    const newPosition = direction === 'left' 
      ? Math.max(0, scrollPosition - scrollAmount)
      : scrollPosition + scrollAmount;
    
    scrollContainerRef.current.scrollTo({
      left: newPosition,
      behavior: 'smooth'
    });
    setScrollPosition(newPosition);
  };

  const canScrollLeft = scrollPosition > 0;
  const canScrollRight = scrollContainerRef.current 
    ? scrollPosition < (scrollContainerRef.current.scrollWidth - scrollContainerRef.current.clientWidth)
    : false;

  return (
    <div className="full-bleed bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="held-container held-container-wide py-4">
        <div className="flex items-center justify-center relative">
          {/* Back button - left aligned but inline with menu */}
          <Link 
            href={`/user/${user?.handle || ''}`}
            className="absolute left-0 sm:left-4 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Link>

          {/* Centered Horizontal Carousel Navigation */}
          <div className="relative w-full max-w-4xl mx-auto px-4 sm:px-16">
            <div 
              ref={scrollContainerRef}
              className="flex gap-2 overflow-x-auto scrollbar-hide pb-2"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              onScroll={(e) => setScrollPosition(e.currentTarget.scrollLeft)}
            >
              {navItems.map((item) => {
                if (item.type === 'action') {
                  return (
                    <button
                      key={item.key}
                      onClick={handleSignOut}
                      className="flex-shrink-0 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-2 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <LogOut className="h-4 w-4" />
                      {item.label}
                    </button>
                  );
                }

                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={`flex-shrink-0 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                      section === item.key
                        ? 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
            
            {/* Scroll Buttons */}
            {canScrollLeft && (
              <button
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 shadow-lg rounded-full p-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            
            {canScrollRight && (
              <button
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 shadow-lg rounded-full p-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
