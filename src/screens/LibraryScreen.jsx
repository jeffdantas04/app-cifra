import React, { useState, useMemo } from 'react';
import { Search, Plus, X, SlidersHorizontal, Trash2, CheckSquare } from 'lucide-react';
import SongCard from '../components/SongCard';
import TagBadge from '../components/TagBadge';
import { GENRES } from '../data/songs';

export default function LibraryScreen({ songs, setlists = [], onSelectSong, onAddSong, onDeleteSongs }) {
  const [query, setQuery]               = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [showFilters, setShowFilters]   = useState(false);

  // ── Seleção / exclusão ────────────────────────────────────────────────────
  const [selectionMode, setSelectionMode]       = useState(false);
  const [selectedIds, setSelectedIds]           = useState(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const toggleTag = (tag) =>
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );

  const filtered = useMemo(() => songs.filter(song => {
    const q = query.toLowerCase();
    const matchesQuery =
      !q ||
      song.title.toLowerCase().includes(q) ||
      song.artist.toLowerCase().includes(q) ||
      song.key.toLowerCase().includes(q);
    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.some(tag => song.tags?.includes(tag));
    return matchesQuery && matchesTags;
  }), [songs, query, selectedTags]);

  const availableTags = useMemo(() => {
    const set = new Set();
    songs.forEach(s => s.tags?.forEach(t => set.add(t)));
    return [...set];
  }, [songs]);

  // songId → [setlistName, ...] lookup
  const songSetlistMap = useMemo(() => {
    const map = {};
    setlists.forEach(sl => {
      sl.songIds?.forEach(id => {
        if (!map[id]) map[id] = [];
        map[id].push(sl.name);
      });
    });
    return map;
  }, [setlists]);

  // ── Helpers de seleção ────────────────────────────────────────────────────
  const enterSelectionMode = (song = null) => {
    setSelectionMode(true);
    setSelectedIds(song ? new Set([song.id]) : new Set());
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const toggleSelect = (song) =>
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(song.id) ? next.delete(song.id) : next.add(song.id);
      return next;
    });

  const allSelected = filtered.length > 0 && filtered.every(s => selectedIds.has(s.id));

  const toggleSelectAll = () =>
    setSelectedIds(allSelected ? new Set() : new Set(filtered.map(s => s.id)));

  const handleConfirmDelete = () => {
    onDeleteSongs?.([...selectedIds]);
    setShowDeleteConfirm(false);
    exitSelectionMode();
  };

  const count = selectedIds.size;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">

          {/* Barra de título */}
          <div className="flex items-center gap-2 px-4 pt-4 pb-2">
            {selectionMode ? (
              /* Modo seleção */
              <>
                <button
                  onClick={exitSelectionMode}
                  className="text-sm font-medium text-gray-500 dark:text-gray-400
                             px-1 py-1 active:opacity-60 transition-opacity"
                >
                  Cancelar
                </button>

                <span className="flex-1 text-center text-sm font-bold
                                 text-gray-900 dark:text-white">
                  {count === 0
                    ? 'Nenhuma selecionada'
                    : `${count} ${count === 1 ? 'selecionada' : 'selecionadas'}`}
                </span>

                <button
                  onClick={() => count > 0 && setShowDeleteConfirm(true)}
                  disabled={count === 0}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                              text-sm font-semibold transition-colors
                              ${count > 0
                                ? 'bg-red-500 text-white active:bg-red-600'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600'
                              }`}
                >
                  <Trash2 size={14} />
                  Excluir
                </button>
              </>
            ) : (
              /* Modo normal */
              <>
                <h1 className="flex-1 text-xl font-bold text-gray-900 dark:text-white">
                  Biblioteca
                </h1>

                {songs.length > 0 && (
                  <button
                    onClick={() => enterSelectionMode()}
                    className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800
                               text-gray-500 dark:text-gray-400
                               active:bg-gray-200 dark:active:bg-gray-700 transition-colors"
                  >
                    <CheckSquare size={18} />
                  </button>
                )}

                <button
                  onClick={() => setShowFilters(f => !f)}
                  className={`p-2 rounded-xl transition-colors
                    ${showFilters
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}
                >
                  <SlidersHorizontal size={18} />
                </button>

                <button
                  onClick={onAddSong}
                  className="p-2 rounded-xl bg-primary-500 text-white
                             active:bg-primary-600 transition-colors"
                >
                  <Plus size={18} />
                </button>
              </>
            )}
          </div>

          {/* Busca (oculta no modo seleção) */}
          {!selectionMode && (
            <div className="px-4 pb-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  placeholder="Buscar música, artista..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm
                             bg-gray-100 dark:bg-gray-800
                             text-gray-900 dark:text-gray-100
                             placeholder:text-gray-400
                             border border-transparent
                             focus:outline-none focus:border-primary-300 dark:focus:border-primary-700
                             transition"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Tags (ocultas no modo seleção) */}
          {showFilters && !selectionMode && availableTags.length > 0 && (
            <div className="px-4 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
              {availableTags.map(tag => (
                <TagBadge
                  key={tag}
                  tag={tag}
                  onClick={() => toggleTag(tag)}
                  selected={selectedTags.includes(tag)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Lista de músicas ───────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
              <Search size={48} strokeWidth={1} />
              <p className="text-sm">Nenhuma música encontrada</p>
            </div>
          ) : (
            <>
              {/* Contagem + Selecionar todas */}
              <div className="flex items-center justify-between px-4 py-2">
                <p className="text-xs text-gray-400 dark:text-gray-600">
                  {filtered.length} {filtered.length === 1 ? 'música' : 'músicas'}
                  {selectedTags.length > 0 && ` · ${selectedTags.join(', ')}`}
                </p>
                {selectionMode && (
                  <button
                    onClick={toggleSelectAll}
                    className="text-xs font-semibold text-primary-500 dark:text-primary-400
                               active:opacity-60 transition-opacity"
                  >
                    {allSelected ? 'Desmarcar todas' : 'Selecionar todas'}
                  </button>
                )}
              </div>

              {filtered.map(song => (
                <SongCard
                  key={song.id}
                  song={song}
                  onClick={selectionMode ? () => toggleSelect(song) : onSelectSong}
                  onLongPress={!selectionMode ? () => enterSelectionMode(song) : undefined}
                  selectionMode={selectionMode}
                  selected={selectedIds.has(song.id)}
                  setlistNames={songSetlistMap[song.id]}
                />
              ))}
            </>
          )}
        </div>
      </div>

      {/* ── Modal de confirmação de exclusão ──────────────────────────────── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 w-full max-w-sm shadow-2xl">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
              Excluir {count} {count === 1 ? 'música' : 'músicas'}?
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold
                           bg-gray-100 dark:bg-gray-700
                           text-gray-700 dark:text-gray-200
                           active:bg-gray-200 dark:active:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold
                           bg-red-500 text-white
                           active:bg-red-600 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
