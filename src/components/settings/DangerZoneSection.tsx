import React, { useState } from 'react';
import { UserDoc } from '@/types';

export default function DangerZoneSection({ user }: { user?: UserDoc }) {
  const [confirmHandle, setConfirmHandle] = useState('');
  const [hydrated, setHydrated] = useState(false);
  React.useEffect(() => {
    setHydrated(true);
  }, []);
  const isLoading = !user || !hydrated;
  return (
    <section aria-labelledby="danger-header" className="mb-8">
      <h2 id="danger-header" className="font-serif text-xl mb-4 text-red-700">Danger Zone</h2>
      {isLoading ? (
        <div className="text-gray-400 text-sm">Loading danger zone…</div>
      ) : (
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <div className="mb-2 font-semibold text-red-700">Delete Account</div>
          <input
            type="text"
            placeholder={`Type @${user!.handle} to confirm`}
            value={confirmHandle}
            onChange={e => setConfirmHandle(e.target.value)}
            className="border px-2 py-1 rounded w-full mb-2"
          />
          <button
            className="bg-red-700 text-white px-4 py-2 rounded disabled:opacity-50"
            disabled={confirmHandle !== user!.handle}
            onClick={() => {/* TODO: Delete account logic */}}
          >
            Delete Account
          </button>
          <div className="mt-4 font-semibold text-red-700">Delete All Data</div>
          <button
            className="bg-red-700 text-white px-4 py-2 rounded mt-2"
            onClick={() => {/* TODO: Delete all data logic */}}
          >
            Delete All Data
          </button>
        </div>
      )}
    </section>
  );
}
