import React from 'react';
import { Music, ChevronRight, GripVertical, Check, ListMusic } from 'lucide-react';
import TagBadge from './TagBadge';

export default function SongCard({
  song,
  onClick,
  onLongPress,
  draggable,
  compact,
  selectionMode = false,
  selected = false,
  setlistNames,
}) {
  const pressTimer = React.useRef(null);

  const handleTouchStart = () => {
    if (!onLongPress) return;
    pressTimer.current = setTimeout(() => onLongPress(song), 600);
  };

  const handleTouchEnd = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  return (
    <div
      onClick={() => onClick?.(song)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchEnd}
      className={`flex items-center gap-3 px-4 py-3
                  border-b border-gray-100 dark:border-gray-700/50
                  cursor-pointer transition-colors select-none
                  ${selected
                    ? 'bg-primary-50 dark:bg-primary-900/20'
                    : 'bg-white dark:bg-gray-800 active:bg-gray-50 dark:active:bg-gray-700'
                  }`}
    >
      {/* Ícone da esquerda: checkbox em modo seleção, grip se draggable */}
      {selectionMode ? (
        <div
          className={`w-5 h-5 rounded-full border-2 flex-shrink-0
                      flex items-center justify-center transition-colors
                      ${selected
                        ? 'bg-primary-500 border-primary-500'
                        : 'border-gray-300 dark:border-gray-600'
                      }`}
        >
          {selected && <Check size={11} className="text-white" strokeWidth={3} />}
        </div>
      ) : draggable ? (
        <GripVertical size={16} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
      ) : null}

      {/* Badge da tonalidade */}
      <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30
                      flex items-center justify-center flex-shrink-0">
        <span className="text-primary-600 dark:text-primary-400 font-bold text-sm">
          {song.key}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 dark:text-gray-100 truncate text-sm">
          {song.title}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{song.artist}</p>
        {!compact && !selectionMode && setlistNames?.length > 0 && (
          <div className="flex items-center gap-1 mt-0.5">
            <ListMusic size={10} className="flex-shrink-0 text-indigo-400 dark:text-indigo-500" />
            <span className="text-[11px] font-medium text-indigo-500 dark:text-indigo-400 truncate">
              {setlistNames.length === 1
                ? setlistNames[0]
                : `${setlistNames[0]} +${setlistNames.length - 1}`
              }
            </span>
          </div>
        )}
        {!compact && !selectionMode && song.tags?.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {song.tags.slice(0, 2).map(tag => (
              <TagBadge key={tag} tag={tag} />
            ))}
          </div>
        )}
      </div>

      {/* BPM */}
      {song.bpm && !compact && !selectionMode && (
        <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
          {song.bpm} bpm
        </span>
      )}

      {/* Seta (oculta no modo seleção) */}
      {!selectionMode && (
        <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
      )}
    </div>
  );
}
