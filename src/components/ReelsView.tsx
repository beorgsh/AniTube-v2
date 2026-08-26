import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Film, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Heart, 
  Share2, 
  Bookmark, 
  Shuffle, 
  Tv, 
  ChevronUp, 
  ChevronDown, 
  Sparkles, 
  AlertCircle, 
  Loader2, 
  Info, 
  Flame, 
  ArrowLeft,
  Check,
  Zap,
  Subtitles,
  ExternalLink,
  RotateCcw,
  Clock
} from 'lucide-react';
import videojs from 'video.js';
import type Player from 'video.js/dist/types/player';
import { Video, AnimeStreamResult } from '../types';
import { fetchRecentAnime, fetchPopularAnime, fetchAnimeStream } from '../services/animeApi';
import { fetchJikanAnimeTrailers } from '../services/jikanApi';
import { 
  getWatchLaterList, 
  toggleWatchLater, 
  isInWatchLater, 
  getLikedEpisodesList, 
  toggleLikedEpisode, 
  isEpisodeLiked 
} from '../services/sessionStorage';
import { FadeImage, VerifiedBadge } from './FadeImage';

interface ReelsViewProps {
  onSelectVideo: (video: Video) => void;
  onBackToHome: () => void;
  initialVideo?: Video | null;
  initialReelMode?: 'anireels';
}

