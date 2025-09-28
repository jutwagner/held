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
      <div className="held-card p-6">
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Select Objects</h2>
          <span className="text-xs text-gray-600 dark:text-gray-400">{selectedIds.length}/7 selected</span>
        </div>
        {selectionError && (
          <div className="p-2 mb-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-400">
            {selectionError}
          </div>
        )}
        {allObjects.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">You have no registry items yet. Add some in your registry.</p>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {allObjects.map((obj) => {
              const selected = selectedIds.includes(obj.id);
              return (
                <button
                  key={obj.id}
                  type="button"
                  onClick={() => onToggle(obj.id)}
                  className={`w-full text-left p-3 rounded border transition-colors flex items-center gap-3 ${selected ? 'border-gray-900 bg-gray-50 dark:bg-gray-800/40' : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'}`}
                >
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden flex-shrink-0">
                    {obj.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={obj.images[0]} alt={obj.title} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">?</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">{obj.title}</div>
                    {obj.maker && <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{obj.maker}</div>}
                  </div>
                  {selected && (
                    <span className="text-xs px-2 py-1 rounded bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900">Selected</span>
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
