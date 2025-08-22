import React from 'react';
import ExportPanel from './ExportPanel';
import ImportPanel from './ImportPanel';
import DangerZoneSection from './DangerZoneSection';
import { UserDoc } from '@/types';

export default function DataSection({ user }: { user?: UserDoc }) {
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => {
    setHydrated(true);
  }, []);
  const isLoading = !user || !hydrated;
  return (
    <section aria-labelledby="data-header" className="mb-8">
      <h2 id="data-header" className="font-serif text-xl mb-4">Data & Backups</h2>
      {isLoading ? (
        <div className="mb-4">
          <div className="bg-gray-200 h-10 w-32 rounded animate-pulse mb-2" />
          <div className="bg-gray-200 h-10 w-32 rounded animate-pulse mb-2" />
          <div className="text-gray-400 text-sm">Loading data…</div>
        </div>
      ) : (
        <>
          <ExportPanel user={user!} />
          <ImportPanel user={user!} />
        </>
      )}
      <div className="mt-4 text-xs text-gray-400">Encrypted backup toggle and Held+ lock coming soon.</div>
      {/* DangerZoneSection is rendered at the page level, not here */}
    </section>
  );
}
