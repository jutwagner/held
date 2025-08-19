import React from 'react';
import AvatarUploader from './AvatarUploader';
import HandleField from './HandleField';
import { Input } from '@/components/ui/input';
import { UserDoc } from '@/types';

export default function ProfileSection({ user, displayName, setDisplayName, handle, setHandle, bio, setBio, avatarUrl, setAvatarUrl }: {
  user?: UserDoc;
  displayName: string;
  setDisplayName: (val: string) => void;
  handle: string;
  setHandle: (val: string) => void;
  bio: string;
  setBio: (val: string) => void;
  avatarUrl: string;
  setAvatarUrl: (val: string) => void;
}) {
  return (
    <section aria-labelledby="profile-header" className="mb-8">
      <h2 id="profile-header" className="font-serif text-xl mb-4">Profile</h2>
      {user ? (
        <div className="flex flex-col gap-6">
          <AvatarUploader avatarUrl={avatarUrl} setAvatarUrl={setAvatarUrl} />
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium mb-1">Display Name</label>
            <Input
              id="displayName"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              maxLength={40}
            />
          </div>
          <HandleField handle={handle} setHandle={setHandle} />
          <div>
            <label htmlFor="bio" className="block text-sm font-medium mb-1">Short Bio</label>
            <Input
              id="bio"
              value={bio}
              onChange={e => setBio(e.target.value)}
              maxLength={120}
            />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs font-mono bg-gray-100 rounded px-2 py-1">Held by @{handle}</span>
          </div>
        </div>
      ) : (
        <div className="text-gray-400 text-sm">Loading profile…</div>
      )}
    </section>
  );
}
