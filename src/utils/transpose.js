const SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
// Notes that prefer flats
const PREFER_FLAT = new Set(['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb']);

function noteIndex(note) {
  let i = SHARP.indexOf(note);
  if (i !== -1) return { index: i, wasFlat: false };
  i = FLAT.indexOf(note);
  if (i !== -1) return { index: i, wasFlat: true };
  return null;
}

function transposeSingleChord(chord, semitones) {
  // Match root note (with optional # or b) + everything after
  const match = chord.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return chord;

  const [, root, quality] = match;
  const result = noteIndex(root);
  if (!result) return chord;

  const newIndex = (result.index + semitones + 12) % 12;
  const useFlat = result.wasFlat || PREFER_FLAT.has(SHARP[newIndex] + (quality.startsWith('m') && !quality.startsWith('maj') ? 'm' : ''));
  const newNote = useFlat ? FLAT[newIndex] : SHARP[newIndex];

  // Handle bass note (e.g. G/B)
  const slashIdx = quality.indexOf('/');
  if (slashIdx !== -1) {
    const bassRoot = quality.slice(slashIdx + 1);
    const bassResult = noteIndex(bassRoot);
    if (bassResult) {
      const newBassIdx = (bassResult.index + semitones + 12) % 12;
      const newBass = useFlat ? FLAT[newBassIdx] : SHARP[newBassIdx];
      return newNote + quality.slice(0, slashIdx + 1) + newBass;
    }
  }

  return newNote + quality;
}

export function transposeContent(content, semitones) {
  if (semitones === 0) return content;
  return content.replace(/\[([^\]]+)\]/g, (_, chord) => {
    return `[${transposeSingleChord(chord, semitones)}]`;
  });
}

export function transposeKey(key, semitones) {
  if (semitones === 0) return key;
  const result = noteIndex(key);
  if (!result) return key;
  const newIndex = (result.index + semitones + 12) % 12;
  return SHARP[newIndex];
}

export const ALL_KEYS = SHARP;

// Mix sharp/flat for user-friendly display (12 chromatic pitches)
export const KEY_OPTIONS = ['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B'];

// Semitone distance from one key to another (always 0–11)
export function semitonesBetween(fromKey, toKey) {
  const from = noteIndex(fromKey);
  const to   = noteIndex(toKey);
  if (!from || !to) return 0;
  return (to.index - from.index + 12) % 12;
}
