import React from 'react';

export default function PreviewCard({ theme, typeTitleSerif, typeMetaMono, density }: { theme: string; typeTitleSerif: boolean; typeMetaMono: boolean; density: string }) {
  // TODO: Framer Motion for subtle transitions
  return (
    <div className={`rounded-lg p-4 mt-4 shadow-md ${theme === 'dark' ? 'bg-gray-900 text-white' : theme === 'dim' ? 'bg-gray-100 text-gray-900' : 'bg-white text-gray-900'} ${density === 'cozy' ? 'text-sm' : density === 'spacious' ? 'text-lg' : 'text-base'}`}>
      <div className={typeTitleSerif ? 'font-serif text-xl mb-2' : 'font-sans text-xl mb-2'}>Held Preview Title</div>
      <div className={typeMetaMono ? 'font-mono text-xs text-gray-500' : 'font-sans text-xs text-gray-500'}>Metadata example</div>
      <div className="mt-2">This is a live preview of your appearance settings.</div>
    </div>
  );
}
