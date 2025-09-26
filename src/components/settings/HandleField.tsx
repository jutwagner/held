import React, { useState } from 'react';

export default function HandleField({ handle, setHandle }: { handle: string; setHandle: (h: string) => void }) {
  const [available, setAvailable] = useState(true);
  const [checking, setChecking] = useState(false);

  // TODO: Debounced Firestore check for handle availability

  const handleChange = (value: string) => {
    const normalized = value.replace(/^@+/, '').slice(0, 24);
    setHandle(normalized);
  };

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="handle" className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-10">Handle</label>
      <div className="relative">
        <input
          id="handle"
          type="text"
          value={handle}
          onChange={e => handleChange(e.target.value)}
          className="border border-gray-300 inputforce dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-7 py-2 rounded-md w-full"
          maxLength={24}
          autoComplete="off"
        />
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">@</span>
      </div>
      <span className={`text-xs ${available ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{checking ? 'Checking...' : available ? 'Available' : 'Not available'}</span>
    </div>
  );
}
