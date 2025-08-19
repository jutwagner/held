import React from 'react';
import { UserDoc } from '@/types';

export default function ImportPanel({ user }: { user: UserDoc }) {
  // TODO: Import logic, diff preview, confirm apply
  return (
    <div className="mb-4">
      <input type="file" accept="application/json" className="mb-2" />
      <button className="bg-gray-900 text-white px-4 py-2 rounded">Import JSON</button>
      <div className="text-xs text-gray-400 mt-2">Import is beta. Diff preview coming soon.</div>
    </div>
  );
}
