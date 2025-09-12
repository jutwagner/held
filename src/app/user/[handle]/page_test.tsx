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
      
      console.log('Loading profile for handle:', profileHandle);
      
      try {
        const user = await getUserByHandle(profileHandle);
        console.log('Found user:', user);
        
        if (!user) {
          console.log('No user found for handle:', profileHandle);
          router.push('/404');
          return;
        }

        setProfileUser(user);
        setIsPublicProfile(user.isPublicProfile ?? false);
        setIsOwnProfile(currentUser?.uid === user.uid);

        console.log('User is public:', user.isPublicProfile);
        console.log('Is own profile:', currentUser?.uid === user.uid);

        // Only load objects and rotations if profile is public or it's the user's own profile
        if (user.isPublicProfile || currentUser?.uid === user.uid) {
          console.log('Loading objects and rotations...');
          const [userObjects, userRotations] = await Promise.all([
            getUserObjects(user.uid),
            getUserRotations(user.uid)
          ]);
          
          console.log('Loaded objects:', userObjects.length);
          console.log('Loaded rotations:', userRotations.length);
          
          setObjects(userObjects);
          setRotations(userRotations);
        } else {
          console.log('Profile is private and not owned by current user');
        }
      } catch (error) {
        console.error('Error loading profile:', error);
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
      
      // Update the user's public profile setting
      // This would typically call an API endpoint to update the user
      // For now, we'll just update the local state
      setProfileUser(prev => prev ? { ...prev, isPublicProfile: newPublicState } : null);
    } catch (error) {
      console.error('Error toggling public profile:', error);
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div>Test content</div>
    </div>
  );
}
