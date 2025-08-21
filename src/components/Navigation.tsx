
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export default function Navigation() {
  const { user, loading, logout } = useAuth();
  return (
    <>
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="held-container">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <h1 className="text-xl font-serif font-medium">Held</h1>
              <span className="text-xs font-mono text-gray-500">/held</span>
            </Link>
            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/registry" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Registry</Link>
              <Link href="/rotations" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Rotations</Link>
              <Link href="/theCollaborative" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">theCollaborative</Link>
            </div>
            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {loading ? (
                <div className="flex items-center justify-center h-8 w-24">
                  <span className="text-gray-400 text-sm">Loading…</span>
                </div>
              ) : user ? (
                <>
                  {/* ...existing code for Dialog and DropdownMenu... */}
                </>
              ) : (
                <div className="flex items-center space-x-2">
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/auth/signin">Sign In</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/auth/signup">Sign Up</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      {/* Mobile Bottom Bar - persistent on all main pages */}
    </>
  );
}

export function MobileBottomBar() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50 flex justify-around py-2">
      <Link href="/registry" className="flex flex-col items-center text-gray-600 hover:text-blue-600">
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><rect x="4" y="7" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M9 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="2"/></svg>
        <span className="text-xs mt-1">Registry</span>
      </Link>
      <Link href="/rotations" className="flex flex-col items-center text-gray-600 hover:text-blue-600">
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><path d="M12 7v5" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="16" r="1" fill="currentColor"/></svg>
        <span className="text-xs mt-1">Rotations</span>
      </Link>
      <Link href="/theCollaborative" className="flex flex-col items-center text-gray-600 hover:text-blue-600">
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/></svg>
        <span className="text-xs mt-1">theCollaborative</span>
      </Link>
    </nav>
  );
}