// Fisher-Yates shuffle algorithm for true randomized anime reels
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const ReelsView: React.FC<ReelsViewProps> = ({ 
  onSelectVideo, 
  onBackToHome, 
  initialVideo
}) => {
  const reelMode = 'anireels';
  const [reels, setReels] = useState<Video[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isLoadingFeed, setIsLoadingFeed] = useState<boolean>(true);
  const [feedError, setFeedError] = useState<string | null>(null);

  // Lazy loading pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const isFetchingMoreRef = useRef<boolean>(false);

  // Playback states
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [isVideoReady, setIsVideoReady] = useState<boolean>(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  // 30-Second Midpoint Clip & Internet Data Saving States
  const [isClipEnded, setIsClipEnded] = useState<boolean>(false);
  const [shownBlurMap, setShownBlurMap] = useState<{ [key: string]: boolean }>({});
  const hasSeekedToMiddleRef = useRef<boolean>(false);
  const clipStartTimeRef = useRef<number>(0);
  const clipEndTimeRef = useRef<number>(0);

  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '12:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Realtime drag & swipe physics state (TikTok / Instagram mobile experience)
  const [dragOffsetY, setDragOffsetY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const dragStartY = useRef<number>(0);
  const dragStartTime = useRef<number>(0);
  const hasMovedSignificantly = useRef<boolean>(false);

  // Prefetching cache: maps anime ID or slug to fetched stream result
  const streamCacheRef = useRef<Map<string, AnimeStreamResult>>(new Map());
  const [prefetchStatus, setPrefetchStatus] = useState<{ [key: string]: boolean }>({});

  // Interaction states
  const [likedMap, setLikedMap] = useState<{ [key: string]: boolean }>({});
  const [likeCounts, setLikeCounts] = useState<{ [key: string]: number }>({});
  const [savedMap, setSavedMap] = useState<{ [key: string]: boolean }>({});
  const [showHeartAnim, setShowHeartAnim] = useState<boolean>(false);
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Video.js player refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<Player | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Stable refs for event listeners to avoid closure capture bugs
  const currentAnimeRef = useRef<Video | null>(null);
  const reelModeRef = useRef<string>('anireels');
  const handleNextReelRef = useRef<() => void>(() => {});

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // 1. Initial Load: Fetch Recent & Popular Anime
  const loadReelsFeed = useCallback(async () => {
    setIsLoadingFeed(true);
    setFeedError(null);
    setCurrentPage(1);
    setHasMore(true);
    setIsLoadingMore(false);

    try {
      let uniqueVideos: Video[] = [];

      // Fetch both recent episodes and popular anime from API
      const [recentRes, popVideos] = await Promise.all([
        fetchRecentAnime(1, 24).catch(() => ({ videos: [] })),
        fetchPopularAnime().catch(() => [])
      ]);

      const combined = [...recentRes.videos, ...popVideos];
      
      // Deduplicate by slug or ID
      const seen = new Set<string>();
      uniqueVideos = combined.filter(v => {
        const key = v.slug || v.id || v.title;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      if (uniqueVideos.length === 0) {
        throw new Error('No AniReels shorts available at the moment.');
      }

      // Apply Randomized Fisher-Yates Algorithm
      let randomized = shuffleArray(uniqueVideos);
      if (initialVideo) {
        const initKey = initialVideo.slug || initialVideo.id;
        const withoutInit = randomized.filter(v => (v.slug || v.id) !== initKey);
        randomized = [initialVideo, ...withoutInit];
      }
      setReels(randomized);
      setCurrentIndex(0);

      // Initialize like and saved status maps
      const initialLikes: { [key: string]: boolean } = {};
      const initialCounts: { [key: string]: number } = {};
      const initialSaved: { [key: string]: boolean } = {};

      randomized.forEach(v => {
        const key = v.slug || v.id;
        initialLikes[key] = isEpisodeLiked(v.id || key, v.episodeNumber || 1);
        initialCounts[key] = v.likesCount || Math.floor(Math.random() * 400) + 120;
        initialSaved[key] = isInWatchLater(v.id);
      });

      setLikedMap(initialLikes);
      setLikeCounts(initialCounts);
      setSavedMap(initialSaved);
    } catch (err: any) {
      console.error('Failed to load reels:', err);
      setFeedError(err.message || 'Failed to load reels feed.');
    } finally {
      setIsLoadingFeed(false);
    }
  }, [initialVideo]);

  // Lazy loading pagination engine
  const loadMoreReels = useCallback(async (nextPage: number) => {
    if (isFetchingMoreRef.current || !hasMore) return;
    isFetchingMoreRef.current = true;
    setIsLoadingMore(true);

    try {
      let newItems: Video[] = [];
      const res = await fetchRecentAnime(nextPage, 20);
      if (res && res.videos && res.videos.length > 0) {
        newItems = res.videos;
      } else {
        setHasMore(false);
      }

      if (newItems.length > 0) {
        setReels(prevReels => {
          const existingKeys = new Set(prevReels.map(v => v.youtubeId || v.slug || v.id || v.title));
          const filtered = newItems.filter(v => {
            const key = v.youtubeId || v.slug || v.id || v.title;
            if (existingKeys.has(key)) return false;
            existingKeys.add(key);
            return true;
          });
          if (filtered.length === 0) return prevReels;
          return [...prevReels, ...filtered];
        });

        // Update liked / counts / saved maps for new items
        setLikedMap(prev => {
          const updated = { ...prev };
          newItems.forEach(v => {
            const key = v.slug || v.id;
            if (!(key in updated)) {
              updated[key] = isEpisodeLiked(v.id || key, v.episodeNumber || 1);
            }
          });
          return updated;
        });

        setLikeCounts(prev => {
          const updated = { ...prev };
          newItems.forEach(v => {
            const key = v.slug || v.id;
            if (!(key in updated)) {
              updated[key] = v.likesCount || Math.floor(Math.random() * 400) + 120;
            }
          });
          return updated;
        });

        setSavedMap(prev => {
          const updated = { ...prev };
          newItems.forEach(v => {
            const key = v.slug || v.id;
            if (!(key in updated)) {
              updated[key] = isInWatchLater(v.id);
            }
          });
          return updated;
        });

        setCurrentPage(nextPage);
      }
    } catch (err) {
      console.warn(`Failed to lazy load page ${nextPage} reels:`, err);
    } finally {
      setIsLoadingMore(false);
      isFetchingMoreRef.current = false;
    }
  }, [reelMode, hasMore]);

  useEffect(() => {
    loadReelsFeed();
  }, [loadReelsFeed]);

  // Infinite scroll trigger: prefetch & load next page when user reaches near end
  useEffect(() => {
    if (reels.length === 0) return;
    if (currentIndex >= reels.length - 3 && !isLoadingMore && hasMore) {
      loadMoreReels(currentPage + 1);
    }
  }, [currentIndex, reels.length, isLoadingMore, hasMore, currentPage, loadMoreReels]);

  // 2. Intelligent Prefetch Engine: Prefetches stream for active reel, next (+1), and next-next (+2)
  const prefetchStreamForIndex = useCallback(async (index: number) => {
    if (!reels[index]) return;
    const anime = reels[index];

    // If item is a trailer, skip HLS API prefetch
    if (anime.isTrailer || anime.youtubeId) {
      return null;
    }

    const key = anime.slug || anime.id;

    if (streamCacheRef.current.has(key)) {
      return streamCacheRef.current.get(key);
    }

    try {
      const slug = anime.slug || (anime.id.startsWith('slug-') ? anime.id.replace('slug-', '') : undefined);
      const malId = anime.malId || (anime.id.startsWith('anime-') ? anime.id.replace('anime-', '') : undefined);

      const streamResult = await fetchAnimeStream({
        slug,
        malId,
        episode: anime.episodeNumber || 1,
        preferredServer: 'hd-1'
      });

      if (streamResult && streamResult.streamUrl) {
        streamCacheRef.current.set(key, streamResult);
        setPrefetchStatus(prev => ({ ...prev, [key]: true }));
        return streamResult;
      }
    } catch (err) {
      console.warn(`Prefetch failed for ${anime.title}:`, err);
    }
    return null;
  }, [reels, reelMode]);

  // Trigger prefetch on index change: current, next 2 items, and previous 1
  useEffect(() => {
    if (reels.length === 0) return;

    // Current item
    prefetchStreamForIndex(currentIndex);

    // Next item (+1)
    if (currentIndex + 1 < reels.length) {
      prefetchStreamForIndex(currentIndex + 1);
    }

    // Next-next item (+2) for ultra-fast instant playback
    if (currentIndex + 2 < reels.length) {
      prefetchStreamForIndex(currentIndex + 2);
    }

    // Previous item (-1)
    if (currentIndex - 1 >= 0) {
      prefetchStreamForIndex(currentIndex - 1);
    }
  }, [currentIndex, reels, prefetchStreamForIndex]);

  // 3. Video.js Player Setup & Stream Synchronization
  const currentAnime = reels[currentIndex];

  useEffect(() => {
    currentAnimeRef.current = currentAnime;
  }, [currentAnime]);

  useEffect(() => {
    reelModeRef.current = reelMode;
  }, [reelMode]);

  const handleSeekToMidpoint = useCallback(() => {
    if (!playerRef.current || hasSeekedToMiddleRef.current || reelMode !== 'anireels') return;
    const player = playerRef.current;
    const dur = player.duration() || 0;

    // Calculate midpoint of episode (e.g. 24 min episode = 1440s -> 720s midpoint)
    const midPoint = dur > 60 ? Math.floor(dur / 2) : 720;
    clipStartTimeRef.current = midPoint;
    clipEndTimeRef.current = midPoint + 30;
    hasSeekedToMiddleRef.current = true;

    try {
      player.currentTime(midPoint);
    } catch (err) {
      console.warn('Seek to middle failed:', err);
    }
  }, [reelMode]);

  const handleReplayClip = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsClipEnded(false);
    hasSeekedToMiddleRef.current = false;

    if (!currentAnime || !playerRef.current) return;
    const player = playerRef.current;
    const key = currentAnime.slug || currentAnime.id;
    const streamData = streamCacheRef.current.get(key);

    if (streamData && streamData.streamUrl) {
      player.src({
        src: streamData.streamUrl,
        type: 'application/x-mpegURL',
      });
      player.muted(isMuted);
      player.volume(volume);

      const startSec = clipStartTimeRef.current || 720;
      clipEndTimeRef.current = startSec + 30;
      hasSeekedToMiddleRef.current = true;

      player.currentTime(startSec);
      player.play().then(() => {
        setIsPlaying(true);
        setIsVideoReady(true);
      }).catch(console.warn);
    }
  };

  useEffect(() => {
    if (!currentAnime) return;

    let isCancelled = false;
    setCurrentTime(0);
    setIsClipEnded(false);
    hasSeekedToMiddleRef.current = false;
    clipStartTimeRef.current = 0;
    clipEndTimeRef.current = 0;

    // If active item is a trailer / YouTube video, skip Video.js setup
    if (currentAnime.isTrailer || currentAnime.youtubeId) {
      if (playerRef.current) {
        try {
          playerRef.current.pause();
        } catch (e) {
          // Ignore
        }
      }
      setIsBuffering(false);
      setIsVideoReady(true);
      setIsPlaying(true);
      setStreamError(null);
      return;
    }

    setIsBuffering(true);
    setIsVideoReady(false);
    setStreamError(null);

    const setupPlayer = async () => {
      const key = currentAnime.slug || currentAnime.id;
      let streamData = streamCacheRef.current.get(key);

      if (!streamData) {
        streamData = await prefetchStreamForIndex(currentIndex);
      }

      if (isCancelled) return;

      if (!streamData || !streamData.streamUrl) {
        setStreamError('Could not resolve stream source for this reel.');
        setIsBuffering(false);
        setIsVideoReady(false);
        return;
      }

      const streamUrl = streamData.streamUrl;

      if (!videoRef.current) return;

      // Initialize or reuse Video.js player instance
      if (!playerRef.current) {
        playerRef.current = videojs(videoRef.current, {
          controls: false,
          autoplay: true,
          muted: isMuted,
          preload: 'auto',
          fluid: true,
          playsinline: true,
          loadingSpinner: false,
          bigPlayButton: false,
          controlBar: false,
          errorDisplay: false,
          textTrackDisplay: false,
          html5: {
            vhs: {
              overrideNative: true,
              enableLowInitialPlaylist: true,
              smoothQualityChange: true,
            },
          },
        });

        playerRef.current.on('loadedmetadata', handleSeekToMidpoint);

        playerRef.current.on('timeupdate', () => {
          if (playerRef.current) {
            const cur = playerRef.current.currentTime() || 0;
            const dur = playerRef.current.duration() || 0;
            setCurrentTime(cur);
            setDuration(dur);
            if (cur > 0.1) {
              setIsVideoReady(true);
            }

            if (reelModeRef.current === 'anireels') {
              if (!hasSeekedToMiddleRef.current && dur > 0) {
                handleSeekToMidpoint();
              }

              // 30-Second Clip End Limit check: record shown blur state and auto-repeat
              if (clipEndTimeRef.current > 0 && cur >= clipEndTimeRef.current) {
                const anime = currentAnimeRef.current;
                const key = anime ? (anime.slug || anime.id) : '';
                if (key) {
                  setShownBlurMap(prev => ({ ...prev, [key]: true }));
                }
                const startTime = clipStartTimeRef.current > 0 ? clipStartTimeRef.current : 0;
                try {
                  playerRef.current.currentTime(startTime);
                  playerRef.current.play().catch(() => {});
                } catch (_) {}
                setIsPlaying(true);
                setIsClipEnded(false);
              }
            }
          }
        });

        playerRef.current.on('waiting', () => setIsBuffering(true));
        playerRef.current.on('playing', () => {
          setIsBuffering(false);
          setIsPlaying(true);
          setIsVideoReady(true);
        });
        playerRef.current.on('pause', () => setIsPlaying(false));
        playerRef.current.on('ended', () => {
          if (reelModeRef.current === 'anireels') {
            const anime = currentAnimeRef.current;
            const key = anime ? (anime.slug || anime.id) : '';
            if (key) {
              setShownBlurMap(prev => ({ ...prev, [key]: true }));
            }
            if (playerRef.current) {
              const startTime = clipStartTimeRef.current > 0 ? clipStartTimeRef.current : 0;
              try {
                playerRef.current.currentTime(startTime);
                playerRef.current.play().catch(() => {});
              } catch (_) {}
              setIsPlaying(true);
              setIsClipEnded(false);
            }
          } else {
            handleNextReelRef.current();
          }
        });
        playerRef.current.on('error', () => {
          setIsBuffering(false);
          setIsVideoReady(false);
          setStreamError('Playback interrupted. Please try again.');
        });
      }

      const player = playerRef.current;
      try {
        player.pause();
      } catch (e) {
        // Ignore
      }

      player.src({
        src: streamUrl,
        type: 'application/x-mpegURL',
      });
      player.load();

      player.muted(isMuted);
      player.volume(volume);

      player.play().then(() => {
        setIsPlaying(true);
        setIsVideoReady(true);
        handleSeekToMidpoint();
      }).catch(() => {
        // Autoplay may need user interaction if unmuted
        setIsPlaying(false);
      });
      setIsBuffering(false);
    };

    setupPlayer();

    return () => {
      isCancelled = true;
    };
  }, [currentIndex, currentAnime, prefetchStreamForIndex, handleSeekToMidpoint, reelMode]);

  // Clean up player on unmount
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  // Navigation handlers
  const handleNextReel = () => {
    if (currentIndex < reels.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      showToast('You reached the end of the reel queue! Shuffling fresh anime...');
      handleShuffleReels();
    }
  };

  const handlePrevReel = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  useEffect(() => {
    handleNextReelRef.current = handleNextReel;
  }, [handleNextReel]);

  const [tapAnim, setTapAnim] = useState<{ type: 'play' | 'pause'; key: number } | null>(null);
  const lastTapTimeRef = useRef<number>(0);

  // Re-randomize algorithm
  const handleShuffleReels = () => {
    if (reels.length === 0) return;
    const randomized = shuffleArray(reels);
    setReels(randomized);
    setCurrentIndex(0);
    showToast('AniReels queue shuffled with random anime!');
  };

  // Play / Pause toggle on click or tap gesture
  const togglePlayPause = () => {
    if (hasMovedSignificantly.current) return;
    const now = Date.now();
    if (now - lastTapTimeRef.current < 200) return; // lower threshold for snappier feedback
    lastTapTimeRef.current = now;

    if (isClipEnded) {
      handleReplayClip();
      return;
    }
    if (!playerRef.current) return;

    const newKey = now;
    if (isPlaying) {
      try {
        playerRef.current.pause();
      } catch (_) {}
      setIsPlaying(false);
      setTapAnim({ type: 'play', key: newKey });
    } else {
      playerRef.current.play().then(() => {
        setIsPlaying(true);
        setTapAnim({ type: 'pause', key: newKey });
      }).catch(console.warn);
    }

    setTimeout(() => {
      setTapAnim(prev => prev?.key === newKey ? null : prev);
    }, 750);
  };

  // Mute / Unmute toggle
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!playerRef.current) return;
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    playerRef.current.muted(newMuted);
  };

  // Like interaction with double tap or button
  const handleLike = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (hasMovedSignificantly.current) return;
    if (!currentAnime) return;

    const key = currentAnime.slug || currentAnime.id;
    const isLiked = likedMap[key];
    const epNum = currentAnime.episodeNumber || 1;

    toggleLikedEpisode({
      animeId: currentAnime.id,
      animeTitle: currentAnime.title,
      episodeNumber: epNum,
      formattedTitle: `${currentAnime.title}: EP ${epNum}`,
      thumbnail: currentAnime.poster || currentAnime.thumbnail,
      slug: currentAnime.slug,
      malId: currentAnime.malId,
      streamUrl: currentAnime.streamUrl,
      channel: currentAnime.channel,
    });

    setLikedMap(prev => ({ ...prev, [key]: !isLiked }));
    setLikeCounts(prev => ({
      ...prev,
      [key]: (prev[key] || 0) + (isLiked ? -1 : 1)
    }));

    if (!isLiked) {
      setShowHeartAnim(true);
      setTimeout(() => setShowHeartAnim(false), 900);
    }
  };

  // Save / Bookmark to Watch Later
  const handleToggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentAnime) return;
    const key = currentAnime.slug || currentAnime.id;
    const isSaved = savedMap[key];
    toggleWatchLater(currentAnime);
    setSavedMap(prev => ({ ...prev, [key]: !isSaved }));
    showToast(isSaved ? 'Removed from Watch Later' : 'Added to Watch Later');
  };

  // Share action
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentAnime) return;
    const shareUrl = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      showToast('AniReel link copied to clipboard!');
    } else {
      showToast(`Sharing: ${currentAnime.title}`);
    }
  };

  // Watch Full Anime in Main Player
  const handleWatchFullAnime = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentAnime) return;
    onSelectVideo(currentAnime);
  };

  // Realtime Drag & Swipe Gesture Event Handlers (TikTok / Mobile physics)
  const handlePointerDown = (e: React.PointerEvent) => {
    // Ignore drag if clicking inside interactive overlay buttons or modals
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('.no-drag') || showInfoModal) {
      return;
    }

    dragStartY.current = e.clientY;
    dragStartTime.current = Date.now();
    hasMovedSignificantly.current = false;
    setIsDragging(true);
    setIsTransitioning(false);

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch (_) {}
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaY = e.clientY - dragStartY.current;

    if (Math.abs(deltaY) > 8) {
      hasMovedSignificantly.current = true;
    }

    // Apply elastic boundary resistance if at top of queue or end of queue
    let effectiveDelta = deltaY;
    if (currentIndex === 0 && deltaY > 0) {
      effectiveDelta = deltaY * 0.32;
    } else if (currentIndex === reels.length - 1 && deltaY < 0) {
      effectiveDelta = deltaY * 0.32;
    }

    setDragOffsetY(effectiveDelta);
  };

  const handlePointerUpOrCancel = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (_) {}

    const deltaY = e.clientY - dragStartY.current;
    const elapsed = Math.max(1, Date.now() - dragStartTime.current);
    const velocity = deltaY / elapsed; // px per ms
    const containerHeight = containerRef.current?.clientHeight || 650;

    // Tap gesture check: if user tapped without dragging significantly
    if (!hasMovedSignificantly.current && Math.abs(deltaY) < 12) {
      togglePlayPause();
      return;
    }

    // Fast flick velocity or distance threshold (> 70px)
    const isSwipedUp = (deltaY < -70 || velocity < -0.4) && currentIndex < reels.length - 1;
    const isSwipedDown = (deltaY > 70 || velocity > 0.4) && currentIndex > 0;

    if (isSwipedUp) {
      // Transition to next reel
      setIsTransitioning(true);
      setDragOffsetY(-containerHeight);
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setDragOffsetY(0);
        setIsTransitioning(false);
        hasMovedSignificantly.current = false;
      }, 260);
    } else if (isSwipedDown) {
      // Transition to previous reel
      setIsTransitioning(true);
      setDragOffsetY(containerHeight);
      setTimeout(() => {
        setCurrentIndex(prev => prev - 1);
        setDragOffsetY(0);
        setIsTransitioning(false);
        hasMovedSignificantly.current = false;
      }, 260);
    } else {
      // Spring back to center
      setIsTransitioning(true);
      setDragOffsetY(0);
      setTimeout(() => {
        setIsTransitioning(false);
        hasMovedSignificantly.current = false;
      }, 260);
    }
  };

  // Keyboard navigation (ArrowUp, ArrowDown, Spacebar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        handleNextReel();
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        handlePrevReel();
      } else if (e.key === ' ' && !showInfoModal) {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === 'm' || e.key === 'M') {
        if (playerRef.current) {
          const newMuted = !isMuted;
          setIsMuted(newMuted);
          playerRef.current.muted(newMuted);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, reels.length, isPlaying, isMuted, showInfoModal]);

  const activeKey = currentAnime ? (currentAnime.slug || currentAnime.id) : '';
  const isCurrentPrefetched = prefetchStatus[activeKey];
  const hasShownBlurForCurrent = activeKey ? !!shownBlurMap[activeKey] : false;

  const clipElapsed = Math.max(0, currentTime - (clipStartTimeRef.current || 720));
  const clipProgressPercent = Math.min(100, Math.max(0, (clipElapsed / 30) * 100));
  const progressPercent = (reelMode === 'anireels' && clipStartTimeRef.current > 0)
    ? clipProgressPercent
    : (duration > 0 ? (currentTime / duration) * 100 : 0);

  // Fade in blur overlay 2 seconds before clip ends ONCE per reel (never during swipe/drag)
  const isNearClipEnd = reelMode === 'anireels' &&
    isVideoReady &&
    !hasShownBlurForCurrent &&
    !isTransitioning &&
    !isDragging &&
    (
      isClipEnded ||
      (clipEndTimeRef.current > 0 && currentTime >= clipEndTimeRef.current - 2)
    );

  const prevAnime = currentIndex > 0 ? reels[currentIndex - 1] : null;
  const nextAnime = currentIndex < reels.length - 1 ? reels[currentIndex + 1] : null;

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-2 sm:p-4 overflow-hidden select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-neutral-900/95 border border-white/20 text-white text-xs font-medium shadow-2xl backdrop-blur-md flex items-center gap-2 animate-fade-in">
          <Sparkles className="w-4 h-4 text-pink-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="w-full max-w-xl mx-auto flex items-center justify-between px-2 py-2 mb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onBackToHome}
            className="p-2 rounded-xl bg-[#1c1c1c] hover:bg-[#282828] text-gray-300 hover:text-white transition-colors cursor-pointer border border-white/5"
            title="Back to Home"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          {/* Title Header */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#181818] border border-white/10 shadow-lg text-xs font-bold text-white">
            <Film className="w-3.5 h-3.5 text-pink-500" />
            <span>AniReels</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {reels.length > 0 && (
            <span className="text-xs text-gray-400 font-mono bg-[#1c1c1c] px-2.5 py-1 rounded-lg border border-white/5">
              {currentIndex + 1} / {reels.length}
            </span>
          )}
          <button
            onClick={handleShuffleReels}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#202020] hover:bg-[#2c2c2c] text-xs text-gray-200 hover:text-white border border-white/10 transition-all cursor-pointer shadow-sm active:scale-95"
            title="Shuffle and randomize queue"
          >
            <Shuffle className="w-3.5 h-3.5 text-pink-400" />
            <span className="hidden sm:inline">Shuffle</span>
          </button>
        </div>
      </div>

      {/* Main Reels Viewport with Realtime Drag & Swipe Gestures */}
      {isLoadingFeed ? (
        <div className="w-full max-w-md sm:max-w-lg aspect-[9/16] max-h-[78vh] rounded-3xl bg-[#141414] border border-[#262626] flex flex-col items-center justify-center shadow-2xl p-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-pink-950/50 border border-pink-800/40 flex items-center justify-center text-pink-400 animate-pulse">
            <Film className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Loading AniReels Feed...</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-xs">
              Randomizing anime episodes and preparing prefetch stream pipeline.
            </p>
          </div>
          <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
        </div>
      ) : feedError ? (
        <div className="w-full max-w-md aspect-[9/16] max-h-[78vh] rounded-3xl bg-[#141414] border border-[#262626] flex flex-col items-center justify-center p-6 text-center space-y-4 shadow-2xl">
          <AlertCircle className="w-10 h-10 text-rose-500" />
          <div>
            <h3 className="text-base font-bold text-white">Could not load reels</h3>
            <p className="text-xs text-gray-400 mt-1">{feedError}</p>
          </div>
          <button
            onClick={loadReelsFeed}
            className="px-5 py-2 rounded-full bg-white text-black text-xs font-bold hover:bg-gray-200 transition-colors cursor-pointer"
          >
            Retry Feed
          </button>
        </div>
      ) : currentAnime ? (
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUpOrCancel}
          onPointerCancel={handlePointerUpOrCancel}
          style={{ touchAction: 'none' }}
          className="relative w-full max-w-md sm:max-w-lg aspect-[9/16] max-h-[78vh] rounded-3xl overflow-hidden bg-black border border-[#242424] shadow-2xl flex items-center justify-center group cursor-grab active:cursor-grabbing select-none"
        >
          {/* 1. PREVIOUS REEL CARD (Visible in realtime drag downwards) */}
          {prevAnime && (
            <div
              className="absolute inset-0 z-0 overflow-hidden bg-black flex items-center justify-center"
              style={{
                transform: `translateY(calc(-100% + ${dragOffsetY}px))`,
                transition: isDragging ? 'none' : isTransitioning ? 'transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none'
              }}
            >
              <FadeImage
                src={prevAnime.poster || prevAnime.thumbnail}
                alt={prevAnime.title}
                className="w-full h-full object-cover filter brightness-75"
                containerClassName="w-full h-full"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black via-black/30 to-black/60" />
              <div className="absolute bottom-6 left-4 right-4 z-10 text-white">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-600 text-white uppercase tracking-wider mb-1 inline-block">
                  EP {prevAnime.episodeNumber || 1}
                </span>
                <h3 className="text-sm font-bold truncate drop-shadow-md">{prevAnime.title}</h3>
              </div>
            </div>
          )}

          {/* 2. CURRENT ACTIVE REEL CARD (Follows touch/pointer in real-time) */}
          <div
            className="absolute inset-0 z-10 overflow-hidden bg-black flex items-center justify-center"
            style={{
              transform: `translateY(${dragOffsetY}px)`,
              transition: isDragging ? 'none' : isTransitioning ? 'transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none'
            }}
          >
            {/* Background Ambient Poster */}
            <div className="absolute inset-0 overflow-hidden opacity-30 pointer-events-none">
              <FadeImage
                src={currentAnime.poster || currentAnime.thumbnail}
                alt={currentAnime.title}
                className="w-full h-full object-cover filter blur-2xl scale-125"
                containerClassName="w-full h-full"
              />
              <div className="absolute inset-0 bg-black/50" />
            </div>

            {/* Video Player Surface */}
            <div 
              onClick={togglePlayPause} 
              onDoubleClick={handleLike}
              className="relative z-10 w-full h-full flex items-center justify-center"
            >
              {currentAnime.isTrailer || currentAnime.youtubeId ? (
                <div className="w-full h-full relative bg-black flex items-center justify-center overflow-hidden">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${currentAnime.youtubeId}?autoplay=1&mute=${isMuted ? 1 : 0}&enablejsapi=1&rel=0&controls=1&modestbranding=1&playsinline=1`}
                    title={currentAnime.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    className="w-full h-full object-cover border-0 pointer-events-none z-10"
                  />
                  {/* Transparent Mobile & Desktop Touch Gesture Layer over iframe */}
                  <div
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUpOrCancel}
                    onPointerCancel={handlePointerUpOrCancel}
                    onClick={togglePlayPause}
                    onDoubleClick={handleLike}
                    className="absolute inset-0 z-20 touch-none bg-transparent cursor-grab active:cursor-grabbing"
                  />
                </div>
              ) : (
                <div data-vjs-player className="w-full h-full flex items-center justify-center pointer-events-none">
                  <video
                    ref={videoRef}
                    className="video-js vjs-default-skin w-full h-full object-cover"
                    playsInline
                  />
                </div>
              )}

              {/* Tap Pause / Play Center Pulse Feedback */}
              {tapAnim && (
                <div className="absolute inset-0 flex items-center justify-center z-45 pointer-events-none">
                  <div key={tapAnim.key} className="animate-tap-feedback flex items-center justify-center">
                    {tapAnim.type === 'pause' ? (
                      <Pause className="w-10 h-10 text-white fill-current drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]" />
                    ) : (
                      <Play className="w-10 h-10 text-white fill-current drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]" />
                    )}
                  </div>
                </div>
              )}

              {/* Double Tap Heart Floating Animation */}
              {showHeartAnim && (
                <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
                  <div className="w-24 h-24 rounded-full bg-pink-600/90 flex items-center justify-center text-white shadow-2xl animate-ping">
                    <Heart className="w-14 h-14 fill-current text-white" />
                  </div>
                </div>
              )}

              {/* Stream Error Notice */}
              {streamError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-black/90 backdrop-blur-md z-35 text-center space-y-3 no-drag">
                  <AlertCircle className="w-10 h-10 text-rose-500" />
                  <div>
                    <h4 className="text-sm font-bold text-white">Playback Error</h4>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs">{streamError}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        prefetchStreamForIndex(currentIndex);
                      }}
                      className="px-4 py-1.5 rounded-full bg-[#2a2a2a] hover:bg-[#383838] text-white text-xs font-semibold cursor-pointer"
                    >
                      Retry
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNextReel();
                      }}
                      className="px-4 py-1.5 rounded-full bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold cursor-pointer"
                    >
                      Next Reel
                    </button>
                  </div>
                </div>
              )}
              {/* 30-Second Midpoint Clip Finished / 2-Second Fade-In Blur Overlay */}
              {reelMode === 'anireels' && (
                <div
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUpOrCancel}
                  onPointerCancel={handlePointerUpOrCancel}
                  className={`absolute inset-0 z-40 bg-black/85 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center space-y-3 transition-opacity duration-700 ease-in-out ${
                    isNearClipEnd ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                  }`}
                >
                  {/* Ambient Blurred Background Poster */}
                  <div className="absolute inset-0 overflow-hidden opacity-40 pointer-events-none">
                    <FadeImage
                      src={currentAnime.poster || currentAnime.thumbnail}
                      alt={currentAnime.title}
                      className="w-full h-full object-cover filter blur-3xl scale-125"
                      containerClassName="w-full h-full"
                    />
                    <div className="absolute inset-0 bg-black/60" />
                  </div>

                  <div className="relative z-10 flex flex-col items-center max-w-xs space-y-4">
                    {/* Poster Image */}
                    <div className="w-28 h-40 rounded-2xl overflow-hidden border border-white/20 shadow-2xl shrink-0 group hover:scale-105 transition-all">
                      <FadeImage
                        src={currentAnime.poster || currentAnime.thumbnail}
                        alt={currentAnime.title}
                        className="w-full h-full object-cover"
                        containerClassName="w-full h-full"
                      />
                    </div>

                    <div className="space-y-1">
                      {/* Anime Title */}
                      <h3 className="text-base sm:text-lg font-extrabold text-white line-clamp-2 leading-snug drop-shadow-md">
                        {currentAnime.title}
                      </h3>
                      
                      {/* Episode Info */}
                      <p className="text-xs text-pink-400 font-extrabold tracking-wide uppercase">
                        Episode {currentAnime.episodeNumber || 1}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 flex flex-col items-center gap-2 w-full">
                      <button
                        onClick={handleWatchFullAnime}
                        className="w-full py-3 px-5 rounded-xl bg-linear-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer active:scale-95"
                      >
                        <Tv className="w-4 h-4" />
                        <span>Watch Now</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Top Controls (Mute Toggle) - Hidden when near clip end */}
            {!isNearClipEnd && (
              <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-end pointer-events-none transition-opacity duration-300">
                <button
                  onClick={toggleMute}
                  className="p-2.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white transition-all pointer-events-auto cursor-pointer shadow-lg active:scale-90"
                  title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-white" />}
                </button>
              </div>
            )}

            {/* Bottom Info Overlay - Hidden when near clip end */}
            {!currentAnime.isTrailer && !isNearClipEnd && (
              <div className="absolute left-0 right-4 bottom-0 p-4 z-30 bg-linear-to-t from-black via-black/80 to-transparent pointer-events-none space-y-1.5 transition-opacity duration-300">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-wider bg-pink-600 text-white shadow-md">
                    EP {currentAnime.episodeNumber || 1}
                  </span>
                </div>

                {/* Anime Title */}
                <h2 className="text-sm sm:text-base font-bold text-white drop-shadow-lg line-clamp-2 leading-snug">
                  {currentAnime.title}
                </h2>

                {/* Watch Full Anime Button */}
                <div className="pt-0.5 pointer-events-auto">
                  <button
                    onClick={handleWatchFullAnime}
                    className="text-xs px-3.5 py-1.5 rounded-full font-extrabold transition-all shadow-lg cursor-pointer bg-white hover:bg-gray-200 text-black flex items-center gap-1.5"
                  >
                    <Tv className="w-3.5 h-3.5" />
                    <span>Watch Full</span>
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Progress Scrubber Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-40">
              <div
                className="h-full bg-pink-500 transition-all duration-150"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Info Details Modal / Bottom Sheet */}
            {showInfoModal && (
              <div 
                onClick={(e) => e.stopPropagation()} 
                className="absolute inset-x-0 bottom-0 z-50 p-5 rounded-t-3xl bg-[#141414]/95 border-t border-white/20 backdrop-blur-xl shadow-2xl max-h-[60%] overflow-y-auto space-y-3 animate-fade-in no-drag"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-pink-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-white">Anime Synopsis</span>
                  </div>
                  <button
                    onClick={() => setShowInfoModal(false)}
                    className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded bg-[#242424] cursor-pointer"
                  >
                    Close
                  </button>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed">
                  {currentAnime.description || 'No description available for this anime series.'}
                </p>

                <div className="pt-2 flex items-center justify-between">
                  <div className="text-[11px] text-gray-400">
                    Total Episodes: <span className="text-white font-semibold">{currentAnime.totalEpisodes || 'N/A'}</span>
                  </div>
                  <button
                    onClick={handleWatchFullAnime}
                    className="px-4 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold shadow-lg transition-all cursor-pointer"
                  >
                    Open Full Series Player
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 4. NEXT REEL CARD (Visible in realtime drag upwards) */}
          {nextAnime && (
            <div
              className="absolute inset-0 z-0 overflow-hidden bg-black flex items-center justify-center"
              style={{
                transform: `translateY(calc(100% + ${dragOffsetY}px))`,
                transition: isDragging ? 'none' : isTransitioning ? 'transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none'
              }}
            >
              <FadeImage
                src={nextAnime.poster || nextAnime.thumbnail}
                alt={nextAnime.title}
                className="w-full h-full object-cover filter brightness-75"
                containerClassName="w-full h-full"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black via-black/30 to-black/60" />
              <div className="absolute bottom-6 left-4 right-4 z-10 text-white">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-600 text-white uppercase tracking-wider mb-1 inline-block">
                  EP {nextAnime.episodeNumber || 1}
                </span>
                <h3 className="text-sm font-bold truncate drop-shadow-md">{nextAnime.title}</h3>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Floating Vertical Navigation Arrows (Desktop / Tablet) */}
      <div className="fixed right-6 sm:right-10 top-1/2 -translate-y-1/2 hidden md:flex flex-col items-center gap-3 z-40">
        <button
          onClick={handlePrevReel}
          disabled={currentIndex === 0}
          className={`w-10 h-10 rounded-full flex items-center justify-center bg-[#1e1e1e] border border-white/10 text-white transition-all shadow-xl ${
            currentIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-pink-600 hover:scale-110 cursor-pointer'
          }`}
          title="Previous Reel (Arrow Up / K)"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
        <button
          onClick={handleNextReel}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-[#1e1e1e] border border-white/10 text-white hover:bg-pink-600 hover:scale-110 transition-all shadow-xl cursor-pointer"
          title="Next Reel (Arrow Down / J)"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
