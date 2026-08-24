import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  ThumbsUp, 
  ThumbsDown, 
  Share2, 
  Bell, 
  Check,
  Layers,
  Sparkles,
  AlertCircle,
  Film,
  Play,
  Grid,
  List,
  ChevronDown,
  ChevronUp,
  Server as ServerIcon
} from 'lucide-react';
import { Video, SubtitleTrack, StreamSource, SkipInterval, AnimeInfoData, AnimeEpisodeDetail, AnimeSeasonItem } from '../types';
import { VideoPlayer } from './VideoPlayer';
import { VideoCard } from './VideoCard';
import { FadeImage, VerifiedBadge } from './FadeImage';
import { 
  fetchAnimeStream, 
  fetchAnimeStreamBySlug, 
  buildProxiedM3u8Url, 
  fetchAnimeInfo, 
  fetchAnimeEpisodesMetadata 
} from '../services/animeApi';
import { formatRelativeTime } from '../services/timeUtils';
import { 
  isInWatchLater, 
  toggleWatchLater, 
  isEpisodeLiked, 
  toggleLikedEpisode,
  addToWatchHistory
} from '../services/sessionStorage';

interface WatchViewProps {
  video: Video;
  allVideos: Video[];
  onSelectVideo: (video: Video) => void;
  onSelectGenre?: (genre: string) => void;
}

