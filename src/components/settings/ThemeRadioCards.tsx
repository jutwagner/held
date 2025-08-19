import React from 'react';
import type { Theme } from '@/types';

const themes: { key: Theme; label: string }[] = [
  { key: 'light', label: 'Light' },
  { key: 'dim', label: 'Dim' },
  { key: 'dark', label: 'Dark' },
];

export default function ThemeRadioCards({ theme, setTheme }: { theme: Theme; setTheme: (t: Theme) => void }) {
  return (
    <div className="flex gap-4 mb-4">
      {themes.map(t => (
        <label key={t.key} className={`flex flex-col items-center px-4 py-3 rounded-lg border cursor-pointer transition-all ${theme === t.key ? 'border-gray-900 bg-gray-100' : 'border-gray-200 bg-white'}`}> 
          <input type="radio" name="theme" value={t.key} checked={theme === t.key} onChange={() => setTheme(t.key)} className="sr-only" />
          <span className="font-semibold text-base">{t.label}</span>
        </label>
      ))}
    </div>
  );
}
