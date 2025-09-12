import React, { useState } from 'react';

export default function HandleField({ handle, setHandle }: { handle: string; setHandle: (h: string) => void }) {
  const [available, setAvailable] = useState(true);
  const [checking, setChecking] = useState(false);

  // TODO: Debounced Firestore check for handle availability

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="handle" className="text-sm font-medium text-gray-900 dark:text-gray-100">Handle</label>
      <input
        id="handle"
        type="text"
        value={handle}
        onChange={e => setHandle(e.target.value)}
        className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2 py-1 rounded"
        maxLength={24}
        autoComplete="off"
      />
      <span className={`text-xs ${available ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{checking ? 'Checking...' : available ? 'Available' : 'Not available'}</span>
    </div>
  );
}
