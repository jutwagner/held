import React from 'react';
import { UserDoc } from '@/types';

export default function ExportPanel({ user }: { user: UserDoc }) {
  // TODO: Export logic, generate signed URL, show toast
  return (
    <div className="mb-4">
      <button className="bg-gray-900 text-white px-4 py-2 rounded">Export JSON</button>
      <button className="bg-gray-900 text-white px-4 py-2 rounded ml-2">Export CSV</button>
      <div className="text-xs text-gray-400 mt-2">Exports auto-expire after 15 min.</div>
    </div>
  );
}
