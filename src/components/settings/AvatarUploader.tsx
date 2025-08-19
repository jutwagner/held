import React from 'react';

export default function AvatarUploader({ avatarUrl, setAvatarUrl }: { avatarUrl: string; setAvatarUrl: (url: string) => void }) {
  // TODO: Implement Firebase Storage upload and optimistic preview
  return (
    <div className="flex flex-col items-center gap-2">
      <img src={avatarUrl || '/default-avatar.png'} alt="Avatar" className="w-20 h-20 rounded-full object-cover border" />
      <input type="file" accept="image/*" className="mt-2" onChange={() => { /* TODO: upload logic */ }} />
    </div>
  );
}
