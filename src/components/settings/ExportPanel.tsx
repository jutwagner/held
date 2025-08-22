import React, { useEffect, useState } from 'react';
import { UserDoc } from '../../types';

interface ExportPanelProps {
  user: UserDoc;
}

export default function ExportPanel({ user }: ExportPanelProps) {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  // TODO: Export logic, generate signed URL, show toast
  return (
    <div className="mb-4">
      {(!user || !hydrated) ? (
        <>
          <div className="bg-gray-200 h-10 w-32 rounded animate-pulse mb-2" />
          <div className="bg-gray-200 h-10 w-32 rounded animate-pulse mb-2" />
          <div className="text-gray-400 text-sm">Loading data…</div>
        </>
      ) : (
        <>
          <button className="bg-gray-900 text-white px-4 py-2 rounded">Export JSON</button>
          <button className="bg-gray-900 text-white px-4 py-2 rounded ml-2">Export CSV</button>
        </>
      )}
      <div className="text-xs text-gray-400 mt-2">Exports auto-expire after 15 min.</div>
    </div>
  );
}
