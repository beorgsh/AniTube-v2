/**
 * Advanced Search Relevance & Keyword Filtering Engine
 * 
 * Ensures that anime search results strictly match the connected query keywords
 * and filters out irrelevant or generic keyword-stuffed results.
 */

// Common generic noise/stop words that can dilute search queries
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'in', 'on', 'of', 'and', 'to', 'for', 'with', 'at', 'by',
  'from', 'episode', 'episodes', 'ep', 'season', 'seasons', 'discussion',
  'announcement', 'part', 'movie', 'movies', 'tv', 'special', 'specials',
  'recap', 'ova', 'ona', 'is', 'it', 'arc', 'official', 'news', 'spoilers',
  'spoiler', 'chapter', 'sub', 'dub', 'no', 'ga', 'wa', 'ni', 'de', 'wo', 'ka'
]);

/**
 * Normalizes text for clean token comparisons:
 * Lowercases, converts non-alphanumeric chars to spaces, collapses multiple spaces.
 */
export function normalizeSearchString(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9\s]/g, ' ')     // replace symbols/punctuation with space
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Strips episode/discussion/spoiler noise from raw titles (e.g. from AniNews or AniList threads)
 * to yield the clean, core anime franchise name suitable for searching.
 */
export function cleanAnimeTitleForSearch(rawTitle: string): string {
  if (!rawTitle) return '';
  let cleaned = rawTitle
    .replace(/^\[.*?\]/g, '') // remove leading tags e.g. [Spoilers], [Official], [News]
    .replace(/\(.*?\)/g, '')  // remove (TV), (Movie), (Dub)
    .replace(/【.*?】/g, '')
    .replace(/«.*?»/g, '')
    .replace(/Episode\s+\d+/gi, '')
    .replace(/Ep\.?\s*\d+/gi, '')
    .replace(/Chapter\s+\d+/gi, '')
    .replace(/\bDiscussion\b.*/gi, '')
    .replace(/\bAnnouncement\b.*/gi, '')
    .replace(/\bOfficial\b.*/gi, '')
    .replace(/\bReview\b.*/gi, '')
    .replace(/\bTrailer\b.*/gi, '')
    .replace(/\bPV\s*\d*\b.*/gi, '')
    .replace(/\bTeaser\b.*/gi, '')
    .replace(/\bMegathread\b.*/gi, '')
    .replace(/\bPoll\b.*/gi, '')
    .replace(/\bRecap\b.*/gi, '')
    .replace(/[-–—:|]+$/g, '') // remove trailing separators
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned || rawTitle.trim();
}

/**
 * Extracts significant tokens from a search query, removing non-essential stop words.
 */
export function extractSignificantTokens(query: string): string[] {
  const normalized = normalizeSearchString(query);
  if (!normalized) return [];

  const rawTokens = normalized.split(' ').filter(t => t.length > 0);
  const significant = rawTokens.filter(t => !STOP_WORDS.has(t) && t.length >= 2);

  // If filtering removed all words (e.g. user literally searched "Season" or "TV"), fall back to raw tokens
  if (significant.length === 0) {
    return rawTokens.filter(t => t.length > 0);
  }

  return significant;
}

export interface MatchScoreResult {
  isConnected: boolean;
  score: number;
  matchedTokensCount: number;
  totalTokensCount: number;
}

/**
 * Scores and validates whether a candidate anime is genuinely connected to the search query.
 */
