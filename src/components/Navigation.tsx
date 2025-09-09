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
  const [isDynamicIsland, setIsDynamicIsland] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      const unsubscribe = subscribeToUnreadMessages(user.uid, (count) => {
        setUnreadCount(count);
      });
      return unsubscribe;
    }
  }, [user?.uid]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.navigator.userAgent) {
      const ua = window.navigator.userAgent;
      // iPhone 14 Pro/Pro Max, iOS 16+, Safari only
      const isIOS = /iPhone/.test(ua) && /Safari/.test(ua) && !/Chrome/.test(ua);
      // Dynamic Island devices: iPhone 14 Pro, 14 Pro Max, 15 Pro, 15 Pro Max
      const isDynamic = /iPhone\s?(14|15)\s?Pro/.test(ua);
      setIsDynamicIsland(isIOS && isDynamic);
    }
  }, []);

  // Hide top navigation on specific pages (passport and "new" flows)
  if (pathname?.startsWith('/passport/') || pathname === '/rotations/new' || pathname === '/registry/new') {
    return null;
  }

  return (
    <>
      <nav
        className={`border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky z-40${isDynamicIsland ? ' sticky-header-safe safe-area-top' : ''}`}
        style={!isDynamicIsland ? { position: 'sticky', top: 0 } : undefined}
      >
        <div className="held-container">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <Image src="/held-logo.svg" alt="Held Logo" width={32} height={32} className="h-8 w-auto" />
            </Link>
            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/registry" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Registry</Link>
              <Link href="/rotations" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Rotations</Link>
              <Link href="/theCollaborative" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">theCollaborative</Link>
              {/*user && (
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
              )*/}
            </div>
            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center gap-2">
                {/* Add Button placeholder for CLS */}
                <div style={{ width: 120, height: 36, display: 'flex', alignItems: 'right', justifyContent: 'right' }}>
                  {loading ? (
                    <div className="bg-gray-200 rounded-lg w-full h-full animate-pulse" />
                  ) : user ? (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-black text-white font-semibold px-4 py-2 rounded-lg shadow hover:bg-black-700 transition-all">
                          <span className="flex items-center gap-2">
                            Add
                          </span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogTitle><VisuallyHidden>Add to Held</VisuallyHidden></DialogTitle>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Add Object Option */}
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-full flex flex-col items-center mb-2">
                              <div className="p-4 pt-0 flex flex-col items-center w-full ">
                                
                                <Image src="/img/registry.svg" alt="Registry" width={28} height={28} className="h-8 w-8 text-gray-600" />
                                <div className="text-xs text-gray-500 text-center mt-1">Add a collectible, piece of gear, or item to your registry.</div>
                              </div>
                            </div>
                            <DialogClose asChild>
                              <Link href="/registry/new" className="flex items-center justify-center gap-2 bg-gray-900 text-white px-5 py-3 rounded-md shadow hover:bg-gray-800 transition-all duration-200 text-lg font-semibold w-full">
                                Add to Registry
                              </Link>
                            </DialogClose>
                          </div>
                          {/* Add Rotation Option */}
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-full flex flex-col items-center mb-2">
                              <div className="p-4 pt-0 flex flex-col items-center w-full">
                                
                                
                                              <Image src="/img/rotations.svg" alt="Rotations" width={28} height={28} className="h-8 w-8 text-gray-600" />
                                <div className="text-xs text-gray-500 text-center mt-1">Create a new rotation to organize and share a set of objects.</div>
                              </div>
                            </div>
                            <DialogClose asChild>

                              <Link href="/rotations/new" className="flex items-center justify-center gap-2 bg-gray-900 text-white px-5 py-3 rounded-md shadow hover:bg-gray-800 transition-all duration-200 text-lg font-semibold w-full">
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
                        <button className="rounded-full  shadow-sm w-10 h-10 bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 relative">
                          {user.avatarUrl ? (
                            <Image src={user.avatarUrl} alt="Avatar" width={40} height={40} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <svg width="32" height="32" fill="none" viewBox="0 0 23 36"><path d="M16 18c-4 0-7 2-7 4v2h14v-2c0-2-3-4-7-4zm0-8a4 4 0 110 8 4 4 0 010-8z" fill="#bbb"/></svg>
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
                        <DropdownMenuItem asChild>
                          <Link href="/settings/messages" className="flex items-center">
                            <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                            <span className="ml-2">Messages</span>
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
  const pathname = usePathname();
  const isActive = (href: string) => pathname?.startsWith(href);
  return (
    <nav
      className="mobileNav md:hidden fixed bottom-0 left-0 right-0 bg-white/70 backdrop-blur-md shadow-lg z-50 flex justify-around items-center"
      style={{ minHeight: 66, paddingBottom: 'calc(env(safe-area-inset-bottom) + 2px)' }}
    >
      <Link href="/registry" className="flex flex-col items-center justify-center text-gray-600 hover:text-blue-600 h-full">
        <span className={`flex items-center justify-center h-10 w-10 ${isActive('/registry') ? 'bg-gray-200 rounded-full' : ''}`}>
          <Image src="/img/registry.svg" alt="Registry" width={22} height={22} />
        </span>
      </Link>
      <Link href="/rotations" className="flex flex-col items-center justify-center text-gray-600 hover:text-blue-600 h-full">
        <span className={`flex items-center justify-center h-10 w-10 ${isActive('/rotations') ? 'bg-gray-200 rounded-full' : ''}`}>
          <Image src="/img/rotations.svg" alt="Rotations" width={22} height={22} />
        </span>
      </Link>
      <Link href="/theCollaborative" className="flex flex-col items-center justify-center text-gray-600 hover:text-blue-600 h-full">
        <span className={`flex items-center justify-center h-10 w-10 ${isActive('/theCollaborative') ? 'bg-gray-200 rounded-full' : ''}`}>
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/></svg>
        </span>
      </Link>
      {/*user && (
        <Link href="/settings" className="flex flex-col items-center justify-center text-gray-600 hover:text-blue-600 h-full">
          <span className="flex items-center justify-center h-8">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
              <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </span>
        </Link>
      )*/}
    </nav>
  );
}
