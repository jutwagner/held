import React from 'react';

export default function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</span>
      <button
        className={`w-10 h-6 rounded-full border flex items-center transition-colors ${checked ? 'bg-gray-900 border-gray-900 dark:bg-gray-100 dark:border-gray-100' : 'bg-gray-200 border-gray-300 dark:bg-gray-700 dark:border-gray-600'}`}
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
      >
        <span className={`block w-5 h-5 rounded-full bg-white dark:bg-gray-900 shadow transform transition-transform ${checked ? 'translate-x-4' : ''}`}></span>
      </button>
    </div>
  );
}
