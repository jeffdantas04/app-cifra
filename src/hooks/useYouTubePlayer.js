import { useEffect, useRef, useState, useCallback } from 'react';

// ── Singleton API loader — only loads the <script> once per page ─────────────
let _apiState = 'idle'; // 'idle' | 'loading' | 'ready'
const _pendingResolvers = [];

function loadYouTubeAPI() {
  if (_apiState === 'ready') return Promise.resolve();
  return new Promise((resolve) => {
    _pendingResolvers.push(resolve);
    if (_apiState === 'idle') {
      _apiState = 'loading';
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
      window.onYouTubeIframeAPIReady = () => {
        _apiState = 'ready';
        _pendingResolvers.splice(0).forEach(fn => fn());
      };
    }
  });
}

/**
 * Hook that wraps the YouTube IFrame Player API.
 *
 * Usage:
 *   const { containerId, isReady, isPlaying, currentTime, duration,
 *           play, pause, seek, togglePlay } = useYouTubePlayer(videoId);
 *
 * Render a <div id={containerId} /> somewhere in the DOM before the hook
 * effect fires (i.e. in the same render that enables this hook).
 * The YouTube iframe will be injected into that div.
 *
 * Pass null/undefined as videoId to skip player creation.
 */
export function useYouTubePlayer(videoId) {
  // Stable ID for the lifetime of this hook instance
  const containerIdRef = useRef('yt-' + Math.random().toString(36).slice(2, 9));
  const playerRef      = useRef(null);
  const timerRef       = useRef(null);

  const [isReady,     setIsReady]     = useState(false);
  const [isPlaying,   setIsPlaying]   = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration,    setDuration]    = useState(0);

  // ── Create / destroy player when videoId changes ─────────────────────────
  useEffect(() => {
    // Cleanup any previous player
    clearInterval(timerRef.current);
    try { playerRef.current?.destroy(); } catch {}
    playerRef.current = null;

    if (!videoId) {
      setIsReady(false);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      return;
    }

    let cancelled = false;

    loadYouTubeAPI().then(() => {
      if (cancelled) return;

      playerRef.current = new window.YT.Player(containerIdRef.current, {
        videoId,
        // Tiny dimensions — the containing div handles visual hiding
        height: '1',
        width:  '1',
        playerVars: {
          autoplay:       0,
          controls:       0,
          rel:            0,
          modestbranding: 1,
          fs:             0,
          iv_load_policy: 3,
          playsinline:    1,  // Required for iOS inline playback
          origin:         window.location.origin,
        },
        events: {
          onReady: (e) => {
            if (cancelled) return;
            setDuration(e.target.getDuration() || 0);
            setIsReady(true);
          },
          onStateChange: (e) => {
            if (cancelled) return;
            const S = window.YT?.PlayerState;
            if (!S) return;
            if (e.data === S.PLAYING) {
              setIsPlaying(true);
            } else if (e.data === S.PAUSED || e.data === S.ENDED) {
              setIsPlaying(false);
              if (e.data === S.ENDED) {
                setCurrentTime(0);
              }
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      clearInterval(timerRef.current);
      try { playerRef.current?.destroy(); } catch {}
      playerRef.current = null;
      setIsReady(false);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  // ── Poll currentTime while playing (every 250 ms) ─────────────────────────
  useEffect(() => {
    clearInterval(timerRef.current);
    if (!isPlaying) return;
    timerRef.current = setInterval(() => {
      try {
        const p = playerRef.current;
        if (!p?.getCurrentTime) return;
        const t = p.getCurrentTime();
        const d = p.getDuration();
        setCurrentTime(t);
        if (d > 0) setDuration(d);
      } catch { /* player may not be ready yet */ }
    }, 250);
    return () => clearInterval(timerRef.current);
  }, [isPlaying]);

  // ── Controls ─────────────────────────────────────────────────────────────
  const play  = useCallback(() => { try { playerRef.current?.playVideo();  } catch {} }, []);
  const pause = useCallback(() => { try { playerRef.current?.pauseVideo(); } catch {} }, []);
  const seek  = useCallback((t) => {
    try {
      playerRef.current?.seekTo(t, true);
      setCurrentTime(t);
    } catch {}
  }, []);
  const togglePlay = useCallback(() => {
    isPlaying ? pause() : play();
  }, [isPlaying, pause, play]);

  return {
    containerId: containerIdRef.current,
    isReady,
    isPlaying,
    currentTime,
    duration,
    play,
    pause,
    seek,
    togglePlay,
  };
}
