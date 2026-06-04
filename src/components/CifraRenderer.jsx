import React from 'react';
import { transposeContent } from '../utils/transpose';

// ── Chord color themes (full literal strings — required for Tailwind JIT) ─────
const CHORD_THEMES = {
  primary: {
    text:   'text-primary-500 dark:text-primary-400',
    active: 'active:bg-primary-50 dark:active:bg-primary-900/20',
  },
  alt: {
    // light → laranja acessível (5:1 no branco); dark → limão da paleta accent
    text:   'text-orange-700 dark:text-accent-400',
    active: 'active:bg-orange-50 dark:active:bg-accent-900/20',
  },
};

// ── Section detection ──────────────────────────────────────────────────────────
// Matches lines like: "Verso:", "Verso 2:", "Refrão:", "Parte 1:", "Chorus:", etc.
const SECTION_RE = /^(?:intro|outro|solo|coda|tag|interlude|instrumental|bridge|chorus|verse|pre-?chorus|refrão|verso|ponte|pré-refrão|estrofe|part(?:e(?:\s+final)?)?|vamp|(?:primeira|segunda|terceira|quarta)\s+parte)(?:\s*\d+)?[:\s]*$/i;

function detectSection(line) {
  const t = line.trim();
  if (SECTION_RE.test(t) || TAB_SECTION_RE.test(t)) {
    return t.replace(/:$/, '').trim();
  }
  return null;
}

// ── Tab section-header detection ──────────────────────────────────────────────
// Matches lines like: "Tab:", "Tab - Intro:", "Tab-Solo:", "Tab Verse:", etc.
// A dedicated regex so "Tab - Intro" becomes a section with the cyan style.
const TAB_SECTION_RE = /^tab(?:\s*[-–\s]\s*[\w\s]+)?\s*:?\s*$/i;

// ── Tab line detection ─────────────────────────────────────────────────────────
// Matches standard guitar / bass tab lines:
//   E|-0----2--3--|    B|--0------|    e|~~~~~|    etc.
const TAB_LINE_RE = /^[EBGDAebgda]\s*\|[-0-9hHpPbBrRsS/\\~^*x()\[\]{}<>+ ]+\|?\s*$/;

function isTabLine(line) {
  return TAB_LINE_RE.test(line.trim());
}

