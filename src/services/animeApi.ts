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
 * Safely fetches JSON from a URL without throwing SyntaxError when receiving HTML
 * (e.g. Vercel SPA index.html 404/200 rewrites on static deployments).
 */
async function safeFetchJson<T = any>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, init);
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      return null;
    }
    const text = await res.text();
    if (!text || text.trim().startsWith('<')) {
      return null;
    }
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

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

  // Determine current uploaded episode: prioritize is_sub / episode / sub over total episodes count
  let currentUploadedEp = 0;
  if (typeof anime.is_sub === 'number' && anime.is_sub > 0) {
    currentUploadedEp = anime.is_sub;
  } else if (typeof (anime as any).is_sub === 'string' && /^\d+$/.test((anime as any).is_sub)) {
    currentUploadedEp = parseInt((anime as any).is_sub, 10);
  } else if (typeof (anime as any).episode === 'number' && (anime as any).episode > 0) {
    currentUploadedEp = (anime as any).episode;
  } else if (typeof (anime as any).episode === 'string' && /^\d+$/.test((anime as any).episode)) {
    currentUploadedEp = parseInt((anime as any).episode, 10);
  } else if (typeof (anime as any).sub === 'number' && (anime as any).sub > 0) {
    currentUploadedEp = (anime as any).sub;
  } else if (typeof (anime as any).sub === 'string' && /^\d+$/.test((anime as any).sub)) {
    currentUploadedEp = parseInt((anime as any).sub, 10);
  }

  // Fallback to anime.episodes only if no uploaded episode field is found
  if (currentUploadedEp <= 0 && anime.episodes) {
    const parsedTotal = parseInt(anime.episodes, 10);
    if (!isNaN(parsedTotal) && parsedTotal > 0) {
      currentUploadedEp = parsedTotal;
    }
  }

  const latestEp = currentUploadedEp > 0 ? currentUploadedEp : 1;
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
  const proxyUrl = `/api/recent-anime?page=${page}&per_page=${perPage}`;
  const directUrl = `https://anikotoapi.site/recent-anime?page=${page}&per_page=${perPage}`;

  let responseData: AnikotoResponse | null = await safeFetchJson<AnikotoResponse>(proxyUrl);

  if (!responseData || !responseData.ok) {
    responseData = await safeFetchJson<AnikotoResponse>(directUrl, {
      headers: { 'Accept': 'application/json' },
    });
  }

  if (responseData && responseData.ok && Array.isArray(responseData.data)) {
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

  // 3. Robust client-side fallback to latest-episodes category
  try {
    const categoryItems = await fetchAnikotoCategory('latest-episodes');
    if (categoryItems.length > 0) {
      const categoryVideos = categoryItems.map((item) => transformAnikotoCategoryItemToVideo(item, 'Recent Updates'));
      const startIndex = (page - 1) * perPage;
      const paginated = categoryVideos.slice(startIndex, startIndex + perPage);
      const activeList = paginated.length > 0 ? paginated : categoryVideos.slice(0, perPage);

      return {
        videos: activeList,
        pagination: {
          page,
          per_page: perPage,
          total: categoryVideos.length,
          total_pages: Math.ceil(categoryVideos.length / perPage) || 1,
        },
      };
    }
  } catch (catErr) {
    console.warn('Category fallback in fetchRecentAnime failed:', catErr);
  }

  throw new Error('Failed to fetch recent anime catalogue');
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
  const cleanSlug = String(slug).replace(/^slug-/, '').replace(/^anime-/, '').trim();
  const server = preferredServer === 'hd-2' ? 'hd-2' : 'hd-1';
  const localProxyUrl = `/api/anime/slug-stream?id=${encodeURIComponent(cleanSlug)}&server=${server}&ep=${episode}&type=${type}`;
  const directApiUrl = `https://anikoto-api.vercel.app/api/stream?id=${encodeURIComponent(cleanSlug)}&server=${server}&ep=${episode}&type=${type}`;

  // 1. Try local proxy
  let apiData: AnikotoSlugStreamResponse | null = await safeFetchJson<AnikotoSlugStreamResponse>(localProxyUrl);

  // 2. Direct fallback
  if (!apiData || !apiData.success || !apiData.data) {
    apiData = await safeFetchJson<AnikotoSlugStreamResponse>(directApiUrl, {
      headers: { 'Accept': 'application/json' },
    });
  }

  // 3. Fallback to alternate server hd-2 if hd-1 failed
  if ((!apiData || !apiData.success || !apiData.data) && server === 'hd-1') {
    const fallbackUrl = `/api/anime/slug-stream?id=${encodeURIComponent(cleanSlug)}&server=hd-2&ep=${episode}&type=${type}`;
    apiData = await safeFetchJson<AnikotoSlugStreamResponse>(fallbackUrl);
    if (!apiData || !apiData.success || !apiData.data) {
      const directFallbackUrl = `https://anikoto-api.vercel.app/api/stream?id=${encodeURIComponent(cleanSlug)}&server=hd-2&ep=${episode}&type=${type}`;
      apiData = await safeFetchJson<AnikotoSlugStreamResponse>(directFallbackUrl, {
        headers: { 'Accept': 'application/json' },
      });
    }
  }

  if (!apiData || !apiData.success || !apiData.data || !apiData.data.m3u8) {
    throw new Error(`No stream found for slug "${cleanSlug}" on server ${server} (Episode ${episode})`);
  }

  const data = apiData.data;
  const referer = data.referer || DEFAULT_REFERER;
  const proxiedM3u8 = buildProxiedM3u8Url(data.m3u8, referer);

  // Parse WebVTT Subtitles
  const parsedSubs: SubtitleTrack[] = [];
  if (Array.isArray(data.subtitles)) {
    data.subtitles.forEach((sub: any) => {
      const subUrl = sub.file || sub.url;
      if (!subUrl) return;
      const isEnglish =
        sub.default ||
        sub.label?.toLowerCase() === 'english' ||
        sub.label?.toLowerCase().includes('eng');
      const proxiedVtt = buildProxiedVttUrl(subUrl, referer);
      parsedSubs.push({
        lang: isEnglish ? 'en' : (sub.label ? sub.label.toLowerCase().slice(0, 3) : 'en'),
        label: sub.label || 'English',
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

  const simplifiedServers = renameServersSimplified(servers);

  return {
    streamUrl: proxiedM3u8,
    rawM3u8Url: data.m3u8,
    subtitles: parsedSubs,
    servers: simplifiedServers,
    defaultEnglishVtt,
    intro,
    outro,
    slug: cleanSlug,
    sourceType: 'slug',
  };
}

export function renameServersSimplified(servers: StreamSource[]): StreamSource[] {
  let subCount = 1;
  let dubCount = 1;
  return servers.map((srv) => {
    const isDub = srv.category === 'dub' || srv.serverName?.toLowerCase().includes('dub');
    if (isDub) {
      const name = `Server ${dubCount} Dub`;
      dubCount++;
      return { ...srv, serverName: name };
    } else {
      const name = `Server ${subCount} Sub`;
      subCount++;
      return { ...srv, serverName: name };
    }
  });
}

/**
 * Fetches live streaming sources using MAL ID with automatic fallback to Slug API.
 */
export async function fetchAnimeStreamByMalId(
  malId: string | number,
  episode: number = 1,
  fallbackSlug?: string
): Promise<AnimeStreamResult> {
  const cleanMalId = String(malId).replace(/^mal-/, '').replace(/^anime-/, '').replace(/^slug-/, '').trim();
  const cleanFallbackSlug = fallbackSlug ? String(fallbackSlug).replace(/^slug-/, '').replace(/^anime-/, '').trim() : undefined;

  const localProxyUrl = `/api/anime/stream/${cleanMalId}/${episode}${cleanFallbackSlug ? `?slug=${encodeURIComponent(cleanFallbackSlug)}` : ''}`;
  const directApiUrl = `https://aniapikoto.vercel.app/api/anikoto/mal/${cleanMalId}/${episode}`;

  let apiData: any = await safeFetchJson(localProxyUrl);

  // If server already returned a slug stream fallback
  if (apiData && apiData.isSlugStream && apiData.data) {
    const slugToUse = apiData.slug || cleanFallbackSlug || cleanMalId;
    return fetchAnimeStreamBySlug(slugToUse, episode, apiData.server || 'hd-1');
  }

  // Direct fetch fallback if server route not reached
  if (!apiData || !apiData.success || !apiData.data) {
    apiData = await safeFetchJson(directApiUrl, {
      headers: { 'Accept': 'application/json' },
    });
  }

  // Check if MAL data has active servers
  const hasSub = apiData?.data && Array.isArray(apiData.data.sub) && apiData.data.sub.length > 0;
  const hasSsub = apiData?.data && Array.isArray(apiData.data.ssub) && apiData.data.ssub.length > 0;
  const hasDub = apiData?.data && Array.isArray(apiData.data.dub) && apiData.data.dub.length > 0;
  const hasAnyServer = hasSub || hasSsub || hasDub;
  const discoveredSlug = apiData?.data?.slug || cleanFallbackSlug;

  // Fallback to Slug API if no servers found on MAL ID
  if (!hasAnyServer && discoveredSlug) {
    return fetchAnimeStreamBySlug(discoveredSlug, episode, 'hd-1');
  }

  if (!apiData || !apiData.success || !apiData.data || !hasAnyServer) {
    if (cleanFallbackSlug) {
      return fetchAnimeStreamBySlug(cleanFallbackSlug, episode, 'hd-1');
    }
    throw new Error(`No streaming sources found for MAL ID: ${cleanMalId}`);
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
          const subUrl = sub.url || sub.file;
          if (!subUrl) return;
          const isEn =
            sub.lang?.toLowerCase() === 'en' ||
            sub.label?.toLowerCase().includes('eng');
          const proxiedVtt = buildProxiedVttUrl(subUrl, DEFAULT_REFERER);
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
          const subUrl = sub.url || sub.file;
          if (!subUrl) return;
          const isEn =
            sub.lang?.toLowerCase() === 'en' ||
            sub.label?.toLowerCase().includes('eng');
          const proxiedVtt = buildProxiedVttUrl(subUrl, DEFAULT_REFERER);
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
    throw new Error(`No active streaming servers found for MAL ID ${cleanMalId}`);
  }

  const primaryServer = servers[0];
  const proxiedM3u8 = buildProxiedM3u8Url(primaryServer.m3u8, DEFAULT_REFERER);

  const defaultEnglishVtt =
    allSubtitles.find((s) => s.isDefault) ||
    primaryServer.subtitles.find((s) => s.isDefault) ||
    allSubtitles[0];

  const simplifiedServers = renameServersSimplified(servers);

  return {
    streamUrl: proxiedM3u8,
    rawM3u8Url: primaryServer.m3u8,
    subtitles: allSubtitles.length > 0 ? allSubtitles : primaryServer.subtitles,
    servers: simplifiedServers,
    defaultEnglishVtt,
    slug: discoveredSlug,
    sourceType: 'mal',
  };
}

/**
 * Helper to parse/extract a numeric MAL ID from an anime details response object.
 */
export function extractMalIdFromInfo(infoData: any): number | undefined {
  if (!infoData) return undefined;

  // 1. Direct mal_id / malId property
  if (typeof infoData.malId === 'number' && infoData.malId > 0) return infoData.malId;
  if (typeof infoData.mal_id === 'number' && infoData.mal_id > 0) return infoData.mal_id;
  if (typeof infoData.malId === 'string' && /^\d+$/.test(infoData.malId)) return Number(infoData.malId);
  if (typeof infoData.mal_id === 'string' && /^\d+$/.test(infoData.mal_id)) return Number(infoData.mal_id);

  // 2. mal array or string (e.g. ["https://myanimelist.net/anime/21/One_Piece"] or ["21"])
  if (Array.isArray(infoData.mal) && infoData.mal.length > 0) {
    for (const entry of infoData.mal) {
      if (typeof entry === 'number' && entry > 0) return entry;
      if (typeof entry === 'string') {
        const match = entry.match(/\/anime\/(\d+)/) || entry.match(/^(\d+)$/);
        if (match && match[1]) return Number(match[1]);
      }
    }
  } else if (typeof infoData.mal === 'string') {
    const match = infoData.mal.match(/\/anime\/(\d+)/) || infoData.mal.match(/^(\d+)$/);
    if (match && match[1]) return Number(match[1]);
  } else if (typeof infoData.mal === 'number' && infoData.mal > 0) {
    return infoData.mal;
  }

  // 3. Check anilistId / al_id if numeric
  if (typeof infoData.anilistId === 'number' && infoData.anilistId > 0) return infoData.anilistId;
  if (typeof infoData.al_id === 'number' && infoData.al_id > 0) return infoData.al_id;

  // 4. Check infoData.id if numeric
  if (typeof infoData.id === 'number' && infoData.id > 0) return infoData.id;
  if (typeof infoData.id === 'string' && /^\d+$/.test(infoData.id)) return Number(infoData.id);

  return undefined;
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
  const cleanSlug = slug
    ? String(slug).replace(/^slug-/, '').replace(/^anime-/, '').trim()
    : undefined;
  const rawMalIdStr = malId
    ? String(malId).replace(/^slug-/, '').replace(/^anime-/, '').replace(/^mal-/, '').trim()
    : undefined;

  const finalSlug = cleanSlug || (rawMalIdStr && !/^\d+$/.test(rawMalIdStr) ? rawMalIdStr : undefined);
  let numericMalId = rawMalIdStr && /^\d+$/.test(rawMalIdStr) ? Number(rawMalIdStr) : undefined;

  let lastError: Error | null = null;

  // 1. IF MAL ID IS AVAILABLE (e.g. Home list returns mal_id), TRY MAL ID API FIRST
  if (numericMalId) {
    try {
      const malStream = await fetchAnimeStreamByMalId(numericMalId, episode, finalSlug);
      if (malStream && malStream.streamUrl) {
        return malStream;
      }
    } catch (malErr: any) {
      console.warn(`Primary MAL Stream API failed for MAL ID ${numericMalId}:`, malErr?.message);
      lastError = malErr;
    }
  }

  // 2. IF MAL ID FAILED OR WAS NOT RETURNED IN JSON (e.g. Reels list where json name is id = slug), TRY SLUG BASE API
  const targetSlug = finalSlug || rawMalIdStr || '';
  if (targetSlug) {
    try {
      const slugStream = await fetchAnimeStreamBySlug(targetSlug, episode, preferredServer);
      if (slugStream && slugStream.streamUrl) {
        return slugStream;
      }
    } catch (slugErr: any) {
      console.warn(`Slug Stream API failed for slug "${targetSlug}":`, slugErr?.message);
      lastError = slugErr;
    }
  }

  // 3. PLAYER ERROR RETRY TEST: If both above failed or only slug was given, fetch Anime Details to get the official MAL ID returned in details!
  if (targetSlug) {
    try {
      console.info(`Attempting fallback: fetching anime details for "${targetSlug}" to extract MAL ID...`);
      const infoData = await fetchAnimeInfo(targetSlug);
      const discoveredMalId = extractMalIdFromInfo(infoData);

      if (discoveredMalId && discoveredMalId !== numericMalId) {
        console.info(`Discovered MAL ID ${discoveredMalId} from anime details. Retrying MAL Stream API...`);
        const retryMalStream = await fetchAnimeStreamByMalId(discoveredMalId, episode, targetSlug);
        if (retryMalStream && retryMalStream.streamUrl) {
          return retryMalStream;
        }
      }
    } catch (infoErr: any) {
      console.warn(`Anime details lookup retry for "${targetSlug}" failed:`, infoErr?.message);
    }
  }

  throw new Error(lastError?.message || `Unable to fetch video stream for episode ${episode}`);
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

  const rawItemId = String(item.id || '').replace(/^slug-/, '').replace(/^anime-/, '').trim();
  const numericMalId = (item as any).mal_id || (item as any).malId || (/^\d+$/.test(rawItemId) ? Number(rawItemId) : undefined);
  const slugStr = (item as any).slug || (!/^\d+$/.test(rawItemId) ? rawItemId : rawItemId);

  const channel: Channel = {
    id: `ch-slug-${rawItemId}`,
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
    id: `slug-${rawItemId}`,
    malId: numericMalId,
    slug: slugStr,
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
    streamUrl: '', // dynamically streamed via fetchAnimeStream
    category: categoryLabel,
    tags,
    likes: `${(viewsCount * 0.08 / 1000).toFixed(1)}K`,
    likesCount: Math.round(viewsCount * 0.08),
    commentsCount: `${Math.floor(viewsCount * 0.004) + 24}`,
    comments: [
      {
        id: `c-slug-${rawItemId}-1`,
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

  let jsonResult: { success: boolean; data: AnikotoCategoryItem[] } | null = await safeFetchJson(localProxy);

  if (!jsonResult || !jsonResult.success || !Array.isArray(jsonResult.data)) {
    jsonResult = await safeFetchJson(directApi, {
      headers: { 'Accept': 'application/json' },
    });
  }

  if (!jsonResult || !jsonResult.success || !Array.isArray(jsonResult.data)) {
    throw new Error(`Failed to fetch anime category: ${category}`);
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
  const directApi = `https://anikoto-api.vercel.app/api/search?keyword=${encodeURIComponent(keyword)}&page=${page}`;
  
  let jsonResult: any = await safeFetchJson(localProxy);
  if (!jsonResult || !jsonResult.success || !Array.isArray(jsonResult.data)) {
    jsonResult = await safeFetchJson(directApi, {
      headers: { 'Accept': 'application/json' },
    });
  }

  if (!jsonResult || !jsonResult.success || !Array.isArray(jsonResult.data)) {
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
  const cleanId = String(slugOrId).replace(/^slug-/, '').replace(/^anime-/, '').trim();
  const localProxy = `/api/anime/info?id=${encodeURIComponent(cleanId)}`;
  const directUrl = `https://anikoto-api.vercel.app/api/info?id=${encodeURIComponent(cleanId)}`;

  let json: any = await safeFetchJson(localProxy);
  if (!json || !json.success || !json.data) {
    json = await safeFetchJson(directUrl, {
      headers: { 'Accept': 'application/json' },
    });
  }

  if (!json || !json.success || !json.data) {
    throw new Error(`Failed to fetch anime info for ${cleanId}`);
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
  const directUrl = `https://anikototvapi.vercel.app/api/genre/${encodeURIComponent(formattedGenre)}?page=${page}`;

  let json: any = await safeFetchJson(localProxy);
  if (!json || (!json.success && !json.results)) {
    json = await safeFetchJson(directUrl, {
      headers: { 'Accept': 'application/json' },
    });
  }

  if (json) {
    if (json.success && Array.isArray(json.data)) {
      const videos = json.data.map((it: AnikotoCategoryItem) => transformAnikotoCategoryItemToVideo(it, genre));
      return {
        videos,
        totalPages: json.totalPages || 1,
        genre: json.genre || formattedGenre,
      };
    } else if (json.results && Array.isArray(json.results.data)) {
      const videos = json.results.data.map((item: any) => {
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
        totalPages: json.results.totalPages || 1,
        genre: formattedGenre,
      };
    }
  }

  throw new Error(`Failed to fetch genre ${genre}`);
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
  banner?: string;
}> {
  const params = new URLSearchParams();
  if (season !== undefined) params.set('season', String(season));

  const localProxy = `/api/anime/metadata/${anilistId}${params.toString() ? `?${params.toString()}` : ''}`;
  const directUrl = `https://anime-metadata-api.vercel.app/api/episodes/${anilistId}${params.toString() ? `?${params.toString()}` : ''}`;

  try {
    let data = await safeFetchJson(localProxy);
    if (!data || !data.success || !data.data) {
      data = await safeFetchJson(directUrl);
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

      const discoveredBanner =
        data.data.banner ||
        data.data.bannerImage ||
        data.data.cover ||
        data.data.coverImage ||
        data.data.headerImage ||
        (Array.isArray(data.data.images) && data.data.images[0]?.url ? data.data.images[0].url : typeof data.data.images?.[0] === 'string' ? data.data.images[0] : epList[0]?.image);

      return {
        episodes: epList,
        images: data.data.images || [],
        title: data.data.title || data.data.titleRomaji,
        totalEpisodes: data.data.totalEpisodes || epList.length,
        banner: discoveredBanner,
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

