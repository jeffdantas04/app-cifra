import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

const STORAGE_KEY = 'customChordData';

/**
 * Manages user-created chord voicings stored in localStorage.
 *
 * Data shape: { [chordName]: voicing[] }
 * where voicing = { frets, fingers, baseFret, barre }
 */
export function useCustomChords() {
  const [data, setData] = useLocalStorage(STORAGE_KEY, {});

  /** Append a new voicing to a chord (creates the chord entry if it doesn't exist). */
  const addVoicing = useCallback((chordName, voicing) => {
    setData(prev => ({
      ...prev,
      [chordName]: [...(prev[chordName] ?? []), voicing],
    }));
  }, [setData]);

  /**
   * Remove the voicing at `voicingIdx` from a chord.
   * If no voicings remain, the chord key is removed entirely.
   */
  const removeVoicing = useCallback((chordName, voicingIdx) => {
    setData(prev => {
      const voicings = [...(prev[chordName] ?? [])];
      voicings.splice(voicingIdx, 1);
      if (voicings.length === 0) {
        const { [chordName]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [chordName]: voicings };
    });
  }, [setData]);

  return { customData: data, addVoicing, removeVoicing };
}
