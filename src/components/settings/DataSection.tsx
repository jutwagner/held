import React from 'react';
import ExportPanel from './ExportPanel';
import ImportPanel from './ImportPanel';
import { UserDoc } from '@/types';

export default function DataSection({ user }: { user?: UserDoc }) {
  return (
    <section aria-labelledby="data-header" className="mb-8">
      <h2 id="data-header" className="font-serif text-xl mb-4">Data & Backups</h2>
      {user ? (
        <>
          <ExportPanel user={user} />
          <ImportPanel user={user} />
        </>
      ) : (
        <div className="text-gray-400 text-sm">Loading data…</div>
      )}
      {/* TODO: Encrypted backup toggle */}
      <div className="mt-4 text-xs text-gray-400">Encrypted backup toggle and Held+ lock coming soon.</div>
    </section>
  );
}
