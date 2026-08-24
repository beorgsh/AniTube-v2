import { Video, Channel, Comment, SubtitleTrack, StreamSource, AnikotoCategoryItem, AnimeInfoData, AnimeEpisodeDetail } from '../types';

export interface AnikotoAnime {
  id: number;
  title: string;
  alternative?: string;
  titles?: string;
  native?: string;
  slug?: string;
  rating?: string;
  poster?: string;
  background_image?: string;
  is_sub?: number;
  is_dub?: number;
  description?: string;
  aired?: string;
  season?: string;
  year?: number;
  duration?: string;
  status?: string;
  score?: string;
  episodes?: string;
  mal_id?: string | number;
  ani_id?: string | number;
  updated_at?: string;
  terms_by_type?: {
    genre?: string[];
    producers?: string[];
    studios?: string[];
    type?: string[];
  };
}

export interface AnikotoResponse {
  ok: boolean;
  data: AnikotoAnime[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export interface AniapikotoStreamResponse {
  success: boolean;
  data?: {
    source?: string;
    malId?: number;
    episodeNumber?: number;
    title?: string;
    slug?: string;
    sub?: Array<{
      serverName: string;
      category: string;
      m3u8: string;
      type: string;
      subtitles?: Array<{
        lang: string;
        label: string;
        url: string;
        format?: string;
      }>;
    }>;
    ssub?: Array<{
      serverName: string;
      category: string;
      m3u8: string;
      type: string;
      subtitles?: Array<{
        lang: string;
        label: string;
        url: string;
        format?: string;
      }>;
    }>;
    dub?: Array<{
      serverName: string;
      category: string;
      m3u8: string;
      type: string;
      subtitles?: Array<{
        lang: string;
        label: string;
        url: string;
        format?: string;
      }>;
    }>;
  };
  error?: string;
}

export interface AnikotoSlugStreamResponse {
  success: boolean;
  data?: {
    m3u8: string;
    referer?: string;
    intro?: {
      start: number;
      end: number;
    };
    outro?: {
      start: number;
      end: number;
    };
    subtitles?: Array<{
      file: string;
      label: string;
      kind?: string;
      default?: boolean;
    }>;
  };
  server?: string;
  slug?: string;
  error?: string;
}

export interface AnimeStreamResult {
  streamUrl: string;
  rawM3u8Url: string;
  subtitles: SubtitleTrack[];
  servers: StreamSource[];
  defaultEnglishVtt?: SubtitleTrack;
  intro?: { start: number; end: number };
  outro?: { start: number; end: number };
  slug?: string;
  sourceType: 'mal' | 'slug';
}

// Studio avatars for YouTube-styled verified creator badges
const STUDIO_AVATARS: Record<string, string> = {
  'MAPPA': 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150&auto=format&fit=crop&q=80',
  'Toei Animation': 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=150&auto=format&fit=crop&q=80',
  'ufotable': 'https://images.unsplash.com/photo-1563089145-599997674d42?w=150&auto=format&fit=crop&q=80',
  'Bones': 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=150&auto=format&fit=crop&q=80',
  'Wit Studio': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=150&auto=format&fit=crop&q=80',
  'CloverWorks': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'A-1 Pictures': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=80',
  'Kyoto Animation': 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=150&auto=format&fit=crop&q=80',
  'bilibili': 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&auto=format&fit=crop&q=80',
  'Pierrot': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
};

const DEFAULT_REFERER = 'https://megaplay.buzz/';

/**
 * Builds a CORS-proxied URL for an .m3u8 playlist with the required Referer header.
 */
export function buildProxiedM3u8Url(rawUrl: string, referer: string = DEFAULT_REFERER): string {
  if (!rawUrl) return '';
  // If already proxied, return as is
  if (rawUrl.startsWith('/api/stream/manifest')) return rawUrl;
  return `/api/stream/manifest?url=${encodeURIComponent(rawUrl)}&referer=${encodeURIComponent(referer)}`;
}

/**
 * Builds a CORS-proxied URL for a WebVTT subtitle track with the required Referer header.
 */
export function buildProxiedVttUrl(rawUrl: string, referer: string = DEFAULT_REFERER): string {
  if (!rawUrl) return '';
  if (rawUrl.startsWith('/api/stream/vtt')) return rawUrl;
  return `/api/stream/vtt?url=${encodeURIComponent(rawUrl)}&referer=${encodeURIComponent(referer)}`;
}

// Helper to format relative time
function formatRelativeTime(updatedAt?: string, aired?: string): string {
  if (updatedAt) {
    const updatedDate = new Date(updatedAt.replace(' ', 'T') + 'Z');
    const now = new Date();
    const diffMs = now.getTime() - updatedDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
  }
  if (aired) {
    return aired.split(' to ')[0] || 'Recently Airing';
  }
  return 'Recently updated';
}

// Generate realistic comments for an anime
function generateCommentsForAnime(anime: AnikotoAnime): Comment[] {
  const title = anime.title || 'this anime';
  return [
    {
      id: `c-api-${anime.id}-1`,
      author: 'OtakuReviewer',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      timeAgo: '2 hours ago',
      content: `The sound design and pacing of ${title} is incredible! Super clean streaming quality.`,
      likes: Math.floor(Math.random() * 450) + 50,
      isHeartedByCreator: true,
      repliesCount: Math.floor(Math.random() * 12) + 1,
    },
    {
      id: `c-api-${anime.id}-2`,
      author: 'SakugaLover',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
      timeAgo: '5 hours ago',
      content: `Score: ${anime.score || '8.8'}/10. The key animation during the climax was peak fiction!`,
      likes: Math.floor(Math.random() * 220) + 20,
      repliesCount: 3,
    },
    {
      id: `c-api-${anime.id}-3`,
      author: 'AnimeStreamFan',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
      timeAgo: '1 day ago',
      content: anime.is_dub ? `Both English Sub & Dub are available with automatic English VTT subtitles enabled.` : `Subtitled episode ${anime.is_sub || 1} is super hype!`,
      likes: Math.floor(Math.random() * 180) + 10,
      repliesCount: 1,
    }
  ];
}

/**
 * Transforms an Anikoto anime item into a Video object.
 */
export function transformAnimeToVideo(anime: AnikotoAnime, index: number): Video {
  const studioName =
    anime.terms_by_type?.studios?.[0] ||
    anime.terms_by_type?.producers?.[0] ||
    'AniTube Official Channel';

  const avatarUrl =
    STUDIO_AVATARS[studioName] ||
    (anime.poster || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150&auto=format&fit=crop&q=80');

  const channel: Channel = {
    id: `ch-api-${studioName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    name: studioName,
    avatar: avatarUrl,
    subscribers: `${(Math.random() * 4 + 1.2).toFixed(2)}M`,
    isVerified: true,
    handle: `@${studioName.replace(/[^a-zA-Z0-9]/g, '')}`,
  };

  const landscapeThumbnail =
    anime.background_image && anime.background_image.trim().length > 0
      ? anime.background_image
      : anime.poster || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80';

  let durationStr = '24:00';
  if (anime.duration) {
    if (anime.duration.includes('min')) {
      const match = anime.duration.match(/\d+/);
      durationStr = match ? `${match[0]}:00` : '24:00';
    } else if (!isNaN(Number(anime.duration))) {
      durationStr = `${anime.duration}:00`;
    } else {
      durationStr = anime.duration;
    }
  }

  const rawScore = parseFloat(anime.score || '8.4');
  const baseMultiplier = isNaN(rawScore) ? 8.0 : rawScore;
  const viewsNumber = Math.round((baseMultiplier * 140000) + (index * 35000));
  const viewsStr = `${(viewsNumber / 1000).toFixed(0)}K views`;

  const genres = anime.terms_by_type?.genre || [];
  const primaryCategory = genres[0] || (anime.season ? `${anime.season.toUpperCase()} ${anime.year || ''}` : 'Anime');

  const tags = [
    ...(genres),
    ...(anime.terms_by_type?.studios || []),
    anime.season,
    anime.year ? String(anime.year) : '',
    anime.status,
    anime.is_dub ? 'Dubbed' : '',
    'Subbed',
  ].filter(Boolean);

  const malId = anime.mal_id || (anime.id === 1642 ? 21 : anime.id);

  const likesCount = Math.round(viewsNumber * 0.08);
  const likesStr = likesCount > 1000 ? `${(likesCount / 1000).toFixed(1)}K` : `${likesCount}`;

  const description = anime.description && anime.description.trim().length > 0
    ? anime.description
    : `Watch the latest episodes of ${anime.title} with high-definition multi-bitrate HLS streams on AniTube.\n\nStatus: ${anime.status || 'Airing'}\nEpisodes: ${anime.episodes || 'Ongoing'}\nAired: ${anime.aired || '2026'}\nScore: ${anime.score || 'N/A'}`;

  const rawEpisodes = anime.episodes ? parseInt(anime.episodes, 10) : (anime.is_sub || 1);
  const latestEp = !isNaN(rawEpisodes) && rawEpisodes > 0 ? rawEpisodes : 1;
  const rawTitle = anime.title || anime.titles || anime.alternative || 'Untitled Anime';
  const cleanTitle = rawTitle.replace(/:\s*EP\s*\d+/i, '').replace(/\s*-\s*Episode\s*\d+/i, '').replace(/\s*EP\s*\d+/i, '').trim();
  const formattedTitle = latestEp > 0 ? `${cleanTitle}: EP ${latestEp}` : cleanTitle;

  const portraitPoster = anime.poster && anime.poster.trim().length > 0
    ? anime.poster
    : landscapeThumbnail;

  return {
    id: `anime-${anime.id}`,
    malId: malId,
    aniId: anime.ani_id,
    slug: anime.slug,
    title: formattedTitle,
    description,
    thumbnail: landscapeThumbnail,
    poster: portraitPoster,
    banner: anime.background_image || landscapeThumbnail,
    duration: `EP ${latestEp}`,
    views: viewsStr,
    viewsCount: viewsNumber,
    uploadedAt: formatRelativeTime(anime.updated_at, anime.aired),
    channel,
    streamUrl: '', // Stream is dynamically fetched using MAL ID upon playback
    category: primaryCategory,
    tags,
    likes: likesStr,
    likesCount,
    commentsCount: `${(Math.floor(viewsNumber * 0.003) + 12).toLocaleString()}`,
    comments: generateCommentsForAnime(anime),
    isLive: anime.status === 'Currently Airing' && index === 0,
    episodeNumber: latestEp,
    totalEpisodes: anime.episodes || String(latestEp),
  };
}

/**
 * Fetches recent anime list with pagination support.
 */
export async function fetchRecentAnime(page: number = 1, perPage: number = 10): Promise<{
  videos: Video[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}> {
  const directUrl = `https://anikotoapi.site/recent-anime?page=${page}&per_page=${perPage}`;
  const proxyUrl = `/api/recent-anime?page=${page}&per_page=${perPage}`;

  let responseData: AnikotoResponse | null = null;
  let lastError: Error | null = null;

  try {
    const res = await fetch(directUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    if (res.ok) {
      responseData = await res.json();
    }
  } catch (err) {
    lastError = err as Error;
  }

  if (!responseData || !responseData.ok) {
    try {
      const res = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      if (res.ok) {
        responseData = await res.json();
      }
    } catch (err) {
      lastError = err as Error;
    }
  }

  if (!responseData || !responseData.ok || !Array.isArray(responseData.data)) {
    throw new Error(lastError?.message || 'Failed to fetch anime data from anikotoapi.site');
  }

  const videos = responseData.data.map((item, idx) =>
    transformAnimeToVideo(item, (page - 1) * perPage + idx)
  );

  return {
    videos,
    pagination: responseData.pagination || {
      page,
      per_page: perPage,
      total: videos.length,
      total_pages: 1,
    },
  };
}

/**
 * Fetches stream from the slug stream API:
 * https://anikoto-api.vercel.app/api/stream?id=:slug&server=hd-1&ep=:episode&type=sub
 * Defaults server to hd-1 and supports hd-2.
 */
export async function fetchAnimeStreamBySlug(
  slug: string,
  episode: number = 1,
  preferredServer: 'hd-1' | 'hd-2' | string = 'hd-1',
  type: string = 'sub'
): Promise<AnimeStreamResult> {
  const cleanSlug = slug.trim();
  const server = preferredServer === 'hd-2' ? 'hd-2' : 'hd-1';
  const localProxyUrl = `/api/anime/slug-stream?id=${encodeURIComponent(cleanSlug)}&server=${server}&ep=${episode}&type=${type}`;
  const directApiUrl = `https://anikoto-api.vercel.app/api/stream?id=${encodeURIComponent(cleanSlug)}&server=${server}&ep=${episode}&type=${type}`;

  let apiData: AnikotoSlugStreamResponse | null = null;
  let lastError: Error | null = null;

  // 1. Try local proxy
  try {
    const res = await fetch(localProxyUrl);
    if (res.ok) {
      apiData = await res.json();
    }
  } catch (err) {
    lastError = err as Error;
  }

  // 2. Direct fallback
  if (!apiData || !apiData.success || !apiData.data) {
    try {
      const res = await fetch(directApiUrl, {
        headers: { 'Accept': 'application/json' },
      });
      if (res.ok) {
        apiData = await res.json();
      }
    } catch (err) {
      lastError = err as Error;
    }
  }

  // 3. Fallback to alternate server hd-2 if hd-1 failed
  if ((!apiData || !apiData.success || !apiData.data) && server === 'hd-1') {
    try {
      const fallbackUrl = `/api/anime/slug-stream?id=${encodeURIComponent(cleanSlug)}&server=hd-2&ep=${episode}&type=${type}`;
      const res = await fetch(fallbackUrl);
      if (res.ok) {
        apiData = await res.json();
      }
    } catch (err) {
      console.warn('Fallback to hd-2 slug server failed:', err);
    }
  }

  if (!apiData || !apiData.success || !apiData.data || !apiData.data.m3u8) {
    throw new Error(
      lastError?.message || `No stream found for slug "${cleanSlug}" on server ${server} (Episode ${episode})`
    );
  }

  const data = apiData.data;
  const referer = data.referer || DEFAULT_REFERER;
  const proxiedM3u8 = buildProxiedM3u8Url(data.m3u8, referer);

  // Parse WebVTT Subtitles
  const parsedSubs: SubtitleTrack[] = [];
  if (Array.isArray(data.subtitles)) {
    data.subtitles.forEach((sub) => {
      const isEnglish =
        sub.default ||
        sub.label?.toLowerCase() === 'english' ||
        sub.label?.toLowerCase().includes('eng');
      const proxiedVtt = buildProxiedVttUrl(sub.file, referer);
      parsedSubs.push({
        lang: isEnglish ? 'en' : sub.label.toLowerCase().slice(0, 3),
        label: sub.label,
        url: proxiedVtt,
        format: 'vtt',
        isDefault: isEnglish,
      });
    });
  }

  const intro =
    data.intro && data.intro.end > data.intro.start
      ? { start: data.intro.start, end: data.intro.end }
      : undefined;
  const outro =
    data.outro && data.outro.end > data.outro.start
      ? { start: data.outro.start, end: data.outro.end }
      : undefined;

  // Build default servers for slug stream (HD-1 and HD-2)
  const activeServerName = server === 'hd-2' ? 'HD-2 (Sub)' : 'HD-1 (Sub)';
  const servers: StreamSource[] = [
    {
      serverName: 'HD-1 (Sub)',
      category: 'sub',
      m3u8: data.m3u8,
      type: 'hls',
      subtitles: parsedSubs,
      intro,
      outro,
    },
    {
      serverName: 'HD-2 (Sub)',
      category: 'sub',
      m3u8: data.m3u8,
      type: 'hls',
      subtitles: parsedSubs,
      intro,
      outro,
    },
  ];

  const defaultEnglishVtt =
    parsedSubs.find((s) => s.isDefault) ||
    parsedSubs.find((s) => s.label?.toLowerCase().includes('eng')) ||
    parsedSubs[0];

  return {
    streamUrl: proxiedM3u8,
    rawM3u8Url: data.m3u8,
    subtitles: parsedSubs,
    servers,
    defaultEnglishVtt,
    intro,
    outro,
    slug: cleanSlug,
    sourceType: 'slug',
  };
}

/**
 * Fetches live streaming sources using MAL ID with automatic fallback to Slug API.
 */
export async function fetchAnimeStreamByMalId(
  malId: string | number,
  episode: number = 1,
  fallbackSlug?: string
): Promise<AnimeStreamResult> {
  const localProxyUrl = `/api/anime/stream/${malId}/${episode}${fallbackSlug ? `?slug=${encodeURIComponent(fallbackSlug)}` : ''}`;
  const directApiUrl = `https://aniapikoto.vercel.app/api/anikoto/mal/${malId}/${episode}`;

  let apiData: any = null;
  let lastError: Error | null = null;

  // 1. Try internal server proxy route first
  try {
    const res = await fetch(localProxyUrl);
    if (res.ok) {
      apiData = await res.json();
    }
  } catch (err) {
    lastError = err as Error;
  }

  // If server already returned a slug stream fallback
  if (apiData && apiData.isSlugStream && apiData.data) {
    const slugToUse = apiData.slug || fallbackSlug || String(malId);
    return fetchAnimeStreamBySlug(slugToUse, episode, apiData.server || 'hd-1');
  }

  // 2. Direct fetch fallback if server route not reached
  if (!apiData || !apiData.success || !apiData.data) {
    try {
      const res = await fetch(directApiUrl, {
        headers: { 'Accept': 'application/json' },
      });
      if (res.ok) {
        apiData = await res.json();
      }
    } catch (err) {
      lastError = err as Error;
    }
  }

  // Check if MAL data has active servers
  const hasSub = apiData?.data && Array.isArray(apiData.data.sub) && apiData.data.sub.length > 0;
  const hasSsub = apiData?.data && Array.isArray(apiData.data.ssub) && apiData.data.ssub.length > 0;
  const hasDub = apiData?.data && Array.isArray(apiData.data.dub) && apiData.data.dub.length > 0;
  const hasAnyServer = hasSub || hasSsub || hasDub;
  const discoveredSlug = apiData?.data?.slug || fallbackSlug;

  // 3. Fallback to Slug API if no servers found on MAL ID
  if (!hasAnyServer && discoveredSlug) {
    console.info(`No stream servers found for MAL ID ${malId}. Falling back to slug "${discoveredSlug}" with default hd-1/hd-2 servers.`);
    return fetchAnimeStreamBySlug(discoveredSlug, episode, 'hd-1');
  }

  if (!apiData || !apiData.success || !apiData.data || !hasAnyServer) {
    // If fallback slug was passed, give it a final try
    if (fallbackSlug) {
      return fetchAnimeStreamBySlug(fallbackSlug, episode, 'hd-1');
    }
    throw new Error(lastError?.message || `No streaming sources found for MAL ID: ${malId}`);
  }

  const data = apiData.data;
  const servers: StreamSource[] = [];
  const allSubtitles: SubtitleTrack[] = [];

  // Parse Sub servers
  if (Array.isArray(data.sub)) {
    data.sub.forEach((s: any) => {
      const parsedSubs: SubtitleTrack[] = [];
      if (Array.isArray(s.subtitles)) {
        s.subtitles.forEach((sub: any) => {
          const isEn =
            sub.lang?.toLowerCase() === 'en' ||
            sub.label?.toLowerCase().includes('eng');
          const proxiedVtt = buildProxiedVttUrl(sub.url, DEFAULT_REFERER);
          const track: SubtitleTrack = {
            lang: sub.lang || 'en',
            label: sub.label || 'English',
            url: proxiedVtt,
            format: sub.format || 'vtt',
            isDefault: isEn,
          };
          parsedSubs.push(track);
          if (isEn && !allSubtitles.some((e) => e.label === track.label)) {
            allSubtitles.push(track);
          }
        });
      }

      servers.push({
        serverName: `${s.serverName} (Sub)`,
        category: 'sub',
        m3u8: s.m3u8,
        type: s.type || 'hls',
        subtitles: parsedSubs,
      });
    });
  }

  // Parse Soft-Sub / ssub servers
  if (Array.isArray(data.ssub)) {
    data.ssub.forEach((s: any) => {
      const parsedSubs: SubtitleTrack[] = [];
      if (Array.isArray(s.subtitles)) {
        s.subtitles.forEach((sub: any) => {
          const isEn =
            sub.lang?.toLowerCase() === 'en' ||
            sub.label?.toLowerCase().includes('eng');
          const proxiedVtt = buildProxiedVttUrl(sub.url, DEFAULT_REFERER);
          const track: SubtitleTrack = {
            lang: sub.lang || 'en',
            label: sub.label || 'English',
            url: proxiedVtt,
            format: sub.format || 'vtt',
            isDefault: isEn,
          };
          parsedSubs.push(track);
          if (isEn && !allSubtitles.some((e) => e.label === track.label)) {
            allSubtitles.push(track);
          }
        });
      }

      servers.push({
        serverName: `${s.serverName} (Soft Sub)`,
        category: 'ssub',
        m3u8: s.m3u8,
        type: s.type || 'hls',
        subtitles: parsedSubs,
      });
    });
  }

  // Parse Dub servers
  if (Array.isArray(data.dub)) {
    data.dub.forEach((s: any) => {
      servers.push({
        serverName: `${s.serverName} (Dub)`,
        category: 'dub',
        m3u8: s.m3u8,
        type: s.type || 'hls',
        subtitles: [],
      });
    });
  }

  if (servers.length === 0) {
    if (discoveredSlug) {
      return fetchAnimeStreamBySlug(discoveredSlug, episode, 'hd-1');
    }
    throw new Error(`No active streaming servers found for MAL ID ${malId}`);
  }

  // Primary stream is the first available server
  const primaryServer = servers[0];
  const proxiedM3u8 = buildProxiedM3u8Url(primaryServer.m3u8, DEFAULT_REFERER);

  // Find automatic English VTT subtitle track
  const defaultEnglishVtt =
    allSubtitles.find((s) => s.isDefault) ||
    primaryServer.subtitles.find((s) => s.isDefault) ||
    allSubtitles[0];

  return {
    streamUrl: proxiedM3u8,
    rawM3u8Url: primaryServer.m3u8,
    subtitles: allSubtitles.length > 0 ? allSubtitles : primaryServer.subtitles,
    servers,
    defaultEnglishVtt,
    slug: discoveredSlug,
    sourceType: 'mal',
  };
}

/**
 * Universal stream resolver: accepts MAL ID and/or Slug, automatically resolving
 * the best HLS stream with hd-1/hd-2 server fallback and English subtitle track.
 */
export async function fetchAnimeStream({
  malId,
  slug,
  episode = 1,
  preferredServer = 'hd-1',
}: {
  malId?: string | number;
  slug?: string;
  episode?: number;
  preferredServer?: string;
}): Promise<AnimeStreamResult> {
  // If MAL ID is available, try MAL ID with slug fallback
  if (malId && /^\d+$/.test(String(malId))) {
    try {
      return await fetchAnimeStreamByMalId(malId, episode, slug);
    } catch (malErr) {
      if (slug) {
        console.warn(`MAL stream fetch failed, falling back to slug ${slug}:`, malErr);
        return await fetchAnimeStreamBySlug(slug, episode, preferredServer);
      }
      throw malErr;
    }
  }

  // If no numeric MAL ID, use slug directly
  const targetSlug = slug || (malId ? String(malId) : '');
  if (!targetSlug) {
    throw new Error('Either MAL ID or Anime Slug is required to fetch a stream');
  }

  return await fetchAnimeStreamBySlug(targetSlug, episode, preferredServer);
}

/**
 * Transforms an Anikoto Category item (from /popular, /latest-episodes, /ongoing, /upcoming, /completed)
 * into a full Video object using the REAL poster as the avatar and thumbnail.
 */
export function transformAnikotoCategoryItemToVideo(
  item: AnikotoCategoryItem,
  categoryLabel: string = 'Trending'
): Video {
  const animeType = item.type || 'TV';
  const cleanTitle = item.title?.trim() || 'Untitled Anime';

  // Use the REAL anime poster image for both thumbnail and channel avatar
  const realPoster = item.image || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80';

  const channel: Channel = {
    id: `ch-slug-${item.id}`,
    name: `${cleanTitle} Studio`,
    avatar: realPoster, // REAL poster image used as avatar
    subscribers: `${(Math.random() * 3.5 + 1.1).toFixed(2)}M`,
    isVerified: true,
    handle: `@${cleanTitle.replace(/[^a-zA-Z0-9]/g, '').slice(0, 15)}`,
  };

  const parsedSub = item.sub ? parseInt(item.sub, 10) : 0;
  const parsedEpisodes = item.episodes ? parseInt(item.episodes, 10) : 0;
  const latestEp = parsedSub > 0 ? parsedSub : (parsedEpisodes > 0 ? parsedEpisodes : 1);
  const totalEpisodes = item.episodes || (item.sub ? `${item.sub} eps` : (latestEp > 1 ? String(latestEp) : 'Ongoing'));

  const rawTitle = item.title?.trim() || 'Untitled Anime';
  const baseTitle = rawTitle.replace(/:\s*EP\s*\d+/i, '').replace(/\s*-\s*Episode\s*\d+/i, '').replace(/\s*EP\s*\d+/i, '').trim();
  const formattedTitle = latestEp > 0 ? `${baseTitle}: EP ${latestEp}` : baseTitle;

  const durationText = `EP ${latestEp}`;

  const viewsCount = Math.floor(Math.random() * 550000) + 120000;
  const viewsStr = `${(viewsCount / 1000).toFixed(0)}K views`;

  const tags = [
    categoryLabel,
    animeType,
    item.sub ? `Sub: ${item.sub}` : `Sub: ${latestEp}`,
    item.dub ? `Dub: ${item.dub}` : '',
    item.episodes ? `${item.episodes} Episodes` : '',
  ].filter(Boolean);

  return {
    id: `slug-${item.id}`,
    slug: item.id,
    title: formattedTitle,
    description: `${cleanTitle} (${animeType})\n\nCategory: ${categoryLabel}\nEpisodes: ${totalEpisodes}\nSubbed: ${item.sub || 'Available'} | Dubbed: ${item.dub || 'None'}\n\nStream full episodes directly with automatic HLS video playback and synchronized English subtitles.`,
    thumbnail: realPoster,
    poster: realPoster,
    banner: realPoster,
    duration: durationText,
    views: viewsStr,
    viewsCount,
    uploadedAt: 'Updated recently',
    channel,
    streamUrl: '', // dynamically streamed via fetchAnimeStreamBySlug
    category: categoryLabel,
    tags,
    likes: `${(viewsCount * 0.08 / 1000).toFixed(1)}K`,
    likesCount: Math.round(viewsCount * 0.08),
    commentsCount: `${Math.floor(viewsCount * 0.004) + 24}`,
    comments: [
      {
        id: `c-slug-${item.id}-1`,
        author: 'AnimeLover99',
        avatar: realPoster,
        timeAgo: '1 hour ago',
        content: `Hyped to watch ${cleanTitle}! The stream quality on AniTube is crisp with low latency.`,
        likes: 312,
        isHeartedByCreator: true,
        repliesCount: 4,
      },
    ],
    episodeNumber: latestEp,
    totalEpisodes,
  };
}

/**
 * Fetches anime category collection:
 * 'popular' | 'latest-episodes' | 'ongoing' | 'upcoming' | 'completed'
 */
export async function fetchAnikotoCategory(
  category: 'popular' | 'latest-episodes' | 'ongoing' | 'upcoming' | 'completed'
): Promise<AnikotoCategoryItem[]> {
  const localProxy = `/api/anime/category/${category}`;
  const directApi = `https://anikoto-api.vercel.app/api/${category}`;

  let jsonResult: { success: boolean; data: AnikotoCategoryItem[] } | null = null;
  let lastErr: Error | null = null;

  // 1. Try local proxy
  try {
    const res = await fetch(localProxy);
    if (res.ok) {
      jsonResult = await res.json();
    }
  } catch (err) {
    lastErr = err as Error;
  }

  // 2. Direct fetch fallback
  if (!jsonResult || !jsonResult.success || !Array.isArray(jsonResult.data)) {
    try {
      const res = await fetch(directApi, {
        headers: { 'Accept': 'application/json' },
      });
      if (res.ok) {
        jsonResult = await res.json();
      }
    } catch (err) {
      lastErr = err as Error;
    }
  }

  if (!jsonResult || !jsonResult.success || !Array.isArray(jsonResult.data)) {
    throw new Error(lastErr?.message || `Failed to fetch anime category: ${category}`);
  }

  return jsonResult.data;
}

export async function fetchPopularAnime(): Promise<Video[]> {
  const items = await fetchAnikotoCategory('popular');
  return items.map((it) => transformAnikotoCategoryItemToVideo(it, 'Popular'));
}

export async function fetchLatestEpisodes(): Promise<Video[]> {
  const items = await fetchAnikotoCategory('latest-episodes');
  return items.map((it) => transformAnikotoCategoryItemToVideo(it, 'Latest Episodes'));
}

export async function fetchOngoingAnime(): Promise<Video[]> {
  const items = await fetchAnikotoCategory('ongoing');
  return items.map((it) => transformAnikotoCategoryItemToVideo(it, 'Ongoing'));
}

export async function fetchUpcomingAnime(): Promise<Video[]> {
  const items = await fetchAnikotoCategory('upcoming');
  return items.map((it) => transformAnikotoCategoryItemToVideo(it, 'Upcoming'));
}

export async function fetchCompletedAnime(): Promise<Video[]> {
  const items = await fetchAnikotoCategory('completed');
  return items.map((it) => transformAnikotoCategoryItemToVideo(it, 'Completed'));
}

export async function fetchAnimeSearch(keyword: string, page: number = 1): Promise<{ videos: Video[], totalPages: number }> {
  const localProxy = `/api/anime/search?keyword=${encodeURIComponent(keyword)}&page=${page}`;
  
  const res = await fetch(localProxy);
  if (!res.ok) {
    throw new Error(`Search failed with status ${res.status}`);
  }
  
  const jsonResult = await res.json();
  if (!jsonResult.success || !Array.isArray(jsonResult.data)) {
    throw new Error('Invalid search response');
  }
  
  const videos = jsonResult.data.map((it: AnikotoCategoryItem) => transformAnikotoCategoryItemToVideo(it, 'Search Result'));
  
  return {
    videos,
    totalPages: jsonResult.totalPages || 1
  };
}

/**
 * Fetch detailed anime info (genres, episodes array, seasons, related, MAL/AniList IDs, studios)
 * Endpoint: https://anikoto-api.vercel.app/api/info?id={slug}
 */
export async function fetchAnimeInfo(slugOrId: string): Promise<AnimeInfoData> {
  const localProxy = `/api/anime/info?id=${encodeURIComponent(slugOrId)}`;
  
  const res = await fetch(localProxy);
  if (!res.ok) {
    // Direct upstream fallback
    const directUrl = `https://anikoto-api.vercel.app/api/info?id=${encodeURIComponent(slugOrId)}`;
    const directRes = await fetch(directUrl);
    if (!directRes.ok) {
      throw new Error(`Failed to fetch anime info for ${slugOrId}`);
    }
    const directJson = await directRes.json();
    if (!directJson.success || !directJson.data) {
      throw new Error('Invalid anime info response');
    }
    return directJson.data;
  }

  const json = await res.json();
  if (!json.success || !json.data) {
    throw new Error('Invalid anime info response');
  }

  return json.data;
}

/**
 * Fetch anime by genre (Action, Adventure, Comedy, Fantasy, Romance, Drama, Sci-Fi, Shounen, etc.)
 * Endpoint: https://anikototvapi.vercel.app/api/genre/{genre}?page={page}
 */
export async function fetchAnimeByGenre(genre: string, page: number = 1): Promise<{ videos: Video[], totalPages: number, genre: string }> {
  const formattedGenre = genre.toLowerCase().trim().replace(/\s+/g, '-');
  const localProxy = `/api/anime/genre/${encodeURIComponent(formattedGenre)}?page=${page}`;

  const res = await fetch(localProxy);
  if (!res.ok) {
    // Direct upstream fallback
    const directUrl = `https://anikototvapi.vercel.app/api/genre/${encodeURIComponent(formattedGenre)}?page=${page}`;
    const directRes = await fetch(directUrl);
    if (!directRes.ok) {
      throw new Error(`Failed to fetch genre ${genre}`);
    }
    const directData = await directRes.json();
    if (directData.success && directData.results && Array.isArray(directData.results.data)) {
      const videos = directData.results.data.map((item: any) => {
        let id = item.slug || '';
        if (id.includes('/')) id = id.split('/')[0];
        return transformAnikotoCategoryItemToVideo({
          id,
          title: item.title || item.japaneseTitle,
          image: item.poster,
          type: item.type || 'TV',
          sub: item.sub ? String(item.sub) : null,
          dub: item.dub ? String(item.dub) : null,
          episodes: item.total ? String(item.total) : null,
        }, genre);
      });
      return {
        videos,
        totalPages: directData.results.totalPages || 1,
        genre: formattedGenre,
      };
    }
    throw new Error('Invalid genre response format');
  }

  const json = await res.json();
  if (!json.success || !Array.isArray(json.data)) {
    throw new Error('Invalid genre data format');
  }

  const videos = json.data.map((it: AnikotoCategoryItem) => transformAnikotoCategoryItemToVideo(it, genre));

  return {
    videos,
    totalPages: json.totalPages || 1,
    genre: json.genre || formattedGenre,
  };
}

/**
 * Fetch rich episode metadata (thumbnails, titles, descriptions, air dates)
 * Endpoint: https://anime-metadata-api.vercel.app/api/episodes/{anilistId}
 */
export async function fetchAnimeEpisodesMetadata(
  anilistId: number | string,
  season?: number
): Promise<{
  episodes: AnimeEpisodeDetail[];
  images: any[];
  title?: string;
  totalEpisodes?: number;
}> {
  const params = new URLSearchParams();
  if (season !== undefined) params.set('season', String(season));

  const localProxy = `/api/anime/metadata/${anilistId}${params.toString() ? `?${params.toString()}` : ''}`;

  try {
    const res = await fetch(localProxy);
    let data;
    if (res.ok) {
      data = await res.json();
    } else {
      const directUrl = `https://anime-metadata-api.vercel.app/api/episodes/${anilistId}${params.toString() ? `?${params.toString()}` : ''}`;
      const directRes = await fetch(directUrl);
      if (directRes.ok) {
        data = await directRes.json();
      }
    }

    if (data && data.success && data.data) {
      const epList: AnimeEpisodeDetail[] = Array.isArray(data.data.episodes)
        ? data.data.episodes.map((ep: any) => ({
            id: ep.id,
            number: ep.number,
            title: ep.title || `Episode ${ep.number}`,
            description: ep.description || '',
            image: ep.image,
            airDate: ep.airDate,
            duration: ep.duration,
            isFiller: ep.isFiller,
            rating: ep.rating,
            hasAired: ep.hasAired,
          }))
        : [];

      return {
        episodes: epList,
        images: data.data.images || [],
        title: data.data.title || data.data.titleRomaji,
        totalEpisodes: data.data.totalEpisodes || epList.length,
      };
    }
  } catch (err) {
    console.warn('Metadata fetch warning:', err);
  }

  return {
    episodes: [],
    images: [],
  };
}

