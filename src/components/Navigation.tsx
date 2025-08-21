
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogClose } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

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
                  {/* Add Button with Modal */}
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
                  {/* User avatar and dropdown menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="rounded-full border-2 border-gray-200 shadow-sm w-10 h-10 overflow-hidden bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <svg width="32" height="32" fill="none" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" stroke="#888" strokeWidth="2"/><path d="M16 18c-4 0-7 2-7 4v2h14v-2c0-2-3-4-7-4zm0-8a4 4 0 110 8 4 4 0 010-8z" fill="#bbb"/></svg>
                        )}
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
