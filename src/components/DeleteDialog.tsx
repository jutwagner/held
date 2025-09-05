"use client";

import React from 'react';
import { Button } from '@/components/ui/button';

type Props = {
  title?: string;
  message?: string;
  open?: boolean;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function DeleteDialog({
  title = 'Delete Item',
  message = 'Are you sure you want to delete this item? This action cannot be undone.',
  open = true,
  busy = false,
  onCancel,
  onConfirm,
}: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-3 text-gray-900">{title}</h3>
          <p className="mb-6 text-gray-600">{message}</p>
          <div className="flex justify-center gap-3">
            <Button 
              variant="outline"
              onClick={onCancel}
              disabled={busy}
              className="px-6 py-2 rounded-xl border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button 
              onClick={onConfirm}
              disabled={busy}
              className="px-6 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white"
            >
              {busy ? 'Deleting...' : 'Delete Forever'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

