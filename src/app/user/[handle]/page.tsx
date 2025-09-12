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
              <div className="h-48 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 relative">
                {profileUser.coverImage ? (
                  <Image
                    src={profileUser.coverImage}
                    alt="Cover"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 opacity-20" />
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
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {profileUser.displayName || 'Unnamed User'}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300">
                          @{profileUser.handle}
                        </p>
                        {profileUser.bio && (
                          <p className="text-gray-700 dark:text-gray-300 mt-2 max-w-md">
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
              <Card key={object.id} className="w-64 flex-shrink-0">
                <CardContent className="p-4">
                  <Link href={`/registry/${object.slug}`}>
                    <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg mb-3 overflow-hidden">
                      {object.images.length > 0 ? (
                        <Image
                          src={object.images[0]}
                          alt={object.title}
                          width={200}
                          height={200}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-gray-400 text-sm">No image</span>
                        </div>
                      )}
                    </div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {object.title}
                    </h3>
                    {object.maker && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {object.maker}
                      </p>
                    )}
                    <div className="flex gap-1 mt-2">
                      {object.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </HorizontalCarousel>
        </div>
      )}

      <div className="held-container-wide">
        {/* Rotations Carousel */}
        {rotations.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Rotations ({rotations.length})
              </h2>
              {rotations.length > 4 && (
                <Link href="/rotations" className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400">
                  View all
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Rotations Carousel - Bleeds to edge */}
      {rotations.length > 0 && (
        <div className="mb-8">
          <HorizontalCarousel>
            {rotations.slice(0, 6).map((rotation) => (
              <Card key={rotation.id} className="w-72 flex-shrink-0">
                <CardContent className="p-4">
                  <Link href={`/rotations/${rotation.slug}`}>
                    <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg mb-3 overflow-hidden">
                      {rotation.coverImage ? (
                        <Image
                          src={rotation.coverImage}
                          alt={rotation.name}
                          width={280}
                          height={160}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-gray-400 text-sm">No cover image</span>
                        </div>
                      )}
                    </div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {rotation.name}
                    </h3>
                    {rotation.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                        {rotation.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {rotation.objectIds?.length || 0} objects
                      </span>
                      {rotation.isPublic ? (
                        <Globe className="h-3 w-3 text-green-500" />
                      ) : (
                        <Lock className="h-3 w-3 text-gray-400" />
                      )}
                    </div>
                  </Link>
                </CardContent>
              </Card>
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
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 pl-4 pr-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', paddingLeft: ' 10rem'  }}
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