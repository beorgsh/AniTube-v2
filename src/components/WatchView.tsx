import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  ThumbsUp, 
  ThumbsDown, 
  Share2, 
  CheckCircle2, 
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
import { Video, SubtitleTrack, StreamSource, SkipInterval, AnimeInfoData, AnimeEpisodeDetail } from '../types';
import { VideoPlayer } from './VideoPlayer';
import { VideoCard } from './VideoCard';
import { 
  fetchAnimeStream, 
  fetchAnimeStreamBySlug, 
  buildProxiedM3u8Url, 
  fetchAnimeInfo, 
  fetchAnimeEpisodesMetadata 
} from '../services/animeApi';
import { formatRelativeTime } from '../services/timeUtils';

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
  const [isLiked, setIsLiked] = useState(video.isLiked || false);
  const [isDisliked, setIsDisliked] = useState(video.isDisliked || false);
  const [likesCount, setLikesCount] = useState(video.likesCount || 240000);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isServerDropdownOpen, setIsServerDropdownOpen] = useState(false);

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

  const activeEpisodeRef = useRef<HTMLDivElement | null>(null);
  const serverDropdownRef = useRef<HTMLDivElement | null>(null);

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

  // Fetch Stream ONLY on video or episode change
  useEffect(() => {
    setIsLiked(video.isLiked || false);
    setIsDisliked(video.isDisliked || false);
    setLikesCount(video.likesCount || 240000);
    setIsDescriptionExpanded(false);
    setStreamError(null);

    let isMounted = true;

    async function loadStream() {
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
      if (!targetSlug) return;
      try {
        const infoData = await fetchAnimeInfo(targetSlug);
        if (!isMounted) return;
        setAnimeInfo(infoData);

        const anilistId = infoData.anilistId || video.aniId;
        if (anilistId) {
          try {
            const meta = await fetchAnimeEpisodesMetadata(anilistId);
            if (isMounted && meta.episodes && meta.episodes.length > 0) {
              setEpisodesMetadata(meta.episodes);
            }
          } catch (e) {
            console.warn('Episodes metadata fetch error:', e);
          }
        }
      } catch (err) {
        console.warn('Failed to load anime info:', err);
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

    // If switching between hd-1 and hd-2 on slug engine
    if (sourceType === 'slug' && activeSlug) {
      const serverKey = targetServer.serverName.toLowerCase().includes('hd-2') ? 'hd-2' : 'hd-1';
      try {
        setIsLoadingStream(true);
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
    if (targetServer.subtitles && targetServer.subtitles.length > 0) {
      setSubtitles(targetServer.subtitles);
    }
  };

  // Handle Like
  const handleLike = () => {
    if (isLiked) {
      setIsLiked(false);
      setLikesCount(prev => prev - 1);
    } else {
      setIsLiked(true);
      if (isDisliked) setIsDisliked(false);
      setLikesCount(prev => prev + 1);
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
        setLikesCount(prev => prev - 1);
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

  // Total Episode Calculation
  const totalEpisodeCount = animeInfo?.episodes?.length || (typeof animeInfo?.totalSub === 'number' ? animeInfo.totalSub : 12);
  const episodeNumbers = Array.from({ length: Math.min(Math.max(totalEpisodeCount, 1), 60) }, (_, i) => i + 1);

  // Recommendations / Related Videos
  const relatedVideos = useMemo(() => {
    return allVideos.filter(v => v.id !== video.id);
  }, [allVideos, video.id]);

  // YouTube formatted title: "{Anime Title} EP {Episode Number}: {Episode Title}"
  const baseAnimeTitle = (animeInfo?.title || video.title)
    .replace(/\s*-\s*Episode\s*\d+/i, '')
    .replace(/\s*EP\s*\d+/i, '')
    .trim();

  const currentEpisodeData = episodesMetadata.find(ep => ep.number === currentEpisode);
  const episodeDetailSuffix = currentEpisodeData?.title ? `: ${currentEpisodeData.title}` : '';
  const formattedMainTitle = `${baseAnimeTitle} EP ${currentEpisode}${episodeDetailSuffix}`;

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
              poster={video.thumbnail}
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
              <img
                src={video.channel.avatar}
                alt={video.channel.name}
                className="w-10 h-10 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div>
                <div className="flex items-center gap-1 font-semibold text-white text-sm">
                  <span>{animeInfo?.studios ? animeInfo.studios[0] : video.channel.name}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#aaaaaa]" />
                </div>
                <div className="text-xs text-[#aaaaaa]">
                  {video.channel.subscribers} subscribers
                </div>
              </div>

              {/* YouTube Subscribe Button */}
              <button
                onClick={() => setIsSubscribed(!isSubscribed)}
                className={`ml-3 px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
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

            {/* Action Buttons: Server Dropdown, Likes, Share */}
            <div className="flex items-center gap-2 flex-wrap relative z-30 py-1">
              
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
                    <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-2 w-52 bg-[#212121] border border-[#3e3e3e] rounded-xl shadow-2xl py-1.5 z-50 text-xs">
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
                    {totalEpisodeCount}
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

          {/* Seasons & Related Section (In the Comments position on bottom of player) */}
          <div className="pt-3 space-y-6">
            
            {/* Franchise & Seasons */}
            {animeInfo?.seasons && animeInfo.seasons.length > 0 && (
              <div className="space-y-3 bg-[#181818] border border-[#272727] rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <Film className="w-4 h-4 text-white" />
                    <span>Seasons & Franchise ({animeInfo.seasons.length})</span>
                  </h2>
                  <span className="text-xs text-[#aaaaaa]">Prequels, sequels & movies</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
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
                      className={`p-2 rounded-xl border flex flex-col items-center gap-2 cursor-pointer transition-all hover:bg-[#252525] ${
                        season.isActive
                          ? 'bg-[#272727] border-white text-white'
                          : 'bg-[#1e1e1e] border-[#2c2c2c] text-gray-200'
                      }`}
                    >
                      <div className="relative w-full aspect-[3/4] overflow-hidden rounded-lg bg-black">
                        <img
                          src={season.image || video.thumbnail}
                          alt={season.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        {season.isActive && (
                          <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-white text-black">
                            Current
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-center line-clamp-2 text-white">
                        {season.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* More Like This / Recommended Anime Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>More Like This</span>
                </h2>
                <span className="text-xs text-[#aaaaaa]">Related recommendations</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {relatedVideos.slice(0, 6).map((relVid) => (
                  <VideoCard
                    key={relVid.id}
                    video={relVid}
                    onSelectVideo={onSelectVideo}
                  />
                ))}
              </div>
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
                  <span className="px-2 py-0.5 rounded-full bg-[#2e2e2e] text-white text-[10px] font-semibold">
                    {episodesMetadata.length > 0 ? episodesMetadata.length : episodeNumbers.length} Total
                  </span>
                </div>
                <p className="text-[11px] text-[#aaaaaa] pt-0.5 truncate max-w-[220px]">
                  Now Playing: Ep {currentEpisode}
                </p>
              </div>

              {/* View Switcher (List / Grid) */}
              <div className="flex items-center bg-[#141414] border border-[#333] rounded-lg p-0.5">
                <button
                  onClick={() => setEpisodeViewMode('list')}
                  className={`p-1.5 rounded-md transition-colors ${
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
                  className={`p-1.5 rounded-md transition-colors ${
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
              
              {/* List Mode with rich thumbnails, title and duration */}
              {episodeViewMode === 'list' && (
                episodesMetadata.length > 0 ? (
                  episodesMetadata.map((ep) => {
                    const isSelected = currentEpisode === ep.number;
                    return (
                      <div
                        key={ep.id || ep.number}
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
                          {ep.image ? (
                            <img
                              src={ep.image}
                              alt={ep.title || `Episode ${ep.number}`}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                              <Play className="w-6 h-6 opacity-40 text-white" />
                            </div>
                          )}

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

                          {/* Playing Status Overlay */}
                          {isSelected && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <span className="px-2 py-0.5 rounded bg-white text-black text-[10px] font-bold flex items-center gap-1 shadow">
                                <Play className="w-2.5 h-2.5 fill-current" />
                                Playing
                              </span>
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
                ) : (
                  /* Fallback List of Standard Episodes */
                  episodeNumbers.map((epNum) => {
                    const isSelected = currentEpisode === epNum;
                    return (
                      <div
                        key={epNum}
                        ref={isSelected ? activeEpisodeRef : null}
                        onClick={() => setCurrentEpisode(epNum)}
                        className={`flex items-center justify-between p-3 rounded-xl cursor-pointer border transition-all ${
                          isSelected
                            ? 'bg-white text-black border-white'
                            : 'bg-[#1e1e1e] border-[#2c2c2c] hover:bg-[#282828] text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Play className={`w-4 h-4 ${isSelected ? 'fill-current text-black' : 'text-white'}`} />
                          <span className="font-semibold text-xs">Episode {epNum}</span>
                        </div>
                        {isSelected && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-black/10 px-2 py-0.5 rounded">
                            Playing
                          </span>
                        )}
                      </div>
                    );
                  })
                )
              )}

              {/* Grid Mode with Quick Episode Buttons */}
              {episodeViewMode === 'grid' && (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {episodeNumbers.map((epNum) => {
                    const isSelected = currentEpisode === epNum;
                    return (
                      <button
                        key={epNum}
                        onClick={() => setCurrentEpisode(epNum)}
                        className={`p-2.5 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1 border transition-all ${
                          isSelected
                            ? 'bg-white text-black border-white'
                            : 'bg-[#1e1e1e] border-[#2c2c2c] hover:bg-[#282828] text-white'
                        }`}
                      >
                        <span className={`text-[10px] ${isSelected ? 'text-gray-600' : 'text-[#aaaaaa]'}`}>EP</span>
                        <span className="text-sm font-black">{epNum}</span>
                      </button>
                    );
                  })}
                </div>
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
                      <img
                        src={season.image || video.thumbnail}
                        alt={season.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
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
    </div>
  );
};
