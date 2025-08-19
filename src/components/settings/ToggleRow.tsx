import React from 'react';

export default function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-medium">{label}</span>
      <button
        className={`w-10 h-6 rounded-full border flex items-center transition-colors ${checked ? 'bg-gray-900 border-gray-900' : 'bg-gray-200 border-gray-300'}`}
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
      >
        <span className={`block w-5 h-5 rounded-full bg-white shadow transform transition-transform ${checked ? 'translate-x-4' : ''}`}></span>
      </button>
    </div>
  );
}
