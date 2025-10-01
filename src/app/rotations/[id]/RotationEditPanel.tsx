'use client';
import { HeldObject } from '@/types';

interface RotationEditPanelProps {
  allObjects: HeldObject[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  selectionError: string;
}

export default function RotationEditPanel({
  allObjects,
  selectedIds,
  onToggle,
  selectionError,
}: RotationEditPanelProps) {
  return (
    <div className="held-container held-container-wide mt-4">
      <div className="rounded-2xl px-6 py-5">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Select Objects</h2>
          <span className="text-xs text-gray-600 dark:text-gray-400">{selectedIds.length}/7 selected</span>
        </div>
        {selectionError && (
          <div className="p-2 mb-3 bg-red-50/70 dark:bg-red-900/30 border border-red-200/70 dark:border-red-800/70 rounded text-sm text-red-700 dark:text-red-400">
            {selectionError}
          </div>
        )}
        {allObjects.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">You have no registry items yet. Add some in your registry.</p>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {allObjects.map((obj) => {
              const selected = selectedIds.includes(obj.id);
              return (
                <button
                  key={obj.id}
                  type="button"
                  onClick={() => onToggle(obj.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl border flex items-center gap-3 transition-all duration-150 ${selected ? 'border-gray-900/80 bg-gray-900/5 dark:border-gray-100/70 dark:bg-gray-100/10 shadow-sm' : 'border-white/60 dark:border-gray-700/60 bg-white/30 dark:bg-gray-900/30 hover:border-white dark:hover:border-gray-500/70'}`}
                >
                  <div className="w-12 h-12 bg-white/40 dark:bg-gray-800/60 rounded-lg overflow-hidden flex-shrink-0">
                    {obj.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={obj.images[0]} alt={obj.title} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">?</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate text-gray-900 dark:text-gray-100">{obj.title}</div>
                    {obj.maker && <div className="text-xs text-gray-600 dark:text-gray-400 truncate">{obj.maker}</div>}
                  </div>
                  {selected && (
                    <span className="text-xs px-3 py-1 rounded-full bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900">Selected</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
