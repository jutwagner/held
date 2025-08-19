import React from 'react';
import type { Density } from '@/types';

const densities: { key: Density; label: string }[] = [
  { key: 'cozy', label: 'Cozy' },
  { key: 'standard', label: 'Standard' },
  { key: 'spacious', label: 'Spacious' },
];

export default function DensitySelector({ density, setDensity }: { density: Density; setDensity: (d: Density) => void }) {
  return (
    <div className="flex gap-4 mb-4">
      {densities.map(d => (
        <label key={d.key} className={`flex flex-col items-center px-4 py-3 rounded-lg border cursor-pointer transition-all ${density === d.key ? 'border-gray-900 bg-gray-100' : 'border-gray-200 bg-white'}`}> 
          <input type="radio" name="density" value={d.key} checked={density === d.key} onChange={() => setDensity(d.key)} className="sr-only" />
          <span className="font-semibold text-base">{d.label}</span>
        </label>
      ))}
    </div>
  );
}
