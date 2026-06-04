import { useState, useEffect, useRef, useCallback } from 'react';

export function useAutoScroll(containerRef) {
  const [isScrolling, setIsScrolling] = useState(false);
  const [speed, setSpeed] = useState(3); // 1-10
  const rafRef = useRef(null);
  const lastTimeRef = useRef(null);

  const stop = useCallback(() => {
    setIsScrolling(false);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    lastTimeRef.current = null;
  }, []);

  const start = useCallback(() => {
    setIsScrolling(true);
  }, []);

  const toggle = useCallback(() => {
    setIsScrolling(prev => !prev);
  }, []);

  useEffect(() => {
    if (!isScrolling || !containerRef.current) return;

    const scroll = (timestamp) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const elapsed = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      const pixelsPerMs = speed * 0.03;
      const delta = elapsed * pixelsPerMs;

      const el = containerRef.current;
      if (!el) return;

      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 1) {
        stop();
        return;
      }

      el.scrollTop += delta;
      rafRef.current = requestAnimationFrame(scroll);
    };

    rafRef.current = requestAnimationFrame(scroll);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      lastTimeRef.current = null;
    };
  }, [isScrolling, speed, containerRef, stop]);

  return { isScrolling, speed, setSpeed, start, stop, toggle };
}