export const WatchView = ({
  video,
  allVideos,
  onSelectVideo,
  onSelectGenre
}: WatchViewProps) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(video.isDisliked || false);
  const [likesCount, setLikesCount] = useState(video.likesCount || 240000);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isServerDropdownOpen, setIsServerDropdownOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Episode view mode in sidebar (List vs Grid)
  const [episodeViewMode, setEpisodeViewMode] = useState<'list' | 'grid'>('list');

  // Dynamic stream and subtitle state
  const [currentStreamUrl, setCurrentStreamUrl] = useState(video.streamUrl);
  const [subtitles, setSubtitles] = useState<SubtitleTrack[]>(video.subtitles || []);
  const [servers, setServers] = useState<StreamSource[]>(video.availableServers || []);
  const [activeServerIndex, setActiveServerIndex] = useState(0);
  const [currentEpisode, setCurrentEpisode] = useState(video.episodeNumber || 1);
  const [isLoadingStream, setIsLoadingStream] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [currentIntro, setCurrentIntro] = useState<SkipInterval | undefined>(video.intro);
  const [currentOutro, setCurrentOutro] = useState<SkipInterval | undefined>(video.outro);
  const [activeSlug, setActiveSlug] = useState<string | undefined>(video.slug);
  const [sourceType, setSourceType] = useState<'mal' | 'slug'>('mal');

  // Anime Info & Metadata States
  const [animeInfo, setAnimeInfo] = useState<AnimeInfoData | null>(null);
  const [episodesMetadata, setEpisodesMetadata] = useState<AnimeEpisodeDetail[]>([]);
  const [metadataImages, setMetadataImages] = useState<any[]>([]);
  const [isLoadingInfo, setIsLoadingInfo] = useState<boolean>(true);

  const activeEpisodeRef = useRef<HTMLDivElement | null>(null);
  const serverDropdownRef = useRef<HTMLDivElement | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Close server dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (serverDropdownRef.current && !serverDropdownRef.current.contains(event.target as Node)) {
        setIsServerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync Watch Later & Liked state from session storage on mount or video/episode switch
  useEffect(() => {
    const targetKey = activeSlug || video.slug || video.id;
    setIsSubscribed(isInWatchLater(targetKey) || isInWatchLater(video.id));
    setIsLiked(isEpisodeLiked(targetKey, currentEpisode));
  }, [video.id, video.slug, activeSlug, currentEpisode]);

  // Fetch Stream ONLY on video or episode change
  useEffect(() => {
    const targetKey = activeSlug || video.slug || video.id;
    setIsLiked(isEpisodeLiked(targetKey, currentEpisode));
    setIsDisliked(video.isDisliked || false);
    setLikesCount(video.likesCount || 240000);
    setIsDescriptionExpanded(false);
    setStreamError(null);

    let isMounted = true;

    async function loadStream() {
      // Clear previous stream URL immediately so previous episode does not continue playing in background
      setCurrentStreamUrl('');
      setIsLoadingStream(true);
      try {
        const streamData = await fetchAnimeStream({
          malId: video.malId,
          slug: video.slug,
          episode: currentEpisode,
          preferredServer: 'hd-1',
        });

        if (!isMounted) return;
        setCurrentStreamUrl(streamData.streamUrl);
        setSubtitles(streamData.subtitles);
        setServers(streamData.servers);
        setActiveServerIndex(0);
        setCurrentIntro(streamData.intro);
        setCurrentOutro(streamData.outro);
        setActiveSlug(streamData.slug || video.slug);
        setSourceType(streamData.sourceType || (streamData.slug ? 'slug' : 'mal'));
        setStreamError(null);
      } catch (err: any) {
        if (!isMounted) return;
        console.warn('Failed to load anime stream:', err);
        setStreamError(err?.message || 'Could not fetch HLS stream for this anime.');
      } finally {
        if (isMounted) {
          setIsLoadingStream(false);
        }
      }
    }

    loadStream();

    return () => {
      isMounted = false;
    };
  }, [video.id, video.malId, video.slug, currentEpisode]);

  // Fetch full anime details (genres, seasons, related, MAL score) from Info API
  useEffect(() => {
    let isMounted = true;
    async function loadInfo() {
      const targetSlug = activeSlug || video.slug || video.id;
      if (!targetSlug) {
        setIsLoadingInfo(false);
        return;
      }
      setIsLoadingInfo(true);
      try {
        const infoData = await fetchAnimeInfo(targetSlug);
        if (!isMounted) return;
        setAnimeInfo(infoData);

        const anilistId = infoData.anilistId || video.aniId;
        if (anilistId) {
          try {
            const meta = await fetchAnimeEpisodesMetadata(anilistId);
            if (isMounted) {
              if (meta.episodes && meta.episodes.length > 0) {
                setEpisodesMetadata(meta.episodes);
              }
              if (meta.images && meta.images.length > 0) {
                setMetadataImages(meta.images);
              }
            }
          } catch (e) {
            console.warn('Episodes metadata fetch error:', e);
          }
        }
      } catch (err) {
        console.warn('Failed to load anime info:', err);
      } finally {
        if (isMounted) {
          setIsLoadingInfo(false);
        }
      }
    }

    loadInfo();

    return () => {
      isMounted = false;
    };
  }, [video.id, video.slug, activeSlug, video.aniId]);

  // Scroll active episode into view in the sidebar list
  useEffect(() => {
    if (activeEpisodeRef.current) {
      activeEpisodeRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentEpisode]);

  // Handle switching streaming server
  const handleSelectServer = async (index: number) => {
    if (!servers[index]) return;
    setActiveServerIndex(index);
    setIsServerDropdownOpen(false);
    const targetServer = servers[index];

    // Clear current stream immediately so prior server audio stops right away
    setCurrentStreamUrl('');
    setIsLoadingStream(true);

    // If switching between hd-1 and hd-2 on slug engine
    if (sourceType === 'slug' && activeSlug) {
      const serverKey = targetServer.serverName.toLowerCase().includes('hd-2') ? 'hd-2' : 'hd-1';
      try {
        const refreshed = await fetchAnimeStreamBySlug(activeSlug, currentEpisode, serverKey);
        setCurrentStreamUrl(refreshed.streamUrl);
        if (refreshed.subtitles && refreshed.subtitles.length > 0) {
          setSubtitles(refreshed.subtitles);
        }
        if (refreshed.intro) setCurrentIntro(refreshed.intro);
        if (refreshed.outro) setCurrentOutro(refreshed.outro);
        setIsLoadingStream(false);
        return;
      } catch (err) {
        console.warn(`Failed to switch to slug server ${serverKey}, fallback to direct m3u8:`, err);
        setIsLoadingStream(false);
      }
    }

    const proxiedUrl = buildProxiedM3u8Url(targetServer.m3u8, 'https://megaplay.buzz/');
    setCurrentStreamUrl(proxiedUrl);
    setIsLoadingStream(false);
    if (targetServer.subtitles && targetServer.subtitles.length > 0) {
      setSubtitles(targetServer.subtitles);
    }
  };

  // Handle Subscribe -> saves to Watch Later session cookies
  const handleSubscribeToggle = () => {
    const isSaved = toggleWatchLater(video);
    setIsSubscribed(isSaved);
    showToast(isSaved ? 'Saved anime to Watch Later' : 'Removed anime from Watch Later');
  };

  // Handle Like -> saves specific episode to Liked Videos in session cookies
  const handleLike = () => {
    const isNowLiked = toggleLikedEpisode({
      animeId: video.id,
      animeTitle: baseAnimeTitle,
      episodeNumber: currentEpisode,
      episodeTitle: currentEpisodeData?.title,
      formattedTitle: formattedMainTitle,
      thumbnail: currentEpisodeData?.image || video.thumbnail,
      slug: activeSlug || video.slug,
      malId: video.malId,
      streamUrl: currentStreamUrl,
      channel: video.channel
    });
    setIsLiked(isNowLiked);
    if (isNowLiked) {
      setLikesCount(prev => prev + 1);
      if (isDisliked) setIsDisliked(false);
      showToast(`Added EP ${currentEpisode} to Liked Videos`);
    } else {
      setLikesCount(prev => Math.max(0, prev - 1));
      showToast(`Removed EP ${currentEpisode} from Liked Videos`);
    }
  };

  // Handle Dislike
  const handleDislike = () => {
    if (isDisliked) {
      setIsDisliked(false);
    } else {
      setIsDisliked(true);
      if (isLiked) {
        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
        toggleLikedEpisode({
          animeId: video.id,
          animeTitle: baseAnimeTitle,
          episodeNumber: currentEpisode,
          formattedTitle: formattedMainTitle,
          thumbnail: currentEpisodeData?.image || video.thumbnail,
        });
      }
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Stable callback for video ended
  const handleVideoEnded = useCallback(() => {
    const totalEp = animeInfo?.episodes?.length || (typeof animeInfo?.totalSub === 'number' ? animeInfo.totalSub : 12);
    const nextEp = currentEpisode + 1;
    if (nextEp <= totalEp) {
      setCurrentEpisode(nextEp);
    } else if (allVideos.length > 0) {
      const other = allVideos.find(v => v.id !== video.id);
      if (other) onSelectVideo(other);
    }
  }, [animeInfo, currentEpisode, allVideos, video.id, onSelectVideo]);

  // Anime Detail Banner or Fanart Fallback Resolution
  const animeBannerOrFanart = useMemo(() => {
    // 1. Search metadata images for fanart, banner, backdrop
    if (metadataImages && metadataImages.length > 0) {
      const fanartMatch = metadataImages.find((img: any) =>
        img?.type === 'fanart' ||
        img?.type === 'banner' ||
        img?.type === 'backdrop' ||
        img?.image_type === 'fanart' ||
        img?.image_type === 'banner'
      );
      if (fanartMatch?.image) return fanartMatch.image;
      if (metadataImages[0]?.image) return metadataImages[0].image;
    }

    // 2. Check animeInfo for banner, bannerImage, fanart, cover, background_image, images
    if (animeInfo?.banner) return animeInfo.banner;
    if (animeInfo?.bannerImage) return animeInfo.bannerImage;
    if (animeInfo?.fanart) return animeInfo.fanart;
    if (animeInfo?.cover) return animeInfo.cover;
    if (animeInfo?.background_image) return animeInfo.background_image;
    if (animeInfo?.images && animeInfo.images.length > 0) {
      const fanartImg = animeInfo.images.find(img => img?.type === 'fanart' || img?.type === 'banner');
      if (fanartImg?.image) return fanartImg.image;
      if (animeInfo.images[0]?.image) return animeInfo.images[0].image;
    }

    // 3. Fall back to anime poster or video thumbnail
    return animeInfo?.poster || video.thumbnail || '';
  }, [metadataImages, animeInfo, video.thumbnail]);

  // Total Episode & Metadata Resolution (Guarantees both List and Grid views are identical)
  const resolvedEpisodes = useMemo(() => {
    let parsedSub = 0;
    if (animeInfo?.totalSub) {
      const s = String(animeInfo.totalSub).replace(/[^0-9]/g, '');
      if (s) parsedSub = parseInt(s, 10);
    }
    let parsedDub = 0;
    if (animeInfo?.totalDub) {
      const s = String(animeInfo.totalDub).replace(/[^0-9]/g, '');
      if (s) parsedDub = parseInt(s, 10);
    }
    let parsedVideoEp = 0;
    if (video.totalEpisodes) {
      const s = String(video.totalEpisodes).replace(/[^0-9]/g, '');
      if (s) parsedVideoEp = parseInt(s, 10);
    }
    const epArrayCount = Array.isArray(animeInfo?.episodes) ? animeInfo.episodes.length : 0;
    const metaCount = episodesMetadata.length;

    // Detect highest known count, defaulting to at least currentEpisode or 12
    const totalCount = Math.max(metaCount, parsedSub, parsedDub, parsedVideoEp, epArrayCount, currentEpisode, 12);
    const countClamped = Math.min(Math.max(totalCount, 1), 2000);

    const defaultFallbackImage = animeBannerOrFanart || video.thumbnail;

    const list: AnimeEpisodeDetail[] = [];
    for (let i = 1; i <= countClamped; i++) {
      const foundMeta = episodesMetadata.find(m => m.number === i);
      if (foundMeta) {
        list.push({
          ...foundMeta,
          image: (foundMeta.image && foundMeta.image.trim().length > 0) ? foundMeta.image : defaultFallbackImage,
        });
      } else {
        list.push({
          id: `ep-${i}`,
          number: i,
          title: `Episode ${i}`,
          image: defaultFallbackImage,
        });
      }
    }
    return list;
  }, [animeInfo, video.totalEpisodes, video.thumbnail, episodesMetadata, currentEpisode, animeBannerOrFanart]);

  // Franchise & Seasons from Details API
  const franchiseSeasons = useMemo(() => {
    const list: AnimeSeasonItem[] = [];

    if (animeInfo?.seasons && animeInfo.seasons.length > 0) {
      animeInfo.seasons.forEach((s) => {
        list.push({
          id: s.id,
          title: s.title,
          image: s.image || video.thumbnail,
          isActive: s.isActive || s.id === (activeSlug || video.slug),
        });
      });
    }

    // If API returned related entries (prequels/sequels) and seasons is sparse
    if (animeInfo?.related && animeInfo.related.length > 0) {
      animeInfo.related.forEach((rel) => {
        if (!list.some(existing => existing.id === rel.id || existing.title.toLowerCase() === rel.title.toLowerCase())) {
          list.push({
            id: rel.id,
            title: rel.title,
            image: rel.image || video.thumbnail,
            isActive: rel.id === (activeSlug || video.slug),
          });
        }
      });
    }

    return list;
  }, [animeInfo, activeSlug, video.slug, video.thumbnail]);

  // Recommendations / Related Videos
  const relatedVideos = useMemo(() => {
    return allVideos.filter(v => v.id !== video.id);
  }, [allVideos, video.id]);

  // YouTube formatted title: "{Anime Title}: EP {Episode Number}: {Episode Title}"
  const baseAnimeTitle = (animeInfo?.title || video.title)
    .replace(/:\s*EP\s*\d+/i, '')
    .replace(/\s*-\s*Episode\s*\d+/i, '')
    .replace(/\s*EP\s*\d+/i, '')
    .trim();

  const currentEpisodeData = episodesMetadata.find(ep => ep.number === currentEpisode);
  const episodeDetailSuffix = currentEpisodeData?.title ? `: ${currentEpisodeData.title}` : '';
  const formattedMainTitle = `${baseAnimeTitle}: EP ${currentEpisode}${episodeDetailSuffix}`;

  // Current Episode Poster resolution (Episode image -> Detail Banner/Fanart -> Video thumbnail)
  const activeEpisodePoster = (currentEpisodeData?.image && currentEpisodeData.image.trim().length > 0)
    ? currentEpisodeData.image
    : (animeBannerOrFanart || video.thumbnail);

  // Sync Watch History with thumbnail of last watched episode and episode number
  useEffect(() => {
    if (video && activeEpisodePoster) {
      addToWatchHistory({
        ...video,
        thumbnail: activeEpisodePoster,
        episodeNumber: currentEpisode,
      });
    }
  }, [video, currentEpisode, activeEpisodePoster]);

  return (
    <div className="w-full max-w-[1780px] mx-auto px-2 sm:px-4 lg:px-6 py-4 bg-[#0f0f0f]">
      {/* YouTube Grid Layout: Player & Details on Left, Episode Queue on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (Desktop: 8 cols) - Player, Details, Seasons & Related */}
        <div className="lg:col-span-8 space-y-3">
          
          {/* Video Player */}
          <div className="w-full rounded-xl overflow-hidden bg-black">
            <VideoPlayer
              streamUrl={currentStreamUrl}
              poster={activeEpisodePoster}
              title={formattedMainTitle}
              autoPlay={true}
              subtitles={subtitles}
              servers={servers}
              activeServerIndex={activeServerIndex}
              onSelectServer={handleSelectServer}
              isLoadingStream={isLoadingStream}
              malId={video.malId || animeInfo?.malId || 21}
              slug={activeSlug || video.slug}
              episode={currentEpisode}
              intro={currentIntro}
              outro={currentOutro}
              sourceType={sourceType}
              onEnded={handleVideoEnded}
            />
          </div>

          {/* Stream Error Notification */}
          {streamError && (
            <div className="p-3 bg-[#1e1e1e] border border-[#333] rounded-xl flex items-center gap-3 text-xs text-white">
              <AlertCircle className="w-4 h-4 text-white shrink-0" />
              <span>{streamError}</span>
            </div>
          )}

          {/* YouTube Video Title: "One Piece EP 11: Title" */}
          <div className="pt-1">
            <h1 className="text-lg sm:text-xl font-bold text-white leading-snug">
              {formattedMainTitle}
            </h1>
          </div>

          {/* YouTube Action Bar (Channel, Subscribe, Likes, Share, Server Dropdown) */}
          <div className="flex flex-wrap items-center justify-between gap-3 py-1 border-b border-[#272727] pb-3">
            {/* Channel / Studio Info */}
            <div className="flex items-center gap-3">
              <FadeImage
                src={video.channel.avatar}
                alt={video.channel.name}
                className="w-10 h-10 rounded-full object-cover"
                containerClassName="w-10 h-10 rounded-full shrink-0"
              />
              <div>
                <div className="flex items-center gap-1 font-semibold text-white text-sm">
                  <span>{animeInfo?.studios ? animeInfo.studios[0] : video.channel.name}</span>
                  <VerifiedBadge className="w-3.5 h-3.5 shrink-0" />
                </div>
                <div className="text-xs text-[#aaaaaa]">
                  {video.channel.subscribers} subscribers
                </div>
              </div>

              {/* YouTube Subscribe Button */}
              <button
                onClick={handleSubscribeToggle}
                className={`ml-3 px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSubscribed
                    ? 'bg-[#272727] text-white hover:bg-[#3f3f3f]'
                    : 'bg-white text-black hover:bg-[#d9d9d9]'
                }`}
              >
                {isSubscribed ? (
                  <>
                    <Bell className="w-3.5 h-3.5 fill-current" />
                    <span>Subscribed</span>
                  </>
                ) : (
                  <span>Subscribe</span>
                )}
              </button>
            </div>

            {/* Action Buttons: Likes/Dislikes, Share, Server Dropdown */}
            <div className="flex items-center gap-2 flex-wrap relative z-30 py-1">
              {/* Likes / Dislikes Segmented Pill */}
              <div className="flex items-center bg-[#272727] rounded-full overflow-hidden shrink-0">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold hover:bg-[#3f3f3f] transition-colors border-r border-[#3a3a3a] ${
                    isLiked ? 'text-white font-bold' : 'text-white'
                  }`}
                >
                  <ThumbsUp className={`w-4 h-4 ${isLiked ? 'fill-white' : ''}`} />
                  <span>{(likesCount / 1000).toFixed(0)}K</span>
                </button>
                <button
                  onClick={handleDislike}
                  className={`px-3 py-2 text-xs hover:bg-[#3f3f3f] transition-colors ${
                    isDisliked ? 'text-white font-bold' : 'text-white'
                  }`}
                >
                  <ThumbsDown className={`w-4 h-4 ${isDisliked ? 'fill-white' : ''}`} />
                </button>
              </div>

              {/* Share Button */}
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#272727] hover:bg-[#3f3f3f] text-white text-xs font-semibold transition-colors shrink-0"
              >
                {copiedLink ? <Check className="w-4 h-4 text-white" /> : <Share2 className="w-4 h-4 text-white" />}
                <span>{copiedLink ? 'Copied' : 'Share'}</span>
              </button>

              {/* YouTube-Style Server Dropdown */}
              {servers.length > 0 && (
                <div className="relative z-50" ref={serverDropdownRef}>
                  <button
                    onClick={() => setIsServerDropdownOpen(!isServerDropdownOpen)}
                    id="btn-server-dropdown"
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#272727] hover:bg-[#3f3f3f] text-white text-xs font-semibold transition-colors shrink-0"
                  >
                    <ServerIcon className="w-3.5 h-3.5 text-white" />
                    <span>Server: {servers[activeServerIndex]?.serverName || 'HD-1'}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-white transition-transform ${isServerDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {isServerDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-[#212121] border border-[#3e3e3e] rounded-xl shadow-2xl py-1.5 z-50 text-xs">
                      <div className="px-3 py-1.5 text-[11px] font-semibold text-[#aaaaaa] uppercase tracking-wider border-b border-[#2e2e2e]">
                        Select Server
                      </div>
                      <div className="py-1 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-[#333]">
                        {servers.map((srv, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSelectServer(idx)}
                            className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-[#2e2e2e] transition-colors ${
                              activeServerIndex === idx ? 'text-white font-bold bg-[#2b2b2b]' : 'text-gray-300'
                            }`}
                          >
                            <span>{srv.serverName}</span>
                            {activeServerIndex === idx && (
                              <Check className="w-3.5 h-3.5 text-white" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* YouTube Details / Description Box on bottom of player */}
          <div 
            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
            className="p-3.5 bg-[#212121] hover:bg-[#272727] rounded-xl cursor-pointer transition-colors space-y-2 text-xs sm:text-sm text-white"
          >
            {/* Views and Quick Meta Header */}
            <div className="flex items-center gap-2 font-semibold text-white flex-wrap text-xs">
              <span>{video.views}</span>
              <span>•</span>
              <span>{formatRelativeTime(video.uploadedAt)}</span>
              {animeInfo?.studios && animeInfo.studios.length > 0 && (
                <>
                  <span>•</span>
                  <span className="text-[#aaaaaa]">{animeInfo.studios.join(', ')}</span>
                </>
              )}
            </div>

            {/* Clickable Genre Tags */}
            {(animeInfo?.genres || video.tags) && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {(animeInfo?.genres || video.tags).map((genre) => (
                  <button
                    key={genre}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectGenre) onSelectGenre(genre);
                    }}
                    className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#272727] hover:bg-[#383838] text-white transition-colors"
                  >
                    #{genre}
                  </button>
                ))}
              </div>
            )}

            {/* Synopsis Content */}
            <p className={`text-[#f1f1f1] leading-relaxed whitespace-pre-line text-xs sm:text-sm ${
              !isDescriptionExpanded ? 'line-clamp-2' : ''
            }`}>
              {animeInfo?.description || video.description}
            </p>

            {/* Expanded Detailed Metadata Grid */}
            {isDescriptionExpanded && (
              <div className="pt-2.5 mt-2 border-t border-[#333] grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-white">
                <div className="p-2 rounded-lg bg-[#181818]">
                  <span className="text-[#aaaaaa] text-[11px] block">Aired</span>
                  <span className="font-medium text-white">
                    {animeInfo?.aired ? animeInfo.aired.join(', ') : '2024'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-[#181818]">
                  <span className="text-[#aaaaaa] text-[11px] block">Duration</span>
                  <span className="font-medium text-white">
                    {animeInfo?.duration ? animeInfo.duration.join(', ') : '24 min'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-[#181818]">
                  <span className="text-[#aaaaaa] text-[11px] block">Total Episodes</span>
                  <span className="font-medium text-white">
                    {resolvedEpisodes.length}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-[#181818]">
                  <span className="text-[#aaaaaa] text-[11px] block">MAL Score</span>
                  <span className="font-medium text-white">
                    {animeInfo?.mal ? animeInfo.mal.join(', ') : '8.5'}
                  </span>
                </div>
              </div>
            )}

            <div className="font-semibold text-white text-xs pt-0.5 flex items-center gap-1">
              {isDescriptionExpanded ? (
                <>
                  <span>Show less</span>
                  <ChevronUp className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>...more</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </div>
          </div>

          {/* Seasons & Franchise Section (Direct from Details API) */}
          <div className="pt-3 space-y-6">
            <div className="space-y-3 bg-[#181818] border border-[#272727] rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <Film className="w-4 h-4 text-white" />
                    <span>Seasons</span>
                    {franchiseSeasons.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-[#272727] text-gray-300 text-xs font-normal">
                        {franchiseSeasons.length}
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Official series seasons and franchise entries from details API
                  </p>
                </div>
              </div>

              {franchiseSeasons.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {franchiseSeasons.map((season) => (
                    <div
                      key={season.id}
                      onClick={() => {
                        if (season.id) {
                          const cleanId = season.id.replace(/^slug-/, '');
                          onSelectVideo({
                            ...video,
                            id: `slug-${cleanId}`,
                            slug: cleanId,
                            title: season.title,
                            thumbnail: season.image || video.thumbnail,
                            episodeNumber: 1,
                          });
                        }
                      }}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-2 cursor-pointer transition-all hover:bg-[#252525] group ${
                        season.isActive
                          ? 'bg-[#272727] border-white text-white shadow-lg'
                          : 'bg-[#1a1a1a] border-[#2c2c2c] text-gray-200 hover:border-[#444]'
                      }`}
                    >
                      <div className="relative w-full aspect-[3/4] overflow-hidden rounded-lg bg-black">
                        <FadeImage
                          src={season.image || video.thumbnail}
                          alt={season.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          containerClassName="w-full h-full"
                          fallbackSrc={video.thumbnail}
                        />
                        {season.isActive ? (
                          <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-white text-black shadow">
                            Current
                          </span>
                        ) : (
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="px-2 py-1 rounded bg-white text-black text-[10px] font-bold flex items-center gap-1">
                              <Play className="w-2.5 h-2.5 fill-current" />
                              Watch Season
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-center line-clamp-2 text-white group-hover:text-gray-100">
                        {season.title}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                /* When details API has 1 primary season */
                <div className="p-3.5 rounded-xl bg-[#141414] border border-[#272727] flex items-center gap-4">
                  <div className="w-16 h-20 rounded-lg overflow-hidden bg-black shrink-0">
                    <FadeImage
                      src={video.thumbnail}
                      alt={baseAnimeTitle}
                      className="w-full h-full object-cover"
                      containerClassName="w-full h-full"
                    />
                  </div>
                  <div>
                    <div className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-white text-black mb-1">
                      Season 1 • Current
                    </div>
                    <h3 className="text-sm font-bold text-white">{baseAnimeTitle}</h3>
                    <p className="text-xs text-gray-400 pt-0.5">
                      {animeInfo?.status?.[0] || 'Complete Series'} • {resolvedEpisodes.length} Episodes
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (Desktop: 4 cols) - YouTube Playlist Episode Queue */}
        <div className="lg:col-span-4 space-y-4 sticky top-16">
          
          {/* Episode Queue Container */}
          <div className="bg-[#181818] border border-[#272727] rounded-xl overflow-hidden shadow-xl flex flex-col max-h-[calc(100vh-80px)]">
                 {/* Episode Queue Header */}
            <div className="p-3 bg-[#212121] border-b border-[#2a2a2a] flex items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-white" />
                  <h2 className="text-sm font-bold text-white">
                    Episodes
                  </h2>
                  {isLoadingInfo ? (
                    <div className="w-14 h-4 rounded-full bg-[#2e2e2e] animate-pulse" />
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-[#2e2e2e] text-white text-[10px] font-semibold">
                      {resolvedEpisodes.length} Total
                    </span>
                  )}
                </div>
                {isLoadingInfo ? (
                  <div className="w-24 h-2.5 rounded bg-[#2a2a2a] animate-pulse mt-1.5" />
                ) : (
                  <p className="text-[11px] text-[#aaaaaa] pt-0.5 truncate max-w-[220px]">
                    Now Playing: Ep {currentEpisode}
                  </p>
                )}
              </div>

              {/* View Switcher (List / Grid) */}
              <div className="flex items-center bg-[#141414] border border-[#333] rounded-lg p-0.5">
                <button
                  onClick={() => setEpisodeViewMode('list')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    episodeViewMode === 'list'
                      ? 'bg-white text-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title="List View"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setEpisodeViewMode('grid')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    episodeViewMode === 'grid'
                      ? 'bg-white text-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title="Grid View"
                >
                  <Grid className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Episode Scrollable List Area */}
            <div className="p-2.5 overflow-y-auto space-y-2 flex-1 scrollbar-thin scrollbar-thumb-[#333] scrollbar-track-transparent">
              
              {/* Skeleton Loader while Anime Info / Episode List metadata is loading */}
              {isLoadingInfo ? (
                episodeViewMode === 'list' ? (
                  Array.from({ length: 6 }).map((_, idx) => (
                    <div
                      key={`ep-skeleton-${idx}`}
                      className="flex gap-3 p-2 rounded-xl bg-[#181818] border border-[#272727]/60 animate-pulse select-none"
                    >
                      {/* Thumbnail Skeleton */}
                      <div className="relative w-28 sm:w-32 aspect-video rounded-lg bg-[#242424] shrink-0 overflow-hidden flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-[#2e2e2e]" />
                        <span className="absolute top-1.5 left-1.5 w-8 h-3.5 rounded bg-[#2e2e2e]" />
                        <span className="absolute bottom-1.5 right-1.5 w-6 h-3 rounded bg-[#2e2e2e]" />
                      </div>

                      {/* Content Skeleton */}
                      <div className="flex flex-col justify-between flex-1 min-w-0 py-0.5 space-y-1.5">
                        <div className="space-y-1.5">
                          <div className="h-3.5 bg-[#2d2d2d] rounded w-3/4" />
                          <div className="h-2.5 bg-[#222222] rounded w-full" />
                          <div className="h-2.5 bg-[#222222] rounded w-4/5" />
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <div className="h-2.5 bg-[#262626] rounded w-14" />
                          <div className="h-2.5 bg-[#222222] rounded w-10" />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {Array.from({ length: 15 }).map((_, idx) => (
                      <div
                        key={`grid-skeleton-${idx}`}
                        className="p-2.5 h-13 rounded-xl bg-[#1e1e1e] border border-[#282828] animate-pulse flex flex-col items-center justify-center gap-1"
                      >
                        <div className="w-5 h-2 bg-[#2d2d2d] rounded" />
                        <div className="w-6 h-3.5 bg-[#333333] rounded" />
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <>
                  {/* List Mode with rich thumbnails, title and duration */}
                  {episodeViewMode === 'list' && (
                    resolvedEpisodes.map((ep) => {
                      const isSelected = currentEpisode === ep.number;
                      return (
                        <div
                          key={ep.id || `ep-${ep.number}`}
                          ref={isSelected ? activeEpisodeRef : null}
                          onClick={() => setCurrentEpisode(ep.number)}
                          className={`flex gap-3 p-2 rounded-xl cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-[#272727] border border-[#444]'
                              : 'bg-[#181818] border border-transparent hover:bg-[#222222]'
                          }`}
                        >
                          {/* Thumbnail */}
                          <div className="relative w-28 sm:w-32 aspect-video rounded-lg overflow-hidden bg-black shrink-0">
                            <FadeImage
                              src={ep.image || animeBannerOrFanart || video.thumbnail}
                              alt={ep.title || `Episode ${ep.number}`}
                              className="w-full h-full object-cover"
                              containerClassName="w-full h-full"
                              fallbackSrc={animeBannerOrFanart || video.thumbnail}
                            />

                            {/* Episode Number Pill */}
                            <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-black/80 text-white">
                              EP {ep.number}
                            </span>

                            {/* Duration */}
                            {ep.duration && (
                              <span className="absolute bottom-1.5 right-1.5 px-1 py-0.5 rounded text-[9px] font-medium bg-black/85 text-white">
                                {ep.duration}m
                              </span>
                            )}

                            {/* Playing Status Overlay - Pure Play Button Only */}
                            {isSelected && (
                              <div className="absolute inset-0 bg-black/55 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
                                <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-xl">
                                  <Play className="w-4 h-4 fill-black text-black ml-0.5" />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Text Metadata */}
                          <div className="flex flex-col justify-between flex-1 min-w-0 py-0.5">
                            <div>
                              <div className="text-xs font-bold truncate text-white">
                                EP {ep.number}: {ep.title || `Episode ${ep.number}`}
                              </div>
                              {ep.description && (
                                <p className="text-[11px] text-[#aaaaaa] line-clamp-2 leading-tight pt-0.5">
                                  {ep.description}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 text-[10px] text-[#aaaaaa] pt-1">
                              {ep.isFiller && (
                                <span className="px-1.5 py-0.2 rounded bg-[#333] text-white font-semibold">
                                  Filler
                                </span>
                              )}
                              {ep.airDate && (
                                <span className="truncate">{formatRelativeTime(ep.airDate)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Grid Mode with Quick Episode Buttons */}
                  {episodeViewMode === 'grid' && (
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                      {resolvedEpisodes.map((ep) => {
                        const isSelected = currentEpisode === ep.number;
                        return (
                          <button
                            key={ep.id || `grid-${ep.number}`}
                            onClick={() => setCurrentEpisode(ep.number)}
                            className={`p-2.5 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-0.5 border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-white text-black border-white shadow'
                                : 'bg-[#1e1e1e] border-[#2c2c2c] hover:bg-[#282828] text-white'
                            }`}
                            title={`Episode ${ep.number}${ep.title ? `: ${ep.title}` : ''}`}
                          >
                            <div className="flex items-center gap-1">
                              {isSelected && <Play className="w-2.5 h-2.5 fill-black text-black" />}
                              <span className={`text-[10px] ${isSelected ? 'text-gray-700' : 'text-[#aaaaaa]'}`}>EP</span>
                            </div>
                            <span className="text-sm font-black">{ep.number}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Franchise & Seasons in Sidebar */}
          {animeInfo?.seasons && animeInfo.seasons.length > 0 && (
            <div className="bg-[#181818] border border-[#272727] rounded-xl p-3.5 space-y-2.5 shadow-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-white" />
                  <span>Seasons & Movies ({animeInfo.seasons.length})</span>
                </h3>
                <span className="text-[10px] text-[#aaaaaa]">Franchise</span>
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-0.5 scrollbar-thin scrollbar-thumb-[#333]">
                {animeInfo.seasons.map((season) => (
                  <div
                    key={season.id}
                    onClick={() => {
                      if (season.id) {
                        onSelectVideo({
                          ...video,
                          id: season.id,
                          slug: season.id,
                          title: season.title,
                          thumbnail: season.image || video.thumbnail,
                        });
                      }
                    }}
                    className={`p-1.5 rounded-lg border flex flex-col gap-1.5 cursor-pointer transition-all hover:bg-[#252525] ${
                      season.isActive
                        ? 'bg-[#272727] border-white text-white'
                        : 'bg-[#1e1e1e] border-[#2c2c2c] text-gray-200'
                    }`}
                  >
                    <div className="relative w-full aspect-video overflow-hidden rounded bg-black">
                      <FadeImage
                        src={season.image || video.thumbnail}
                        alt={season.title}
                        className="w-full h-full object-cover"
                        containerClassName="w-full h-full"
                        fallbackSrc={video.thumbnail}
                      />
                      {season.isActive && (
                        <span className="absolute top-1 right-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-white text-black">
                          Current
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-semibold line-clamp-2 text-white leading-tight">
                      {season.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Up Next / Recommendations in Sidebar */}
          <div className="space-y-3 pt-1">
            <h3 className="text-xs font-bold text-[#aaaaaa] uppercase tracking-wider px-1">
              Up Next
            </h3>
            <div className="space-y-3">
              {relatedVideos.slice(0, 8).map((relVid) => (
                <VideoCard
                  key={relVid.id}
                  video={relVid}
                  layout="list"
                  onSelectVideo={onSelectVideo}
                />
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-[#212121] text-white text-xs font-semibold rounded-xl shadow-2xl border border-[#383838] animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
