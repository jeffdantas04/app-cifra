import React, { useState, useMemo } from 'react';
import { X, Check, ChevronUp, ChevronDown } from 'lucide-react';
import ChordDiagram from './ChordDiagram';

const STRINGS   = 6;
const FRET_ROWS = 4;
const STRING_LABELS = ['E', 'A', 'D', 'G', 'B', 'e'];

// ── Interactive fretboard ──────────────────────────────────────────────────────
function EditorFretboard({ frets, fingers, baseFret, barre, onStringToggle, onFretClick, onFingerChange }) {
  return (
    <div className="select-none" style={{ WebkitUserSelect: 'none' }}>

      {/* String labels */}
      <div className="flex px-5 mb-1">
        {STRING_LABELS.map((label, s) => (
          <div key={s} className="flex-1 text-center text-[11px] font-bold
                                  text-gray-400 dark:text-gray-500">
            {label}
          </div>
        ))}
      </div>

      {/* Above-nut: mute / open toggles */}
      <div className="flex px-5 mb-1">
        {frets.map((f, s) => (
          <button
            key={s}
            onClick={() => onStringToggle(s)}
            className="flex-1 h-10 flex items-center justify-center
                       text-base font-bold rounded-xl
                       active:bg-gray-100 dark:active:bg-gray-800
                       transition-colors"
          >
            {f === -1 && <span className="text-red-400 dark:text-red-500">✕</span>}
            {f === 0  && <span className="text-emerald-500 dark:text-emerald-400">○</span>}
            {/* fret > 0: nothing shown above — dot visible in grid */}
          </button>
        ))}
      </div>

      {/* Nut / fret-position indicator */}
      {baseFret === 1 ? (
        <div className="mx-5 h-3 rounded-sm bg-gray-800 dark:bg-gray-100" />
      ) : (
        <div className="mx-5 flex items-center gap-2">
          <span className="flex-shrink-0 text-[10px] font-bold text-gray-500 dark:text-gray-400">
            {baseFret}ª
          </span>
          <div className="flex-1 border-t-2 border-gray-400 dark:border-gray-500" />
        </div>
      )}

      {/* Fret grid */}
      <div className="mx-5 border-l border-r border-b
                      border-gray-300 dark:border-gray-600
                      rounded-b-2xl overflow-hidden">
        {Array.from({ length: FRET_ROWS }).map((_, row) => {
          const absFret = baseFret + row;
          const isBarreRow = barre?.fret === absFret;

          return (
            <div
              key={row}
              className="relative flex
                         border-b border-gray-200 dark:border-gray-700
                         last:border-b-0"
              style={{ height: '3.5rem' }}
            >
              {/* Barre rounded bar */}
              {isBarreRow && (
                <div
                  aria-hidden="true"
                  className="absolute top-1/2 -translate-y-1/2 z-20
                             h-7 rounded-full pointer-events-none
                             bg-gray-800 dark:bg-gray-200"
                  style={{
                    left:  `${(barre.from  / (STRINGS - 1)) * 100}%`,
                    right: `${((STRINGS - 1 - barre.to) / (STRINGS - 1)) * 100}%`,
                  }}
                />
              )}

              {Array.from({ length: STRINGS }).map((_, s) => {
                const hasDot       = frets[s] === absFret;
                const coveredBarre = isBarreRow && barre.from <= s && s <= barre.to;
                const finger       = fingers?.[s] ?? 0;

                return (
                  <button
                    key={s}
                    onClick={() => onFretClick(s, absFret)}
                    className={`flex-1 flex items-center justify-center relative z-10
                                ${s < STRINGS - 1
                                  ? 'border-r border-gray-200 dark:border-gray-700'
                                  : ''}
                                active:bg-primary-50 dark:active:bg-primary-900/20
                                transition-colors`}
                  >
                    {hasDot && !coveredBarre && (
                      <div className="w-8 h-8 rounded-full z-10
                                      bg-gray-800 dark:bg-gray-200
                                      flex items-center justify-center">
                        {finger > 0 && (
                          <span className="text-white dark:text-gray-900 text-[11px] font-bold leading-none">
                            {finger}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Finger selectors — only shown when there are pressed strings */}
      {frets.some(f => f > 0) && (
        <div className="mx-5 mt-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest
                        text-gray-400 dark:text-gray-500 mb-2">
            Dedo (opcional)
          </p>
          <div className="flex gap-1">
            {frets.map((f, s) => {
              if (f <= 0) return <div key={s} className="flex-1" />;
              return (
                <div key={s} className="flex-1 flex flex-col items-center gap-0.5">
                  <span className="text-[9px] font-semibold text-gray-400 dark:text-gray-500">
                    {STRING_LABELS[s]}
                  </span>
                  {[0, 1, 2, 3, 4].map(n => (
                    <button
                      key={n}
                      onClick={() => onFingerChange(s, n)}
                      className={`w-full py-0.5 rounded text-[10px] font-bold leading-none
                                  transition-colors
                                  ${fingers[s] === n
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                                  }`}
                    >
                      {n === 0 ? '—' : n}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Barre configuration panel ─────────────────────────────────────────────────
function BarrePanel({ baseFret, barreFret, barreFrom, barreTo, setBarreFret, setBarreFrom, setBarreTo }) {
  return (
    <div className="px-5 pb-4 space-y-3 border-t border-gray-100 dark:border-gray-800 mt-0">

      {/* Fret row */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest
                      text-gray-400 dark:text-gray-500 mb-1.5 mt-3">
          Casa
        </p>
        <div className="flex gap-1.5">
          {Array.from({ length: FRET_ROWS }).map((_, row) => {
            const f = baseFret + row;
            return (
              <button
                key={f}
                onClick={() => setBarreFret(f)}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-colors
                            ${barreFret === f
                              ? 'bg-primary-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                            }`}
              >
                {f}ª
              </button>
            );
          })}
        </div>
      </div>

      {/* From string */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest
                      text-gray-400 dark:text-gray-500 mb-1.5">
          De (corda)
        </p>
        <div className="flex gap-1.5">
          {STRING_LABELS.map((label, s) => (
            <button
              key={s}
              onClick={() => setBarreFrom(s)}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-colors
                          ${barreFrom === s
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                          }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* To string */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest
                      text-gray-400 dark:text-gray-500 mb-1.5">
          Até (corda)
        </p>
        <div className="flex gap-1.5">
          {STRING_LABELS.map((label, s) => (
            <button
              key={s}
              onClick={() => setBarreTo(s)}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-colors
                          ${barreTo === s
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                          }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main editor ───────────────────────────────────────────────────────────────
export default function ChordDiagramEditor({ onSave, onClose, initialName = '' }) {
  const [name,      setName]      = useState(initialName);
  const [baseFret,  setBaseFret]  = useState(1);
  const [frets,     setFrets]     = useState([-1, -1, -1, -1, -1, -1]);
  const [fingers,   setFingers]   = useState([0, 0, 0, 0, 0, 0]);
  const [showBarre, setShowBarre] = useState(false);
  const [barreFret, setBarreFret] = useState(1);
  const [barreFrom, setBarreFrom] = useState(0);
  const [barreTo,   setBarreTo]   = useState(5);

  const activeBarre = showBarre
    ? { fret: barreFret, from: barreFrom, to: barreTo }
    : null;

  const voicing = useMemo(() => ({
    frets, fingers, baseFret, barre: activeBarre,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [frets, fingers, baseFret, showBarre, barreFret, barreFrom, barreTo]);

  // Toggle above-nut state: mute ↔ open (or fret → mute)
  const toggleString = (s) => {
    setFrets(prev => {
      const next = [...prev];
      if (next[s] === -1) next[s] = 0;  // mute → open
      else                next[s] = -1; // open / fret → mute
      return next;
    });
    setFingers(prev => { const n = [...prev]; n[s] = 0; return n; });
  };

  // Click on a fret cell: place dot (or remove if same fret)
  const handleFretClick = (s, absFret) => {
    setFrets(prev => {
      const next = [...prev];
      if (next[s] === absFret) next[s] = -1; // same → mute (remove)
      else                     next[s] = absFret;
      return next;
    });
  };

  const handleFingerChange = (s, finger) => {
    setFingers(prev => { const n = [...prev]; n[s] = finger; return n; });
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim(), voicing);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-gray-900">

      {/* ── Sticky header ── */}
      <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2.5
                      bg-white dark:bg-gray-900
                      border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={onClose}
          className="p-2 rounded-xl text-gray-400 dark:text-gray-500
                     active:bg-gray-100 dark:active:bg-gray-800 transition-colors"
        >
          <X size={20} />
        </button>

        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nome do acorde (ex: Am7, G#m…)"
          className="flex-1 min-w-0 px-3 py-2 rounded-xl text-sm font-semibold
                     bg-gray-100 dark:bg-gray-800
                     text-gray-900 dark:text-gray-100
                     placeholder-gray-400 dark:placeholder-gray-500
                     focus:outline-none focus:ring-2
                     focus:ring-primary-400 dark:focus:ring-primary-600"
        />

        <button
          onClick={handleSave}
          disabled={!name.trim()}
          className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl
                     bg-primary-500 text-white text-sm font-semibold
                     disabled:opacity-40 active:bg-primary-600 transition-colors"
        >
          <Check size={16} />
          Salvar
        </button>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto pb-8">

        {/* Live preview */}
        <div className="flex items-center justify-center pt-5 pb-3 gap-6">
          <div className="text-gray-900 dark:text-white w-28 flex-shrink-0">
            <ChordDiagram voicing={voicing} name={name || '—'} fill />
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
            <p className="font-semibold text-gray-600 dark:text-gray-300 mb-1">
              Preview ao vivo
            </p>
            <p>✕ = corda muda</p>
            <p>○ = corda aberta</p>
            <p>● = posição do dedo</p>
          </div>
        </div>

        {/* BaseFret navigation */}
        <div className="flex items-center justify-center gap-3 pb-4">
          <button
            onClick={() => setBaseFret(b => Math.max(1, b - 1))}
            disabled={baseFret === 1}
            className="p-2 rounded-xl transition-colors
                       text-gray-500 dark:text-gray-400
                       disabled:text-gray-200 dark:disabled:text-gray-700
                       active:bg-gray-100 dark:active:bg-gray-800"
          >
            <ChevronUp size={18} />
          </button>
          <span className="text-sm font-semibold text-gray-600 dark:text-gray-300
                           w-36 text-center">
            {baseFret === 1 ? 'Casa 1 · pestana/nut' : `A partir da ${baseFret}ª casa`}
          </span>
          <button
            onClick={() => setBaseFret(b => Math.min(16, b + 1))}
            className="p-2 rounded-xl transition-colors
                       text-gray-500 dark:text-gray-400
                       active:bg-gray-100 dark:active:bg-gray-800"
          >
            <ChevronDown size={18} />
          </button>
        </div>

        {/* Interactive fretboard */}
        <EditorFretboard
          frets={frets}
          fingers={fingers}
          baseFret={baseFret}
          barre={activeBarre}
          onStringToggle={toggleString}
          onFretClick={handleFretClick}
          onFingerChange={handleFingerChange}
        />

        {/* Barre section */}
        <div className="mx-5 mt-6 rounded-2xl border border-gray-200 dark:border-gray-700
                        overflow-hidden">
          <button
            onClick={() => {
              if (!showBarre) setBarreFret(baseFret); // sync fret on open
              setShowBarre(v => !v);
            }}
            className="w-full flex items-center justify-between px-4 py-3.5
                       active:bg-gray-50 dark:active:bg-gray-800/60 transition-colors"
          >
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Barra / pestana parcial
            </span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold transition-colors
                              ${showBarre
                                ? 'bg-primary-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                              }`}>
              {showBarre ? 'Ativada' : 'Desativada'}
            </span>
          </button>

          {showBarre && (
            <BarrePanel
              baseFret={baseFret}
              barreFret={barreFret}
              barreFrom={barreFrom}
              barreTo={barreTo}
              setBarreFret={setBarreFret}
              setBarreFrom={setBarreFrom}
              setBarreTo={setBarreTo}
            />
          )}
        </div>

        {/* Help */}
        <div className="mx-5 mt-4 p-3 rounded-2xl
                        bg-gray-50 dark:bg-gray-800/50">
          <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed text-center">
            Toque acima das cordas para alternar aberta&nbsp;(○) e muda&nbsp;(✕)<br />
            Toque nas casas para posicionar ou remover dedos
          </p>
        </div>
      </div>
    </div>
  );
}
