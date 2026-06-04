/**
 * Splits song content into sync stanzas using the same double-newline
 * strategy as PaginatedCifra. '---' page-break markers are preserved
 * so that stanza indices match between scroll mode and page mode.
 */
export function splitSyncStanzas(content) {
  return content
    .split(/\n[ \t]*\n/)
    .map(s => s.trim())
    .filter(Boolean);
}

/**
 * Returns the 0-based stanza index that should be highlighted for the given
 * playback position, or -1 if playback hasn't started.
 *
 * The song is divided evenly across all stanzas (including '---' markers so
 * indices stay aligned with PaginatedCifra's stanza array).
 */
export function getActiveSyncUnit(currentTime, duration, totalUnits) {
  if (!duration || !totalUnits || currentTime <= 0) return -1;
  const idx = Math.floor((currentTime / duration) * totalUnits);
  return Math.min(idx, totalUnits - 1);
}
