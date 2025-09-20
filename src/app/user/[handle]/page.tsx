"use client";
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getUserByHandle, getUserObjects, getUserRotations } from '@/lib/firebase-services';
import type { UserDoc, HeldObject, Rotation } from '@/types';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/Badge';
import { ChevronLeft, ChevronRight, Settings, Globe, Lock } from 'lucide-react';

export default function ProfilePage() {
  const params = useParams();
  const profileHandle = params?.handle as string;
  const { user: currentUser } = useAuth();
  const router = useRouter();

  const [profileUser, setProfileUser] = useState<UserDoc | null>(null);
  const [objects, setObjects] = useState<HeldObject[]>([]);
  const [rotations, setRotations] = useState<Rotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPublicProfile, setIsPublicProfile] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser || !isOwnProfile) return;

    setUploadingCover(true);
    try {
      // Import upload functions
      const { uploadImages, updateUser } = await import('@/lib/firebase-services');
      
      // Upload image (uploadImages expects array, returns array)
      const imageUrls = await uploadImages([file], currentUser.uid);
      const imageUrl = imageUrls[0];
      
      // Update user profile with cover image
      await updateUser(currentUser.uid, { coverImage: imageUrl });
      
      // Update local state
      if (profileUser) {
        setProfileUser({ ...profileUser, coverImage: imageUrl });
      }
    } catch (error) {
      console.error('Error uploading cover image:', error);
    } finally {
      setUploadingCover(false);
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      if (!profileHandle || typeof profileHandle !== 'string') return;

      try {
        const user = await getUserByHandle(profileHandle);

        if (!user) {
          router.push('/404');
          return;
        }

        setProfileUser(user);
        setIsPublicProfile(user.isPublicProfile ?? false);
        setIsOwnProfile(currentUser?.uid === user.uid);

        if (user.isPublicProfile || currentUser?.uid === user.uid) {
          const [userObjects, userRotations] = await Promise.all([
            getUserObjects(user.uid),
            getUserRotations(user.uid)
          ]);

          setObjects(userObjects);
          setRotations(userRotations);
        }
      } catch (error) {
        router.push('/404');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [profileHandle, currentUser, router]);

  const togglePublicProfile = async () => {
    if (!profileUser || !currentUser || profileUser.uid !== currentUser.uid) return;

    try {
      const newPublicState = !isPublicProfile;
      setIsPublicProfile(newPublicState);

      setProfileUser(prev => prev ? { ...prev, isPublicProfile: newPublicState } : null);
    } catch (error) {
      setIsPublicProfile(!isPublicProfile); // Revert on error
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading profile...</div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Profile not found</div>
      </div>
    );
  }

  // Check if profile is private and not owned by current user
  if (!profileUser.isPublicProfile && !isOwnProfile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Private Profile
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            This profile is private and only visible to its owner.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 ">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="held-container py-6  held-container-wide py-8 align-center" >
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Link>
            {isOwnProfile && (
              <Link href="/settings">
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="held-container-wide py-8 align-center">
        {/* Profile Header */}
        <div className="flex justify-center mb-8">
          <div className="w-full">
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              {/* Cover Image */}
              <div className="h-48 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 relative group">
                {profileUser.coverImage ? (
                  <>
                    <Image
                      src={profileUser.coverImage}
                      alt="Cover"
                      fill
                      className="object-cover"
                    />
                    {/* Gradient shadow overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
                  </>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 opacity-20" />
                )}
                
                {/* Cover Upload/Delete Buttons - Only show for own profile */}
                {isOwnProfile && (
                  <>
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
                      <button
                        onClick={() => coverInputRef.current?.click()}
                        disabled={uploadingCover}
                        className="bg-white/90 text-gray-800 px-4 py-2 rounded-lg font-medium shadow-lg hover:bg-white transition-colors"
                      >
                        {uploadingCover ? 'Uploading...' : profileUser.coverImage ? 'Change Cover' : 'Add Cover Image'}
                      </button>
                      
                      {profileUser.coverImage && (
                        <button
                          onClick={async () => {
                            setUploadingCover(true);
                            try {
                              const { updateUser } = await import('@/lib/firebase-services');
                              await updateUser(currentUser.uid, { coverImage: null });
                              setProfileUser({ ...profileUser, coverImage: null });
                            } catch (error) {
                              console.error('Error removing cover image:', error);
                            } finally {
                              setUploadingCover(false);
                            }
                          }}
                          disabled={uploadingCover}
                          className="bg-red-500/90 text-white px-4 py-2 rounded-lg font-medium shadow-lg hover:bg-red-500 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCoverUpload}
                      className="hidden"
                    />
                  </>
                )}
              </div>

              {/* Profile Info */}
              <div className="relative px-6 pb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-16">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
                      {profileUser.avatarUrl ? (
                        <Image
                          src={profileUser.avatarUrl}
                          alt={profileUser.displayName}
                          width={128}
                          height={128}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-600">
                          <svg width="48" height="48" fill="none" viewBox="0 0 24 24" className="text-gray-500">
                            <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Profile Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <h1 className={`text-2xl font-bold ${profileUser.coverImage ? 'text-white drop-shadow-lg' : 'text-gray-900 dark:text-gray-100'}`}>
                          {profileUser.displayName || 'Unnamed User'}
                        </h1>
                        <p className={`${profileUser.coverImage ? 'text-white/90 drop-shadow-lg' : 'text-gray-600 dark:text-gray-300'}`}>
                          @{profileUser.handle}
                        </p>
                        {profileUser.bio && (
                          <p className={`mt-2 max-w-md ${profileUser.coverImage ? 'text-white/90 drop-shadow-lg' : 'text-gray-700 dark:text-gray-300'}`}>
                            {profileUser.bio}
                          </p>
                        )}
                      </div>

                      {/* Public Profile Toggle (only for own profile) */}
                      {isOwnProfile && (
                        <div className="flex items-center gap-2">
                          {isPublicProfile ? (
                            <Globe className="h-4 w-4 text-green-500" />
                          ) : (
                            <Lock className="h-4 w-4 text-gray-400" />
                          )}
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {isPublicProfile ? 'Public' : 'Private'}
                          </span>
                          <Switch
                            checked={isPublicProfile}
                            onCheckedChange={togglePublicProfile}
                            className="data-[state=checked]:bg-green-500"
                          />
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex gap-6 mt-4">
                      <div className="text-center">
                        <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                          {objects.length}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Objects
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                          {rotations.length}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Rotations
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Registry Carousel */}
        {objects.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Registry ({objects.length})
              </h2>
              {objects.length > 4 && (
                <Link href="/registry" className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400">
                  View all
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Registry Carousel - Bleeds to edge */}
      {objects.length > 0 && (
        <div className="mb-8">
          <HorizontalCarousel>
            {objects.slice(0, 8).map((object) => (
              <Link key={object.id} href={`/registry/${object.slug}`} className="w-64 flex-shrink-0">
                <div className="relative rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl border border-white/60 dark:border-gray-700/60 ring-1 ring-black/5 dark:ring-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.3)] hover:shadow-[0_24px_64px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_24px_64px_rgba(0,0,0,0.4)] h-[400px] flex flex-col transition-transform duration-300 hover:scale-[1.02] cursor-pointer group">
                  {/* Subtle top sheen */}
                  <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-b from-white/50 dark:from-gray-800/50 to-transparent" />
                  
                  {/* Premium/Public Accent */}
                  {object.isPublic && (
                    <span className="absolute top-4 right-4 bg-gradient-to-r from-green-500 to-green-300 text-white text-[10px] font-semibold px-3 py-1 rounded-full shadow z-10 tracking-wide uppercase">Public</span>
                  )}
                  
                  {/* Image */}
                  <div className="relative aspect-square rounded-2xl overflow-hidden flex items-center justify-center border border-white/70 dark:border-gray-700/70 ring-1 ring-black/5 dark:ring-white/5 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 dark:from-gray-700 dark:via-gray-600 dark:to-gray-500 m-4">
                    {object.images.length > 0 ? (
                      <Image
                        src={object.images[0]}
                        alt={object.title}
                        width={200}
                        height={200}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image src="/img/placeholder.svg" alt="No image" width={48} height={48} className="w-12 h-12 opacity-40" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="px-4 pb-4 flex-1 flex flex-col">
                    <h3 className="font-serif text-lg font-semibold mb-1 line-clamp-1 text-gray-900 dark:text-gray-100 tracking-tight">
                      {object.title}
                    </h3>
                    {object.maker ? (
                      <p className="text-sm text-gray-700/90 dark:text-gray-300/90 mb-3 font-light">
                        {object.maker}
                      </p>
                    ) : (
                      <div className="h-5 mb-3" />
                    )}
                    
                    {/* Tags */}
                    {object.tags && object.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {object.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="px-2 py-1 rounded-full bg-white/70 dark:bg-gray-700/70 border border-white/60 dark:border-gray-600/60 ring-1 ring-black/5 dark:ring-white/5 text-xs text-gray-800 dark:text-gray-200">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </HorizontalCarousel>
        </div>
      )}

      {/* Rotations Carousel - Bleeds to edge */}
      {rotations.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4" style={{ paddingLeft: 'calc((100vw - 80rem) / 2)' }}>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Rotations ({rotations.length})
            </h2>
            {rotations.length > 4 && (
              <Link href="/rotations" className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400">
                View all
              </Link>
            )}
          </div>
          <HorizontalCarousel>
            {rotations.slice(0, 6).map((rotation) => (
              <Link key={rotation.id} href={`/rotations/${rotation.slug}`} className="w-72 flex-shrink-0">
                <div className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 min-h-[400px]">
                  {/* Cover Image */}
                  {rotation.coverImage ? (
                    <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 overflow-hidden">
                      <Image
                        src={rotation.coverImage}
                        alt="Rotation Cover"
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600">
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 -z-10" />
                    </div>
                  )}
                  
                  {/* Decorative icon for cards without cover images */}
                  {!rotation.coverImage && (
                    <div className="absolute top-4 right-4 w-16 h-16 bg-white/90 dark:bg-gray-800/90 rounded-full flex items-center justify-center shadow-sm backdrop-blur-sm z-10">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-60" />
                    </div>
                  )}
                  
                  {/* Card Content */}
                  <div className={`p-6 ${!rotation.coverImage ? 'pt-8' : ''}`}>
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="font-semibold text-xl text-gray-900 dark:text-gray-100 leading-tight line-clamp-2">
                        {rotation.name}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {rotation.isPublic ? (
                          <Globe className="h-4 w-4 text-green-500" />
                        ) : (
                          <Lock className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                    
                    {/* Description */}
                    {rotation.description && (
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                        {rotation.description}
                      </p>
                    )}
                    
                    {/* Object count */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {rotation.objectIds?.length || 0} objects
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </HorizontalCarousel>
        </div>
      )}

      <div className="held-container-wide">
        {/* Empty State */}
        {objects.length === 0 && rotations.length === 0 && (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" className="text-gray-400">
                  <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {isOwnProfile ? 'Start building your collection' : 'No content yet'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {isOwnProfile
                  ? 'Add objects to your registry and create rotations to organize your collection.'
                  : 'This user hasn\'t added any objects or rotations yet.'
                }
              </p>
              {isOwnProfile && (
                <div className="flex gap-3 justify-center">
                  <Button asChild>
                    <Link href="/registry/new">Add Object</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/rotations/new">Create Rotation</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Horizontal Carousel Component
function HorizontalCarousel({ children }: { children: React.ReactNode }) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    
    const scrollAmount = 300;
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
    <div className="relative">
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide py-6 pl-4 pr-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', paddingLeft: 'calc((100vw - 80rem) / 2)' }}
        onScroll={(e) => setScrollPosition(e.currentTarget.scrollLeft)}
      >
        {children}
      </div>

      {/* Scroll Buttons */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 shadow-lg rounded-full p-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 shadow-lg rounded-full p-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}