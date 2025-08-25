
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogClose, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useState, useEffect } from 'react';
import NotificationBadge from './NotificationBadge';
import { subscribeToUnreadMessages } from '@/lib/firebase-services';

export default function Navigation() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user?.uid) {
      const unsubscribe = subscribeToUnreadMessages(user.uid, (count) => {
        setUnreadCount(count);
      });
      return unsubscribe;
    }
  }, [user?.uid]);
  
  // Hide navigation on passport pages
  if (pathname?.startsWith('/passport/')) {
    return null;
  }
  
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
              {user && (
                <Link href="/settings/messages" className="text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-gray-500">
                    <path d="M2 8l8 5 8-5M2 8v6a2 2 0 002 2h12a2 2 0 002-2V8l-8 5-8-5z" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                  Messages
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-medium rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
              )}
            </div>
            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center gap-4">
                {/* Add Button placeholder for CLS */}
                <div style={{ width: 120, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {loading ? (
                    <div className="bg-gray-200 rounded-lg w-full h-full animate-pulse" />
                  ) : user ? (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition-all">
                          <span className="flex items-center gap-2">
                            <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M12 5v14m7-7H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                            Add
                          </span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogTitle><VisuallyHidden>Add to Held</VisuallyHidden></DialogTitle>
                        <h3 className="text-2xl font-bold mb-4 tracking-tight text-gray-900 text-center">Add to Held</h3>
                        <p className="text-sm text-gray-500 mb-2 text-center">Choose what you want to add:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                          {/* Add Object Option */}
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-full flex flex-col items-center mb-2">
                              <div className="bg-gray-100 rounded-xl p-4 flex flex-col items-center w-full shadow-sm border border-gray-200">
                                <svg width="32" height="32" fill="none" viewBox="0 0 32 32"><rect x="6" y="10" width="20" height="12" rx="3" stroke="#111" strokeWidth="2"/><path d="M13 10V7a3 3 0 016 0v3" stroke="#111" strokeWidth="2"/></svg>
                                <div className="font-semibold text-gray-900 text-base mt-2">Object</div>
                                <div className="text-xs text-gray-500 text-center mt-1">Add a collectible, piece of gear, or item to your registry.</div>
                              </div>
                            </div>
                            <DialogClose asChild>
                              <Link href="/registry/new" className="flex items-center justify-center gap-2 bg-gray-900 text-white px-5 py-3 rounded-lg shadow hover:bg-gray-800 transition-all duration-200 text-lg font-semibold w-full">
                                <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M12 5v14m7-7H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                                Add Object
                              </Link>
                            </DialogClose>
                          </div>
                          {/* Add Rotation Option */}
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-full flex flex-col items-center mb-2">
                              <div className="bg-blue-50 rounded-xl p-4 flex flex-col items-center w-full shadow-sm border border-blue-200">
                                <svg width="32" height="32" fill="none" viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" stroke="#2563eb" strokeWidth="2"/><path d="M16 10v8" stroke="#2563eb" strokeWidth="2"/><circle cx="16" cy="22" r="1.5" fill="#2563eb"/></svg>
                                <div className="font-semibold text-blue-700 text-base mt-2">Rotation</div>
                                <div className="text-xs text-blue-600 text-center mt-1">Create a new rotation to organize and share a set of objects.</div>
                              </div>
                            </div>
                            <DialogClose asChild>
                              <Link href="/rotations/new" className="flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-lg shadow hover:bg-blue-500 transition-all duration-200 text-lg font-semibold w-full">
                                <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M12 5v14m7-7H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                                Add Rotation
                              </Link>
                            </DialogClose>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <Link href="/auth/signin" className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition-all">
                      Sign In
                    </Link>
                  )}
                </div>
                {/* Avatar placeholder for CLS */}
                <div style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {loading ? (
                    <div className="bg-gray-200 rounded-full w-full h-full animate-pulse" />
                  ) : user ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="rounded-full border-2 border-gray-200 shadow-sm w-10 h-10 overflow-hidden bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 relative">
                          {user.avatarUrl ? (
                            <Image src={user.avatarUrl} alt="Avatar" width={40} height={40} className="w-full h-full object-cover" />
                          ) : (
                            <svg width="32" height="32" fill="none" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" stroke="#888" strokeWidth="2"/><path d="M16 18c-4 0-7 2-7 4v2h14v-2c0-2-3-4-7-4zm0-8a4 4 0 110 8 4 4 0 010-8z" fill="#bbb"/></svg>
                          )}
                          <NotificationBadge count={unreadCount} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem asChild>
                          <Link href="/settings" className="flex items-center">
                            <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                            <span className="ml-2">Settings</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={logout} className="flex items-center text-red-600">
                          <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M16 17l-4 4m0 0l-4-4m4 4V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                          <span className="ml-2">Sign Out</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Link href="/auth/signin" className="rounded-full border-2 border-gray-200 shadow-sm w-10 h-10 overflow-hidden bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center">
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" className="text-gray-500">
                        <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
      {/* Mobile Bottom Bar - persistent on all main pages */}
    </>
  );
}

export function MobileBottomBar() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user?.uid) {
      const unsubscribe = subscribeToUnreadMessages(user.uid, (count) => {
        setUnreadCount(count);
      });
      return unsubscribe;
    }
  }, [user?.uid]);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50 flex justify-around py-2">
      <Link href="/registry" className="flex flex-col items-center text-gray-600 hover:text-blue-600">
        <Image src="/img/registry.svg" alt="Registry" width={28} height={28} className="mb-1" />
        <span className="text-xs mt-1">Registry</span>
      </Link>
      <Link href="/rotations" className="flex flex-col items-center text-gray-600 hover:text-blue-600">
        <Image src="/img/rotations.svg" alt="Rotations" width={28} height={28} className="mb-1" />
        <span className="text-xs mt-1">Rotations</span>
      </Link>
      <Link href="/theCollaborative" className="flex flex-col items-center text-gray-600 hover:text-blue-600">
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/></svg>
        <span className="text-xs mt-1">theCollaborative</span>
      </Link>
      {user && (
        <Link href="/settings/messages" className="flex flex-col items-center text-gray-600 hover:text-blue-600 relative">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" className="mb-1">
            <path d="M2 8l8 5 8-5M2 8v6a2 2 0 002 2h12a2 2 0 002-2V8l-8 5-8-5z" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
          <span className="text-xs mt-1">Messages</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-medium rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>
      )}
    </nav>
  );
}
