import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, X, ZoomIn, ZoomOut, Plus } from 'lucide-react';
import ChordDiagram from '../components/ChordDiagram';
import ChordModal from '../components/ChordModal';
import ChordDiagramEditor from '../components/ChordDiagramEditor';
import { CHORD_DATA } from '../data/chords';
import { useCustomChords } from '../hooks/useCustomChords';

// ── Family filter pills ───────────────────────────────────────────────────────
const FILTERS = [
  { id: 'all',   label: 'Todos',
    active: 'bg-gray-800 dark:bg-gray-100 text-white dark:text-gray-900',
    inactive: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300' },
  { id: 'maior', label: 'Maior',
    active: 'bg-blue-500 text-white',
    inactive: 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400' },
  { id: 'menor', label: 'Menor',
    active: 'bg-violet-500 text-white',
    inactive: 'bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400' },
  { id: 'dom7',  label: '7ª Dom.',
    active: 'bg-orange-500 text-white',
    inactive: 'bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400' },
  { id: 'm7',    label: 'm7',
    active: 'bg-teal-500 text-white',
    inactive: 'bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400' },
  { id: 'maj7',  label: 'Maior 7',
    active: 'bg-primary-500 text-white',
    inactive: 'bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400' },
  { id: 'sus',   label: 'Sus.',
    active: 'bg-amber-500 text-white',
    inactive: 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400' },
  { id: 'dim',   label: 'dim',
    active: 'bg-red-500 text-white',
    inactive: 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400' },
  { id: 'aug',   label: 'aug',
    active: 'bg-pink-500 text-white',
    inactive: 'bg-pink-50 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400' },
];

// ── Root-note helpers ─────────────────────────────────────────────────────────
const ROOT_ORDER = ['C','D','E','F','G','A','B','Bb','Eb','Ab','Db','F#','C#'];

function getRoot(chord) {
  return (chord[1] === '#' || chord[1] === 'b') ? chord.slice(0, 2) : chord[0];
}

function getFamily(chord) {
  const suffix = chord.slice(getRoot(chord).length);
  if (!suffix)                  return 'maior';
  if (suffix === 'm')           return 'menor';
  if (suffix === '7')           return 'dom7';
  if (suffix === 'm7')          return 'm7';
  if (suffix.includes('maj7'))  return 'maj7';
  if (suffix.startsWith('sus')) return 'sus';
  if (suffix.startsWith('dim')) return 'dim';
  if (suffix.startsWith('aug')) return 'aug';
  return 'outros';
}

const FAMILY_RANK = ['maior','menor','dom7','m7','maj7','sus','dim','aug','outros'];

// Tailwind grid classes (must be full literals for JIT)
const GRID_CLASS = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4' };

// ── Chord card ────────────────────────────────────────────────────────────────
function ChordCard({ chord, cols, firstVoicing, isCustomOnly, onClick }) {
  const nameSz = cols <= 2 ? 'text-sm' : 'text-[11px]';

  return (
    <button
      onClick={() => onClick(chord)}
      className="flex flex-col items-center gap-0.5
                 active:opacity-40 transition-opacity"
    >
      <div className="w-full text-gray-800 dark:text-gray-100 relative">
        {firstVoicing
          ? <ChordDiagram voicing={firstVoicing} name={null} fill />
          : <div className="aspect-[6/7] flex items-center justify-center
                            text-gray-300 dark:text-gray-600 text-sm">—</div>
        }
        {/* Small dot for custom-only chords */}
        {isCustomOnly && (
          <span className="absolute top-0 right-0 w-2 h-2 rounded-full
                           bg-primary-400 dark:bg-primary-500" />
        )}
      </div>
      <span className={`font-bold text-gray-500 dark:text-gray-400 ${nameSz}`}>
        {chord}
      </span>
    </button>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function ChordDictionaryScreen() {
  const [search,       setSearch]       = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeRoot,   setActiveRoot]   = useState('C');
  const [activeChord,  setActiveChord]  = useState(null);
  const [cols,         setCols]         = useState(4);
  const [showEditor,   setShowEditor]   = useState(false);
  const [editorInitName, setEditorInitName] = useState('');

  // Custom chords from localStorage
  const { customData, addVoicing, removeVoicing } = useCustomChords();

  const isSearching = search.trim().length > 0;

  // ── Merged chord groups (built-in + custom) ───────────────────────────────
  const allGroups = useMemo(() => {
    const g = {};
    ROOT_ORDER.forEach(r => { g[r] = []; });

    // Built-in
    Object.keys(CHORD_DATA).forEach(chord => {
      const r = getRoot(chord);
      if (g[r]) g[r].push(chord);
    });

    // Custom — only add if not already present (avoid duplicates)
    Object.keys(customData).forEach(chord => {
      const r = getRoot(chord);
      if (!g[r]) return;                       // unknown root → skip
      if (!g[r].includes(chord)) g[r].push(chord);
    });

    // Sort each group by family rank
    ROOT_ORDER.forEach(r => {
      g[r].sort((a, b) =>
        FAMILY_RANK.indexOf(getFamily(a)) - FAMILY_RANK.indexOf(getFamily(b))
      );
    });
    return g;
  }, [customData]);

  const dynamicRoots = useMemo(() =>
    ROOT_ORDER.filter(r => allGroups[r]?.length > 0),
    [allGroups]
  );

  // ── Helpers to get voicings ───────────────────────────────────────────────
  const getFirstVoicing = useCallback((chord) => {
    return CHORD_DATA[chord]?.[0] ?? customData[chord]?.[0] ?? null;
  }, [customData]);

  const getAllVoicings = useCallback((chord) => {
    const builtin = CHORD_DATA[chord] ?? [];
    const custom  = customData[chord] ?? [];
    return [...builtin, ...custom];
  }, [customData]);

  const getBuiltInCount = useCallback((chord) => {
    return CHORD_DATA[chord]?.length ?? 0;
  }, []);

  // ── Roots available for current family filter ─────────────────────────────
  const availableRoots = useMemo(() =>
    dynamicRoots.filter(r => {
      if (activeFilter === 'all') return true;
      return allGroups[r].some(c => getFamily(c) === activeFilter);
    }),
    [activeFilter, dynamicRoots, allGroups]
  );

  // Auto-correct root when family filter makes it unavailable
  useEffect(() => {
    if (!availableRoots.includes(activeRoot) && availableRoots.length > 0) {
      setActiveRoot(availableRoots[0]);
    }
  }, [availableRoots, activeRoot]);

  // ── Display groups for the grid ───────────────────────────────────────────
  const displayGroups = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (isSearching) {
      return dynamicRoots.map(root => {
        let chords = allGroups[root];
        if (activeFilter !== 'all') chords = chords.filter(c => getFamily(c) === activeFilter);
        chords = chords.filter(c => c.toLowerCase().includes(q));
        return { root, chords };
      }).filter(g => g.chords.length > 0);
    }

    let chords = allGroups[activeRoot] ?? [];
    if (activeFilter !== 'all') chords = chords.filter(c => getFamily(c) === activeFilter);
    return chords.length ? [{ root: activeRoot, chords }] : [];
  }, [search, activeFilter, activeRoot, isSearching, allGroups, dynamicRoots]);

  // ── Editor handlers ───────────────────────────────────────────────────────
  const openEditorNew = () => {
    setEditorInitName('');
    setShowEditor(true);
    setActiveChord(null);
  };

  const openEditorForChord = (chordName) => {
    setEditorInitName(chordName);
    setActiveChord(null);
    setShowEditor(true);
  };

  const handleEditorSave = (chordName, voicing) => {
    addVoicing(chordName, voicing);
    setShowEditor(false);
    setActiveChord(chordName);   // re-open modal on the saved chord
  };

  // ── Misc ──────────────────────────────────────────────────────────────────
  const handleFamilyFilter = (id) => { setActiveFilter(id); setSearch(''); };
  const zoomOut = () => setCols(c => Math.min(4, c + 1));
  const zoomIn  = () => setCols(c => Math.max(1, c - 1));

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">

      {/* ── Header ── */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-900
                      border-b border-gray-100 dark:border-gray-800">

        {/* Title + controls */}
        <div className="flex items-center gap-2 px-4 pt-4 pb-3">
          <h1 className="flex-1 text-lg font-bold text-gray-900 dark:text-white">
            Dicionário de Acordes
          </h1>
          {/* Zoom */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={zoomOut}
              disabled={cols === 4}
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors
                          ${cols === 4
                            ? 'text-gray-300 dark:text-gray-700'
                            : 'text-gray-500 dark:text-gray-400 active:bg-gray-100 dark:active:bg-gray-800'
                          }`}
            >
              <ZoomOut size={16} />
            </button>
            <button
              onClick={zoomIn}
              disabled={cols === 1}
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors
                          ${cols === 1
                            ? 'text-gray-300 dark:text-gray-700'
                            : 'text-gray-500 dark:text-gray-400 active:bg-gray-100 dark:active:bg-gray-800'
                          }`}
            >
              <ZoomIn size={16} />
            </button>
          </div>
          {/* Add chord */}
          <button
            onClick={openEditorNew}
            title="Criar novo acorde"
            className="w-8 h-8 flex items-center justify-center rounded-lg
                       bg-primary-500 text-white
                       active:bg-primary-600 transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 mx-4 mb-2 px-3 py-2.5 rounded-xl
                        bg-gray-100 dark:bg-gray-800">
          <Search size={15} className="flex-shrink-0 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar acorde (ex: Am7, G…)"
            className="flex-1 bg-transparent text-sm
                       text-gray-800 dark:text-gray-200
                       placeholder-gray-400 dark:placeholder-gray-500
                       focus:outline-none"
          />
          {isSearching && (
            <button onClick={() => setSearch('')}
              className="text-gray-400 active:text-gray-600 transition-colors">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Family filter pills */}
        <div className="chord-filters flex gap-1.5 px-4 pb-2 overflow-x-auto no-scrollbar">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => handleFamilyFilter(f.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold
                          transition-colors
                          ${activeFilter === f.id ? f.active : f.inactive}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Root note pills */}
        {!isSearching && (
          <div className="flex gap-1.5 px-4 pt-1 pb-3 overflow-x-auto no-scrollbar">
            {availableRoots.map(root => (
              <button
                key={root}
                onClick={() => setActiveRoot(root)}
                className={`flex-shrink-0 min-w-[36px] h-8 px-2 rounded-xl
                            text-sm font-black transition-colors
                            ${activeRoot === root
                              ? 'bg-primary-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                            }`}
              >
                {root}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto">
        {displayGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Search size={36} className="text-gray-300 dark:text-gray-700" />
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center leading-relaxed">
              {isSearching
                ? <><span>Nenhum resultado para </span><span className="font-semibold">"{search}"</span></>
                : 'Nenhum acorde nesta combinação.'
              }
            </p>
          </div>
        ) : (
          displayGroups.map(({ root, chords }) => (
            <div key={root}>
              {isSearching && (
                <div className="flex items-center gap-3 px-4 pt-4 pb-2">
                  <span className="text-xl font-black text-gray-800 dark:text-gray-100 w-9 flex-shrink-0">
                    {root}
                  </span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                </div>
              )}
              <div className={`grid ${GRID_CLASS[cols]} gap-x-2 gap-y-4 px-4 py-4`}>
                {chords.map(chord => (
                  <ChordCard
                    key={chord}
                    chord={chord}
                    cols={cols}
                    firstVoicing={getFirstVoicing(chord)}
                    isCustomOnly={!CHORD_DATA[chord] && !!customData[chord]}
                    onClick={setActiveChord}
                  />
                ))}
              </div>
            </div>
          ))
        )}
        <div className="h-6" />
      </div>

      {/* ── Chord modal ── */}
      {activeChord && (
        <ChordModal
          chordName={activeChord}
          allVoicings={getAllVoicings(activeChord)}
          builtInCount={getBuiltInCount(activeChord)}
          onDeleteCustom={(voicingIdx) =>
            removeVoicing(activeChord, voicingIdx - getBuiltInCount(activeChord))
          }
          onAddVoicing={() => openEditorForChord(activeChord)}
          onClose={() => setActiveChord(null)}
        />
      )}

      {/* ── Diagram editor ── */}
      {showEditor && (
        <ChordDiagramEditor
          initialName={editorInitName}
          onSave={handleEditorSave}
          onClose={() => setShowEditor(false)}
        />
      )}
    </div>
  );
}
