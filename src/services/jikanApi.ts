import { Video } from '../types';
import { fetchAniListAnimeTrailers } from './aniListApi';

export { fetchAniListAnimeTrailers };

export interface JikanPromoItem {
  title: string;
  trailer: {
    youtube_id?: string;
    url?: string;
    embed_url?: string;
    images?: {
      image_url?: string;
      medium_image_url?: string;
      large_image_url?: string;
      maximum_image_url?: string;
    };
  };
  entry: {
    mal_id: number;
    url?: string;
    images?: {
      jpg?: {
        image_url?: string;
        large_image_url?: string;
      };
    };
    title: string;
  };
}

// High Quality Fallback Anime Trailers (YouTube IDs + Posters + Info)
const FALLBACK_TRAILERS: Partial<Video>[] = [
  {
    id: 'jikan-trailer-solo-leveling-s2',
    malId: 58564,
    title: 'Solo Leveling Season 2: Arise from the Shadow - Official Trailer',
    japaneseTitle: '俺だけレベルアップな件 Season 2',
    description: 'Sung Jinwoo faces formidable monarchs and uncovers the secrets of the System in this thrilling second season of Solo Leveling.',
    thumbnail: 'https://img.youtube.com/vi/a_6043r2S3M/maxresdefault.jpg',
    poster: 'https://cdn.myanimelist.net/images/anime/1202/141019.jpg',
    duration: '2:15',
    views: '3.4M',
    viewsCount: 3400000,
    uploadedAt: 'Recent',
    channel: {
      id: 'aniplex',
      name: 'Aniplex / A-1 Pictures',
      avatar: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=120&auto=format&fit=crop&q=80',
      subscribers: '2.1M',
      isVerified: true,
      handle: '@aniplex',
    },
    streamUrl: 'https://www.youtube.com/embed/a_6043r2S3M?autoplay=1&enablejsapi=1&rel=0&modestbranding=1',
    youtubeId: 'a_6043r2S3M',
    embedUrl: 'https://www.youtube.com/embed/a_6043r2S3M?autoplay=1&enablejsapi=1&rel=0&modestbranding=1',
    isTrailer: true,
    score: 8.75,
    rank: 18,
    studios: ['A-1 Pictures'],
    genres: ['Action', 'Fantasy', 'Supernatural'],
    category: 'Trailer',
    tags: ['Trailer', 'Solo Leveling', 'Action', 'PV'],
    likes: '280K',
    likesCount: 280000,
    commentsCount: '12K',
    comments: [],
  },
  {
    id: 'jikan-trailer-chainsaw-man-movie',
    malId: 56805,
    title: 'Chainsaw Man The Movie: Reze Arc - Teaser Trailer',
    japaneseTitle: '劇場版 チェンソーマン レゼ篇',
    description: 'Denji meets Reze, a mystery girl working at a coffee shop, sparking explosive new chaos in the Devil Hunter world.',
    thumbnail: 'https://img.youtube.com/vi/L397TWL2p4A/maxresdefault.jpg',
    poster: 'https://cdn.myanimelist.net/images/anime/1806/140021.jpg',
    duration: '1:45',
    views: '5.2M',
    viewsCount: 5200000,
    uploadedAt: '1 month ago',
    channel: {
      id: 'mappa',
      name: 'MAPPA Channel',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      subscribers: '3.8M',
      isVerified: true,
      handle: '@mappa_official',
    },
    streamUrl: 'https://www.youtube.com/embed/L397TWL2p4A?autoplay=1&enablejsapi=1&rel=0&modestbranding=1',
    youtubeId: 'L397TWL2p4A',
    embedUrl: 'https://www.youtube.com/embed/L397TWL2p4A?autoplay=1&enablejsapi=1&rel=0&modestbranding=1',
    isTrailer: true,
    score: 8.92,
    rank: 12,
    studios: ['MAPPA'],
    genres: ['Action', 'Demons', 'Supernatural'],
    category: 'Trailer',
    tags: ['Movie', 'Chainsaw Man', 'MAPPA', 'Reze'],
    likes: '450K',
    likesCount: 450000,
    commentsCount: '18K',
    comments: [],
  },
  {
    id: 'jikan-trailer-demon-slayer-infinity-castle',
    malId: 58852,
    title: 'Demon Slayer: Kimetsu no Yaiba - Infinity Castle Arc Trilogy Announcement Trailer',
    japaneseTitle: '鬼滅の刃 無限城編',
    description: 'The Hashira and Tanjiro plunge into Muzan\'s Infinity Castle for the ultimate decisive showdown against the Upper Moons.',
    thumbnail: 'https://img.youtube.com/vi/1410-b9LhYI/maxresdefault.jpg',
    poster: 'https://cdn.myanimelist.net/images/anime/1138/143521.jpg',
    duration: '2:30',
    views: '8.1M',
    viewsCount: 8100000,
    uploadedAt: '2 months ago',
    channel: {
      id: 'ufotable',
      name: 'Aniplex / Ufotable',
      avatar: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=120&auto=format&fit=crop&q=80',
      subscribers: '4.5M',
      isVerified: true,
      handle: '@ufotable',
    },
    streamUrl: 'https://www.youtube.com/embed/1410-b9LhYI?autoplay=1&enablejsapi=1&rel=0&modestbranding=1',
    youtubeId: '1410-b9LhYI',
    embedUrl: 'https://www.youtube.com/embed/1410-b9LhYI?autoplay=1&enablejsapi=1&rel=0&modestbranding=1',
    isTrailer: true,
    score: 9.15,
    rank: 5,
    studios: ['ufotable'],
    genres: ['Action', 'Fantasy', 'Historical'],
    category: 'Trailer',
    tags: ['Demon Slayer', 'ufotable', 'Infinity Castle'],
    likes: '720K',
    likesCount: 720000,
    commentsCount: '25K',
    comments: [],
  },
  {
    id: 'jikan-trailer-jujutsu-kaisen-s3',
    malId: 57422,
    title: 'Jujutsu Kaisen Season 3: Culling Game Arc - Teaser PV',
    japaneseTitle: '呪術廻戦 死滅回游',
    description: 'Kenjaku initiates the bloody Culling Game battle royale across Japan, forcing sorcerers into mortal combat.',
    thumbnail: 'https://img.youtube.com/vi/M_OauHnAFc8/maxresdefault.jpg',
    poster: 'https://cdn.myanimelist.net/images/anime/1171/139363.jpg',
    duration: '1:50',
    views: '6.7M',
    viewsCount: 6700000,
    uploadedAt: '3 months ago',
    channel: {
      id: 'mappa-jkk',
      name: 'Toho Animation / MAPPA',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      subscribers: '3.8M',
      isVerified: true,
      handle: '@toho_animation',
    },
    streamUrl: 'https://www.youtube.com/embed/M_OauHnAFc8?autoplay=1&enablejsapi=1&rel=0&modestbranding=1',
    youtubeId: 'M_OauHnAFc8',
    embedUrl: 'https://www.youtube.com/embed/M_OauHnAFc8?autoplay=1&enablejsapi=1&rel=0&modestbranding=1',
    isTrailer: true,
    score: 8.85,
    rank: 15,
    studios: ['MAPPA'],
    genres: ['Action', 'Supernatural'],
    category: 'Trailer',
    tags: ['Jujutsu Kaisen', 'MAPPA', 'Culling Game'],
    likes: '510K',
    likesCount: 510000,
    commentsCount: '19K',
    comments: [],
  },
  {
    id: 'jikan-trailer-frieren-s2',
    malId: 52991,
    title: 'Frieren: Beyond Journey\'s End - Official Anime Trailer',
    japaneseTitle: '葬送のフリーレン',
    description: 'An elven mage re-evaluates the meaning of lifespan, memory, and companionship after her hero party disbands.',
    thumbnail: 'https://img.youtube.com/vi/qgQunxD0qmo/maxresdefault.jpg',
    poster: 'https://cdn.myanimelist.net/images/anime/1015/138006.jpg',
    duration: '2:10',
    views: '4.8M',
    viewsCount: 4800000,
    uploadedAt: '4 months ago',
    channel: {
      id: 'madhouse',
      name: 'Toho Animation / Madhouse',
      avatar: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=120&auto=format&fit=crop&q=80',
      subscribers: '2.9M',
      isVerified: true,
      handle: '@madhouse_jp',
    },
    streamUrl: 'https://www.youtube.com/embed/qgQunxD0qmo?autoplay=1&enablejsapi=1&rel=0&modestbranding=1',
    youtubeId: 'qgQunxD0qmo',
    embedUrl: 'https://www.youtube.com/embed/qgQunxD0qmo?autoplay=1&enablejsapi=1&rel=0&modestbranding=1',
    isTrailer: true,
    score: 9.32,
    rank: 1,
    studios: ['Madhouse'],
    genres: ['Adventure', 'Drama', 'Fantasy'],
    category: 'Trailer',
    tags: ['Frieren', 'Madhouse', 'Fantasy'],
    likes: '610K',
    likesCount: 610000,
    commentsCount: '22K',
    comments: [],
  },
  {
    id: 'jikan-trailer-attack-on-titan-final',
    malId: 48583,
    title: 'Attack on Titan The Final Season Part 3 - Official Trailer',
    japaneseTitle: '進撃の巨人 The Final Season',
    description: 'The Rumbling marches across the sea as Mikasa, Armin, and the Survey Corps launch their desperate final battle against Eren.',
    thumbnail: 'https://img.youtube.com/vi/E7WytAs2460/maxresdefault.jpg',
    poster: 'https://cdn.myanimelist.net/images/anime/1279/131020.jpg',
    duration: '2:25',
    views: '12.4M',
    viewsCount: 12400000,
    uploadedAt: '5 months ago',
    channel: {
      id: 'aot-official',
      name: 'Pony Canyon / MAPPA',
      avatar: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=120&auto=format&fit=crop&q=80',
      subscribers: '5.1M',
      isVerified: true,
      handle: '@ponycanyon',
    },
    streamUrl: 'https://www.youtube.com/embed/E7WytAs2460?autoplay=1&enablejsapi=1&rel=0&modestbranding=1',
    youtubeId: 'E7WytAs2460',
    embedUrl: 'https://www.youtube.com/embed/E7WytAs2460?autoplay=1&enablejsapi=1&rel=0&modestbranding=1',
    isTrailer: true,
    score: 9.06,
    rank: 8,
    studios: ['MAPPA'],
    genres: ['Action', 'Drama', 'Suspense'],
    category: 'Trailer',
    tags: ['Attack on Titan', 'MAPPA', 'Rumbling'],
    likes: '950K',
    likesCount: 950000,
    commentsCount: '34K',
    comments: [],
  }
];

