import React from 'react';
import type { Theme } from '@/types';

const themes: { key: Theme; label: string }[] = [
  { key: 'light', label: 'Light' },
  { key: 'dark', label: 'Dark' },
];

export default function ThemeRadioCards({ theme, setTheme }: { theme: Theme; setTheme: (t: Theme) => void }) {
  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    
    // Dispatch custom event for immediate theme application
    if (typeof window !== "undefined") {
      const event = new CustomEvent('theme-change', {
        detail: { theme: newTheme }
      });
      window.dispatchEvent(event);
    }
  };

  return (
    <div className="flex gap-4 mb-4">
      {themes.map(t => (
        <label key={t.key} className={`flex flex-col items-center px-4 py-3 rounded-lg border cursor-pointer transition-all ${theme === t.key ? 'border-gray-900 bg-gray-100 dark:border-gray-100 dark:bg-gray-800' : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900'}`}> 
          <input type="radio" name="theme" value={t.key} checked={theme === t.key} onChange={() => handleThemeChange(t.key)} className="sr-only" />
          <span className="font-semibold text-base text-gray-900 dark:text-gray-100">{t.label}</span>
        </label>
      ))}
    </div>
  );
}
