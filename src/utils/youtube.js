/**
 * Extrai o ID de um link do YouTube em qualquer formato:
 *  youtube.com/watch?v=ID
 *  youtu.be/ID
 *  youtube.com/embed/ID
 *  youtube.com/shorts/ID
 */
export function extractYouTubeId(url) {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

/** Retorna a URL da thumbnail (mqdefault = 320×180, 16:9 sem barras pretas) ou null. */
export function getYouTubeThumbnail(url) {
  const id = extractYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
}
