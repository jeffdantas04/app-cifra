/**
 * Importa uma cifra do CifraClub e converte para o formato inline do App Cifra.
 *
 * CifraClub: acordes em <b>X</b> OU texto puro acima da letra,
 *            seções como [Refrão] OU "Refrão:" OU "REFRÃO"
 * App Cifra: [X]letra inline, "Verso:" como marcador de bloco
 */

// ── CORS proxies ──────────────────────────────────────────────────────────────
const PROXIES = [
  (u) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
  (u) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`,
];

// ── Validação de URL ──────────────────────────────────────────────────────────
export function isCifraClubUrl(url) {
  try {
    return new URL(url.trim()).hostname.includes('cifraclub.com');
  } catch {
    return false;
  }
}

// ── Fetch com fallback CORS ───────────────────────────────────────────────────
async function fetchHtml(url) {
  try {
    const res = await fetch(url.trim(), { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const text = await res.text();
      if (text.includes('<html') || text.includes('<HTML')) return text;
    }
  } catch {}

  for (const makeProxy of PROXIES) {
    try {
      const proxyUrl = makeProxy(url.trim());
      const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(14000) });
      if (!res.ok) continue;
      if (proxyUrl.includes('allorigins')) {
        const data = await res.json();
        if (data?.contents) return data.contents;
      } else {
        const text = await res.text();
        if (text) return text;
      }
    } catch {}
  }

  throw new Error(
    'Não foi possível carregar a página. Verifique sua conexão e tente novamente.'
  );
}

// ── Detecção de acordes ───────────────────────────────────────────────────────

// Regex para UM token de acorde válido: Am7, C#m, D/F#, Bb, Asus4, Gmaj7 …
const CHORD_TOKEN_RE =
  /^[A-G][#b]?(?:m(?:aj\d*)?|M(?:aj\d*)?|maj\d+|min\d*|dim\d?|aug\d?|sus[24]?|add\d*)?[0-9]*(?:\/[A-G][#b]?)?$/;

function isChordToken(token) {
  return CHORD_TOKEN_RE.test(token);
}

/**
 * Linha de acordes com tags [Acorde] (gerada após substituir <b>X</b> → [X]).
 * IMPORTANTE: valida que o conteúdo dentro dos colchetes é um acorde real,
 * não um nome de seção como [Refrão] ou [Verse].
 */
function isTaggedChordLine(line) {
  const stripped = line.replace(/\[[^\]]+\]/g, '').trim();
  if (!line.trim() || stripped !== '') return false;
  // Verifica que TODOS os tokens entre colchetes são acordes válidos
  const tags = [...line.matchAll(/\[([^\]]+)\]/g)].map(m => m[1]);
  return tags.length > 0 && tags.every(isChordToken);
}

/**
 * Linha de texto puro onde TODOS os tokens são acordes válidos.
 * Ex: "D              A           Bm"
 */
function isRawChordLine(line) {
  const tokens = line.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0 || tokens.length > 12) return false;
  return tokens.every(isChordToken);
}

// ── Detecção de seções ────────────────────────────────────────────────────────

/**
 * Keywords reconhecidos pelo CifraRenderer (deve ficar em sincronia com ele).
 * Inclui variações em pt-BR e en usadas pelo CifraClub.
 */
const SECTION_KEYWORDS =
  'intro|outro|solo|coda|tag|interlude|instrumental|bridge|chorus|verse|pre-?chorus' +
  '|refrão|refrao|verso|ponte|pre-refrão|pre-refrao|pré-refrão|pré-refrao' +
  '|estrofe|part(?:e(?:\\s+final)?)?|vamp|final' +
  '|(?:primeira|segunda|terceira|quarta)\\s+parte';

const SECTION_KEYWORD_RE = new RegExp(
  `^(${SECTION_KEYWORDS})(\\s*\\d+)?\\s*:?\\s*$`,
  'i'
);

/**
 * Verifica se a linha é um cabeçalho de seção em qualquer formato:
 *  - "[Refrão]", "[Chorus]" (colchetes, mas NÃO um acorde)
 *  - "Refrão:", "VERSO", "Verso 1:", "Intro"  (texto livre)
 */
function isSectionLine(line) {
  const t = line.trim();
  if (!t) return false;

  // Formato [Nome] — colchetes que NÃO são acorde
  const bracketMatch = t.match(/^\[([^\]]+)\]$/);
  if (bracketMatch) return !isChordToken(bracketMatch[1]);

  // Keyword conhecido (com ou sem número / dois-pontos)
  return SECTION_KEYWORD_RE.test(t);
}

/**
 * Extrai o nome limpo da seção de qualquer formato,
 * removendo colchetes e dois-pontos extras.
 */
function extractSectionName(line) {
  const t = line.trim();
  // "[Nome]" → "Nome"
  const bracketMatch = t.match(/^\[([^\]]+)\]$/);
  if (bracketMatch) return bracketMatch[1].trim();
  // "Verso:" / "VERSO" / "Verso 1:" → mantém sem colon final redundante
  return t.replace(/:+$/, '').trim();
}

// ── Posicionamento e mesclagem ────────────────────────────────────────────────

/** Posições de acordes no formato [Acorde] (rastreia coluna visual). */
function parseTaggedPositions(line) {
  const positions = [];
  let i = 0, col = 0;
  while (i < line.length) {
    if (line[i] === '[') {
      const end = line.indexOf(']', i);
      if (end === -1) { col++; i++; continue; }
      positions.push({ col, chord: line.slice(i + 1, end) });
      i = end + 1;
    } else { col++; i++; }
  }
  return positions;
}

/** Posições de acordes em texto puro (índice = posição direta na string). */
function parseRawPositions(line) {
  const positions = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === ' ') { i++; continue; }
    let end = i;
    while (end < line.length && line[end] !== ' ') end++;
    const token = line.slice(i, end);
    if (isChordToken(token)) positions.push({ col: i, chord: token });
    i = end;
  }
  return positions;
}

/** Constrói linha inline [Acorde]letra a partir das posições. */
function buildInline(positions, lyricLine) {
  if (!positions.length) return lyricLine.trimEnd();
  let result = '', lastCol = 0;
  for (const { col, chord } of positions) {
    result += lyricLine.slice(lastCol, col);
    result += `[${chord}]`;
    lastCol = col;
  }
  return (result + lyricLine.slice(lastCol)).trimEnd();
}

// ── Parser principal ──────────────────────────────────────────────────────────

function parseCifraLines(rawLines) {
  const out = [];
  let i = 0;

  while (i < rawLines.length) {
    const line = rawLines[i].trimEnd();

    // 1. Linha vazia → separador de estrofe
    if (!line.trim()) {
      out.push('');
      i++;
      continue;
    }

    // 2. ── SEÇÃO (prioridade máxima) ─────────────────────────────────────────
    //    Deve vir ANTES da detecção de acordes para evitar que
    //    [Refrão] / [Chorus] sejam tratados como linhas de acorde.
    if (isSectionLine(line)) {
      const name = extractSectionName(line);
      out.push(`${name}:`);
      i++;
      continue;
    }

    // 3. Linha de acordes com tags [Acorde] (formato pós-substituição de <b>)
    if (isTaggedChordLine(line)) {
      const next = rawLines[i + 1]?.trimEnd() ?? '';
      // Mescla com a próxima linha SE ela for letra (não acorde, não seção, não vazia)
      if (next.trim() && !isTaggedChordLine(next) && !isRawChordLine(next) && !isSectionLine(next)) {
        out.push(buildInline(parseTaggedPositions(line), next));
        i += 2;
      } else {
        // Acordes sem letra (intro, riff, solo…)
        out.push(line.trim());
        i++;
      }
      continue;
    }

    // 4. Linha de acordes em texto puro ("D              A           Bm")
    if (isRawChordLine(line)) {
      const next = rawLines[i + 1]?.trimEnd() ?? '';
      if (next.trim() && !isTaggedChordLine(next) && !isRawChordLine(next) && !isSectionLine(next)) {
        out.push(buildInline(parseRawPositions(line), next));
        i += 2;
      } else {
        // Acordes sem letra — converte cada token para [Acorde]
        const converted = line.trim().split(/\s+/).map(t => `[${t}]`).join(' ');
        out.push(converted);
        i++;
      }
      continue;
    }

    // 5. Linha de letra comum
    out.push(line);
    i++;
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

// ── Extração de metadados ─────────────────────────────────────────────────────
function extractMeta(doc) {
  // 1. JSON-LD
  try {
    for (const s of doc.querySelectorAll('script[type="application/ld+json"]')) {
      const data = JSON.parse(s.textContent);
      const entries = Array.isArray(data) ? data : [data];
      for (const entry of entries) {
        if (entry['@type'] === 'MusicComposition' || entry['@type'] === 'MusicRecording') {
          return { title: entry.name || '', artist: entry.byArtist?.name || entry.author?.name || '' };
        }
      }
    }
  } catch {}

  // 2. Open Graph
  const ogTitle = doc.querySelector('meta[property="og:title"]')?.content || '';
  const match = ogTitle.match(/^(.+?)\s*[-–]\s*(.+?)\s*\|/);
  if (match) return { title: match[1].trim(), artist: match[2].trim() };

  // 3. HTML direto
  return {
    title:
      doc.querySelector('h1.t1')?.textContent?.trim() ||
      doc.querySelector('h1[itemprop="name"]')?.textContent?.trim() ||
      doc.querySelector('h1')?.textContent?.trim() || '',
    artist:
      doc.querySelector('h2.t3 a')?.textContent?.trim() ||
      doc.querySelector('h2.t3')?.textContent?.trim() ||
      doc.querySelector('[itemprop="byArtist"]')?.textContent?.trim() || '',
  };
}

// ── API pública ───────────────────────────────────────────────────────────────
export async function importFromCifraClub(url) {
  if (!isCifraClubUrl(url)) {
    throw new Error('URL inválida. Use um link do cifraclub.com.br');
  }

  const html = await fetchHtml(url);
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const { title, artist } = extractMeta(doc);

  const preEl =
    doc.querySelector('.cifra_cnt pre') ||
    doc.querySelector('pre.cifra_cnt') ||
    doc.querySelector('[class*="cifra"] pre') ||
    doc.querySelector('pre');

  if (!preEl) {
    throw new Error('Cifra não encontrada. Verifique se o link aponta para uma cifra válida.');
  }

  // Substitui tags de acorde por [Acorde]
  let innerHTML = preEl.innerHTML;
  innerHTML = innerHTML
    .replace(/<b[^>]*>([^<]+)<\/b>/g, '[$1]')
    .replace(/<span[^>]*class="[^"]*acorde[^"]*"[^>]*>([^<]+)<\/span>/gi, '[$1]');

  const tmp = document.createElement('div');
  tmp.innerHTML = innerHTML;
  const rawText = tmp.textContent || '';

  const content = parseCifraLines(rawText.split('\n'));

  if (!content) {
    throw new Error('Cifra vazia ou não reconhecida. Tente outro link.');
  }

  return { title, artist, content };
}