// ── Section style map (all class strings must be literal for Tailwind JIT) ────
const STYLES = {
  chorus:  { pill: 'bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400', bar: 'border-primary-400 dark:border-primary-500' },
  verse:   { pill: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400',            bar: 'border-blue-400 dark:border-blue-500' },
  bridge:  { pill: 'bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400',    bar: 'border-violet-400 dark:border-violet-500' },
  intro:   { pill: 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400',        bar: 'border-green-400 dark:border-green-500' },
  outro:   { pill: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400',        bar: 'border-amber-400 dark:border-amber-500' },
  solo:    { pill: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400',    bar: 'border-yellow-400 dark:border-yellow-500' },
  pre:     { pill: 'bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400',            bar: 'border-teal-400 dark:border-teal-500' },
  part:    { pill: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400',    bar: 'border-indigo-400 dark:border-indigo-500' },
  tab:     { pill: 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-400',            bar: 'border-cyan-400 dark:border-cyan-500' },
  default: { pill: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',               bar: 'border-gray-300 dark:border-gray-600' },
};

function getSectionStyle(name) {
  // Normalise: strip accents, lowercase
  const n = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (n.startsWith('refr') || n.startsWith('chorus'))        return STYLES.chorus;
  if (n.startsWith('vers') || n.startsWith('estrofe'))        return STYLES.verse;
  if (n.startsWith('pont') || n.startsWith('bridge'))         return STYLES.bridge;
  if (n.startsWith('intro'))                                   return STYLES.intro;
  if (n.startsWith('outro') || n.startsWith('coda'))          return STYLES.outro;
  if (n.startsWith('solo'))                                    return STYLES.solo;
  if (n.startsWith('tab'))                                      return STYLES.tab;
  if (n.startsWith('pre') || n.startsWith('pr'))              return STYLES.pre;
  if (n.startsWith('parte') || n.startsWith('part') ||
      n.startsWith('primeira') || n.startsWith('segunda') ||
      n.startsWith('terceira') || n.startsWith('quarta') ||
      n.startsWith('interlu') || n.startsWith('vamp') ||
      n.startsWith('tag'))                                     return STYLES.part;
  return STYLES.default;
}

// ── Section block wrapper ──────────────────────────────────────────────────────
function SectionBlock({ name, children, twoColumns }) {
  const { pill, bar } = getSectionStyle(name);
  return (
    <div className="mb-4" style={{ breakInside: twoColumns ? 'avoid-column' : undefined }}>
      {/* Label pill */}
      <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-md
                        uppercase tracking-widest mb-2 ${pill}`}>
        {name}
      </span>
      {/* Content with coloured left border */}
      <div className={`pl-3 border-l-2 ${bar}`}>
        {children}
      </div>
    </div>
  );
}

// ── Parse lines into groups ────────────────────────────────────────────────────
// group.type: 'block' | 'pagebreak' | 'tab'
function parseGroups(lines) {
  const groups = [];
  let current = { type: 'block', section: null, lines: [] };
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // ── Forced page break ────────────────────────────────────────────────────
    if (line.trim() === '---') {
      if (current.lines.length || current.section !== null) groups.push(current);
      groups.push({ type: 'pagebreak', section: null, lines: [] });
      current = { type: 'block', section: null, lines: [] };
      i++;
      continue;
    }

    // ── Tab block ────────────────────────────────────────────────────────────
    // Greedily collect consecutive tab lines (blank lines between them are kept).
    if (isTabLine(line)) {
      let j = i;
      const collected = [];
      while (j < lines.length) {
        if (isTabLine(lines[j])) {
          collected.push(lines[j]);
          j++;
        } else if (
          lines[j].trim() === '' &&
          j + 1 < lines.length &&
          isTabLine(lines[j + 1])
        ) {
          collected.push(lines[j]); // blank line *between* tab lines
          j++;
        } else {
          break;
        }
      }
      const tabCount = collected.filter(isTabLine).length;
      if (tabCount >= 2) {
        // Pull in the preceding short label if it looks like a chord/position
        // marker (e.g. "C7M(9):", "5ª posição:", "Intro:") that the user
        // typed right above the tab lines.
        let labelLine = null;
        if (current.lines.length > 0) {
          const last = current.lines[current.lines.length - 1].trim();
          const looksLikeLabel =
            last.length > 0 && last.length < 50 &&
            last.endsWith(':') &&
            !detectSection(last);
          if (looksLikeLabel) labelLine = current.lines.pop();
        }
        if (current.lines.length || current.section !== null) groups.push(current);
        current = { type: 'block', section: null, lines: [] };
        groups.push({
          type: 'tab',
          section: null,
          lines: labelLine ? [labelLine, ...collected] : collected,
        });
        i = j;
        continue;
      }
      // Fewer than 2 real tab lines → fall through as regular text
    }

    // ── Section header ───────────────────────────────────────────────────────
    const section = detectSection(line);
    if (section !== null) {
      if (current.lines.length || current.section !== null) groups.push(current);
      current = { type: 'block', section, lines: [] };
      i++;
      continue;
    }

    // ── Regular line ─────────────────────────────────────────────────────────
    current.lines.push(line);
    i++;
  }

  groups.push(current);
  return groups;
}

// ── Chord line renderer ────────────────────────────────────────────────────────
function CifraLine({ line, fontSize, showChords, showLyrics, twoColumns, onChordClick, chordTheme }) {
  const theme = chordTheme ?? CHORD_THEMES.primary;
  if (!line.trim()) {
    return <div className={twoColumns ? 'h-2' : 'h-3'} />;
  }

  // Line without chords — pure lyric
  if (!line.includes('[')) {
    if (!showLyrics) return null;
    return (
      <div className="leading-6 mb-1" style={{ fontSize, breakInside: 'avoid' }}>
        <span className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">{line}</span>
      </div>
    );
  }

  // Parse chord+lyric segments
  const segments = [];
  const firstChordIdx = line.indexOf('[');
  if (firstChordIdx > 0) {
    segments.push({ chord: '', text: line.slice(0, firstChordIdx) });
  }
  const regex = /\[([^\]]+)\]([^\[]*)/g;
  let m;
  while ((m = regex.exec(line)) !== null) {
    segments.push({ chord: m[1], text: m[2] });
  }
  if (!segments.length) return <div style={{ fontSize }}>{line}</div>;

  // Mode: chords only
  if (showChords && !showLyrics) {
    return (
      <div className="leading-snug mb-2 flex flex-wrap gap-x-3" style={{ breakInside: 'avoid' }}>
        {segments.filter(s => s.chord).map((s, i) => (
          <button
            key={i}
            onClick={() => onChordClick?.(s.chord)}
            className={`font-mono font-bold ${theme.text} rounded px-0.5 ${theme.active} active:opacity-60 transition-opacity cursor-pointer`}
            style={{ fontSize }}
          >
            {s.chord}
          </button>
        ))}
      </div>
    );
  }

  // Mode: lyrics only
  if (!showChords && showLyrics) {
    const plainText = segments.map(s => s.text).join('');
    if (!plainText.trim()) return null;
    return (
      <div className="leading-relaxed mb-1" style={{ fontSize, breakInside: 'avoid' }}>
        <span className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">{plainText}</span>
      </div>
    );
  }

  // Mode: both — chord above syllable
  return (
    <div className="leading-none mb-1" style={{ breakInside: 'avoid' }}>
      {/* Chord row */}
      <div className="flex flex-wrap">
        {segments.map((s, i) => (
          <span
            key={i}
            className="inline-block whitespace-pre font-mono"
            style={{
              minWidth: s.chord
                ? `${Math.max(s.chord.length + 1, s.text.length || 0)}ch`
                : 'auto',
            }}
          >
            {s.chord ? (
              <button
                onClick={() => onChordClick?.(s.chord)}
                className={`block ${theme.text} font-bold leading-tight rounded px-0.5 -mx-0.5 ${theme.active} active:opacity-70 transition-opacity cursor-pointer`}
                style={{ fontSize: `calc(${fontSize} * 0.85)` }}
              >
                {s.chord}
              </button>
            ) : (
              <span className="block leading-tight" style={{ fontSize: `calc(${fontSize} * 0.85)` }}>{' '}</span>
            )}
          </span>
        ))}
      </div>
      {/* Lyric row */}
      <div className="flex flex-wrap">
        {segments.map((s, i) => (
          <span
            key={i}
            className="inline-block whitespace-pre font-mono text-gray-800 dark:text-gray-200 leading-snug"
            style={{
              minWidth: s.chord
                ? `${Math.max(s.chord.length + 1, s.text.length || 0)}ch`
                : 'auto',
              fontSize,
            }}
          >
            {s.text || ' '}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Tab block renderer ─────────────────────────────────────────────────────────
function TabBlock({ lines, hidden, twoColumns }) {
  if (hidden) return null;

  // First non-tab line (if any) is the label; the rest are tab notation rows
  let labelText = 'Tab';
  const contentLines = [...lines];
  if (contentLines.length > 0 && !isTabLine(contentLines[0]) && contentLines[0].trim()) {
    labelText = contentLines.shift().trim().replace(/:$/, '').trim();
  }

  const { pill, bar } = STYLES.tab;

  return (
    <div className="mb-4" style={{ breakInside: twoColumns ? 'avoid-column' : undefined }}>
      {/* Coloured pill label */}
      <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-md
                        uppercase tracking-widest mb-2 ${pill}`}>
        {labelText}
      </span>

      {/* Left-border content area */}
      <div className={`pl-3 border-l-2 ${bar}`}>
        <div className="overflow-x-auto">
          {contentLines.map((line, idx) => {
            if (!line.trim()) return null;
            return (
              <div
                key={idx}
                className="whitespace-pre select-all font-mono text-[12px] leading-5
                           text-gray-700 dark:text-gray-300"
              >
                {line}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Page-break separator ───────────────────────────────────────────────────────
function PageBreakMarker() {
  return (
    <div className="my-5 flex items-center gap-2 select-none">
      <div className="flex-1 border-t-2 border-dashed border-gray-200 dark:border-gray-700" />
      <span className="text-[10px] font-semibold uppercase tracking-widest
                       text-gray-300 dark:text-gray-600 px-1">
        Quebra de página
      </span>
      <div className="flex-1 border-t-2 border-dashed border-gray-200 dark:border-gray-700" />
    </div>
  );
}

// ── Flat section label (blockView=false) ──────────────────────────────────────
function FlatSectionLabel({ name }) {
  return (
    <div className="mt-4 mb-1 text-xs font-semibold uppercase tracking-widest
                    text-gray-400 dark:text-gray-500">
      {name}
    </div>
  );
}

// ── Main renderer ──────────────────────────────────────────────────────────────
export default function CifraRenderer({
  content,
  semitones = 0,
  fontSize = '16px',
  showChords = true,
  showLyrics = true,
  showTabs = true,
  twoColumns = false,
  columnWrap = true,   // false when parent already applies column-count CSS
  blockView = true,
  onChordClick,
  chordColor = 'primary',
}) {
  const chordTheme = CHORD_THEMES[chordColor] ?? CHORD_THEMES.primary;
  const transposed = transposeContent(content, semitones);
  const lines  = transposed.split('\n');
  const groups = parseGroups(lines);

  return (
    <div
      className="px-1"
      style={twoColumns && columnWrap ? { columnCount: 2, columnGap: '2rem' } : {}}
    >
      {groups.map((group, gi) => {
        // Page break separator
        if (group.type === 'pagebreak') return <PageBreakMarker key={gi} />;

        // Tab block
        if (group.type === 'tab') return <TabBlock key={gi} lines={group.lines} hidden={!showTabs} twoColumns={twoColumns} />;

        const lineNodes = group.lines.map((line, li) => (
          <CifraLine
            key={li}
            line={line}
            fontSize={fontSize}
            showChords={showChords}
            showLyrics={showLyrics}
            twoColumns={twoColumns}
            onChordClick={onChordClick}
            chordTheme={chordTheme}
          />
        ));

        if (group.section) {
          if (blockView) {
            return (
              <SectionBlock key={gi} name={group.section} twoColumns={twoColumns}>
                {lineNodes}
              </SectionBlock>
            );
          }
          return (
            <div key={gi}>
              <FlatSectionLabel name={group.section} />
              {lineNodes}
            </div>
          );
        }

        return <div key={gi}>{lineNodes}</div>;
      })}
    </div>
  );
}
