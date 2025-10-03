import React, { useRef, useState } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import app from '@/lib/firebase';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

export default function AvatarUploader({ avatarUrl, setAvatarUrl }: { avatarUrl: string; setAvatarUrl: (url: string) => void }) {
  const fallbackAvatar = '/img/placeholder.svg';
  const [preview, setPreview] = useState<string>(avatarUrl && avatarUrl.trim() ? avatarUrl : fallbackAvatar);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Show local preview
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) setPreview(ev.target.result as string);
    };
    reader.readAsDataURL(file);

    if (!user?.uid) {
      setUploading(false);
      return;
    }

    // Upload to Firebase Storage
    setUploading(true);
    try {
      const storage = getStorage(app);
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_/]/g, '_');
      const storageRef = ref(storage, `users/${user.uid}/avatar/${Date.now()}_${safeName}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setAvatarUrl(url);
      setPreview(url);
    } catch {
      // Optionally show error
      setPreview(avatarUrl || '/default-avatar.png');
    }
    setUploading(false);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative group">
        <Image
          src={preview}
          alt="Avatar"
          width={96}
          height={96}
          className="settingsAvatar rounded-full object-cover shadow-lg transition-transform duration-200 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = fallbackAvatar;
          }}
        />
        <button
          type="button"
          className="absolute bottom-2 right-2 bg-gray-900 text-white rounded-full p-2 shadow-lg opacity-80 hover:opacity-100 transition"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          aria-label="Change avatar"
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.536-6.536a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-2.828 1.172H7v-2a4 4 0 011.172-2.828z" /></svg>
        </button>
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-full">
            <svg className="animate-spin h-8 w-8 text-white" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={uploading}
      />
      <span className="text-xs text-gray-500">JPG, PNG, or GIF. Max 2MB.</span>
    </div>
  );
}