/**
 * Fetch official anime trailers from AniList GraphQL API (with Jikan & Curated fallbacks)
 */
export async function fetchJikanAnimeTrailers(page: number = 1, limit: number = 10): Promise<{
  trailers: Video[];
  page: number;
  hasNextPage: boolean;
}> {
  // 1. Prefer AniList API (GraphQL - fast, accurate, highly reliable trailers)
  try {
    const aniListRes = await fetchAniListAnimeTrailers(page, limit);
    if (aniListRes.trailers && aniListRes.trailers.length > 0) {
      return aniListRes;
    }
  } catch (err) {
    console.warn('AniList trailers fetch failed, falling back to Jikan:', err);
  }

  try {
    // Attempt Jikan /watch/promos endpoint as secondary
    const res = await fetch(`https://api.jikan.moe/v4/watch/promos?page=${page}`);
    if (res.ok) {
      const json = await res.json();
      const promos: JikanPromoItem[] = json?.data || [];
      const hasNextPage = json?.pagination?.has_next_page || false;

      if (promos.length > 0) {
        const parsedTrailers: Video[] = promos
          .filter(p => p.trailer?.youtube_id)
          .map((p, index) => {
            const ytId = p.trailer.youtube_id || '';
            const entry = p.entry;
            const malId = entry.mal_id || Math.floor(Math.random() * 90000) + 10000;
            const posterImg = entry.images?.jpg?.large_image_url || entry.images?.jpg?.image_url || p.trailer.images?.maximum_image_url || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80';
            const thumbImg = p.trailer.images?.maximum_image_url || p.trailer.images?.large_image_url || `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;

            return {
              id: `jikan-promo-${malId}-${index}`,
              malId,
              title: `${entry.title} - Official Trailer (${p.title || 'PV'})`,
              japaneseTitle: entry.title,
              description: `Watch the official PV trailer for ${entry.title}. Synced live from MyAnimeList / Jikan API.`,
              thumbnail: thumbImg,
              poster: posterImg,
              duration: '1:45',
              views: `${Math.floor(Math.random() * 800 + 200)}K`,
              viewsCount: Math.floor(Math.random() * 800000) + 200000,
              uploadedAt: 'Recent',
              channel: {
                id: 'myanimelist-official',
                name: `${entry.title} Official`,
                avatar: posterImg,
                subscribers: '1.5M',
                isVerified: true,
                handle: `@mal_${malId}`,
              },
              streamUrl: `https://www.youtube.com/embed/${ytId}?autoplay=1&enablejsapi=1&rel=0&modestbranding=1`,
              youtubeId: ytId,
              embedUrl: `https://www.youtube.com/embed/${ytId}?autoplay=1&enablejsapi=1&rel=0&modestbranding=1`,
              isTrailer: true,
              score: +(8.0 + Math.random() * 1.2).toFixed(2),
              rank: Math.floor(Math.random() * 100) + 1,
              category: 'AniTrail',
              tags: ['AniTrail', 'Official Trailer', entry.title, 'MAL'],
              likes: `${Math.floor(Math.random() * 200 + 50)}K`,
              likesCount: Math.floor(Math.random() * 200000) + 50000,
              commentsCount: `${Math.floor(Math.random() * 10 + 1)}K`,
              comments: [],
            };
          });

        if (parsedTrailers.length > 0) {
          return {
            trailers: parsedTrailers.slice(0, limit),
            page,
            hasNextPage,
          };
        }
      }
    }
  } catch (err) {
    console.warn('Jikan API promo trailers fetch failed or rate limited, using fallbacks:', err);
  }

  // Fallback to top anime trailers if promos endpoint rate-limited or fails
  try {
    const topRes = await fetch(`https://api.jikan.moe/v4/seasons/upcoming?page=${page}`);
    if (topRes.ok) {
      const topJson = await topRes.json();
      const items: any[] = topJson?.data || [];
      const parsedTop = items
        .filter(item => item.trailer?.youtube_id)
        .map((item, index) => {
          const ytId = item.trailer.youtube_id;
          const posterImg = item.images?.jpg?.large_image_url || item.images?.jpg?.image_url;
          return {
            id: `jikan-top-trailer-${item.mal_id}-${index}`,
            malId: item.mal_id,
            title: `${item.title_english || item.title} - Official Anime Trailer`,
            japaneseTitle: item.title_japanese || item.title,
            description: item.synopsis || `Official upcoming anime trailer for ${item.title}.`,
            thumbnail: item.trailer.images?.maximum_image_url || `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`,
            poster: posterImg,
            duration: '2:00',
            views: `${Math.floor(Math.random() * 900 + 100)}K`,
            viewsCount: Math.floor(Math.random() * 900000) + 100000,
            uploadedAt: item.season ? `${item.season.toUpperCase()} ${item.year || ''}` : 'Upcoming',
            channel: {
              id: `studio-${item.mal_id}`,
              name: item.studios?.[0]?.name || 'Anime Production',
              avatar: posterImg,
              subscribers: '2.4M',
              isVerified: true,
              handle: `@studio_${item.mal_id}`,
            },
            streamUrl: `https://www.youtube.com/embed/${ytId}?autoplay=1&enablejsapi=1&rel=0&modestbranding=1`,
            youtubeId: ytId,
            embedUrl: `https://www.youtube.com/embed/${ytId}?autoplay=1&enablejsapi=1&rel=0&modestbranding=1`,
            isTrailer: true,
            score: item.score || 8.6,
            rank: item.rank || 25,
            studios: item.studios?.map((s: any) => s.name) || [],
            genres: item.genres?.map((g: any) => g.name) || [],
            category: 'AniTrail',
            tags: ['AniTrail', 'Anime Trailer', item.title],
            likes: '340K',
            likesCount: 340000,
            commentsCount: '8.5K',
            comments: [],
          };
        });

      if (parsedTop.length > 0) {
        return {
          trailers: parsedTop as Video[],
          page,
          hasNextPage: topJson?.pagination?.has_next_page || false,
        };
      }
    }
  } catch (topErr) {
    console.warn('Jikan top trailers fallback failed:', topErr);
  }

  // Full high quality fallback pool
  const formattedFallbacks: Video[] = FALLBACK_TRAILERS.map((item, idx) => ({
    ...(item as Video),
    id: item.id || `fallback-trailer-${idx}`,
  }));

  return {
    trailers: formattedFallbacks,
    page: 1,
    hasNextPage: false,
  };
}
