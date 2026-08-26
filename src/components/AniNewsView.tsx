import React, { useState, useEffect, useRef } from 'react';
import { 
  Newspaper, 
  Search, 
  ExternalLink, 
  MessageSquare, 
  Share2, 
  ThumbsUp, 
  Heart, 
  Flame, 
  Sparkles, 
  Play, 
  X, 
  RefreshCw, 
  Globe, 
  MoreHorizontal, 
  Send, 
  Smile, 
  Bookmark, 
  Check, 
  Film, 
  Image as ImageIcon,
  MessageCircle,
  TrendingUp,
  Info,
  Shuffle,
  Dice5
} from 'lucide-react';
import { AnimeNewsItem, Video } from '../types';
import { fetchAniListNews } from '../services/animeApi';
import { formatRelativeTime } from '../services/timeUtils';
import { FadeImage } from './FadeImage';
import { cleanAnimeTitleForSearch, filterAndRankSearchResults } from '../utils/searchFilter';
import { subscribeRateLimit, RateLimitState } from '../services/aniListRateLimit';

interface AniNewsViewProps {
  onSelectVideo?: (video: Video) => void;
  onOpenProfile?: (video: Video) => void;
  onSearchAnime?: (query: string) => void;
}

interface LocalComment {
  id: string;
  author: string;
  avatar: string;
  text: string;
  createdAt: number;
  likes: number;
  isLiked?: boolean;
}

interface PostReaction {
  type: 'like' | 'love' | 'fire' | 'wow';
  count: number;
  userReacted?: boolean;
}

