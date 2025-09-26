
import React from 'react';
import ThemeRadioCards from './ThemeRadioCards';
import DensitySelector from './DensitySelector';
import ToggleRow from './ToggleRow';
import PreviewCard from './PreviewCard';
import { Theme, Density } from '@/types';

interface AppearanceSectionProps {
  theme: Theme;
  typeTitleSerif: boolean;
  typeMetaMono: boolean;
  density: Density;
  onChange: (changes: Partial<{
    theme: Theme;
    typeTitleSerif: boolean;
    typeMetaMono: boolean;
    density: Density;
  }>) => void;
}

export default function AppearanceSection({
  theme,
  typeTitleSerif,
  typeMetaMono,
  density,
  onChange,
}: AppearanceSectionProps) {
  const isLoaded = theme !== undefined && typeTitleSerif !== undefined && typeMetaMono !== undefined && density !== undefined && typeof onChange === 'function';
  return (
    <section aria-labelledby="appearance-header" className="mb-8">
      <h2 id="appearance-header" className="font-serif text-xl mb-4 mt-10 text-gray-900 dark:text-gray-100">Appearance</h2>
      {isLoaded ? (
        <>
          <ThemeRadioCards theme={theme} setTheme={(t: Theme) => onChange({ theme: t })} />
          {/*}
          <ToggleRow label="Title Serif" checked={typeTitleSerif} onChange={(v: boolean) => onChange({ typeTitleSerif: v })} />
          <ToggleRow label="Metadata Mono" checked={typeMetaMono} onChange={(v: boolean) => onChange({ typeMetaMono: v })} />
          <DensitySelector density={density} setDensity={(d: Density) => onChange({ density: d })} />
          */}
          <PreviewCard theme={theme} typeTitleSerif={typeTitleSerif} typeMetaMono={typeMetaMono} density={density} />
        </>
      ) : (
        <div className="text-gray-400 text-sm">Loading appearance…</div>
      )}
    </section>
  );
}
