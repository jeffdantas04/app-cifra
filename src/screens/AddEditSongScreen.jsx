import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ArrowLeft, Check, Maximize2, Minimize2, Undo2, Redo2, Link2, Loader, ChevronDown, Youtube, FileUp, Scissors, Columns2, Tag, Eye, Layers } from 'lucide-react';
import CifraRenderer from '../components/CifraRenderer';
import { ALL_KEYS as TRANSPOSE_KEYS } from '../utils/transpose';
import { importFromCifraClub, isCifraClubUrl } from '../utils/importCifraClub';
import { getYouTubeThumbnail } from '../utils/youtube';

const DEFAULT_TAGS = ['Gospel', 'Adoração', 'MPB', 'Rock', 'Sertanejo', 'Pagode', 'Pop', 'Forró', 'Louvor'];

// ── Editor toolbar data ────────────────────────────────────────────────────────
const SECTIONS = [
  'Verso', 'Refrão', 'Ponte', 'Intro', 'Outro',
  'Solo', 'Pré-Refrão', 'Parte',
  'Primeira Parte', 'Segunda Parte', 'Terceira Parte', 'Quarta Parte', 'Parte Final',
];

const CHORDS_BY_GROUP = {
  maior: ['A','Bb','B','C','C#','D','Eb','E','F','F#','G','Ab'],
  menor: ['Am','Bbm','Bm','Cm','C#m','Dm','Ebm','Em','Fm','F#m','Gm','Abm'],
  dom7:  ['A7','Bb7','B7','C7','C#7','D7','Eb7','E7','F7','F#7','G7','Ab7'],
  m7:    ['Am7','Bbm7','Bm7','Cm7','Dm7','Em7','Fm7','F#m7','Gm7','C#m7'],
  maj7:  ['Amaj7','Bmaj7','Cmaj7','Dmaj7','Emaj7','Fmaj7','Gmaj7'],
  dim:   ['Adim','Bdim','Cdim','Ddim','Edim','Fdim','Gdim'],
};

const ALL_CHORDS = Object.values(CHORDS_BY_GROUP).flat();

const CHORD_FILTERS = [
  { id: 'todos', label: 'Todos'  },
  { id: 'maior', label: 'Maior'  },
  { id: 'menor', label: 'Menor'  },
  { id: 'dom7',  label: '7ª'     },
  { id: 'm7',    label: 'm7'     },
  { id: 'maj7',  label: 'maj7'   },
  { id: 'dim',   label: 'dim'    },
];

