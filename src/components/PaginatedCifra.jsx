import React, {
  useState, useEffect, useLayoutEffect,
  useRef, useMemo, useCallback
} from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import CifraRenderer from './CifraRenderer';

const NAV_H  = 44;   // altura da barra de navegação
const PAD_H  = 32;   // py-4 top + bottom
const GAP_H  = 16;   // espaço entre estrofes (h-4)

function splitStanzas(content) {
  return content.split(/\n[ \t]*\n/).map(s => s.trim()).filter(Boolean);
}

const isPageBreak = (s) => s.trim() === '---';

// Dots or "N / T" depending on total pages
function PageIndicator({ current, total, onSelect }) {
  if (total <= 9) {
    return (
      <div className="flex items-center gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={`rounded-full transition-all duration-200
                        ${i === current
                          ? 'w-4 h-2 bg-primary-400'
                          : 'w-2 h-2 bg-gray-300 dark:bg-gray-600 active:bg-gray-400'
                        }`}
          />
        ))}
      </div>
    );
  }
  return (
    <span className="text-xs font-medium text-gray-400 dark:text-gray-500 tabular-nums">
      {current + 1} <span className="text-gray-300 dark:text-gray-600">/</span> {total}
    </span>
  );
}

export default function PaginatedCifra({
  content,
  semitones,
  fontSize,
  showChords,
  showLyrics,
  twoColumns,
  blockView,
  currentPage,
  onPageChange,
  onTotalPages,
  onChordClick,
  chordColor = 'primary',
  showTabs = true,
  // Sync: index of the stanza currently being played (-1 = none)
  activeSyncUnit = -1,
}) {
  const containerRef  = useRef(null);
  const stanzaRefs    = useRef([]);
  const [pages, setPages] = useState([]);

  const stanzas = useMemo(() => splitStanzas(content), [content]);

  // Trim stale refs when stanza count shrinks
  useEffect(() => {
    stanzaRefs.current = stanzaRefs.current.slice(0, stanzas.length);
  }, [stanzas.length]);

  // ── Measurement ────────────────────────────────────────────────────────────
  const computePages = useCallback(() => {
    if (!containerRef.current) return;

    const baseH = containerRef.current.clientHeight - NAV_H - PAD_H;
    // In two-column mode content flows side by side, fitting ~2× the single-col height.
    // Apply a 0.9 safety factor to avoid under-filled last column.
    const availableH = twoColumns ? baseH * 2 * 0.9 : baseH;

    const newPages = [];
    let page  = [];
    let usedH = 0;

    stanzas.forEach((stanza, i) => {
      // Quebra de página forçada pelo marcador ---
      if (isPageBreak(stanza)) {
        if (page.length > 0) { newPages.push([...page]); page = []; usedH = 0; }
        return;
      }

      const el = stanzaRefs.current[i];
      if (!el) return;

      const h = el.offsetHeight + GAP_H;

      if (usedH + h > availableH && page.length > 0) {
        newPages.push([...page]);
        page  = [i];
        usedH = h;
      } else {
        page.push(i);
        usedH += h;
      }
    });

    if (page.length > 0) newPages.push(page);
    setPages(newPages);
    onTotalPages?.(newPages.length);
  }, [stanzas, twoColumns, onTotalPages]);

  // Run after every render that might change heights
  useLayoutEffect(() => {
    computePages();
  }, [computePages, fontSize, showChords, showLyrics, semitones, twoColumns, blockView]);

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(computePages);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [computePages]);

  // Reset to page 0 when content / display settings change
  useEffect(() => {
    onPageChange(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, fontSize, showChords, showLyrics, semitones, twoColumns, blockView]);

  // ── Auto-flip: advance to the page that contains the active sync stanza ──
  useEffect(() => {
    if (activeSyncUnit < 0 || !pages.length) return;
    const targetPage = pages.findIndex(pageStanzas => pageStanzas.includes(activeSyncUnit));
    if (targetPage >= 0 && targetPage !== safeCurrentPage) {
      onPageChange(targetPage);
    }
  // safeCurrentPage changes when onPageChange fires — avoid infinite loop
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSyncUnit, pages]);

  // ── Derived values ──────────────────────────────────────────────────────────
  const totalPages       = pages.length || 1;
  const safeCurrentPage  = Math.min(currentPage, totalPages - 1);
  const currentStanzaSet = useMemo(
    () => new Set(pages[safeCurrentPage] || []),
    [pages, safeCurrentPage]
  );
  const canPrev = safeCurrentPage > 0;
  const canNext = safeCurrentPage < totalPages - 1;

  const prevPage = useCallback(() => {
    if (canPrev) onPageChange(p => Math.max(0, p - 1));
  }, [canPrev, onPageChange]);

  const nextPage = useCallback(() => {
    if (canNext) onPageChange(p => Math.min(totalPages - 1, p + 1));
  }, [canNext, onPageChange, totalPages]);

  // ── Keyboard / pedal support ─────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown'  || e.key === 'PageDown' || e.key === ' ')  { e.preventDefault(); nextPage(); }
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp'    || e.key === 'PageUp')                     { e.preventDefault(); prevPage(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [nextPage, prevPage]);

  // ── Swipe support (touch) ────────────────────────────────────────────────
  const touchStartX = useRef(null);
  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd   = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx < -50)  nextPage();
    if (dx >  50)  prevPage();
    touchStartX.current = null;
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full relative bg-white dark:bg-gray-900"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Hidden measurement layer (always single-column for accurate heights) ── */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-0 right-0 px-4 py-4"
        style={{ visibility: 'hidden', pointerEvents: 'none' }}
      >
        {stanzas.map((stanza, i) => (
          isPageBreak(stanza) ? (
            <div key={i} ref={el => { stanzaRefs.current[i] = el; }} style={{ height: 0 }} />
          ) : (
            <div key={i} ref={el => { stanzaRefs.current[i] = el; }}>
              <CifraRenderer
                content={stanza}
                semitones={semitones}
                fontSize={fontSize}
                showChords={showChords}
                showLyrics={showLyrics}
                showTabs={showTabs}
                twoColumns={false}
                blockView={blockView}
                chordColor={chordColor}
              />
              <div style={{ height: GAP_H }} />
            </div>
          )
        ))}
      </div>

      {/* ── Visible content — only current page ─────────────────────────── */}
      <div className="flex-1 overflow-hidden px-4 py-4">
        {twoColumns ? (
          /* Two-column: single wrapper so CSS flows across stanzas */
          <div style={{ columnCount: 2, columnGap: '2rem' }}>
            {stanzas.map((stanza, i) =>
              currentStanzaSet.has(i) ? (
                <div
                  key={i}
                  className={`rounded-xl transition-colors duration-500 -mx-1 px-1
                              ${i === activeSyncUnit && activeSyncUnit >= 0
                                ? 'bg-primary-50 dark:bg-primary-950/40'
                                : ''
                              }`}
                  style={{ breakInside: 'avoid-column' }}
                >
                  <CifraRenderer
                    content={stanza}
                    semitones={semitones}
                    fontSize={fontSize}
                    showChords={showChords}
                    showLyrics={showLyrics}
                    showTabs={showTabs}
                    twoColumns={true}
                    columnWrap={false}
                    blockView={blockView}
                    onChordClick={onChordClick}
                    chordColor={chordColor}
                  />
                  <div className="h-4" />
                </div>
              ) : null
            )}
          </div>
        ) : (
          /* Single column: show/hide stanzas individually */
          stanzas.map((stanza, i) => (
            <div
              key={i}
              className={`rounded-xl transition-colors duration-500 -mx-1 px-1
                          ${i === activeSyncUnit && activeSyncUnit >= 0
                            ? 'bg-primary-50 dark:bg-primary-950/40 ring-1 ring-inset ring-primary-200 dark:ring-primary-800/60'
                            : ''
                          }`}
              style={{ display: currentStanzaSet.has(i) ? 'block' : 'none' }}
            >
              <CifraRenderer
                content={stanza}
                semitones={semitones}
                fontSize={fontSize}
                showChords={showChords}
                showLyrics={showLyrics}
                showTabs={showTabs}
                twoColumns={false}
                blockView={blockView}
                onChordClick={onChordClick}
                chordColor={chordColor}
              />
              <div className="h-4" />
            </div>
          ))
        )}
      </div>

      {/* ── Page navigation bar ─────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center justify-between px-4
                      bg-white dark:bg-gray-900
                      border-t border-gray-100 dark:border-gray-800"
           style={{ height: NAV_H }}>

        {/* ← Anterior */}
        <button
          onClick={prevPage}
          disabled={!canPrev}
          className={`w-9 h-9 flex items-center justify-center rounded-full
                      transition-colors
                      ${canPrev
                        ? 'text-gray-500 dark:text-gray-400 active:bg-gray-100 dark:active:bg-gray-800'
                        : 'text-gray-200 dark:text-gray-700 cursor-default'
                      }`}
        >
          <ChevronLeft size={20} />
        </button>

        {/* Indicador central */}
        <PageIndicator
          current={safeCurrentPage}
          total={totalPages}
          onSelect={onPageChange}
        />

        {/* Próxima → */}
        <button
          onClick={nextPage}
          disabled={!canNext}
          className={`w-9 h-9 flex items-center justify-center rounded-full
                      transition-colors
                      ${canNext
                        ? 'text-gray-500 dark:text-gray-400 active:bg-gray-100 dark:active:bg-gray-800'
                        : 'text-gray-200 dark:text-gray-700 cursor-default'
                      }`}
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
