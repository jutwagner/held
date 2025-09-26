import React from 'react';
import Link from 'next/link';
import AvatarUploader from './AvatarUploader';
import HandleField from './HandleField';
import AppearanceSection from './AppearanceSection';
import AccountSection from './AccountSection';
import NotificationsSection from './NotificationsSection';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UserDoc, Theme, Density } from '@/types';
import { Eye } from 'lucide-react';

export default function ProfileSection({
  user,
  setUser,
  displayName,
  setDisplayName,
  handle,
  setHandle,
  bio,
  setBio,
  avatarUrl,
  setAvatarUrl,
  theme,
  typeTitleSerif,
  typeMetaMono,
  density,
  isPublicProfile,
  setIsPublicProfile,
  onAppearanceChange,
  editing = true,
}: {
  user?: UserDoc;
  setUser?: (user: UserDoc) => void;
  displayName: string;
  setDisplayName: (val: string) => void;
  handle: string;
  setHandle: (val: string) => void;
  bio: string;
  setBio: (val: string) => void;
  avatarUrl: string;
  setAvatarUrl: (val: string) => void;
  theme: Theme;
  typeTitleSerif: boolean;
  typeMetaMono: boolean;
  density: Density;
  isPublicProfile: boolean;
  setIsPublicProfile: (val: boolean) => void;
  onAppearanceChange: (changes: Partial<{ theme: Theme; typeTitleSerif: boolean; typeMetaMono: boolean; density: Density }>) => void;
  editing?: boolean;
}) {
  const handlePublicProfileChange = (checked: boolean) => {
    setIsPublicProfile(checked);
  };

  return (
    <section>
      {user ? (
        <div>
          {/* Avatar at top */}
          <div className="flex flex-col items-center mb-6">
            <div className={editing ? '' : 'pointer-events-none opacity-90'}>
              <AvatarUploader avatarUrl={avatarUrl} setAvatarUrl={setAvatarUrl} />
            </div>
          </div>
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Display Name</label>
            <Input
              id="displayName"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              maxLength={40}
              disabled={!editing}
            />
          </div>
          <HandleField handle={handle} setHandle={setHandle} />
          <div>
            <label htmlFor="bio" className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100  mt-5">Short Bio</label>
            <Input
              id="bio"
              value={bio}
              onChange={e => setBio(e.target.value)}
              maxLength={120}
              disabled={!editing}
            />
          </div>
          <div className="flex items-center gap-4 mt-4">
            <span className="text-xs font-mono bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded px-2 py-1">Held by @{handle}</span>
            <label className="flex items-center gap-2">
              <span className="text-sm text-gray-700 dark:text-gray-300">Make my user page public</span>
              <button
                type="button"
                aria-pressed={isPublicProfile}
                onClick={() => {
                  if (!editing) return;
                  console.log('[DEBUG] Switch toggled. New value:', !isPublicProfile);
                  handlePublicProfileChange(!isPublicProfile);
                }}
                className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors focus:outline-none ${isPublicProfile ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-300 dark:bg-gray-700'}`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white dark:bg-gray-900 shadow transition-transform ${isPublicProfile ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </label>
          </div>
          
          {/* View Profile Link */}
          <div className="mt-4">
            <Link href={`/user/${handle}`}>
              <Button variant="outline" size="sm" className="flex items-center gap-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800">
                <Eye className="h-4 w-4 non-dark-invert" />
                View Profile
              </Button>
            </Link>
          </div>
          {/* Consolidated sections below profile info */}
          <AppearanceSection
            theme={theme}
            typeTitleSerif={typeTitleSerif}
            typeMetaMono={typeMetaMono}
            density={density}
            onChange={onAppearanceChange}
          />
          <AccountSection user={user} />
          <NotificationsSection user={user} />
        </div>
      ) : (
        <div className="text-gray-400 text-sm">Loading profile…</div>
      )}
    </section>
  );
}