export default function AddEditSongScreen({ song, onSave, onBack, allTags }) {
  const ALL_TAGS = allTags?.length ? allTags : DEFAULT_TAGS;
  const isEdit = !!song;

  // ── Form state ─────────────────────────────────────────────────────────────
  const [title, setTitle]     = useState(song?.title   || '');
  const [artist, setArtist]   = useState(song?.artist  || '');
  const [key, setKey]         = useState(song?.key     || 'C');
  const [capo, setCapo]       = useState(song?.capo    ?? 0);
  const [bpm, setBpm]         = useState(song?.bpm     || '');
  const [tags, setTags]             = useState(song?.tags        || []);
  const [youtubeUrl, setYoutubeUrl] = useState(song?.youtubeUrl  || '');
  const [twoColumns, setTwoColumns] = useState(song?.twoColumns  ?? false);
  const [content, setContent]       = useState(song?.content    || '');
  const [errors, setErrors]         = useState({});

  const thumbnailUrl = getYouTubeThumbnail(youtubeUrl);

  // ── Editor UI state ────────────────────────────────────────────────────────
  const [chordFilter, setChordFilter]       = useState('todos');
  const [expandedEditor, setExpandedEditor] = useState(false);

  // ── Import do CifraClub ────────────────────────────────────────────────────
  const [showImport, setShowImport]   = useState(false);
  const [importUrl, setImportUrl]     = useState('');
  const [importing, setImporting]     = useState(false);
  const [importError, setImportError] = useState('');
  const [showTags, setShowTags]         = useState(false);
  const [showPreview, setShowPreview]   = useState(false);
  const [previewBlock, setPreviewBlock] = useState(true);
  const [previewCols, setPreviewCols]   = useState(false);

  // ── Undo / Redo ────────────────────────────────────────────────────────────
  const [undoable, setUndoable]     = useState(false);
  const [redoable, setRedoable]     = useState(false);
  const historyRef      = useRef([song?.content || '']);
  const historyIdxRef   = useRef(0);
  const isNavigatingRef = useRef(false);
  const debounceRef     = useRef(null);
  const textareaRef     = useRef(null);
  const fileInputRef    = useRef(null);

  // Cleanup debounce on unmount
  useEffect(() => () => clearTimeout(debounceRef.current), []);

  // Focus textarea when expanding
  useEffect(() => {
    if (expandedEditor) {
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }, [expandedEditor]);

  const pushHistory = useCallback((val) => {
    if (isNavigatingRef.current) return;
    const hist = historyRef.current;
    const idx  = historyIdxRef.current;
    if (hist[idx] === val) return;             // no real change
    const next   = hist.slice(0, idx + 1);
    next.push(val);
    if (next.length > 100) next.splice(0, 1); // cap size
    historyRef.current    = next;
    const newIdx = next.length - 1;
    historyIdxRef.current = newIdx;
    setUndoable(newIdx > 0);
    setRedoable(false);                        // truncated forward history
  }, []);

  const undo = useCallback(() => {
    const idx = historyIdxRef.current;
    if (idx <= 0) return;
    isNavigatingRef.current = true;
    const newIdx = idx - 1;
    historyIdxRef.current   = newIdx;
    setContent(historyRef.current[newIdx]);
    isNavigatingRef.current = false;
    setUndoable(newIdx > 0);
    setRedoable(newIdx < historyRef.current.length - 1);
  }, []);

  const redo = useCallback(() => {
    const hist = historyRef.current;
    const idx  = historyIdxRef.current;
    if (idx >= hist.length - 1) return;
    isNavigatingRef.current = true;
    const newIdx = idx + 1;
    historyIdxRef.current   = newIdx;
    setContent(hist[newIdx]);
    isNavigatingRef.current = false;
    setUndoable(newIdx > 0);
    setRedoable(newIdx < hist.length - 1);
  }, []);

  // Ctrl/Cmd + Z / Y / Shift+Z keyboard shortcuts (only when textarea is focused)
  useEffect(() => {
    const handler = (e) => {
      if (document.activeElement !== textareaRef.current) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && !e.shiftKey && e.key === 'z') { e.preventDefault(); undo(); }
      if (mod && e.key === 'y')                { e.preventDefault(); redo(); }
      if (mod && e.shiftKey && e.key === 'z')  { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  // ── Cursor-aware insertion helpers ─────────────────────────────────────────
  const handleContentChange = useCallback((e) => {
    const val = e.target.value;
    setContent(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => pushHistory(val), 600);
  }, [pushHistory]);

  const insertAtCursor = useCallback((text) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start  = ta.selectionStart ?? content.length;
    const end    = ta.selectionEnd   ?? content.length;
    const before = content.slice(0, start);
    const after  = content.slice(end);
    const next   = before + text + after;
    setContent(next);
    pushHistory(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + text.length, start + text.length);
    });
  }, [content, pushHistory]);

  const insertSection = useCallback((name) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start  = ta.selectionStart ?? content.length;
    const before = content.slice(0, start);
    const after  = content.slice(start);
    let prefix = '';
    if (before.length > 0) {
      if      (before.endsWith('\n\n')) prefix = '';
      else if (before.endsWith('\n'))   prefix = '\n';
      else                              prefix = '\n\n';
    }
    const text = `${prefix}${name}:\n`;
    const next = before + text + after;
    setContent(next);
    pushHistory(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + text.length, start + text.length);
    });
  }, [content, pushHistory]);

  const insertChord = useCallback((chord) => {
    insertAtCursor(`[${chord}]`);
  }, [insertAtCursor]);

  const insertTab = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start  = ta.selectionStart ?? content.length;
    const before = content.slice(0, start);
    const after  = content.slice(start);
    let prefix = '';
    if (before.length > 0) {
      if      (before.endsWith('\n\n')) prefix = '';
      else if (before.endsWith('\n'))   prefix = '\n';
      else                              prefix = '\n\n';
    }
    const template = `${prefix}Tab:\nE|---|\nB|---|\nG|---|\nD|---|\nA|---|\nE|---|\n`;
    const next = before + template + after;
    setContent(next);
    pushHistory(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + template.length, start + template.length);
    });
  }, [content, pushHistory]);

  // ── Importação do CifraClub ────────────────────────────────────────────────
  const handleImport = useCallback(async () => {
    const url = importUrl.trim();
    if (!url) return;
    setImporting(true);
    setImportError('');
    try {
      const { title: t, artist: a, content: c } = await importFromCifraClub(url);
      if (t) setTitle(t);
      if (a) setArtist(a);
      if (c) {
        setContent(c);
        pushHistory(c);
      }
      setShowImport(false);
      setImportUrl('');
    } catch (err) {
      setImportError(err.message || 'Erro ao importar. Tente novamente.');
    } finally {
      setImporting(false);
    }
  }, [importUrl, pushHistory]);

  // ── Importação de arquivo (.txt / .pdf) ──────────────────────────────────

  /** Recebe o texto bruto e preenche os campos do formulário */
  const applyImportedText = useCallback((raw, filename) => {
    const lines = raw.split(/\r?\n/);

    // Linhas não-vazias com seus índices originais
    const nonEmpty = lines
      .map((text, idx) => ({ text: text.trim(), idx }))
      .filter(l => l.text);

    let extractedTitle  = '';
    let extractedArtist = '';
    let contentStart    = 0;

    // 1ª tentativa: metadados explícitos ("Título: X" / "Artista: Y")
    for (const { text, idx } of nonEmpty.slice(0, 6)) {
      const titleMatch  = text.match(/^(?:t[íi]tulo|title|m[úu]sica)\s*[:–-]\s*(.+)/i);
      const artistMatch = text.match(/^(?:artista|artist|banda|band|interprete|intérprete)\s*[:–-]\s*(.+)/i);
      if (titleMatch)  { extractedTitle  = titleMatch[1].trim();  contentStart = idx + 1; }
      if (artistMatch) { extractedArtist = artistMatch[1].trim(); contentStart = idx + 1; }
    }

    // 2ª tentativa: 1ª linha não-vazia = título, 2ª = artista, resto = cifra
    if (!extractedTitle && nonEmpty.length > 0) {
      extractedTitle = nonEmpty[0].text;
      contentStart   = nonEmpty[0].idx + 1;

      if (nonEmpty.length > 1) {
        extractedArtist = nonEmpty[1].text;
        contentStart    = nonEmpty[1].idx + 1;
      }
    }

    // Fallback: nome do arquivo
    if (!extractedTitle) {
      extractedTitle = filename.replace(/\.(txt|pdf)$/i, '').replace(/[-_]/g, ' ').trim();
    }

    const extractedContent = lines.slice(contentStart).join('\n').trim();

    if (extractedTitle)   setTitle(extractedTitle);
    if (extractedArtist)  setArtist(extractedArtist);
    if (extractedContent) { setContent(extractedContent); pushHistory(extractedContent); }
  }, [pushHistory]);

  const handleFileImport = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => applyImportedText(ev.target.result || '', file.name);
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  }, [applyImportedText]);

  // ── Form helpers ───────────────────────────────────────────────────────────
  const toggleTag = (tag) =>
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const validate = () => {
    const e = {};
    if (!title.trim())   e.title   = 'Título obrigatório';
    if (!artist.trim())  e.artist  = 'Artista obrigatório';
    if (!content.trim()) e.content = 'Cifra obrigatória';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({
      ...song,
      id:        song?.id || Date.now().toString(),
      title:     title.trim(),
      artist:    artist.trim(),
      key,
      capo:      Number(capo),
      bpm:        bpm ? Number(bpm) : null,
      tags,
      youtubeUrl:  youtubeUrl.trim() || null,
      twoColumns,
      content:     content.trim(),
      createdAt:  song?.createdAt || new Date().toISOString(),
    });
  };

  const inputClass = (field) => `
    w-full px-3 py-2.5 rounded-xl text-sm
    bg-white dark:bg-gray-800
    text-gray-900 dark:text-gray-100
    border ${errors[field] ? 'border-red-400' : 'border-gray-200 dark:border-transparent'}
    focus:outline-none focus:border-primary-400 dark:focus:border-primary-600
    transition
  `;

  const editorBorder = errors.content
    ? 'border-red-400'
    : 'border-gray-200 dark:border-gray-700';

  const visibleChords = chordFilter === 'todos'
    ? ALL_CHORDS
    : (CHORDS_BY_GROUP[chordFilter] ?? []);

  // ── Shared toolbar rows (rendered in both normal and expanded views) ────────
  const renderToolbarRows = () => (
    <>
      {/* Row 1 — Section blocks + layout markers */}
      <div className="flex items-center overflow-x-auto no-scrollbar gap-1.5 px-2 py-2
                      bg-gray-200 dark:bg-gray-700
                      border-b border-gray-300 dark:border-gray-600">
        <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-widest
                         text-gray-400 dark:text-gray-500 pr-0.5 select-none">
          Bloco
        </span>
        {SECTIONS.map(name => (
          <button
            key={name}
            onMouseDown={e => e.preventDefault()}
            onClick={() => insertSection(name)}
            className="flex-shrink-0 px-3 py-1 rounded-lg
                       text-xs font-bold
                       bg-white dark:bg-gray-600
                       text-gray-700 dark:text-gray-100
                       shadow-sm active:scale-95 transition-transform"
          >
            {name}
          </button>
        ))}

        {/* Botão Tab — insere template de tablatura */}
        <button
          onMouseDown={e => e.preventDefault()}
          onClick={insertTab}
          title="Inserir tablatura de guitarra"
          className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg
                     text-xs font-bold font-mono
                     bg-gray-800 dark:bg-gray-950
                     text-gray-200 dark:text-gray-300
                     shadow-sm active:scale-95 transition-transform"
        >
          Tab
        </button>

        {/* Separador */}
        <div className="flex-shrink-0 w-px h-5 bg-gray-300 dark:bg-gray-500 mx-0.5" />

        {/* Quebra de página */}
        <button
          onMouseDown={e => e.preventDefault()}
          onClick={() => insertSection('---')}
          title="Inserir quebra de página"
          className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg
                     text-xs font-bold
                     bg-orange-50 dark:bg-orange-900/30
                     text-orange-500 dark:text-orange-400
                     shadow-sm active:scale-95 transition-transform"
        >
          <Scissors size={11} />
          Quebra
        </button>
      </div>

      {/* Row 2 — Chord filter tabs  +  Undo / Redo */}
      <div className="flex items-center bg-gray-100 dark:bg-gray-800
                      border-b border-gray-200 dark:border-gray-700">
        {/* Scrollable filter pills */}
        <div className="flex-1 flex items-center overflow-x-auto no-scrollbar gap-0.5 px-2 py-1.5">
          <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-widest
                           text-gray-400 dark:text-gray-500 select-none pr-1">
            Acorde
          </span>
          <div className="flex-shrink-0 w-px h-3.5 bg-gray-300 dark:bg-gray-600 mr-1" />
          {CHORD_FILTERS.map(f => (
            <button
              key={f.id}
              onMouseDown={e => e.preventDefault()}
              onClick={() => setChordFilter(f.id)}
              className={`flex-shrink-0 px-2.5 py-0.5 rounded-full
                          text-xs font-bold transition-colors
                          ${chordFilter === f.id
                            ? 'bg-primary-500 text-white'
                            : 'text-gray-500 dark:text-gray-400'
                          }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Pinned Undo / Redo */}
        <div className="flex-shrink-0 flex items-center gap-0.5 px-2 py-1.5
                        border-l border-gray-200 dark:border-gray-600">
          <button
            onClick={undo}
            disabled={!undoable}
            onMouseDown={e => e.preventDefault()}
            title="Desfazer (Ctrl+Z)"
            className={`p-1.5 rounded-lg transition-colors
                        ${undoable
                          ? 'text-gray-600 dark:text-gray-300 active:bg-gray-200 dark:active:bg-gray-700'
                          : 'text-gray-300 dark:text-gray-600 cursor-default'
                        }`}
          >
            <Undo2 size={14} />
          </button>
          <button
            onClick={redo}
            disabled={!redoable}
            onMouseDown={e => e.preventDefault()}
            title="Refazer (Ctrl+Y)"
            className={`p-1.5 rounded-lg transition-colors
                        ${redoable
                          ? 'text-gray-600 dark:text-gray-300 active:bg-gray-200 dark:active:bg-gray-700'
                          : 'text-gray-300 dark:text-gray-600 cursor-default'
                        }`}
          >
            <Redo2 size={14} />
          </button>
        </div>
      </div>

      {/* Row 3 — Chord buttons (filtered) */}
      <div className="flex items-center overflow-x-auto no-scrollbar gap-1 px-2 py-2
                      bg-gray-100 dark:bg-gray-800
                      border-b border-gray-200 dark:border-gray-700">
        {visibleChords.map(chord => (
          <button
            key={chord}
            onMouseDown={e => e.preventDefault()}
            onClick={() => insertChord(chord)}
            className="flex-shrink-0 px-2.5 py-1 rounded-md
                       text-xs font-mono font-bold
                       text-primary-600 dark:text-primary-400
                       bg-primary-50 dark:bg-primary-900/30
                       active:bg-primary-100 dark:active:bg-primary-900/60
                       transition-colors"
          >
            {chord}
          </button>
        ))}
      </div>
    </>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ════════════════════ Normal form view ════════════════════════════ */}
      <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">

        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-3
                        bg-white dark:bg-gray-900
                        border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={onBack}
            className="p-2 rounded-xl text-gray-500 active:bg-gray-100 dark:active:bg-gray-800"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="flex-1 text-base font-bold text-gray-900 dark:text-white">
            {isEdit ? 'Editar Música' : 'Nova Música'}
          </h2>
          {/* Layout toggles — só visíveis no preview */}
          {showPreview && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPreviewBlock(b => !b)}
                title="Alternar blocos"
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors
                            ${previewBlock
                              ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                            }`}
              >
                <Layers size={14} />
              </button>
              <button
                onClick={() => setPreviewCols(c => !c)}
                title="Alternar colunas"
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors
                            ${previewCols
                              ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                            }`}
              >
                <Columns2 size={14} />
              </button>
            </div>
          )}

          {/* Preview toggle */}
          <button
            onClick={() => setShowPreview(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors
                        ${showPreview
                          ? 'bg-primary-500 text-white active:bg-primary-600'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 active:bg-gray-200 dark:active:bg-gray-700'
                        }`}
          >
            <Eye size={15} />
            Preview
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl
                       bg-primary-500 text-white text-sm font-semibold
                       active:bg-primary-600 transition-colors"
          >
            <Check size={16} />
            Salvar
          </button>
        </div>

        {/* Preview body */}
        {showPreview && (
          <div className="flex-1 overflow-y-auto px-4 py-4 bg-white dark:bg-gray-900">
            {content.trim() ? (
              <>
                <CifraRenderer
                  content={content}
                  semitones={0}
                  fontSize="16px"
                  showChords={true}
                  showLyrics={true}
                  twoColumns={previewCols}
                  blockView={previewBlock}
                />
                <div className="h-8" />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-20">
                <Eye size={36} className="text-gray-200 dark:text-gray-700" />
                <p className="text-sm text-gray-400 dark:text-gray-500 leading-relaxed">
                  Nenhum conteúdo para visualizar.<br />Escreva a cifra e ative o preview.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Form body */}
        <div className={`flex-1 overflow-y-auto px-4 py-4 space-y-4 ${showPreview ? 'hidden' : ''}`}>

          {/* ── Imports — side by side ────────────────────────────────── */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,text/plain"
              className="hidden"
              onChange={handleFileImport}
            />

            <div className="flex gap-2">
              {/* CifraClub toggle */}
              <button
                type="button"
                onClick={() => { setShowImport(v => !v); setImportError(''); }}
                className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-colors
                            ${showImport
                              ? 'border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-950/50'
                              : 'border-primary-200 dark:border-primary-900/60 bg-primary-50/60 dark:bg-primary-950/30'
                            }`}
              >
                <Link2 size={14} className="flex-shrink-0 text-primary-500" />
                <span className="flex-1 text-xs font-semibold text-primary-600 dark:text-primary-400 text-left">
                  CifraClub
                </span>
                <ChevronDown
                  size={13}
                  className={`text-primary-400 transition-transform duration-200 ${showImport ? 'rotate-180' : ''}`}
                />
              </button>

              {/* TXT import */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border
                           border-gray-200 dark:border-gray-700
                           bg-white dark:bg-gray-900
                           active:bg-gray-50 dark:active:bg-gray-800 transition-colors"
              >
                <FileUp size={14} className="flex-shrink-0 text-gray-400" />
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Arquivo .txt
                </span>
              </button>
            </div>

            {/* CifraClub expansion panel */}
            {showImport && (
              <div className="mt-2 px-3 pb-3 pt-2 space-y-2
                              rounded-xl border border-primary-200 dark:border-primary-900/60
                              bg-primary-50/60 dark:bg-primary-950/30">
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug">
                  Cole o link de uma página de cifra do{' '}
                  <span className="font-semibold text-primary-600 dark:text-primary-400">
                    cifraclub.com.br
                  </span>{' '}
                  — título, artista e cifra serão preenchidos automaticamente.
                </p>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={importUrl}
                    onChange={e => { setImportUrl(e.target.value); setImportError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleImport()}
                    placeholder="https://www.cifraclub.com.br/artista/musica/"
                    className="flex-1 min-w-0 px-3 py-2 rounded-xl text-xs
                               bg-white dark:bg-gray-800
                               text-gray-900 dark:text-gray-100
                               border border-gray-200 dark:border-gray-600
                               focus:outline-none focus:border-primary-400
                               dark:focus:border-primary-600 transition"
                  />
                  <button
                    onClick={handleImport}
                    disabled={importing || !importUrl.trim()}
                    className="flex-shrink-0 flex items-center gap-1.5
                               px-3 py-2 rounded-xl
                               bg-primary-500 text-white text-xs font-semibold
                               disabled:opacity-50 disabled:cursor-default
                               active:bg-primary-600 transition-colors"
                  >
                    {importing ? (
                      <><Loader size={12} className="animate-spin" /> Importando…</>
                    ) : 'Importar'}
                  </button>
                </div>
                {importError && (
                  <p className="text-xs text-red-500 leading-snug">{importError}</p>
                )}
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">
              Título *
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Nome da música"
              className={inputClass('title')}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          {/* Artist + Categories */}
          <div>
            <div className="flex gap-2 items-end">
              {/* Artist */}
              <div className="flex-1 min-w-0">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">
                  Artista *
                </label>
                <input
                  type="text"
                  value={artist}
                  onChange={e => setArtist(e.target.value)}
                  placeholder="Artista ou banda"
                  className={inputClass('artist')}
                />
              </div>

              {/* Categories collapse button */}
              <div className="flex-shrink-0">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">
                  Categorias
                </label>
                <button
                  type="button"
                  onClick={() => setShowTags(v => !v)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border transition-colors
                              ${showTags
                                ? 'border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                                : 'border-gray-200 dark:border-transparent bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                              }`}
                >
                  <Tag size={13} className={showTags ? 'text-primary-500' : 'text-gray-400'} />
                  <span className="text-sm font-semibold min-w-[1ch] text-center">
                    {tags.length > 0 ? tags.length : '—'}
                  </span>
                  <ChevronDown
                    size={13}
                    className={`transition-transform duration-200 ${showTags ? 'rotate-180 text-primary-400' : 'text-gray-400'}`}
                  />
                </button>
              </div>
            </div>

            {errors.artist && <p className="text-xs text-red-500 mt-1">{errors.artist}</p>}

            {/* Categories checklist */}
            {showTags && (
              <div className="mt-2 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
                {ALL_TAGS.map((tag, idx) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                                active:bg-gray-50 dark:active:bg-gray-700/50
                                ${idx < ALL_TAGS.length - 1 ? 'border-b border-gray-100 dark:border-gray-700/60' : ''}`}
                  >
                    <div className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors
                                    ${tags.includes(tag)
                                      ? 'bg-primary-500 border-primary-500'
                                      : 'border-gray-300 dark:border-gray-600'
                                    }`}>
                      {tags.includes(tag) && <Check size={9} className="text-white" />}
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-200">{tag}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Key + Capo + BPM */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">
                Tom
              </label>
              <select
                value={key}
                onChange={e => setKey(e.target.value)}
                className={`${inputClass()} appearance-none`}
              >
                {TRANSPOSE_KEYS.map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">
                Capo
              </label>
              <select
                value={capo}
                onChange={e => setCapo(e.target.value)}
                className={`${inputClass()} appearance-none`}
              >
                {[0,1,2,3,4,5,6,7].map(n => (
                  <option key={n} value={n}>{n === 0 ? 'Sem' : `${n}ª`}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">
                BPM
              </label>
              <div className="flex items-center rounded-xl overflow-hidden
                              bg-gray-100 dark:bg-gray-800
                              border border-transparent
                              focus-within:border-primary-300 dark:focus-within:border-primary-700
                              transition">
                <button
                  type="button"
                  onClick={() => setBpm(v => String(Math.max(40, (Number(v) || 120) - 1)))}
                  className="px-2.5 py-2.5 text-base font-bold leading-none
                             text-gray-500 dark:text-gray-400 select-none
                             active:bg-gray-200 dark:active:bg-gray-700 transition-colors"
                >−</button>
                <input
                  type="text"
                  inputMode="numeric"
                  value={bpm}
                  onChange={e => setBpm(e.target.value.replace(/\D/g, ''))}
                  placeholder="120"
                  className="flex-1 min-w-0 text-center text-sm font-medium
                             bg-transparent text-gray-900 dark:text-gray-100
                             placeholder:text-gray-400 focus:outline-none py-2.5"
                />
                <button
                  type="button"
                  onClick={() => setBpm(v => String(Math.min(240, (Number(v) || 120) + 1)))}
                  className="px-2.5 py-2.5 text-base font-bold leading-none
                             text-gray-500 dark:text-gray-400 select-none
                             active:bg-gray-200 dark:active:bg-gray-700 transition-colors"
                >+</button>
              </div>
            </div>
          </div>

          {/* YouTube */}
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">
              Link do YouTube
            </label>
            <div className="flex items-center gap-2
                            px-3 py-2.5 rounded-xl
                            bg-white dark:bg-gray-800
                            border border-gray-200 dark:border-transparent
                            focus-within:border-primary-400 dark:focus-within:border-primary-600
                            transition">
              <Youtube size={15} className="flex-shrink-0 text-red-500" />
              <input
                type="url"
                value={youtubeUrl}
                onChange={e => setYoutubeUrl(e.target.value)}
                placeholder="https://youtu.be/..."
                className="flex-1 min-w-0 bg-transparent text-sm
                           text-gray-900 dark:text-gray-100
                           placeholder-gray-400 dark:placeholder-gray-500
                           focus:outline-none"
              />
              {youtubeUrl && (
                <button
                  type="button"
                  onClick={() => setYoutubeUrl('')}
                  className="flex-shrink-0 text-gray-400 active:text-gray-600 transition-colors text-lg leading-none"
                >
                  ×
                </button>
              )}
            </div>

            {/* Thumbnail preview */}
            {thumbnailUrl && (
              <div className="mt-2 flex items-center gap-3
                              px-3 py-2.5 rounded-xl
                              bg-white dark:bg-gray-800
                              border border-gray-200 dark:border-transparent">
                <img
                  src={thumbnailUrl}
                  alt="Thumbnail"
                  className="w-16 h-10 object-cover rounded-lg flex-shrink-0"
                  onError={e => { e.currentTarget.style.display = 'none'; }}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug">
                  Thumbnail vinculada —{' '}
                  <span className="text-primary-500 font-medium">
                    aparecerá nos Recentes
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Layout */}
          <div className="flex items-center justify-between
                          px-3 py-3 rounded-xl
                          bg-white dark:bg-gray-800
                          border border-gray-200 dark:border-transparent">
            <div className="flex items-center gap-2">
              <Columns2 size={15} className="text-gray-400" />
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  Duas colunas
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Exibe a cifra em layout de 2 colunas
                </p>
              </div>
            </div>
            {/* Toggle switch */}
            <button
              type="button"
              onClick={() => setTwoColumns(v => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0
                          ${twoColumns ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-600'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow
                                transition-transform duration-200
                                ${twoColumns ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* ── Cifra editor (normal mode) ─────────────────────────────── */}
          <div>
            {/* Label row with expand button */}
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Cifra *
              </label>
              <button
                onClick={() => setExpandedEditor(true)}
                className="flex items-center gap-1 text-xs font-semibold
                           text-primary-500 dark:text-primary-400
                           active:opacity-70 transition-opacity"
              >
                <Maximize2 size={13} />
                Expandir
              </button>
            </div>

            <div className={`rounded-xl overflow-hidden border ${editorBorder}`}>
              {renderToolbarRows()}

              {/* Textarea — only mounted when NOT in expanded mode */}
              {!expandedEditor && (
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={handleContentChange}
                  placeholder={"Verso:\n[C]Letra da [G]música\n[Am]Mais um [F]verso\n\nRefrão:\n[F]O refr[C]ão vai a[G]qui"}
                  rows={12}
                  className="block w-full px-3 py-2.5
                             font-mono text-xs leading-relaxed resize-none
                             bg-white dark:bg-gray-800
                             text-gray-900 dark:text-gray-100
                             focus:outline-none"
                />
              )}

              {/* Placeholder shown while expanded so card doesn't collapse */}
              {expandedEditor && (
                <div className="px-3 py-4 text-xs text-gray-400 dark:text-gray-500 italic text-center">
                  Editor expandido — toque em <strong>Recolher</strong> para voltar
                </div>
              )}
            </div>

            {errors.content && <p className="text-xs text-red-500 mt-1">{errors.content}</p>}
          </div>

          {/* Format hint */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1.5">
              Dicas de formato
            </p>
            <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
              <li>• Use <strong>Bloco</strong> para inserir seções (Verso, Refrão…)</li>
              <li>• Filtre por tipo e toque o acorde para inserir no cursor</li>
              <li>• <strong>↩ ↪</strong> desfaz e refaz — Ctrl+Z / Ctrl+Y também funciona</li>
              <li className="font-mono leading-relaxed pt-1">
                Verso:{'\n'}[C]Hoje eu [G]quero te [Am]louvar
              </li>
            </ul>
          </div>

          <div className="h-8" />
        </div>
      </div>

      {/* ════════════════════ Expanded editor overlay ══════════════════════ */}
      {expandedEditor && (
        <div className="fixed inset-0 z-40 flex flex-col bg-gray-50 dark:bg-gray-950">

          {/* Mini header */}
          <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2.5
                          bg-white dark:bg-gray-900
                          border-b border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setExpandedEditor(false)}
              className="p-2 rounded-xl text-gray-500 dark:text-gray-400
                         active:bg-gray-100 dark:active:bg-gray-800 transition-colors"
            >
              <Minimize2 size={20} />
            </button>
            <span className="flex-1 text-sm font-bold text-gray-800 dark:text-white">
              {title || 'Cifra'}
            </span>

            {/* Layout toggles — só no preview */}
            {showPreview && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPreviewBlock(b => !b)}
                  title="Alternar blocos"
                  className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors
                              ${previewBlock
                                ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                              }`}
                >
                  <Layers size={14} />
                </button>
                <button
                  onClick={() => setPreviewCols(c => !c)}
                  title="Alternar colunas"
                  className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors
                              ${previewCols
                                ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                              }`}
                >
                  <Columns2 size={14} />
                </button>
              </div>
            )}

            <button
              onClick={() => setShowPreview(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors
                          ${showPreview
                            ? 'bg-primary-500 text-white active:bg-primary-600'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 active:bg-gray-200 dark:active:bg-gray-700'
                          }`}
            >
              <Eye size={15} />
              Preview
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl
                         bg-primary-500 text-white text-sm font-semibold
                         active:bg-primary-600 transition-colors"
            >
              <Check size={15} />
              Salvar
            </button>
          </div>

          {/* Preview do editor expandido */}
          {showPreview ? (
            <div className="flex-1 overflow-y-auto m-3 px-4 py-4
                            rounded-xl border border-gray-200 dark:border-gray-700
                            bg-white dark:bg-gray-800">
              {content.trim() ? (
                <>
                  <CifraRenderer
                    content={content}
                    semitones={0}
                    fontSize="16px"
                    showChords={true}
                    showLyrics={true}
                    twoColumns={previewCols}
                    blockView={previewBlock}
                  />
                  <div className="h-8" />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-20">
                  <Eye size={36} className="text-gray-200 dark:text-gray-700" />
                  <p className="text-sm text-gray-400 dark:text-gray-500 leading-relaxed">
                    Nenhum conteúdo para visualizar.<br />Escreva a cifra e ative o preview.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Editor card — fills remaining space */
            <div className="flex-1 flex flex-col overflow-hidden m-3 rounded-xl
                            border border-gray-200 dark:border-gray-700">
              {renderToolbarRows()}

              {/* Flex-1 textarea fills all remaining height */}
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleContentChange}
                placeholder={"Verso:\n[C]Letra da [G]música\n[Am]Mais um [F]verso\n\nRefrão:\n[F]O refr[C]ão vai a[G]qui"}
                className="block w-full flex-1 min-h-0 px-3 py-2.5
                           font-mono text-xs leading-relaxed resize-none
                           bg-white dark:bg-gray-800
                           text-gray-900 dark:text-gray-100
                           focus:outline-none"
              />
            </div>
          )}
        </div>
      )}

    </>
  );
}
