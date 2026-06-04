import React from 'react';

// SVG constants
const STRINGS   = 6;
const FRET_ROWS = 4;       // visible fret rows
const W         = 120;     // total SVG width
const H         = 140;     // total SVG height

const TOP_PAD   = 28;      // space above nut for open/mute markers
const BOT_PAD   = 12;      // space below last fret
const LEFT_PAD  = 16;      // space left of low-E string
const RIGHT_PAD = 10;      // space right of high-E string

const GRID_W    = W - LEFT_PAD - RIGHT_PAD;
const GRID_H    = H - TOP_PAD - BOT_PAD;

const COL_GAP   = GRID_W / (STRINGS - 1);   // space between strings
const ROW_GAP   = GRID_H / FRET_ROWS;       // space between frets

const NUT_H     = 5;   // thick nut thickness

// Helpers
const stringX = (s) => LEFT_PAD + s * COL_GAP;  // s=0 → low E
const fretY   = (f) => TOP_PAD + f * ROW_GAP;   // f=0 → top of nut area

// f=1..4 → center y of that fret slot
const fretCenterY = (f) => fretY(f - 1) + ROW_GAP / 2;

const DOT_R     = ROW_GAP * 0.32;
const BARRE_R   = DOT_R;

export default function ChordDiagram({ voicing, name, fill = false }) {
  if (!voicing) return null;

  const { frets, fingers, baseFret = 1, barre = null } = voicing;

  // relative fret: frets array uses absolute positions
  // displayed rows are baseFret .. baseFret + FRET_ROWS
  const relFret = (abs) => abs - baseFret + 1;  // 1..FRET_ROWS

  return (
    <svg
      width={fill ? '100%' : W}
      height={fill ? undefined : H}
      style={fill ? { height: 'auto', display: 'block' } : undefined}
      viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ── Fret-position label (only when not starting at fret 1) ─────── */}
      {baseFret > 1 && (
        <text
          x={LEFT_PAD - 4}
          y={fretY(1) - ROW_GAP / 2 + 4}
          textAnchor="end"
          fontSize="9"
          fontWeight="600"
          fill="currentColor"
          className="fill-gray-500 dark:fill-gray-400"
        >
          {baseFret}ª
        </text>
      )}

      {/* ── Fret grid lines (horizontal) ───────────────────────────────── */}
      {Array.from({ length: FRET_ROWS + 1 }).map((_, row) => (
        <line
          key={`fret-${row}`}
          x1={LEFT_PAD}
          y1={fretY(row)}
          x2={LEFT_PAD + GRID_W}
          y2={fretY(row)}
          stroke="currentColor"
          strokeWidth={row === 0 && baseFret === 1 ? NUT_H : 1}
          strokeLinecap="round"
          className={
            row === 0 && baseFret === 1
              ? 'text-gray-800 dark:text-gray-200'
              : 'text-gray-300 dark:text-gray-600'
          }
        />
      ))}

      {/* ── String lines (vertical) ─────────────────────────────────────── */}
      {Array.from({ length: STRINGS }).map((_, s) => (
        <line
          key={`str-${s}`}
          x1={stringX(s)}
          y1={fretY(0)}
          x2={stringX(s)}
          y2={fretY(FRET_ROWS)}
          stroke="currentColor"
          strokeWidth={1}
          className="text-gray-300 dark:text-gray-600"
        />
      ))}

      {/* ── Barre chord ─────────────────────────────────────────────────── */}
      {barre && (() => {
        const rf = relFret(barre.fret);
        if (rf < 1 || rf > FRET_ROWS) return null;
        const cy = fretCenterY(rf);
        const x1 = stringX(barre.from);
        const x2 = stringX(barre.to);
        return (
          <rect
            key="barre"
            x={x1}
            y={cy - BARRE_R}
            width={x2 - x1}
            height={BARRE_R * 2}
            rx={BARRE_R}
            ry={BARRE_R}
            fill="currentColor"
            className="text-gray-800 dark:text-gray-200"
          />
        );
      })()}

      {/* ── Individual finger dots ───────────────────────────────────────── */}
      {frets.map((absF, s) => {
        if (absF <= 0) return null;           // muted or open → handled above
        const rf = relFret(absF);
        if (rf < 1 || rf > FRET_ROWS) return null;

        // skip strings that are covered by a barre (only the barre rect shows)
        const coveredByBarre =
          barre &&
          barre.fret === absF &&
          s >= barre.from &&
          s <= barre.to;

        const finger = fingers?.[s] ?? 0;
        const cx = stringX(s);
        const cy = fretCenterY(rf);

        return (
          <g key={`dot-${s}`}>
            <circle
              cx={cx}
              cy={cy}
              r={DOT_R}
              fill="currentColor"
              className={coveredByBarre ? 'text-gray-800/60 dark:text-gray-200/60' : 'text-gray-800 dark:text-gray-200'}
            />
            {finger > 0 && (
              <text
                x={cx}
                y={cy + 3.5}
                textAnchor="middle"
                fontSize="8"
                fontWeight="700"
                fill="currentColor"
                className="text-white dark:text-gray-900"
              >
                {finger}
              </text>
            )}
          </g>
        );
      })}

      {/* ── Open / Muted markers above nut ──────────────────────────────── */}
      {frets.map((absF, s) => {
        const cx  = stringX(s);
        const cy  = fretY(0) - 9;
        if (absF === -1) {
          // Muted — X
          const d = 4;
          return (
            <g key={`top-${s}`}>
              <line x1={cx - d} y1={cy - d} x2={cx + d} y2={cy + d}
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                className="text-gray-500 dark:text-gray-400" />
              <line x1={cx + d} y1={cy - d} x2={cx - d} y2={cy + d}
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                className="text-gray-500 dark:text-gray-400" />
            </g>
          );
        }
        if (absF === 0) {
          // Open — O
          return (
            <circle
              key={`top-${s}`}
              cx={cx} cy={cy} r={4.5}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-gray-500 dark:text-gray-400"
            />
          );
        }
        return null;
      })}

      {/* ── Chord name label ────────────────────────────────────────────── */}
      {name && (
        <text
          x={W / 2}
          y={H - 1}
          textAnchor="middle"
          fontSize="10"
          fontWeight="600"
          className="fill-gray-600 dark:fill-gray-300"
          fill="currentColor"
        >
          {name}
        </text>
      )}
    </svg>
  );
}
