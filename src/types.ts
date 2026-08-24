export interface Channel {
  id: string;
  name: string;
  avatar: string;
  subscribers: string;
  isVerified?: boolean;
  handle: string;
}

export interface Comment {
  id: string;
  author: string;
  avatar: string;
  timeAgo: string;
  content: string;
  likes: number;
  isLiked?: boolean;
  isHeartedByCreator?: boolean;
  repliesCount?: number;
}

export interface SubtitleTrack {
  lang: string;
  label: string;
  url: string;
  format?: string;
  isDefault?: boolean;
}

export interface SkipInterval {
  start: number;
  end: number;
}

export interface StreamSource {
  serverName: string;
  category: 'sub' | 'dub' | 'raw' | 'hsub' | 'ssub' | string;
  m3u8: string;
  type: string;
  subtitles: SubtitleTrack[];
  intro?: SkipInterval;
  outro?: SkipInterval;
}

export interface Video {
  id: string;
  malId?: number | string;
  aniId?: number | string;
  slug?: string;
  title: string;
  description: string;
  thumbnail: string;
  poster?: string;
  banner?: string;
  duration: string;
  views: string;
  viewsCount: number;
  uploadedAt: string;
  channel: Channel;
  streamUrl: string;
  rawM3u8Url?: string;
  subtitles?: SubtitleTrack[];
  availableServers?: StreamSource[];
  intro?: SkipInterval;
  outro?: SkipInterval;
  episodeNumber?: number;
  totalEpisodes?: string | number;
  category: string;
  tags: string[];
  likes: string;
  likesCount: number;
  isLiked?: boolean;
  isDisliked?: boolean;
  commentsCount: string;
  comments: Comment[];
  isLive?: boolean;
  isShort?: boolean;
}

export interface AnikotoCategoryItem {
  id: string; // anime slug e.g. "solo-leveling-season-2-arise-from-the-shadow-3eukp"
  title: string;
  image: string; // real anime poster URL
  type: string; // "TV", "ONA", "Special", "Movie"
  sub: string | null;
  dub: string | null;
  episodes: string | null;
}

export interface AnimeEpisodeDetail {
  id?: string;
  number: number;
  title?: string;
  description?: string;
  image?: string;
  airDate?: string;
  duration?: number;
  isFiller?: boolean;
  rating?: string;
  hasAired?: boolean;
}

export interface AnimeSeasonItem {
  title: string;
  id: string;
  image: string;
  isActive?: boolean;
}

export interface AnimeRelatedItem {
  title: string;
  id: string;
  image: string;
  relationType?: string;
}

export interface AnimeRecommendationItem {
  title: string;
  id: string;
  image: string;
}

export interface AnimeInfoData {
  id: string;
  title: string;
  poster: string;
  banner?: string;
  bannerImage?: string;
  fanart?: string;
  cover?: string;
  background_image?: string;
  images?: Array<{ image: string; type?: string }>;
  description: string;
  malId?: number;
  anilistId?: number;
  totalSub?: number | string;
  totalDub?: number | string;
  type?: string[];
  premiered?: string[];
  aired?: string[];
  status?: string[];
  genres?: string[];
  mal?: string[];
  duration?: string[];
  episodes?: (string | number)[];
  studios?: string[];
  producers?: string[];
  related?: AnimeRelatedItem[];
  seasons?: AnimeSeasonItem[];
  recommendations?: AnimeRecommendationItem[];
}

export type ViewMode =
  | 'home'
  | 'watch'
  | 'trending'
  | 'popular'
  | 'latest'
  | 'ongoing'
  | 'upcoming'
  | 'completed'
  | 'genre'
  | 'subscriptions'
  | 'library'
  | 'history'
  | 'watch_later'
  | 'liked';

