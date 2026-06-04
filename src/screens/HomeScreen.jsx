import React, { useMemo, useState } from 'react';
import { Plus, ChevronRight, Music2, ListMusic, Sun, Moon } from 'lucide-react';
import { getYouTubeThumbnail } from '../utils/youtube';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export default function HomeScreen({
  songs,
  setlists,
  onSelectSong,
  onAddSong,
  onGoToLibrary,
  onGoToSetlists,
  onSelectSetlist,
  darkMode,
  onToggleDarkMode,
}) {
  const recentSongs = useMemo(
    () => [...songs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8),
    [songs]
  );

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-950">

      {/* ── Cabeçalho ───────────────────────────────────────────────────────── */}
      <div className="px-5 pt-10 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-500 mb-0.5">
              {greeting()}
            </p>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Início
            </h1>
            {songs.length > 0 && (
              <button
                onClick={onGoToLibrary}
                className="flex items-center gap-1.5 mt-1 active:opacity-60 transition-opacity"
              >
                <Music2 size={12} className="text-gray-500 dark:text-gray-400" />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {songs.length} {songs.length === 1 ? 'cifra' : 'cifras'} na biblioteca
                </span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleDarkMode}
              className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-gray-800
                         flex items-center justify-center
                         active:bg-gray-200 dark:active:bg-gray-700 transition-colors"
            >
              {darkMode
                ? <Sun  size={18} className="text-yellow-400" />
                : <Moon size={18} className="text-gray-500" />
              }
            </button>
            <button
              onClick={onAddSong}
              className="w-10 h-10 rounded-2xl bg-primary-500
                         flex items-center justify-center
                         active:bg-primary-600 transition-colors shadow-sm"
            >
              <Plus size={20} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Setlists ─────────────────────────────────────────────────────────── */}
      {setlists.length > 0 && (
        <section className="mb-8">
          <SectionHeader title="Setlists" onMore={onGoToSetlists} label="Ver todos" />
          <div className="flex gap-2.5 px-5 overflow-x-auto no-scrollbar pb-1">
            {setlists.map(sl => {
              const count = sl.songIds?.length || 0;
              return (
                <button
                  key={sl.id}
                  onClick={() => onSelectSetlist(sl.id)}
                  className="flex-shrink-0 w-44 bg-white dark:bg-gray-800/80
                             rounded-2xl p-4 text-left shadow-sm
                             border border-gray-100 dark:border-transparent
                             active:opacity-70 transition-opacity"
                >
                  <div className="w-8 h-8 rounded-xl bg-gray-50 dark:bg-gray-700
                                  flex items-center justify-center mb-3 shadow-sm border border-gray-100 dark:border-transparent">
                    <ListMusic size={15} className="text-gray-500 dark:text-gray-400" />
                  </div>
                  <p className="font-bold text-sm text-gray-900 dark:text-white truncate">
                    {sl.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {count} {count === 1 ? 'música' : 'músicas'}
                  </p>
                </button>
              );
            })}

            {/* Novo setlist */}
            <button
              onClick={onGoToSetlists}
              className="flex-shrink-0 w-44 rounded-2xl p-4 text-left
                         border-2 border-dashed border-gray-200 dark:border-gray-700
                         flex flex-col items-center justify-center gap-1.5
                         active:bg-gray-50 dark:active:bg-gray-800/50 transition-colors"
            >
              <Plus size={20} className="text-gray-300 dark:text-gray-600" />
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">
                Novo setlist
              </span>
            </button>
          </div>
        </section>
      )}

      {/* ── Adicionadas recentemente ─────────────────────────────────────────── */}
      {recentSongs.length > 0 && (
        <section className="mb-8">
          <SectionHeader title="Recentes" onMore={onGoToLibrary} />
          <div className="flex gap-2.5 px-5 overflow-x-auto no-scrollbar pb-1">
            {recentSongs.map(song => (
              <button
                key={song.id}
                onClick={() => onSelectSong(song)}
                className="flex-shrink-0 w-[106px] text-left
                           active:opacity-70 transition-opacity"
              >
                <SongThumb song={song} />
                <p className="text-xs font-semibold text-gray-900 dark:text-white truncate leading-snug">
                  {song.title}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                  {song.artist}
                </p>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Empty state ─────────────────────────────────────────────────────── */}
      {songs.length === 0 && (
        <div className="flex flex-col items-center px-8 pt-6 pb-10 text-center">
          <div className="w-16 h-16 rounded-3xl bg-white dark:bg-gray-800
                          border border-gray-100 dark:border-transparent
                          flex items-center justify-center mb-4 shadow-sm">
            <Music2 size={28} className="text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white text-base mb-1.5">
            Biblioteca vazia
          </h3>
          <p className="text-gray-500 dark:text-gray-500 text-sm mb-6 leading-relaxed">
            Adicione sua primeira cifra ou importe do CifraClub
          </p>
          <button
            onClick={onAddSong}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl
                       bg-primary-500 text-white text-sm font-semibold
                       active:bg-primary-600 transition-colors"
          >
            <Plus size={16} />
            Adicionar cifra
          </button>
        </div>
      )}

      <div className="h-6" />
    </div>
  );
}

// ── Componentes internos ──────────────────────────────────────────────────────

function SongThumb({ song }) {
  const thumb = getYouTubeThumbnail(song.youtubeUrl);
  const [imgFailed, setImgFailed] = useState(false);

  if (thumb && !imgFailed) {
    return (
      <div className="w-full aspect-square rounded-2xl mb-2 overflow-hidden
                      bg-white dark:bg-gray-800 border border-gray-100 dark:border-transparent">
        <img
          src={thumb}
          alt={song.title}
          className="w-full h-full object-cover"
          onError={() => setImgFailed(true)}
        />
      </div>
    );
  }

  return (
    <div className="w-full aspect-square rounded-2xl mb-2
                    bg-white dark:bg-gray-800
                    border border-gray-100 dark:border-transparent
                    flex items-center justify-center">
      <span className="text-2xl font-extrabold text-primary-500 dark:text-primary-400">
        {song.key}
      </span>
    </div>
  );
}

function SectionHeader({ title, onMore, label = 'Ver todas' }) {
  return (
    <div className="flex items-center justify-between px-5 mb-3">
      <h2 className="text-base font-bold text-gray-900 dark:text-white">
        {title}
      </h2>
      {onMore && (
        <button
          onClick={onMore}
          className="flex items-center gap-0.5 text-xs font-medium
                     text-gray-400 dark:text-gray-500
                     active:opacity-60 transition-opacity"
        >
          {label}
          <ChevronRight size={13} />
        </button>
      )}
    </div>
  );
}
