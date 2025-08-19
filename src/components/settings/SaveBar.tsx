import React from 'react';

export default function SaveBar({ onSave }: { onSave: () => void }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t p-4 flex justify-end items-center z-20">
      <button
        className="bg-gray-900 text-white px-6 py-2 rounded-lg font-semibold text-base shadow-md active:scale-95 transition"
        onClick={onSave}
      >
        Done / Save
      </button>
    </div>
  );
}
