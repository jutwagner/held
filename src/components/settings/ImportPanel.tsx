import React, { useEffect, useState } from 'react';
import { UserDoc } from '../../types';

interface ImportPanelProps {
  user: UserDoc;
}

export default function ImportPanel({ user }: ImportPanelProps) {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  // TODO: Import logic, diff preview, confirm apply
  if (!user || !hydrated) {
    return (
      <div className="mb-4">
        <div className="bg-gray-200 h-10 w-32 rounded animate-pulse mb-2" />
        <div className="bg-gray-200 h-10 w-32 rounded animate-pulse mb-2" />
        <div className="text-gray-400 text-sm">Loading data…</div>
      </div>
    );
  }
  return (
    <div className="mb-4">
      <input type="file" accept="application/json" className="mb-2" />
      <button className="bg-gray-900 text-white px-4 py-2 rounded">Import JSON</button>
      <div className="text-xs text-gray-400 mt-2">Import is beta. Diff preview coming soon.</div>
    </div>
  );
}
