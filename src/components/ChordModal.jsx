import React, { useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import ChordDiagram from './ChordDiagram';

export default function ChordModal({
  chordName,
  allVoicings,       // merged array: [...builtIn, ...custom]
  builtInCount = 0,  // how many leading voicings are built-in (rest are custom)
  onDeleteCustom,    // (voicingIdx) → called with the GLOBAL idx in allVoicings
  onAddVoicing,      // () → open editor pre-filled with this chord
  onClose,
}) {
  const voicings = allVoicings ?? [];
  const [idx, setIdx] = useState(0);
  const backdropRef = useRef(null);

  // Reset index when chord changes
  useEffect(() => { setIdx(0); }, [chordName]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const total   = voicings.length;
  const voicing = voicings[idx] ?? null;
  const isCustom = idx >= builtInCount;

  const prev = () => setIdx(i => Math.max(0, i - 1));
  const next = () => setIdx(i => Math.min(total - 1, i + 1));

  // Swipe support
  const touchX = useRef(null);
  const handleTouchStart = (e) => { touchX.current = e.touches[0].clientX; };
  const handleTouchEnd   = (e) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (dx < -40) next();
    if (dx >  40) prev();
    touchX.current = null;
  };

  const handleDelete = () => {
    if (!isCustom) return;
    onDeleteCustom?.(idx);
    // Move index back if we deleted the last one
    setIdx(i => Math.max(0, Math.min(i, total - 2)));
  };

  return (
    /* Backdrop */
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      {/* Card */}
      <div
        className="w-full max-w-xs bg-white dark:bg-gray-900 rounded-3xl shadow-2xl"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-1">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
              {chordName}
            </span>
            {isCustom && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full
                               bg-primary-100 dark:bg-primary-900/50
                               text-primary-600 dark:text-primary-400">
                Meu acorde
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {/* Add voicing button */}
            {onAddVoicing && (
              <button
                onClick={onAddVoicing}
                title="Adicionar outra posição"
                className="p-2 rounded-xl text-gray-400 dark:text-gray-500
                           active:bg-gray-100 dark:active:bg-gray-800 transition-colors"
              >
                <Plus size={18} />
              </button>
            )}
            {/* Delete custom voicing */}
            {isCustom && onDeleteCustom && (
              <button
                onClick={handleDelete}
                title="Excluir esta posição"
                className="p-2 rounded-xl text-red-400 dark:text-red-500
                           active:bg-red-50 dark:active:bg-red-900/20 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 dark:text-gray-500
                         active:bg-gray-100 dark:active:bg-gray-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {voicing ? (
          <>
            {/* Diagram area with prev/next */}
            <div className="flex items-center justify-center gap-4 px-4 py-3">
              <button
                onClick={prev}
                disabled={idx === 0}
                className={`p-2 rounded-xl transition-colors
                            ${idx === 0
                              ? 'text-gray-200 dark:text-gray-700'
                              : 'text-gray-500 dark:text-gray-400 active:bg-gray-100 dark:active:bg-gray-800'
                            }`}
              >
                <ChevronLeft size={22} />
              </button>

              <div className="text-gray-900 dark:text-white">
                <ChordDiagram voicing={voicing} name={chordName} />
              </div>

              <button
                onClick={next}
                disabled={idx === total - 1}
                className={`p-2 rounded-xl transition-colors
                            ${idx === total - 1
                              ? 'text-gray-200 dark:text-gray-700'
                              : 'text-gray-500 dark:text-gray-400 active:bg-gray-100 dark:active:bg-gray-800'
                            }`}
              >
                <ChevronRight size={22} />
              </button>
            </div>

            {/* Dots indicator */}
            {total > 1 && (
              <div className="flex justify-center gap-1.5 pb-1">
                {Array.from({ length: total }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIdx(i)}
                    className={`rounded-full transition-all duration-200
                                ${i >= builtInCount
                                  ? i === idx
                                    ? 'w-4 h-2 bg-primary-500'
                                    : 'w-2 h-2 bg-primary-300 dark:bg-primary-700 active:bg-primary-400'
                                  : i === idx
                                    ? 'w-4 h-2 bg-gray-700 dark:bg-gray-200'
                                    : 'w-2 h-2 bg-gray-300 dark:bg-gray-600 active:bg-gray-400'
                                }`}
                  />
                ))}
              </div>
            )}

            {/* Counter */}
            <p className="text-center text-xs text-gray-400 dark:text-gray-500 pb-4 pt-1">
              Posição {idx + 1} de {total}
              {builtInCount > 0 && total > builtInCount && (
                <span className="ml-2 text-primary-400 dark:text-primary-500">
                  · {total - builtInCount} personalizada{total - builtInCount > 1 ? 's' : ''}
                </span>
              )}
            </p>
          </>
        ) : (
          /* No voicings at all */
          <div className="py-8 px-5 text-center space-y-3">
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Nenhum diagrama disponível para "{chordName}"
            </p>
            {onAddVoicing && (
              <button
                onClick={onAddVoicing}
                className="flex items-center gap-2 mx-auto px-4 py-2.5 rounded-xl
                           bg-primary-500 text-white text-sm font-semibold
                           active:bg-primary-600 transition-colors"
              >
                <Plus size={16} />
                Criar diagrama
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
