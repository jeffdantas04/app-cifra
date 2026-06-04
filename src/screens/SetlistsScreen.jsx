import React, { useState, useRef } from 'react';
import {
  ListMusic, Plus, ChevronRight, ArrowLeft,
  Pencil, Trash2, Check, X, Music2, GripVertical
} from 'lucide-react';
import SongCard from '../components/SongCard';

function SetlistDetail({ setlist, songs, allSongs, onBack, onUpdate, onDelete, onSelectSong }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(setlist.name);
  const [showAddSong, setShowAddSong] = useState(false);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const dragIdxRef = useRef(null);

  const setlistSongs = (setlist.songIds || [])
    .map(id => songs.find(s => s.id === id))
    .filter(Boolean);

  const availableToAdd = allSongs.filter(s => !setlist.songIds.includes(s.id));

  const handleSaveName = () => {
    if (name.trim()) onUpdate({ ...setlist, name: name.trim() });
    setEditing(false);
  };

  const removeFromSetlist = (songId) => {
    onUpdate({ ...setlist, songIds: setlist.songIds.filter(id => id !== songId) });
  };

  const addToSetlist = (song) => {
    onUpdate({ ...setlist, songIds: [...setlist.songIds, song.id] });
    setShowAddSong(false);
  };

  // ── Drag handlers ────────────────────────────────────────────────────────
  const handleDragStart = (e, idx) => {
    dragIdxRef.current = idx;
    e.dataTransfer.effectAllowed = 'move';
    // Pequeno delay para o browser renderizar o ghost
    setTimeout(() => e.target.classList.add('opacity-40'), 0);
  };

  const handleDragEnd = (e) => {
    e.target.classList.remove('opacity-40');
    dragIdxRef.current = null;
    setDragOverIdx(null);
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIdx !== idx) setDragOverIdx(idx);
  };

  const handleDrop = (e, idx) => {
    e.preventDefault();
    const from = dragIdxRef.current;
    if (from === null || from === idx) return;
    const ids = [...setlist.songIds];
    const [removed] = ids.splice(from, 1);
    ids.splice(idx, 0, removed);
    onUpdate({ ...setlist, songIds: ids });
    dragIdxRef.current = null;
    setDragOverIdx(null);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">
      <div className="flex items-center gap-2 px-3 py-3
                      bg-white dark:bg-gray-900
                      border-b border-gray-200 dark:border-gray-800">
        <button onClick={onBack} className="p-2 rounded-xl text-gray-500 active:bg-gray-100 dark:active:bg-gray-800">
          <ArrowLeft size={20} />
        </button>

        {editing ? (
          <>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-xl text-sm font-semibold
                         bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white
                         focus:outline-none border border-primary-400"
            />
            <button onClick={handleSaveName} className="p-2 text-primary-500 active:opacity-70">
              <Check size={18} />
            </button>
            <button onClick={() => { setName(setlist.name); setEditing(false); }}
                    className="p-2 text-gray-400 active:opacity-70">
              <X size={18} />
            </button>
          </>
        ) : (
          <>
            <h2 className="flex-1 text-base font-bold text-gray-900 dark:text-white truncate">
              {setlist.name}
            </h2>
            <button onClick={() => setEditing(true)}
                    className="p-2 rounded-xl text-gray-400 active:bg-gray-100 dark:active:bg-gray-800">
              <Pencil size={16} />
            </button>
            <button onClick={() => onDelete(setlist.id)}
                    className="p-2 rounded-xl text-red-400 active:bg-red-50 dark:active:bg-red-900/20">
              <Trash2 size={16} />
            </button>
          </>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {setlistSongs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
            <Music2 size={36} strokeWidth={1} />
            <p className="text-sm">Setlist vazia</p>
          </div>
        ) : (
          setlistSongs.map((song, idx) => (
            <div
              key={song.id}
              draggable
              onDragStart={e => handleDragStart(e, idx)}
              onDragEnd={handleDragEnd}
              onDragOver={e => handleDragOver(e, idx)}
              onDrop={e => handleDrop(e, idx)}
              className={`flex items-center transition-colors
                          border-b border-gray-100 dark:border-gray-700/50
                          ${dragOverIdx === idx
                            ? 'bg-primary-50 dark:bg-primary-900/20 border-l-2 border-l-primary-400'
                            : 'bg-white dark:bg-gray-800'
                          }`}
            >
              {/* Drag handle */}
              <div className="pl-3 pr-1 py-4 cursor-grab active:cursor-grabbing text-gray-300 dark:text-gray-600 touch-none">
                <GripVertical size={18} />
              </div>

              <span className="text-xs text-gray-400 w-5 text-center select-none">{idx + 1}</span>

              <div className="flex-1 min-w-0" onClick={() => onSelectSong?.(song)}>
                <SongCard song={song} compact />
              </div>

              <button
                onClick={() => removeFromSetlist(song.id)}
                className="px-3 py-4 text-red-400 active:opacity-70"
              >
                <X size={16} />
              </button>
            </div>
          ))
        )}

        <button
          onClick={() => setShowAddSong(true)}
          className="flex items-center gap-2 w-full px-4 py-4
                     text-primary-500 text-sm font-medium
                     active:bg-gray-50 dark:active:bg-gray-800 transition-colors"
        >
          <Plus size={16} />
          Adicionar música
        </button>
      </div>

      {/* Add song modal */}
      {showAddSong && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
             onClick={() => setShowAddSong(false)}>
          <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl max-h-[70vh] flex flex-col shadow-2xl"
               onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
              <h3 className="font-bold text-gray-900 dark:text-white">Adicionar ao Setlist</h3>
              <button onClick={() => setShowAddSong(false)} className="p-1 text-gray-400 active:opacity-60">
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              {availableToAdd.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-8">Todas as músicas já estão no setlist</p>
              ) : (
                availableToAdd.map(song => (
                  <SongCard key={song.id} song={song} onClick={addToSetlist} compact />
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SetlistsScreen({ setlists, songs, onUpdateSetlist, onDeleteSetlist, onCreateSetlist, initialSelectedId, onSelectSong }) {
  const [selected, setSelected] = useState(initialSelectedId || null);

  // Abre o setlist correto quando vindo da Home
  React.useEffect(() => {
    if (initialSelectedId) setSelected(initialSelectedId);
  }, [initialSelectedId]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  if (selected) {
    const setlist = setlists.find(sl => sl.id === selected);
    if (!setlist) { setSelected(null); return null; }
    return (
      <SetlistDetail
        setlist={setlist}
        songs={songs}
        allSongs={songs}
        onBack={() => setSelected(null)}
        onUpdate={onUpdateSetlist}
        onDelete={(id) => { onDeleteSetlist(id); setSelected(null); }}
        onSelectSong={onSelectSong}
      />
    );
  }

  const handleCreate = () => {
    if (!newName.trim()) return;
    onCreateSetlist(newName.trim());
    setNewName('');
    setShowCreate(false);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">
      <div className="flex items-center gap-2 px-4 py-4
                      bg-white dark:bg-gray-900
                      border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white flex-1">Setlists</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="p-2 rounded-xl bg-primary-500 text-white active:bg-primary-600"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {setlists.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
            <ListMusic size={48} strokeWidth={1} />
            <p className="text-sm">Nenhum setlist criado</p>
            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-medium"
            >
              Criar setlist
            </button>
          </div>
        ) : (
          setlists.map(setlist => (
            <div
              key={setlist.id}
              onClick={() => setSelected(setlist.id)}
              className="flex items-center gap-3 px-4 py-4
                         bg-white dark:bg-gray-800
                         border-b border-gray-100 dark:border-gray-700/50
                         active:bg-gray-50 dark:active:bg-gray-700 cursor-pointer transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30
                              flex items-center justify-center">
                <ListMusic size={18} className="text-primary-500" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{setlist.name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {setlist.songIds?.length || 0} {(setlist.songIds?.length || 0) === 1 ? 'música' : 'músicas'}
                </p>
              </div>
              <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
            </div>
          ))
        )}
      </div>

      {/* Create setlist modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
          <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-2xl">
            <h3 className="font-bold text-gray-900 dark:text-white mb-3">Novo Setlist</h3>
            <input
              autoFocus
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="Nome do setlist"
              className="w-full px-3 py-2.5 rounded-xl text-sm
                         bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white
                         border border-transparent focus:outline-none focus:border-primary-400
                         mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowCreate(false); setNewName(''); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium
                           bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium
                           bg-primary-500 text-white active:bg-primary-600"
              >
                Criar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
