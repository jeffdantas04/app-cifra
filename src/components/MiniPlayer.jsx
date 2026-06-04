import React from 'react';
import { Play, Pause, X, Youtube } from 'lucide-react';

function formatTime(secs) {
  if (!secs || isNaN(secs) || secs < 0) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Mini YouTube audio player strip.
 *
 * Renders the invisible YouTube iframe mount point (<div id={containerId} />)
 * positioned off the visible canvas but present in the DOM so the browser
 * keeps the audio alive. Also renders the visible controls bar.
 *
 * Props:
 *  containerId  – DOM id where the YouTube IFrame API will inject its iframe
 *  isReady      – player has loaded and is ready to play
 *  isPlaying    – currently playing
 *  currentTime  – seconds elapsed
 *  duration     – total seconds
 *  onTogglePlay – callback to play/pause
 *  onSeek       – callback(seconds) to seek
 *  onClose      – callback to close the player
 *  songTitle    – displayed in the strip
 */
export default function MiniPlayer({
  containerId,
  isReady,
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onSeek,
  onClose,
  songTitle,
}) {
  const progress = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;

  function handleBarClick(e) {
    if (!duration || !isReady) return;
    const rect  = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(ratio * duration);
  }

  return (
    <div className="flex-shrink-0 bg-white dark:bg-gray-900
                    border-t border-gray-100 dark:border-gray-800
                    shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">

      {/*
        ── YouTube IFrame mount point ─────────────────────────────────────────
        Positioned off-screen but NOT display:none / visibility:hidden so the
        browser keeps the audio stream active. The iframe inside has height=1
        width=1 set via the YT.Player API call.
      */}
      <div
        id={containerId}
        aria-hidden="true"
        style={{
          position:      'fixed',
          top:           '-2px',
          left:          '-2px',
          width:         '1px',
          height:        '1px',
          overflow:      'hidden',
          opacity:       0.01,
          pointerEvents: 'none',
        }}
      />

      {/* ── Seek bar ──────────────────────────────────────────────────────── */}
      <div
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-1 bg-gray-100 dark:bg-gray-700/60 cursor-pointer relative group"
        onClick={handleBarClick}
      >
        <div
          className="h-full bg-primary-500 relative"
          style={{ width: `${progress}%`, transition: 'width 0.25s linear' }}
        >
          {/* Scrubber thumb — visible on hover */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2
                          w-3 h-3 rounded-full bg-primary-500
                          opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* ── Controls row ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-2.5">
        {/* YouTube red logo */}
        <Youtube size={16} className="flex-shrink-0 text-red-500" />

        {/* Song info */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-800 dark:text-gray-200
                        truncate leading-tight">
            {songTitle}
          </p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 tabular-nums mt-0.5">
            {isReady
              ? `${formatTime(currentTime)} / ${formatTime(duration)}`
              : 'Carregando…'}
          </p>
        </div>

        {/* Play / Pause */}
        <button
          onClick={onTogglePlay}
          disabled={!isReady}
          aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
          className={`w-9 h-9 rounded-full flex items-center justify-center
                      flex-shrink-0 transition-colors
                      ${isReady
                        ? 'bg-primary-500 text-white active:bg-primary-600'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-300 cursor-not-allowed'
                      }`}
        >
          {isPlaying
            ? <Pause size={16} />
            : <Play  size={16} className="ml-0.5" />
          }
        </button>

        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Fechar player"
          className="w-8 h-8 flex items-center justify-center rounded-xl
                     text-gray-400 active:bg-gray-100 dark:active:bg-gray-800
                     transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
