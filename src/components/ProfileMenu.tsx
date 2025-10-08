'use client';

import React, { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronLeft, LogOut } from 'lucide-react';

interface ProfileMenuProps {
  currentSection?: string;
}

const menuItems = [
  { key: 'profile', label: 'Profile', href: '/settings' },
  { key: 'messages', label: 'Messages', href: '/settings/messages' },
  { key: 'premium', label: 'Held+', href: '/settings/premium' },
  { key: 'danger', label: 'Danger', href: '/settings/danger' },
];

export default function ProfileMenu({ currentSection = 'profile' }: ProfileMenuProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const handleSignOut = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    checkScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollButtons);
      return () => container.removeEventListener('scroll', checkScrollButtons);
    }
  }, []);

  return (
    <div className="relative bg-gray-50 border-b border-gray-200">
      <div className="flex items-center h-12 px-4">
        {/* Back button - pinned left */}
        <button
          onClick={handleBack}
          className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors shrink-0 mr-4"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Back</span>
        </button>

        {/* Middle items - horizontal carousel */}
        <div className="flex-1 relative">
          {/* Left scroll arrow */}
          {showLeftArrow && (
            <button
              onClick={scrollLeft}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full p-1 shadow-sm hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="h-3 w-3 text-gray-600" />
            </button>
          )}

          {/* Scrollable container */}
          <div
            ref={scrollContainerRef}
            className="flex items-center gap-1 overflow-x-auto scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {menuItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={`shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentSection === item.key
                    ? 'bg-gray-200 text-gray-900'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right scroll arrow */}
          {showRightArrow && (
            <button
              onClick={scrollRight}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full p-1 shadow-sm hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="h-3 w-3 text-gray-600 rotate-180" />
            </button>
          )}
        </div>

        {/* Sign Out button - pinned right */}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors shrink-0 ml-4"
        >
          <LogOut className="h-4 w-4" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