export const AniNewsView: React.FC<AniNewsViewProps> = ({
  onSelectVideo,
  onOpenProfile,
  onSearchAnime
}) => {
  const [news, setNews] = useState<AnimeNewsItem[]>([]);
  const [trendingSpotlight, setTrendingSpotlight] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  // Facebook-style in-line state per post
  const [expandedPosts, setExpandedPosts] = useState<Record<string | number, boolean>>({});
  const [openComments, setOpenComments] = useState<Record<string | number, boolean>>({});
  const [commentsMap, setCommentsMap] = useState<Record<string | number, LocalComment[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string | number, string>>({});
  const [reactionsMap, setReactionsMap] = useState<Record<string | number, PostReaction>>({});
  const [savedPosts, setSavedPosts] = useState<Record<string | number, boolean>>({});
  const [copiedToast, setCopiedToast] = useState<string | null>(null);

  // Community Composer State
  const [composerText, setComposerText] = useState('');
  const [userCreatedPosts, setUserCreatedPosts] = useState<AnimeNewsItem[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);

  // AniList Rate Limit tracking state
  const [rateLimitState, setRateLimitState] = useState<RateLimitState>({
    remaining: 90,
    limit: 90,
    resetTime: 0,
    isCoolingDown: false,
    cooldownSource: null,
    cooldownSeconds: 0,
  });

  useEffect(() => {
    const unsub = subscribeRateLimit((st) => setRateLimitState(st));
    return () => unsub();
  }, []);

  const categories = [
    { id: 'All', label: 'All Feed' },
    { id: 'Announcement', label: 'Announcements' },
    { id: 'Discussion', label: 'Discussions' },
    { id: 'Release', label: 'Airing Releases' },
    { id: 'Anime', label: 'Anime Spotlight' },
  ];

  // Helper function for client-side Fisher-Yates shuffle
  const shuffleList = <T,>(array: T[]): T[] => {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  // Initial load & dynamic randomized loading
  const loadNews = async (pageNum = 1, search = '', isNewSearch = false, forceRandom = true) => {
    if (pageNum === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      // Pass shuffle=true to get fresh randomly offset and shuffled community posts
      const res = await fetchAniListNews(pageNum, 15, search, forceRandom);
      if (res && Array.isArray(res.data)) {
        const randomizedData = forceRandom && !search ? shuffleList(res.data) : res.data;
        if (pageNum === 1 || isNewSearch) {
          setNews(randomizedData);
          if (res.trendingSpotlight && res.trendingSpotlight.length > 0) {
            setTrendingSpotlight(forceRandom ? shuffleList(res.trendingSpotlight) : res.trendingSpotlight);
          }
        } else {
          setNews((prev) => {
            const existingIds = new Set(prev.map((i) => i.id));
            const newItems = randomizedData.filter((i) => !existingIds.has(i.id));
            return [...prev, ...newItems];
          });
        }
        setHasNextPage(res.hasNextPage);
        setPage(pageNum);
      }
    } catch (err) {
      console.error('Error loading AniNews:', err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      setIsShuffling(false);
    }
  };

  // Instant Feed Shuffle Action
  const handleShuffleFeed = () => {
    setIsShuffling(true);
    // Shuffle existing posts immediately for instant fluid UX
    setNews((prev) => shuffleList(prev));
    setTrendingSpotlight((prev) => shuffleList(prev));

    // Also trigger asynchronous fetch with randomized offset page
    const randomPage = Math.floor(Math.random() * 4) + 1;
    loadNews(randomPage, searchQuery, true, true);
  };

  // Infinite scroll observer sentinel ref
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);

  // Lazy loading observer for infinite scrolling feed
  useEffect(() => {
    if (!loadMoreSentinelRef.current || !hasNextPage || isLoading || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isLoading && !isLoadingMore) {
          loadNews(page + 1, searchQuery, false, false);
        }
      },
      { rootMargin: '350px' }
    );

    observer.observe(loadMoreSentinelRef.current);

    return () => {
      observer.disconnect();
    };
  }, [hasNextPage, isLoading, isLoadingMore, page, searchQuery]);

  useEffect(() => {
    loadNews(1, '', false, true);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadNews(1, searchQuery, true);
  };

  // Toggle in-line post expansion ("See more" / "See less")
  const toggleExpandPost = (postId: string | number) => {
    setExpandedPosts((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  // Toggle in-line comments drawer
  const toggleComments = (postId: string | number) => {
    setOpenComments((prev) => {
      const isOpen = !prev[postId];
      // Seed default comments if not present
      if (isOpen && !commentsMap[postId]) {
        const item = allFeedPosts.find((p) => p.id === postId);
        const initialCount = item?.replyCount || 2;
        const mockReplies: LocalComment[] = [
          {
            id: `seed-1-${postId}`,
            author: 'AnimeEnthusiast_99',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
            text: 'Hyped for this episode! The animation studio really stepped up their game this season.',
            createdAt: Date.now() - 3600000 * 2,
            likes: 14,
          },
          {
            id: `seed-2-${postId}`,
            author: 'SakugaLover',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
            text: 'The pacing in the latest chapter/adaptation is incredible. Can not wait for the next broadcast!',
            createdAt: Date.now() - 3600000 * 5,
            likes: 8,
          }
        ];
        setCommentsMap((cPrev) => ({ ...cPrev, [postId]: mockReplies }));
      }
      return { ...prev, [postId]: isOpen };
    });
  };

  // Post in-line comment
  const handleAddComment = (postId: string | number) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    const newComment: LocalComment = {
      id: `usr-${Date.now()}`,
      author: 'You',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      text,
      createdAt: Date.now(),
      likes: 1,
      isLiked: true,
    };

    setCommentsMap((prev) => ({
      ...prev,
      [postId]: [newComment, ...(prev[postId] || [])],
    }));

    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
  };

  // Toggle React / Like
  const handleToggleReaction = (postId: string | number, type: 'like' | 'love' | 'fire' = 'like') => {
    setReactionsMap((prev) => {
      const current = prev[postId] || {
        type: 'like',
        count: Math.floor(Math.random() * 45) + 12,
        userReacted: false,
      };

      if (current.userReacted) {
        return {
          ...prev,
          [postId]: {
            type,
            count: Math.max(0, current.count - 1),
            userReacted: false,
          },
        };
      } else {
        return {
          ...prev,
          [postId]: {
            type,
            count: current.count + 1,
            userReacted: true,
          },
        };
      }
    });
  };

  // Toggle Bookmark / Save
  const handleToggleSave = (postId: string | number) => {
    setSavedPosts((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  // Share post link
  const handleSharePost = (item: AnimeNewsItem) => {
    const url = item.siteUrl || window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedToast(`Copied "${item.title.slice(0, 30)}..." link!`);
      setTimeout(() => setCopiedToast(null), 2500);
    }
  };

  // Handle composer submission
  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composerText.trim()) return;

    const newPost: AnimeNewsItem = {
      id: `user-post-${Date.now()}`,
      title: composerText.slice(0, 60) + (composerText.length > 60 ? '...' : ''),
      body: composerText,
      summary: composerText,
      image: trendingSpotlight[0]?.image || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
      createdAt: Date.now(),
      author: {
        name: 'You (AniTube Member)',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      },
      category: 'Community Post',
      replyCount: 0,
      viewCount: 1,
      tags: ['Community', 'AniTube'],
    };

    setUserCreatedPosts((prev) => [newPost, ...prev]);
    setComposerText('');
  };

  // Convert post / media item to Video object for AniTube stream player
  const handleWatchAnime = (mediaInfo?: AnimeNewsItem['media'], fallbackTitle?: string) => {
    const rawTitle = mediaInfo?.title || fallbackTitle || 'Anime';
    const cleanTitle = cleanAnimeTitleForSearch(rawTitle) || rawTitle;

    if (onSearchAnime) {
      onSearchAnime(cleanTitle);
    } else if (onSelectVideo) {
      const dummyVideo: Video = {
        id: `aninews-${mediaInfo?.id || Date.now()}`,
        aniId: mediaInfo?.id ? Number(mediaInfo.id) : undefined,
        title: cleanTitle,
        description: `${cleanTitle} - Anime updates synced directly from AniList community.`,
        thumbnail: mediaInfo?.bannerImage || mediaInfo?.coverImage || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
        poster: mediaInfo?.coverImage,
        duration: '24:00',
        views: '124K views',
        viewsCount: 124000,
        uploadedAt: 'Recent',
        channel: {
          id: 'ch-anilist',
          name: 'AniList Community',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
          subscribers: '890K',
          handle: '@anilist',
        },
        streamUrl: '',
        category: mediaInfo?.genres?.[0] || 'Anime News',
        tags: mediaInfo?.genres || ['Anime', 'News'],
        likes: '4.8K',
        likesCount: 4800,
        commentsCount: '89',
        comments: [],
      };

      if (onOpenProfile) {
        onOpenProfile(dummyVideo);
      } else {
        onSelectVideo(dummyVideo);
      }
    }
  };

  // Clean raw body for text rendering
  const formatPostText = (rawBody: string) => {
    if (!rawBody) return '';
    return rawBody
      .replace(/~~~[\s\S]*?~~~/g, '')
      .replace(/img\d*?\([^\)]*\)/gi, '')
      .replace(/!\[.*?\]\(.*?\)/g, '')
      .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
      .replace(/<[^>]*>/g, '')
      .trim();
  };

  const categorizedPosts = [...userCreatedPosts, ...news].filter((item) => {
    if (activeCategory === 'All') return true;
    if (activeCategory === 'Announcement') {
      return /announce|notice|official|schedule|news/i.test(item.title) || /announce|news/i.test(item.category);
    }
    if (activeCategory === 'Discussion') {
      return /discussion|episode|spoil|chapter|poll/i.test(item.title) || /discussion/i.test(item.category);
    }
    if (activeCategory === 'Release') {
      return /release|airing|season|date|broadcast|premiere/i.test(item.title) || item.media?.status === 'RELEASING';
    }
    if (activeCategory === 'Anime') {
      return !!item.media;
    }
    return true;
  });

  // Apply connected search keyword filter when search query is active
  const allFeedPosts = searchQuery.trim()
    ? filterAndRankSearchResults<AnimeNewsItem>(
        searchQuery,
        categorizedPosts,
        (p) => `${p.title} ${p.media?.title || ''} ${p.summary || ''}`,
        (p) => String(p.id),
        (p) => p.tags
      )
    : categorizedPosts;

  return (
    <div id="aninews-facebook-feed" className="min-h-screen bg-[#0f0f0f] text-white pb-20">
      {/* Toast Notification */}
      {copiedToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1c1c1c] text-white text-xs px-4 py-2.5 rounded-full border border-white/20 shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{copiedToast}</span>
        </div>
      )}

      {/* Main Centered Facebook Feed Column */}
      <div className="max-w-2xl mx-auto px-2 sm:px-3 pt-3 sm:pt-4 space-y-2 sm:space-y-2.5">
        
        {/* Top Header & Search Bar (Facebook style) */}
        <div className="bg-[#181818] border border-[#262626] rounded-md sm:rounded-lg p-3 sm:p-3.5 shadow-xs">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-linear-to-tr from-red-600 to-orange-500 flex items-center justify-center shadow-md">
                <Newspaper className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-white leading-tight">
                  AniNews Feed
                </h1>
                <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  Synced live with AniList Anime Community
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Random / Shuffle Feed Button */}
              <button
                onClick={handleShuffleFeed}
                disabled={isLoading || isShuffling}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                  isShuffling
                    ? 'bg-red-500/20 text-red-400 border-red-500/40'
                    : 'bg-[#222222] hover:bg-[#2e2e2e] text-gray-200 hover:text-white border-[#333333] hover:border-red-500/30 shadow-xs'
                }`}
                title="Shuffle feed with random algorithm"
              >
                <Shuffle className={`w-3.5 h-3.5 ${isShuffling ? 'animate-spin text-red-400' : 'text-red-400'}`} />
                <span className="hidden xs:inline sm:inline">Shuffle Feed</span>
              </button>

              <button
                onClick={() => loadNews(1, searchQuery, true, true)}
                disabled={isLoading}
                className="p-2 rounded-full hover:bg-[#282828] text-gray-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                title="Refresh Feed"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-red-500' : ''}`} />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts, anime titles, episode threads..."
              className="w-full bg-[#121212] border border-[#2a2a2a] rounded-full px-4 py-2 pl-9 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
            />
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  loadNews(1, '', true);
                }}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-2.5 border-t border-[#222222] mt-2.5">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-red-600 text-white font-semibold shadow-xs'
                    : 'bg-[#222222] text-gray-300 hover:bg-[#2c2c2c] hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Facebook-style Stories / Spotlight Carousel */}
        {trendingSpotlight.length > 0 && !searchQuery && (
          <div className="bg-[#181818] border border-[#262626] rounded-md sm:rounded-lg p-2.5 sm:p-3 shadow-xs">
            <div className="flex items-center justify-between px-1 mb-2">
              <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-red-500" />
                Spotlight & Stories
              </span>
              <span className="text-[10px] text-gray-400">Swipe to browse</span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {trendingSpotlight.map((anime) => (
                <div
                  key={`story-${anime.id}`}
                  onClick={() => handleWatchAnime({ id: anime.id, title: anime.title, coverImage: anime.cover, bannerImage: anime.image, genres: anime.genres }, anime.title)}
                  className="relative w-24 sm:w-28 h-36 sm:h-40 rounded-md sm:rounded-lg overflow-hidden shrink-0 border border-white/10 hover:border-red-500 group cursor-pointer shadow-xs transition-all duration-200"
                >
                  <FadeImage
                    src={anime.cover || anime.image}
                    alt={anime.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    containerClassName="w-full h-full"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/30 to-transparent" />
                  
                  {/* Top Avatar Ring */}
                  <div className="absolute top-2 left-2 w-7 h-7 rounded-full p-0.5 bg-linear-to-tr from-red-500 to-orange-400 shadow-md">
                    <img
                      src={anime.cover || anime.image}
                      alt={anime.title}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>

                  {/* Bottom title */}
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-[11px] font-semibold text-white line-clamp-2 leading-tight drop-shadow-md">
                      {anime.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Facebook-style "Create Post" Composer */}
        <div className="bg-[#181818] border border-[#262626] rounded-md sm:rounded-lg p-3 sm:p-3.5 shadow-xs">
          <div className="flex items-center gap-3">
            <FadeImage
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"
              alt="User Avatar"
              className="w-9 h-9 rounded-full object-cover ring-1 ring-white/10"
              containerClassName="w-9 h-9 rounded-full shrink-0"
            />
            <form onSubmit={handleCreatePost} className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={composerText}
                onChange={(e) => setComposerText(e.target.value)}
                placeholder="Share your thoughts on recent anime episodes or news..."
                className="w-full bg-[#121212] hover:bg-[#151515] border border-[#2a2a2a] focus:border-red-500 rounded-full px-4 py-2 text-xs text-white placeholder-gray-400 focus:outline-none transition-colors"
              />
              {composerText.trim() && (
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-full text-xs font-semibold flex items-center gap-1 shrink-0 transition-colors cursor-pointer shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post</span>
                </button>
              )}
            </form>
          </div>

          <div className="flex items-center justify-around pt-2.5 border-t border-[#242424] mt-2.5 text-xs text-gray-400">
            <button 
              onClick={() => setActiveCategory('Discussion')} 
              className="flex items-center gap-2 py-1 px-3 hover:bg-[#242424] rounded-md transition-colors cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>Discussion</span>
            </button>
            <button 
              onClick={() => setActiveCategory('Release')} 
              className="flex items-center gap-2 py-1 px-3 hover:bg-[#242424] rounded-md transition-colors cursor-pointer"
            >
              <Film className="w-4 h-4 text-blue-400" />
              <span>Airing Anime</span>
            </button>
            <button 
              onClick={() => setActiveCategory('Announcement')} 
              className="flex items-center gap-2 py-1 px-3 hover:bg-[#242424] rounded-md transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Official News</span>
            </button>
          </div>
        </div>

        {/* Loading Skeletons */}
        {isLoading ? (
          <div className="space-y-2 sm:space-y-2.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[#181818] border border-[#242424] rounded-md sm:rounded-lg p-3 sm:p-4 space-y-3 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#252525]" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3.5 bg-[#252525] rounded w-1/3" />
                    <div className="h-2.5 bg-[#202020] rounded w-1/4" />
                  </div>
                </div>
                <div className="h-4 bg-[#252525] rounded w-3/4" />
                <div className="h-14 bg-[#202020] rounded w-full" />
                <div className="h-48 bg-[#252525] rounded-md w-full" />
              </div>
            ))}
          </div>
        ) : allFeedPosts.length === 0 ? (
          <div className="bg-[#181818] border border-[#262626] rounded-md sm:rounded-lg p-8 text-center text-gray-400 space-y-3">
            <Newspaper className="w-10 h-10 text-gray-600 mx-auto" />
            <h3 className="text-sm font-semibold text-gray-200">No posts in this feed</h3>
            <p className="text-xs max-w-sm mx-auto text-gray-400">
              {searchQuery ? `No results found for "${searchQuery}"` : 'Try changing the category or refreshing.'}
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('All');
                loadNews(1, '', true);
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-md text-xs font-medium transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Facebook-Style Feed Posts Stream: Connected Cards with Subtle Separators and Small Rounded Corners */
          <div className="space-y-2 sm:space-y-2.5">
            {/* Rate Limit Protection Banner */}
            {rateLimitState.isCoolingDown && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-md sm:rounded-lg p-3 text-amber-300 text-xs flex items-center justify-between shadow-md animate-pulse mb-2">
                <div className="flex items-center gap-2.5">
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
                  <div>
                    <p className="font-bold text-amber-200">
                      AniList API Rate Limit Protection ({rateLimitState.cooldownSource || 'Active'})
                    </p>
                    <p className="text-[11px] text-amber-300/80">
                      Cooldown in progress to keep your session within AniList limits ({rateLimitState.remaining}/{rateLimitState.limit} remaining).
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full font-mono font-bold text-xs text-amber-100 shrink-0">
                  {rateLimitState.cooldownSeconds}s
                </span>
              </div>
            )}

            {allFeedPosts.map((item) => {
              const isAnimeCard = !!item.media;
              const isExpanded = expandedPosts[item.id] || false;
              const isCommentsOpen = openComments[item.id] || false;
              const isSaved = savedPosts[item.id] || false;
              const reaction = reactionsMap[item.id] || {
                type: 'like',
                count: Math.floor(Math.random() * 45) + (item.replyCount ? item.replyCount * 3 : 15),
                userReacted: false,
              };
              const postComments = commentsMap[item.id] || [];
              const formattedBody = formatPostText(item.body);
              const isLongText = formattedBody.length > 240;
              const displayedText = isExpanded || !isLongText ? formattedBody : formattedBody.slice(0, 240) + '...';

              return (
                <article
                  key={`fb-post-${item.id}`}
                  className="bg-[#181818] border border-[#242424] sm:border-[#262626] rounded-md sm:rounded-lg overflow-hidden shadow-xs hover:border-[#333333] transition-colors duration-150"
                >
                  {/* Post Header: Author Avatar, Name, Timestamp, Category Chip, 3-dots */}
                  <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="relative">
                        <FadeImage
                          src={item.author.avatar}
                          alt={item.author.name}
                          className="w-9 h-9 rounded-full object-cover ring-1 ring-white/10"
                          containerClassName="w-9 h-9 rounded-full shrink-0"
                        />
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#181818]" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs sm:text-sm font-bold text-white hover:underline cursor-pointer">
                            {item.author.name}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-600/15 text-red-400 border border-red-500/20">
                            {item.category}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-0.5">
                          <span>{formatRelativeTime(item.createdAt)}</span>
                          <span>•</span>
                          <Globe className="w-3 h-3 text-gray-400" />
                          <span>Public</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleSave(item.id)}
                        className={`p-1.5 rounded-full hover:bg-[#252525] transition-colors cursor-pointer ${
                          isSaved ? 'text-red-500' : 'text-gray-400 hover:text-white'
                        }`}
                        title={isSaved ? 'Unsave post' : 'Save post'}
                      >
                        <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                      </button>

                      {item.siteUrl && (
                        <a
                          href={item.siteUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="p-1.5 rounded-full hover:bg-[#252525] text-gray-400 hover:text-white transition-colors"
                          title="Open on AniList"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Post Media Attachment Box */}
                  {item.image ? (
                    <div className="mb-2 sm:mb-2.5 overflow-hidden border-y border-[#242424] bg-[#0a0a0a]">
                      {/* Fixed 16:9 Aspect-Ratio Poster Container */}
                      <div className="relative w-full aspect-video sm:aspect-16/9 bg-[#111111] overflow-hidden flex items-center justify-center group/poster">
                        {/* Ambient Blurred Background (fills canvas cleanly) */}
                        <img
                          src={item.bannerImage || item.image}
                          alt=""
                          aria-hidden="true"
                          className="absolute inset-0 w-full h-full object-cover blur-xl opacity-40 scale-110 select-none pointer-events-none"
                        />
                        {/* Main Fixed Proportion Image */}
                        <FadeImage
                          src={item.bannerImage || item.image}
                          alt={item.title}
                          className="relative z-10 w-full h-full object-contain group-hover/poster:scale-102 transition-transform duration-500"
                          containerClassName="w-full h-full flex items-center justify-center"
                        />

                        {/* Top Badges Overlay (Category & Score) */}
                        <div className="absolute top-2.5 inset-x-2.5 sm:top-3 sm:inset-x-3 z-20 flex items-center justify-between pointer-events-none">
                          <span className="px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-black/75 backdrop-blur-md text-amber-300 border border-white/15 shadow-sm">
                            {item.category}
                          </span>
                          {isAnimeCard && item.media?.averageScore ? (
                            <span className="px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold bg-black/75 backdrop-blur-md text-yellow-400 border border-white/15 shadow-sm flex items-center gap-1">
                              <span>★</span>
                              <span>{item.media.averageScore}%</span>
                            </span>
                          ) : null}
                        </div>

                        {/* ONLY SHOW OVERLAY & WATCH BUTTON IF IT IS AN ANIME SHOW CARD */}
                        {isAnimeCard && (
                          <div className="absolute bottom-0 inset-x-0 z-20 bg-gradient-to-t from-black/95 via-black/80 via-60% to-transparent pt-12 pb-2.5 sm:pb-3 px-3 sm:px-3.5 flex flex-col justify-end gap-1.5">
                            <div className="flex items-end justify-between gap-3">
                              <div className="space-y-1 max-w-[75%] sm:max-w-[80%]">
                                <h2 className="font-bold text-white text-xs sm:text-sm md:text-base leading-snug drop-shadow-md line-clamp-2">
                                  {item.title}
                                </h2>
                                <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-gray-300 flex-wrap drop-shadow">
                                  {item.media?.genres && item.media.genres.length > 0 ? (
                                    <span>{item.media.genres.slice(0, 3).join(' • ')}</span>
                                  ) : null}
                                  {item.media?.status ? (
                                    <>
                                      {item.media?.genres && item.media.genres.length > 0 && <span>•</span>}
                                      <span className="text-emerald-400 font-semibold">{item.media.status}</span>
                                    </>
                                  ) : null}
                                  {item.media?.episodes ? (
                                    <>
                                      <span>•</span>
                                      <span>{item.media.episodes} eps</span>
                                    </>
                                  ) : null}
                                </div>
                              </div>

                              {/* Overlaid Watch Button */}
                              <button
                                onClick={() => handleWatchAnime(item.media, item.title)}
                                className="px-2.5 sm:px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-md text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer"
                                title="Watch on AniTube"
                              >
                                <Play className="w-3 h-3 fill-current" />
                                <span className="hidden xs:inline sm:inline">Watch</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}

                  {/* Content Area for Discussion / Community / Non-Anime Cards: Title, body, and loader together */}
                  {!isAnimeCard && (
                    <div className="px-3 sm:px-3.5 pt-1.5 pb-2.5 space-y-2">
                      <h2 className="font-bold text-white text-xs sm:text-sm md:text-base leading-snug">
                        {item.title}
                      </h2>

                      {formattedBody && (
                        <div className="text-xs sm:text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                          {displayedText}
                          {isLongText && (
                            <button
                              onClick={() => toggleExpandPost(item.id)}
                              className="text-red-400 hover:text-red-300 font-semibold ml-1 cursor-pointer"
                            >
                              {isExpanded ? 'See less' : 'See more'}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Loader below content for Discussion / Community threads */}
                      {(isCommentsOpen || rateLimitState.isCoolingDown) && (
                        <div className="pt-2 pb-1 flex items-center gap-2 text-xs text-gray-400 border-t border-[#242424]">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-red-500 shrink-0" />
                          <span>
                            {rateLimitState.isCoolingDown
                              ? `Rate limit cooling down... resuming in ${rateLimitState.cooldownSeconds}s`
                              : 'Loading discussion responses...'}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Content Area for Anime Cards: Caption text below image */}
                  {isAnimeCard && formattedBody && (
                    <div className="px-3 sm:px-3.5 pb-2.5 text-xs sm:text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                      {displayedText}
                      {isLongText && (
                        <button
                          onClick={() => toggleExpandPost(item.id)}
                          className="text-red-400 hover:text-red-300 font-semibold ml-1 cursor-pointer"
                        >
                          {isExpanded ? 'See less' : 'See more'}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Engagement Statistics Row (Reactions Count & Comment Count) */}
                  <div className="px-3 sm:px-3.5 py-1.5 flex items-center justify-between text-[11px] text-gray-400 border-b border-[#242424]">
                    <div className="flex items-center gap-1.5">
                      <div className="flex -space-x-1">
                        <span className="w-4 h-4 rounded-full bg-red-600 flex items-center justify-center text-[9px] text-white">
                          ❤️
                        </span>
                        <span className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-[9px] text-white">
                          👍
                        </span>
                        <span className="w-4 h-4 rounded-full bg-amber-600 flex items-center justify-center text-[9px] text-white">
                          🔥
                        </span>
                      </div>
                      <span>{reaction.count} reactions</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => toggleComments(item.id)}
                        className="hover:underline cursor-pointer"
                      >
                        {(postComments.length || item.replyCount || 2)} comments
                      </button>
                      <span>{item.viewCount || 180} views</span>
                    </div>
                  </div>

                  {/* Facebook Action Bar: React, Comment, Share */}
                  <div className="px-1.5 py-1 flex items-center justify-between text-xs text-gray-300">
                    <button
                      onClick={() => handleToggleReaction(item.id, 'love')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md hover:bg-[#242424] transition-colors cursor-pointer ${
                        reaction.userReacted ? 'text-red-500 font-bold' : 'hover:text-white'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${reaction.userReacted ? 'fill-current' : ''}`} />
                      <span>{reaction.userReacted ? 'Loved' : 'Love'}</span>
                    </button>

                    <button
                      onClick={() => toggleComments(item.id)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md hover:bg-[#242424] transition-colors cursor-pointer ${
                        isCommentsOpen ? 'text-red-400 font-semibold' : 'hover:text-white'
                      }`}
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Comment</span>
                    </button>

                    <button
                      onClick={() => handleSharePost(item)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md hover:bg-[#242424] hover:text-white transition-colors cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Share</span>
                    </button>
                  </div>

                  {/* In-Line Comments Drawer (Facebook style - NO MODAL) */}
                  {isCommentsOpen && (
                    <div className="p-3 sm:p-3.5 bg-[#141414] border-t border-[#242424] space-y-2.5">
                      {/* In-line Comment Composer */}
                      <div className="flex items-center gap-2.5">
                        <FadeImage
                          src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"
                          alt="You"
                          className="w-7 h-7 rounded-full object-cover"
                          containerClassName="w-7 h-7 rounded-full shrink-0"
                        />
                        <div className="flex-1 flex items-center bg-[#1c1c1c] border border-[#2d2d2d] focus-within:border-red-500 rounded-full px-3 py-1.5 transition-colors">
                          <input
                            type="text"
                            value={commentInputs[item.id] || ''}
                            onChange={(e) =>
                              setCommentInputs((prev) => ({
                                ...prev,
                                [item.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleAddComment(item.id);
                              }
                            }}
                            placeholder="Write a comment..."
                            className="w-full bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none"
                          />
                          <button
                            onClick={() => handleAddComment(item.id)}
                            disabled={!commentInputs[item.id]?.trim()}
                            className="p-1 text-red-500 hover:text-red-400 disabled:opacity-30 transition-colors cursor-pointer shrink-0"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Comments List */}
                      <div className="space-y-2.5 pt-2">
                        {postComments.map((comment) => (
                          <div key={comment.id} className="flex items-start gap-2.5 text-xs">
                            <FadeImage
                              src={comment.avatar}
                              alt={comment.author}
                              className="w-6 h-6 rounded-full object-cover mt-0.5"
                              containerClassName="w-6 h-6 rounded-full shrink-0"
                            />
                            <div className="flex-1">
                              <div className="bg-[#1f1f1f] rounded-2xl px-3 py-2 border border-white/5 inline-block max-w-full">
                                <span className="font-bold text-white block text-[11px]">
                                  {comment.author}
                                </span>
                                <p className="text-gray-300 text-xs mt-0.5 leading-relaxed break-words">
                                  {comment.text}
                                </p>
                              </div>
                              <div className="flex items-center gap-3 text-[10px] text-gray-500 pl-2 mt-1">
                                <span>{formatRelativeTime(comment.createdAt)}</span>
                                <button className="hover:text-gray-300 font-semibold cursor-pointer">
                                  Like
                                </button>
                                <button className="hover:text-gray-300 font-semibold cursor-pointer">
                                  Reply
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {/* Automatic Infinite Scroll Lazyloader Sentinel */}
        {hasNextPage && !isLoading && (
          <div ref={loadMoreSentinelRef} className="text-center pt-2 pb-8">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#181818] border border-[#282828] text-xs text-gray-400 shadow-sm">
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMore ? 'animate-spin text-red-500' : 'text-gray-500'}`} />
              <span>{isLoadingMore ? 'Loading more stories...' : 'Scroll down for more feed updates'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
