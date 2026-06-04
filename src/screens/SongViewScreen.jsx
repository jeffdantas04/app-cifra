import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  ArrowLeft, ChevronUp, ChevronDown, Play, Pause,
  ZoomIn, ZoomOut, ListMusic, Pencil, MoreVertical, Trash2,
  Music2, MicVocal, Columns2, BookOpen, Layers, Palette,
  X, Check, Plus, Youtube, Code2
} from 'lucide-react';
import CifraRenderer from '../components/CifraRenderer';
import PaginatedCifra from '../components/PaginatedCifra';
import MiniPlayer from '../components/MiniPlayer';
import ChordModal from '../components/ChordModal';
import TagBadge from '../components/TagBadge';
import { useAutoScroll } from '../hooks/useAutoScroll';
import { useYouTubePlayer } from '../hooks/useYouTubePlayer';
import { transposeKey, KEY_OPTIONS, semitonesBetween } from '../utils/transpose';
import { splitSyncStanzas, getActiveSyncUnit } from '../utils/syncParser';
import { extractYouTubeId } from '../utils/youtube';

const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px'];

export default function SongViewScreen({ song, setlists = [], onBack, onEdit, onDelete, onAddToSetlist, onCreateAndAddToSetlist }) {
  const [semitones, setSemitones] = useState(0);
  const [fontIdx, setFontIdx] = useState(2); // default 16px
  const [showMenu, setShowMenu] = useState(false);
  const [showScrollBar, setShowScrollBar] = useState(false);
  const [showChords, setShowChords] = useState(true);
  const [showLyrics, setShowLyrics] = useState(true);
  const [twoColumns, setTwoColumns] = useState(song.twoColumns ?? false);
  const [blockView, setBlockView] = useState(true);
  const [pageMode, setPageMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [activeChord, setActiveChord]             = useState(null);
  const [chordColor, setChordColor]               = useState('primary');
  const [showSetlistPicker, setShowSetlistPicker] = useState(false);
  const [showCreateSetlist, setShowCreateSetlist] = useState(false);
  const [newSetlistName, setNewSetlistName]       = useState('');
  const [showKeyPicker, setShowKeyPicker]         = useState(false);
  const [showPlayer, setShowPlayer]               = useState(false);
  const [showTabs, setShowTabs]                   = useState(true);

  // ── YouTube player ────────────────────────────────────────────────────────
  const videoId = useMemo(() => extractYouTubeId(song.youtubeUrl), [song.youtubeUrl]);
  const {
    containerId, isReady, isPlaying, currentTime, duration,
    togglePlay, seek, pause: pauseYT,
  } = useYouTubePlayer(showPlayer && videoId ? videoId : null);

  // ── Sync: map currentTime → active stanza index ───────────────────────────
  const syncStanzas    = useMemo(() => splitSyncStanzas(song.content), [song.content]);
  const totalSyncUnits = syncStanzas.length;
  const activeSyncUnit = getActiveSyncUnit(currentTime, duration, totalSyncUnits);

  // ── Scroll-mode stanza refs for auto-scroll ────────────────────────────────
  const stanzaScrollRefs = useRef([]);

  // Auto-scroll the active stanza into view in scroll mode
  useEffect(() => {
    if (!showPlayer || !isPlaying || pageMode || activeSyncUnit < 0) return;
    const el = stanzaScrollRefs.current[activeSyncUnit];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSyncUnit, showPlayer, isPlaying]);

  const toggleChords = () =>
    setShowChords(prev => {
      // não permite ocultar os dois ao mesmo tempo
      if (prev && !showLyrics) setShowLyrics(true);
      return !prev;
    });

  const toggleLyrics = () =>
    setShowLyrics(prev => {
      if (prev && !showChords) setShowChords(true);
      return !prev;
    });
  const scrollRef = useRef(null);
  const { isScrolling, speed, setSpeed, toggle, stop } = useAutoScroll(scrollRef);

  const displayKey = transposeKey(song.key, semitones);

  const transposeDown = () => setSemitones(s => s - 1);
  const transposeUp = () => setSemitones(s => s + 1);
  const resetTranspose = () => setSemitones(0);

  const fontDown = () => setFontIdx(i => Math.max(0, i - 1));
  const fontUp = () => setFontIdx(i => Math.min(FONT_SIZES.length - 1, i + 1));

  const handleToggleScroll = () => {
    setShowScrollBar(true);
    toggle();
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Top bar */}
      <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2
                      bg-white dark:bg-gray-900
                      border-b border-gray-100 dark:border-gray-800">
        <button
          onClick={() => { stop(); pauseYT(); onBack(); }}
          className="p-2 rounded-xl text-gray-500 dark:text-gray-400
                     active:bg-gray-100 dark:active:bg-gray-800 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-gray-900 dark:text-white truncate leading-tight">
            {song.title}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{song.artist}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSetlistPicker(true)}
            className="p-2 rounded-xl transition-colors
                       text-gray-500 dark:text-gray-400
                       active:bg-gray-100 dark:active:bg-gray-800"
          >
            <ListMusic size={18} />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMenu(m => !m)}
              className="p-2 rounded-xl text-gray-500 dark:text-gray-400
                         active:bg-gray-100 dark:active:bg-gray-800 transition-colors"
            >
              <MoreVertical size={18} />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 min-w-[190px]
                                bg-white dark:bg-gray-800 rounded-2xl shadow-xl
                                border border-gray-100 dark:border-gray-700 overflow-hidden">

                  <button
                    onClick={() => { setShowMenu(false); onEdit(song); }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm
                               text-gray-700 dark:text-gray-200
                               active:bg-gray-50 dark:active:bg-gray-700"
                  >
                    <Pencil size={16} />
                    Editar
                  </button>
                  <button
                    onClick={() => { setShowMenu(false); onDelete(song.id); }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-500
                               active:bg-red-50 dark:active:bg-red-900/20"
                  >
                    <Trash2 size={16} />
                    Excluir
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Song meta bar */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2
                      bg-gray-50 dark:bg-gray-800/50
                      border-b border-gray-100 dark:border-gray-800">
        {/* Key + transpose */}
        <div className="flex items-center gap-1">
          <button
            onClick={transposeDown}
            className="w-7 h-7 flex items-center justify-center rounded-lg
                       bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300
                       active:bg-gray-300 transition-colors"
          >
            <ChevronDown size={14} />
          </button>
          <button
            onClick={() => setShowKeyPicker(true)}
            className="px-2.5 py-1 rounded-lg text-sm font-bold text-primary-600 dark:text-primary-400
                       bg-primary-50 dark:bg-primary-900/30 min-w-[40px] text-center
                       active:bg-primary-100 transition-colors"
          >
            {displayKey}
          </button>
          <button
            onClick={transposeUp}
            className="w-7 h-7 flex items-center justify-center rounded-lg
                       bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300
                       active:bg-gray-300 transition-colors"
          >
            <ChevronUp size={14} />
          </button>
        </div>

        {semitones !== 0 && (
          <span className="text-xs text-gray-400">
            {semitones > 0 ? `+${semitones}` : semitones} tom
          </span>
        )}

        <div className="flex-1" />

        {/* Font size */}
        <div className="flex items-center gap-1">
          <button
            onClick={fontDown}
            className="w-7 h-7 flex items-center justify-center rounded-lg
                       bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300
                       active:bg-gray-300 transition-colors"
          >
            <ZoomOut size={14} />
          </button>
          <button
            onClick={fontUp}
            className="w-7 h-7 flex items-center justify-center rounded-lg
                       bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300
                       active:bg-gray-300 transition-colors"
          >
            <ZoomIn size={14} />
          </button>
        </div>

        {/* Separador */}
        <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />

        {/* Filtro: ocultar acordes / ocultar letra */}
        <div className="flex items-center gap-1">
          {/* Acordes */}
          <button
            onClick={toggleChords}
            title={showChords ? 'Ocultar acordes' : 'Mostrar acordes'}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors
                        ${showChords
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                          : 'bg-primary-500 text-white'
                        }`}
          >
            <Music2 size={14} />
          </button>
          {/* Letra */}
          <button
            onClick={toggleLyrics}
            title={showLyrics ? 'Ocultar letra' : 'Mostrar letra'}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors
                        ${showLyrics
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                          : 'bg-primary-500 text-white'
                        }`}
          >
            <MicVocal size={14} />
          </button>
          {/* Tab notation */}
          <button
            onClick={() => setShowTabs(t => !t)}
            title={showTabs ? 'Ocultar tabs' : 'Mostrar tabs'}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors
                        ${showTabs
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                          : 'bg-primary-500 text-white'
                        }`}
          >
            <Code2 size={14} />
          </button>
        </div>

        {/* Separador */}
        <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />

        {/* Layout: blocos + duas colunas + paginação */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setBlockView(b => !b)}
            title={blockView ? 'Ocultar blocos' : 'Mostrar blocos'}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors
                        ${blockView
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                        }`}
          >
            <Layers size={14} />
          </button>
          <button
            onClick={() => setTwoColumns(c => !c)}
            title={twoColumns ? 'Uma coluna' : 'Duas colunas'}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors
                        ${twoColumns
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                        }`}
          >
            <Columns2 size={14} />
          </button>
          <button
            onClick={() => {
              setPageMode(m => !m);
              setCurrentPage(0);
              if (!pageMode) stop();
            }}
            title={pageMode ? 'Modo scroll' : 'Modo paginação'}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors
                        ${pageMode
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                        }`}
          >
            <BookOpen size={14} />
          </button>

          {/* Cor dos acordes: roxo ↔ laranja(light)/limão(dark) */}
          <button
            onClick={() => setChordColor(c => c === 'primary' ? 'alt' : 'primary')}
            title="Cor dos acordes"
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors
                        ${chordColor === 'alt'
                          ? 'bg-orange-100 text-orange-700 dark:bg-accent-900/20 dark:text-accent-400'
                          : 'bg-primary-100 text-primary-500 dark:bg-primary-900/30 dark:text-primary-400'
                        }`}
          >
            <Palette size={14} />
          </button>
        </div>

        {/* Separador */}
        <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />

        {/* Auto-scroll toggle */}
        <button
          onClick={handleToggleScroll}
          className={`w-8 h-8 flex items-center justify-center rounded-lg
                      transition-colors
                      ${isScrolling
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}
        >
          {isScrolling ? <Pause size={14} /> : <Play size={14} />}
        </button>

        {/* YouTube audio player — only visible when song has a link */}
        {videoId && (
          <>
            <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />
            <button
              onClick={() => setShowPlayer(p => !p)}
              title={showPlayer ? 'Fechar player' : 'Reproduzir áudio'}
              className={`w-8 h-8 flex items-center justify-center rounded-lg
                          transition-colors
                          ${showPlayer
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                          }`}
            >
              <Youtube size={14} />
            </button>
          </>
        )}
      </div>

      {/* Auto-scroll speed — oculto no modo paginação */}
      {showScrollBar && !pageMode && (
        <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2
                        bg-gray-50 dark:bg-gray-800/50
                        border-b border-gray-100 dark:border-gray-800">
          <span className="text-xs text-gray-500 dark:text-gray-400 w-20">
            Velocidade
          </span>
          <input
            type="range"
            min={1}
            max={10}
            value={speed}
            onChange={e => setSpeed(Number(e.target.value))}
            className="flex-1 accent-primary-500"
          />
          <span className="text-xs text-gray-500 dark:text-gray-400 w-6 text-right">
            {speed}
          </span>
        </div>
      )}

      {/* Tags */}
      {song.tags?.length > 0 && (
        <div className="flex-shrink-0 flex gap-2 px-4 py-2 overflow-x-auto no-scrollbar
                        border-b border-gray-100 dark:border-gray-800">
          {song.tags.map(tag => (
            <TagBadge key={tag} tag={tag} />
          ))}
          {song.bpm && (
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium
                             bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              {song.bpm} bpm
            </span>
          )}
          {song.capo > 0 && (
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium
                             bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              Capo {song.capo}ª
            </span>
          )}
        </div>
      )}

      {/* Cifra content — scroll ou paginação */}
      {pageMode ? (
        <div className="flex-1 min-h-0">
          <PaginatedCifra
            content={song.content}
            semitones={semitones}
            fontSize={FONT_SIZES[fontIdx]}
            showChords={showChords}
            showLyrics={showLyrics}
            twoColumns={twoColumns}
            blockView={blockView}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onTotalPages={setTotalPages}
            onChordClick={setActiveChord}
            chordColor={chordColor}
            showTabs={showTabs}
            activeSyncUnit={showPlayer ? activeSyncUnit : -1}
          />
        </div>
      ) : (
        /* Scroll mode — render each stanza individually for sync highlighting */
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-4"
        >
          {syncStanzas.map((stanza, i) => (
            <div
              key={i}
              ref={el => { stanzaScrollRefs.current[i] = el; }}
              className={`rounded-xl transition-colors duration-500 -mx-1 px-1 mb-4
                          ${showPlayer && i === activeSyncUnit && activeSyncUnit >= 0
                            ? 'bg-primary-50 dark:bg-primary-950/40 ring-1 ring-inset ring-primary-200 dark:ring-primary-800/60'
                            : ''
                          }`}
            >
              <CifraRenderer
                content={stanza}
                semitones={semitones}
                fontSize={FONT_SIZES[fontIdx]}
                showChords={showChords}
                showLyrics={showLyrics}
                showTabs={showTabs}
                twoColumns={twoColumns}
                blockView={blockView}
                onChordClick={setActiveChord}
                chordColor={chordColor}
              />
            </div>
          ))}
          <div className="h-16" />
        </div>
      )}

      {/* ── YouTube mini player ──────────────────────────────────────────── */}
      {showPlayer && videoId && (
        <MiniPlayer
          containerId={containerId}
          isReady={isReady}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          onTogglePlay={togglePlay}
          onSeek={seek}
          onClose={() => {
            pauseYT();
            setShowPlayer(false);
          }}
          songTitle={song.title}
        />
      )}

      {/* ── Key picker ───────────────────────────────────────────────────── */}
      {showKeyPicker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setShowKeyPicker(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-5 w-full max-w-xs"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-gray-900 dark:text-white">Tonalidade</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  Original: <span className="font-semibold">{song.key}</span>
                </p>
              </div>
              <button
                onClick={() => setShowKeyPicker(false)}
                className="p-1.5 rounded-lg text-gray-400
                           active:bg-gray-100 dark:active:bg-gray-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* Key grid */}
            <div className="grid grid-cols-4 gap-2">
              {KEY_OPTIONS.map(key => {
                const semis = semitonesBetween(song.key, key);
                const isActive = semis === semitones;
                const isOriginal = semis === 0;
                return (
                  <button
                    key={key}
                    onClick={() => { setSemitones(semis); setShowKeyPicker(false); }}
                    className={`h-12 rounded-xl text-sm font-bold transition-colors relative
                                ${isActive
                                  ? 'bg-primary-500 text-white shadow-sm'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 active:bg-gray-200 dark:active:bg-gray-700'
                                }`}
                  >
                    {key}
                    {isOriginal && !isActive && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2
                                       w-1 h-1 rounded-full bg-primary-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Reset */}
            {semitones !== 0 && (
              <button
                onClick={() => { setSemitones(0); setShowKeyPicker(false); }}
                className="mt-3 w-full py-2 rounded-xl text-sm font-medium
                           text-primary-500 dark:text-primary-400
                           bg-primary-50 dark:bg-primary-900/20
                           active:bg-primary-100 dark:active:bg-primary-900/40 transition-colors"
              >
                Voltar ao original ({song.key})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Chord diagram modal */}
      {activeChord && (
        <ChordModal
          chordName={activeChord}
          onClose={() => setActiveChord(null)}
        />
      )}

      {/* ── Setlist picker ────────────────────────────────────────────────── */}
      {showSetlistPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
             onClick={() => { setShowSetlistPicker(false); setShowCreateSetlist(false); setNewSetlistName(''); }}>
          <div
            className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col max-h-[80vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 flex-shrink-0
                            border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-bold text-base text-gray-900 dark:text-white">
                Adicionar ao Setlist
              </h3>
              <button
                onClick={() => { setShowSetlistPicker(false); setShowCreateSetlist(false); setNewSetlistName(''); }}
                className="p-1.5 rounded-lg text-gray-400
                           active:bg-gray-100 dark:active:bg-gray-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1">
              {setlists.length === 0 && !showCreateSetlist ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-400">
                  <ListMusic size={32} strokeWidth={1} />
                  <p className="text-sm">Nenhum setlist criado ainda.</p>
                </div>
              ) : (
                setlists.map(sl => {
                  const inSetlist = sl.songIds?.includes(song.id);
                  return (
                    <button
                      key={sl.id}
                      onClick={() => onAddToSetlist(song, sl.id)}
                      className="flex items-center gap-3 w-full px-4 py-3.5
                                 border-b border-gray-100 dark:border-gray-800
                                 active:bg-gray-50 dark:active:bg-gray-800 transition-colors"
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                                       ${inSetlist
                                         ? 'bg-primary-500'
                                         : 'bg-primary-50 dark:bg-primary-900/30'
                                       }`}>
                        <ListMusic size={16}
                          className={inSetlist ? 'text-white' : 'text-primary-500 dark:text-primary-400'} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {sl.name}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {sl.songIds?.length || 0} {(sl.songIds?.length || 0) === 1 ? 'música' : 'músicas'}
                        </p>
                      </div>
                      {inSetlist && (
                        <Check size={18} className="text-primary-500 flex-shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Criar novo setlist */}
            <div className="flex-shrink-0 border-t border-gray-100 dark:border-gray-800 px-4 py-3">
              {showCreateSetlist ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={newSetlistName}
                    onChange={e => setNewSetlistName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && newSetlistName.trim()) {
                        onCreateAndAddToSetlist(newSetlistName, song);
                        setShowCreateSetlist(false);
                        setNewSetlistName('');
                        setShowSetlistPicker(false);
                      }
                    }}
                    placeholder="Nome do setlist..."
                    className="flex-1 text-sm px-3 py-2 rounded-xl
                               bg-gray-100 dark:bg-gray-800
                               text-gray-900 dark:text-gray-100
                               placeholder:text-gray-400
                               focus:outline-none border border-transparent
                               focus:border-primary-300 dark:focus:border-primary-700"
                  />
                  <button
                    onClick={() => {
                      if (!newSetlistName.trim()) return;
                      onCreateAndAddToSetlist(newSetlistName, song);
                      setShowCreateSetlist(false);
                      setNewSetlistName('');
                      setShowSetlistPicker(false);
                    }}
                    disabled={!newSetlistName.trim()}
                    className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors flex-shrink-0
                                ${newSetlistName.trim()
                                  ? 'bg-primary-500 text-white active:bg-primary-600'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600'
                                }`}
                  >
                    Criar
                  </button>
                  <button
                    onClick={() => { setShowCreateSetlist(false); setNewSetlistName(''); }}
                    className="p-2 text-gray-400 active:opacity-60"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowCreateSetlist(true)}
                  className="flex items-center gap-2 w-full text-sm font-medium
                             text-primary-500 dark:text-primary-400
                             active:opacity-60 transition-opacity"
                >
                  <div className="w-7 h-7 rounded-lg bg-primary-50 dark:bg-primary-900/30
                                  flex items-center justify-center">
                    <Plus size={14} className="text-primary-500 dark:text-primary-400" />
                  </div>
                  Novo setlist
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