export function evaluateAnimeRelevance(
  query: string,
  candidateTitle: string,
  candidateSlug?: string,
  candidateAltTitles?: string[]
): MatchScoreResult {
  const qNorm = normalizeSearchString(query);
  const cNorm = normalizeSearchString(candidateTitle);
  const slugNorm = normalizeSearchString((candidateSlug || '').replace(/[-_]/g, ' '));
  
  const altNorms = (candidateAltTitles || []).map(normalizeSearchString).filter(Boolean);
  const allCandidateTexts = [cNorm, slugNorm, ...altNorms].filter(Boolean);

  if (!qNorm || allCandidateTexts.length === 0) {
    return { isConnected: false, score: 0, matchedTokensCount: 0, totalTokensCount: 0 };
  }

  // 1. Exact Match Check
  if (cNorm === qNorm || slugNorm === qNorm || altNorms.includes(qNorm)) {
    return {
      isConnected: true,
      score: 1000,
      matchedTokensCount: 1,
      totalTokensCount: 1,
    };
  }

  // 2. Exact Substring / Phrase Match
  const containsExactPhrase = allCandidateTexts.some(text => text.includes(qNorm));

  const qTokens = extractSignificantTokens(query);
  if (qTokens.length === 0) {
    return {
      isConnected: containsExactPhrase,
      score: containsExactPhrase ? 500 : 0,
      matchedTokensCount: containsExactPhrase ? 1 : 0,
      totalTokensCount: 1,
    };
  }

  // 3. Token Overlap Matching
  let matchedTokensCount = 0;
  const matchedTokens: string[] = [];

  for (const token of qTokens) {
    const isTokenInCandidate = allCandidateTexts.some(text => {
      // Word boundary or substring token check
      const regex = new RegExp(`(^|\\s)${token}($|\\s)`, 'i');
      return regex.test(text) || text.includes(token);
    });

    if (isTokenInCandidate) {
      matchedTokensCount++;
      matchedTokens.push(token);
    }
  }

  const tokenRatio = matchedTokensCount / qTokens.length;

  // Strict Connection Criteria:
  // - 1 Token Query: MUST match 1/1 (100%)
  // - 2 Token Query: MUST match 2/2 (100%) OR contain exact phrase
  // - 3 Token Query: MUST match >= 2 tokens (66%+)
  // - 4+ Token Query: MUST match >= 50% of tokens (at least 2 tokens)
  let isConnected = false;

  if (containsExactPhrase) {
    isConnected = true;
  } else if (qTokens.length === 1) {
    isConnected = matchedTokensCount >= 1;
  } else if (qTokens.length === 2) {
    isConnected = matchedTokensCount >= 2;
  } else if (qTokens.length === 3) {
    isConnected = matchedTokensCount >= 2;
  } else {
    isConnected = matchedTokensCount >= Math.ceil(qTokens.length * 0.5) && matchedTokensCount >= 2;
  }

  // Also verify that the first primary token is present for multi-word queries
  if (isConnected && qTokens.length >= 2 && !containsExactPhrase) {
    const primaryToken = qTokens[0];
    const isPrimaryPresent = matchedTokens.includes(primaryToken);
    // If primary token is absent, require higher ratio
    if (!isPrimaryPresent && tokenRatio < 0.75) {
      isConnected = false;
    }
  }

  // 4. Compute Final Scoring
  let score = 0;
  if (isConnected) {
    score += containsExactPhrase ? 500 : 200;
    score += tokenRatio * 300;
    score += matchedTokensCount * 50;

    // Bonus if candidate title starts with the query
    if (cNorm.startsWith(qNorm) || (qTokens.length > 0 && cNorm.startsWith(qTokens[0]))) {
      score += 80;
    }

    // Length closeness penalty (prefer compact, exact titles over overly long diluted strings)
    const lengthDiff = Math.abs(cNorm.length - qNorm.length);
    score -= Math.min(lengthDiff * 0.5, 60);
  }

  return {
    isConnected,
    score: Math.max(0, score),
    matchedTokensCount,
    totalTokensCount: qTokens.length,
  };
}

/**
 * Filters a generic array of items and ranks them strictly by query relevance.
 */
export function filterAndRankSearchResults<T>(
  query: string,
  items: T[],
  getTitle: (item: T) => string,
  getSlug?: (item: T) => string | undefined,
  getAltTitles?: (item: T) => string[] | undefined
): T[] {
  if (!query || !query.trim() || !Array.isArray(items) || items.length === 0) {
    return items;
  }

  const scoredList: { item: T; score: number }[] = [];

  for (const item of items) {
    const title = getTitle(item) || '';
    const slug = getSlug ? getSlug(item) : undefined;
    const altTitles = getAltTitles ? getAltTitles(item) : undefined;

    const evaluation = evaluateAnimeRelevance(query, title, slug, altTitles);
    if (evaluation.isConnected) {
      scoredList.push({ item, score: evaluation.score });
    }
  }

  // Sort by score descending (highest relevance first)
  scoredList.sort((a, b) => b.score - a.score);

  return scoredList.map(entry => entry.item);
}
