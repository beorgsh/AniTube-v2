import { useState, useMemo, useEffect, useRef, useCallback, Fragment } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { FilterBar } from './components/FilterBar';
import { VideoCard } from './components/VideoCard';
import { VideoCardSkeleton } from './components/VideoCardSkeleton';
import { GenreListSkeleton } from './components/GenreListSkeleton';
import { WatchView } from './components/WatchView';
import { AnimeHorizontalSlider } from './components/AnimeHorizontalSlider';
import { AnimeCategoryView } from './components/AnimeCategoryView';
import { ReelsView } from './components/ReelsView';
import { HomeReelsShelf } from './components/HomeReelsShelf';
import { AniNewsView } from './components/AniNewsView';
import { SavedListView } from './components/SavedListView';
import { WatchHistoryView } from './components/WatchHistoryView';
import { LandingPage } from './components/LandingPage';
import { AvatarSetupModal } from './components/AvatarSetupModal';
import { VoiceSearchModal } from './components/VoiceSearchModal';
import { DeveloperPanel } from './components/DeveloperPanel';
import { AnimeProfileModal } from './components/AnimeProfileModal';
import { devLogger } from './services/devLogger';
import { MOCK_VIDEOS, CATEGORIES } from './data/mockVideos';
import { Video, ViewMode } from './types';
import { 
  fetchRecentAnime, 
  fetchPopularAnime, 
  fetchLatestEpisodes, 
  fetchOngoingAnime, 
  fetchUpcomingAnime, 
  fetchCompletedAnime,
  fetchAnimeByGenre 
} from './services/animeApi';
import { 
  getWatchLaterList, 
  getLikedEpisodesList, 
  getWatchHistoryList,
  addToWatchHistory,
  getUserProfile,
  saveUserProfile,
  getHasVisitedLanding,
  setHasVisitedLanding,
  UserProfile,
  LikedEpisodeItem 
} from './services/sessionStorage';
import { History, Tv, RefreshCw, Loader2, Sparkles, AlertCircle, Clock, ThumbsUp, ChevronRight, Shuffle } from 'lucide-react';
import { cleanAnimeTitleForSearch, filterAndRankSearchResults } from './utils/searchFilter';

export default function App() {
  const [activeView, setActiveView] = useState<ViewMode>('home');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);
  const [customVideos, setCustomVideos] = useState<Video[]>([]);

  // Landing & Profile Avatar State
  const [showLanding, setShowLanding] = useState<boolean>(() => !getHasVisitedLanding());
  const [userProfile, setUserProfile] = useState<UserProfile>(() => getUserProfile());
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState<boolean>(false);

  // Developer Mode Diagnostics State
  const [isDevMode, setIsDevMode] = useState<boolean>(() => devLogger.isDevMode());

  // Watch Later, Liked Items, and Watch History State from Session Storage
  const [watchLaterItems, setWatchLaterItems] = useState<Video[]>([]);
  const [likedItems, setLikedItems] = useState<LikedEpisodeItem[]>([]);
  const [watchHistoryItems, setWatchHistoryItems] = useState<Video[]>([]);


  // API Recent Anime State (Grid feed)
  const [apiVideos, setApiVideos] = useState<Video[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [totalApiCount, setTotalApiCount] = useState<number>(0);

  // Category Shelves State
  const [popularVideos, setPopularVideos] = useState<Video[]>([]);
  const [latestVideos, setLatestVideos] = useState<Video[]>([]);
  const [ongoingVideos, setOngoingVideos] = useState<Video[]>([]);
  const [upcomingVideos, setUpcomingVideos] = useState<Video[]>([]);
  const [completedVideos, setCompletedVideos] = useState<Video[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState<boolean>(true);

  // Dynamic Genre Fetching & Cache
  const [genreVideosCache, setGenreVideosCache] = useState<Record<string, Video[]>>({});
  const [genrePagination, setGenrePagination] = useState<Record<string, { page: number; totalPages: number; hasMore: boolean }>>({});
  const [isLoadingGenre, setIsLoadingGenre] = useState<boolean>(false);
  const [isLoadingMoreGenre, setIsLoadingMoreGenre] = useState<boolean>(false);

  // Search State
  const [searchResults, setSearchResults] = useState<Video[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Anime Profile Modal State
  const [profileVideo, setProfileVideo] = useState<Video | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // Selected Reel Video State for AniReels
  const [selectedReelVideo, setSelectedReelVideo] = useState<Video | null>(null);

  // Genre Portrait Blur Overlay Setting State
  const [isGenreBlurOverlay, setIsGenreBlurOverlay] = useState<boolean>(() => {
    try {
      return localStorage.getItem('anitube_genre_blur_overlay') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('anitube_genre_blur_overlay', String(isGenreBlurOverlay));
    } catch (e) {
      console.error('Failed to save genre blur overlay preference:', e);
    }
  }, [isGenreBlurOverlay]);

  // Sync Watch Later, Liked items & Watch History on mount and on storage events
  useEffect(() => {
    setWatchLaterItems(getWatchLaterList());
    setLikedItems(getLikedEpisodesList());
    setWatchHistoryItems(getWatchHistoryList());

    const handleStorageUpdate = () => {
      setWatchLaterItems(getWatchLaterList());
      setLikedItems(getLikedEpisodesList());
      setWatchHistoryItems(getWatchHistoryList());
      setUserProfile(getUserProfile());
    };

    const handleDevModeChange = (e: any) => {
      setIsDevMode(e.detail?.enabled ?? devLogger.isDevMode());
    };

    window.addEventListener('anitube_storage_update', handleStorageUpdate);
    window.addEventListener('anitube_dev_mode_changed', handleDevModeChange);
    return () => {
      window.removeEventListener('anitube_storage_update', handleStorageUpdate);
      window.removeEventListener('anitube_dev_mode_changed', handleDevModeChange);
    };
  }, []);

  // Sentinel ref for infinite scroll / lazy loading
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);

  // Fetch all category shelves
  const loadAllCategories = useCallback(async () => {
    setIsCategoriesLoading(true);
    try {
      const [popular, latest, ongoing, upcoming, completed] = await Promise.allSettled([
        fetchPopularAnime(),
        fetchLatestEpisodes(),
        fetchOngoingAnime(),
        fetchUpcomingAnime(),
        fetchCompletedAnime(),
      ]);

      if (popular.status === 'fulfilled') setPopularVideos(popular.value);
      if (latest.status === 'fulfilled') setLatestVideos(latest.value);
      if (ongoing.status === 'fulfilled') setOngoingVideos(ongoing.value);
      if (upcoming.status === 'fulfilled') setUpcomingVideos(upcoming.value);
      if (completed.status === 'fulfilled') setCompletedVideos(completed.value);
    } catch (err) {
      console.warn('Error fetching anime categories:', err);
    } finally {
      setIsCategoriesLoading(false);
    }
  }, []);

  // Fetch a specific page of recent anime (copying genre loading logic for initial load: pages 1 & 2)
  const loadAnimePage = useCallback(async (pageToLoad: number, isInitial = false) => {
    if (isInitial) {
      setIsInitialLoading(true);
      setApiError(null);
      try {
        const [res1, res2] = await Promise.allSettled([
          fetchRecentAnime(1, 10),
          fetchRecentAnime(2, 10),
        ]);

        let combinedVideos: Video[] = [];
        let maxTotalPages = 1;
        let totalCount = 0;

        if (res1.status === 'fulfilled' && res1.value && res1.value.videos) {
          combinedVideos.push(...res1.value.videos);
          maxTotalPages = Math.max(maxTotalPages, res1.value.pagination?.total_pages || 1);
          totalCount = res1.value.pagination?.total || 0;
        }
        if (res2.status === 'fulfilled' && res2.value && res2.value.videos) {
          combinedVideos.push(...res2.value.videos);
          maxTotalPages = Math.max(maxTotalPages, res2.value.pagination?.total_pages || 1);
          totalCount = Math.max(totalCount, res2.value.pagination?.total || 0);
        }

        const seen = new Set();
        const uniqueVideos = combinedVideos.filter((v) => {
          if (seen.has(v.id)) return false;
          seen.add(v.id);
          return true;
        });

        setApiVideos(uniqueVideos);
        setCurrentPage(2);
        setTotalApiCount(totalCount);
        const inferredTotalPages = uniqueVideos.length >= 20 ? 3 : 2;
        const effectiveTotalPages = Math.max(maxTotalPages, inferredTotalPages);
        setHasMore(uniqueVideos.length > 0 && 2 < effectiveTotalPages);
        setApiError(null);
      } catch (err) {
        console.error('Error fetching recent anime from API (initial):', err);
        setApiError('Unable to load live recent anime from primary API. Displaying high-definition catalogue.');
      } finally {
        setIsInitialLoading(false);
      }
    } else {
      setIsLoadingMore(true);
      try {
        const response = await fetchRecentAnime(pageToLoad, 10);
        
        setApiVideos((prev) => {
          const existingIds = new Set(prev.map((v) => v.id));
          const newUnique = response.videos.filter((v) => !existingIds.has(v.id));
          return [...prev, ...newUnique];
        });

        setCurrentPage(response.pagination.page);
        setTotalApiCount(response.pagination.total);
        const apiTotalPages = response.pagination.total_pages || 1;
        const inferredTotalPages = response.videos.length >= 10 ? pageToLoad + 1 : pageToLoad;
        const effectiveTotalPages = Math.max(apiTotalPages, inferredTotalPages);
        setHasMore(response.videos.length > 0 && pageToLoad < effectiveTotalPages);
        setApiError(null);
      } catch (err) {
        console.error('Error fetching recent anime from API (more):', err);
      } finally {
        setIsLoadingMore(false);
      }
    }
  }, []);

  // Fetch next page of genre anime
  const loadMoreGenre = useCallback(async () => {
    if (selectedCategory === 'All' || isLoadingMoreGenre) return;
    const catLower = selectedCategory.toLowerCase();
    const pag = genrePagination[catLower] || { page: 2, totalPages: 10, hasMore: true };
    if (!pag.hasMore) return;

    const nextPage = pag.page + 1;
    setIsLoadingMoreGenre(true);
    try {
      const fetched = await fetchAnimeByGenre(catLower, nextPage);
      if (fetched && fetched.videos && fetched.videos.length > 0) {
        setGenreVideosCache((prev) => {
          const existing = prev[catLower] || [];
          const existingIds = new Set(existing.map((v) => v.id));
          const newUnique = fetched.videos.filter((v) => !existingIds.has(v.id));
          return { ...prev, [catLower]: [...existing, ...newUnique] };
        });
        setGenrePagination((prev) => ({
          ...prev,
          [catLower]: {
            page: nextPage,
            totalPages: fetched.totalPages || pag.totalPages,
            hasMore: nextPage < (fetched.totalPages || pag.totalPages),
          },
        }));
      } else {
        setGenrePagination((prev) => ({
          ...prev,
          [catLower]: { ...pag, hasMore: false },
        }));
      }
    } catch (e) {
      console.warn('Load more genre error:', e);
    } finally {
      setIsLoadingMoreGenre(false);
    }
  }, [selectedCategory, genrePagination, isLoadingMoreGenre]);

  // Combined video list (custom user streams + API recent anime, or fallback to mock catalogue)
  const allVideos = useMemo(() => {
    if (apiVideos.length > 0) {
      return [...customVideos, ...apiVideos];
    }
    if (popularVideos.length > 0) {
      return [...customVideos, ...popularVideos];
    }
    return [...customVideos, ...MOCK_VIDEOS];
  }, [customVideos, apiVideos, popularVideos]);

  // Perform search with Automatic Connected Filter & Multi-Source Ranking
  useEffect(() => {
    const performSearch = async () => {
      const trimmedQuery = searchQuery ? searchQuery.trim() : '';
      if (!trimmedQuery) {
        setSearchResults([]);
        setSearchError(null);
        return;
      }
      
      setIsSearching(true);
      setSearchError(null);
      try {
        const cleanQuery = cleanAnimeTitleForSearch(trimmedQuery) || trimmedQuery;
        const { fetchAnimeSearch } = await import('./services/animeApi');
        const results = await fetchAnimeSearch(cleanQuery);
        
        // Also match from existing loaded library/categories as instant candidates
        const localCandidates = allVideos.filter(v => v && v.title);
        const localFiltered = filterAndRankSearchResults<Video>(
          cleanQuery,
          localCandidates,
          (v) => v.title,
          (v) => v.slug || v.id,
          (v) => v.tags
        );

        // Merge API results + local catalog results without duplicates
        const combined = [...results.videos, ...localFiltered];
        const seenIds = new Set<string>();
        const uniqueCombined = combined.filter((item) => {
          const key = (item.slug || item.id || item.title).toLowerCase();
          if (seenIds.has(key)) return false;
          seenIds.add(key);
          return true;
        });

        // Final strict rank & filter
        const finalResults = filterAndRankSearchResults<Video>(
          cleanQuery,
          uniqueCombined,
          (v) => v.title,
          (v) => v.slug || v.id,
          (v) => v.tags
        );

        setSearchResults(finalResults);
      } catch (err: any) {
        console.error('Search error:', err);
        setSearchError(err.message || 'Failed to fetch search results.');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(performSearch, 400);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, allVideos]);

  // Initial load on mount
  useEffect(() => {
    loadAnimePage(1, true);
    loadAllCategories();
  }, [loadAnimePage, loadAllCategories]);

  // Lazy loading observer for pagination
  useEffect(() => {
    if (activeView !== 'home' || searchQuery.trim() !== '') {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting) {
          if (selectedCategory === 'All') {
            if (!isLoadingMore && hasMore) {
              loadAnimePage(currentPage + 1, false);
            }
          } else {
            const catLower = selectedCategory.toLowerCase();
            const pag = genrePagination[catLower] || { page: 2, totalPages: 10, hasMore: true };
            if (!isLoadingMoreGenre && pag.hasMore) {
              loadMoreGenre();
            }
          }
        }
      },
      {
        root: null,
        rootMargin: '400px',
        threshold: 0.1,
      }
    );

    const currentSentinel = loadMoreSentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [activeView, currentPage, hasMore, isLoadingMore, loadAnimePage, searchQuery, selectedCategory, genrePagination, isLoadingMoreGenre, loadMoreGenre]);

  // Effect to fetch genre catalogue when category is selected
  useEffect(() => {
    if (selectedCategory === 'All') return;
    const catLower = selectedCategory.toLowerCase();
    if (genreVideosCache[catLower]) return;

    async function loadGenre() {
      setIsLoadingGenre(true);
      try {
        const [res1, res2] = await Promise.allSettled([
          fetchAnimeByGenre(catLower, 1),
          fetchAnimeByGenre(catLower, 2),
        ]);

        let combinedVideos: Video[] = [];
        let maxTotalPages = 1;

        if (res1.status === 'fulfilled' && res1.value && res1.value.videos) {
          combinedVideos.push(...res1.value.videos);
          maxTotalPages = Math.max(maxTotalPages, res1.value.totalPages || 1);
        }
        if (res2.status === 'fulfilled' && res2.value && res2.value.videos) {
          combinedVideos.push(...res2.value.videos);
          maxTotalPages = Math.max(maxTotalPages, res2.value.totalPages || 1);
        }

        if (combinedVideos.length > 0) {
          const seen = new Set();
          const uniqueVideos = combinedVideos.filter((v) => {
            if (seen.has(v.id)) return false;
            seen.add(v.id);
            return true;
          });

          setGenreVideosCache((prev) => ({ ...prev, [catLower]: uniqueVideos }));
          setGenrePagination((prev) => ({
            ...prev,
            [catLower]: {
              page: 2,
              totalPages: maxTotalPages,
              hasMore: 2 < maxTotalPages,
            },
          }));
        }
      } catch (e) {
        console.warn('Genre load error:', e);
      } finally {
        setIsLoadingGenre(false);
      }
    }

    loadGenre();
  }, [selectedCategory, genreVideosCache]);

  // Strictly pure anime genres only (no studios, no channels, no non-genre tags)
  const dynamicCategories = useMemo(() => {
    return CATEGORIES;
  }, []);

  // Filtered video list based on category, dynamic genre API results, and search query
  const filteredVideos = useMemo(() => {
    if (selectedCategory === 'All') {
      return allVideos;
    }
    const catLower = selectedCategory.toLowerCase();
    const genreList = genreVideosCache[catLower] || [];
    if (genreList.length > 0) {
      return genreList;
    }

    // Fallback search in allVideos
    return allVideos.filter((video) => {
      return (
        video.category.toLowerCase() === catLower ||
        video.tags.some((t) => t.toLowerCase() === catLower)
      );
    });
  }, [allVideos, selectedCategory, genreVideosCache]);

  const isGenreLoading = selectedCategory !== 'All' && (isLoadingGenre || !genreVideosCache[selectedCategory.toLowerCase()]);

  // Available Category Reels
  const availableReels = useMemo(() => {
    return [
      {
        id: 'popular',
        title: 'Popular & Trending Anime',
        subtitle: 'Top rated anime series streaming worldwide',
        icon: 'flame' as const,
        videos: popularVideos,
        view: 'popular' as ViewMode,
      },
      {
        id: 'ongoing',
        title: 'Currently Airing & Ongoing Anime',
        subtitle: 'Simulcast episodes airing every week',
        icon: 'tv' as const,
        videos: ongoingVideos,
        view: 'ongoing' as ViewMode,
      },
      {
        id: 'latest',
        title: 'Latest Episode Releases',
        subtitle: 'Newly released anime episodes with sub & dub',
        icon: 'zap' as const,
        videos: latestVideos,
        view: 'latest' as ViewMode,
      },
      {
        id: 'upcoming',
        title: 'Upcoming Anime Releases',
        subtitle: 'Anticipated seasons and anime premieres',
        icon: 'calendar' as const,
        videos: upcomingVideos,
        view: 'upcoming' as ViewMode,
      },
      {
        id: 'completed',
        title: 'Completed Anime Series',
        subtitle: 'Complete anime collections ready to binge',
        icon: 'trophy' as const,
        videos: completedVideos,
        view: 'completed' as ViewMode,
      },
    ].filter((r) => r.videos.length > 0);
  }, [popularVideos, ongoingVideos, latestVideos, upcomingVideos, completedVideos]);

  // Reel Order Sequence (can be randomized or ordered)
  const [reelSequence, setReelSequence] = useState<string[]>([
    'popular',
    'ongoing',
    'latest',
    'upcoming',
    'completed',
  ]);

  // Shuffle / Randomize category reel sequence
  const randomizeReels = useCallback(() => {
    setReelSequence((prev) => {
      const copy = [...prev];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    });
  }, []);

  // Ordered list of active reels based on current reel sequence
  const orderedReels = useMemo(() => {
    const map = new Map(availableReels.map((r) => [r.id, r]));
    const result: typeof availableReels = [];
    reelSequence.forEach((id) => {
      const found = map.get(id);
      if (found) {
        result.push(found);
        map.delete(id);
      }
    });
    map.forEach((val) => result.push(val));
    return result;
  }, [availableReels, reelSequence]);

  // Batch videos per loaded page (10 per page) for interleaving category reels
  const videoBatches = useMemo(() => {
    const batchSize = 10;
    const batches: Video[][] = [];
    for (let i = 0; i < filteredVideos.length; i += batchSize) {
      batches.push(filteredVideos.slice(i, i + batchSize));
    }
    return batches;
  }, [filteredVideos]);

  const handleSelectVideo = (video: Video) => {
    setSelectedVideo(video);
    setActiveView('watch');
    setIsSidebarOpen(false);
    addToWatchHistory(video);
    setWatchHistoryItems(getWatchHistoryList());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectVideoWithEpisode = (video: Video, episodeNum: number) => {
    const updated = { ...video, episodeNumber: episodeNum, duration: `EP ${episodeNum}` };
    setSelectedVideo(updated);
    setActiveView('watch');
    setIsSidebarOpen(false);
    addToWatchHistory(updated);
    setWatchHistoryItems(getWatchHistoryList());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const handleHomeClick = () => {
    setSelectedVideo(null);
    setActiveView('home');
    setSelectedCategory('All');
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#f1f1f1] flex flex-col font-sans selection:bg-[#ff0000] selection:text-white">
      {showLanding ? (
        <LandingPage
          onGetStarted={() => setIsAvatarModalOpen(true)}
          onBrowseDirectly={() => {
            setHasVisitedLanding(true);
            setShowLanding(false);
          }}
        />
      ) : (
        <>
          {/* Top Navigation Bar */}
          <Header
            onToggleSidebar={handleToggleSidebar}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
            onHomeClick={handleHomeClick}
            onLogoClick={() => setShowLanding(true)}
            userProfile={userProfile}
            onOpenAvatarModal={() => setIsAvatarModalOpen(true)}
            isDevMode={isDevMode}
            onToggleDevMode={() => {
              const next = !isDevMode;
              devLogger.setDevMode(next);
              setIsDevMode(next);
            }}
            isGenreBlurOverlay={isGenreBlurOverlay}
            onToggleGenreBlurOverlay={() => setIsGenreBlurOverlay((prev) => !prev)}
          />

          {/* Main Layout Area */}
          <div className="flex flex-1 relative">
            {/* Sidebar */}
            <Sidebar
              isOpen={isSidebarOpen}
              activeView={activeView}
              onSelectView={(view) => {
                setActiveView(view);
                if (view !== 'watch') {
                  setSelectedVideo(null);
                }
              }}
              onSelectCategory={(cat) => {
                setSelectedCategory(cat);
                setActiveView('home');
                setSelectedVideo(null);
              }}
              onSelectVideo={handleSelectVideo}
              onClose={() => setIsSidebarOpen(false)}
              selectedCategory={selectedCategory}
              isWatchPage={activeView === 'watch'}
            />

            {/* Content Body */}
            <main className="flex-1 min-w-0 bg-[#0f0f0f]">

          {/* Watch View */}
          {activeView === 'watch' && selectedVideo && (
            <WatchView
              video={selectedVideo}
              allVideos={allVideos}
              onSelectVideo={handleSelectVideo}
              onSelectGenre={(genre) => {
                setSelectedCategory(genre);
                setActiveView('home');
                setSelectedVideo(null);
              }}
            />
          )}

          {/* AniReels Vertical Shorts Experience */}
          {activeView === 'reels' && (
            <ReelsView
              onSelectVideo={handleSelectVideo}
              onBackToHome={handleHomeClick}
              initialVideo={selectedReelVideo}
              initialReelMode="anireels"
            />
          )}

          {/* AniTrail Anime Trailers Reels Experience */}
          {activeView === 'anitrail' && (
            <ReelsView
              onSelectVideo={handleSelectVideo}
              onBackToHome={handleHomeClick}
              initialVideo={selectedReelVideo}
              initialReelMode="anitrail"
            />
          )}

          {/* Popular & Trending Dedicated View */}
          {(activeView === 'popular' || activeView === 'trending') && (
            <AnimeCategoryView
              category="popular"
              title="Popular & Trending Anime"
              subtitle="Most-watched and highly rated anime series synced from Anikoto API"
              videos={popularVideos}
              isLoading={isCategoriesLoading}
              onSelectVideo={handleSelectVideo}
              onSelectInfo={(video) => {
                setProfileVideo(video);
                setIsProfileModalOpen(true);
              }}
              onBackToHome={handleHomeClick}
            />
          )}

          {/* Latest Episodes Dedicated View */}
          {activeView === 'latest' && (
            <AnimeCategoryView
              category="latest"
              title="Latest Episode Releases"
              subtitle="Freshly updated subbed and dubbed anime episodes"
              videos={latestVideos}
              isLoading={isCategoriesLoading}
              onSelectVideo={handleSelectVideo}
              onSelectInfo={(video) => {
                setProfileVideo(video);
                setIsProfileModalOpen(true);
              }}
              onBackToHome={handleHomeClick}
            />
          )}

          {/* Ongoing Anime Dedicated View */}
          {activeView === 'ongoing' && (
            <AnimeCategoryView
              category="ongoing"
              title="Ongoing & Currently Airing Anime"
              subtitle="Weekly simulcast episodes streaming this season"
              videos={ongoingVideos}
              isLoading={isCategoriesLoading}
              onSelectVideo={handleSelectVideo}
              onSelectInfo={(video) => {
                setProfileVideo(video);
                setIsProfileModalOpen(true);
              }}
              onBackToHome={handleHomeClick}
            />
          )}

          {/* Upcoming Anime Dedicated View */}
          {activeView === 'upcoming' && (
            <AnimeCategoryView
              category="upcoming"
              title="Upcoming Anime Releases"
              subtitle="Anticipated anime seasons and upcoming premieres"
              videos={upcomingVideos}
              isLoading={isCategoriesLoading}
              onSelectVideo={handleSelectVideo}
              onSelectInfo={(video) => {
                setProfileVideo(video);
                setIsProfileModalOpen(true);
              }}
              onBackToHome={handleHomeClick}
            />
          )}

          {/* Completed Anime Dedicated View */}
          {activeView === 'completed' && (
            <AnimeCategoryView
              category="completed"
              title="Completed Anime Series"
              subtitle="Full binge-worthy anime seasons with all episodes available"
              videos={completedVideos}
              isLoading={isCategoriesLoading}
              onSelectVideo={handleSelectVideo}
              onSelectInfo={(video) => {
                setProfileVideo(video);
                setIsProfileModalOpen(true);
              }}
              onBackToHome={handleHomeClick}
            />
          )}

          {/* AniNews Dedicated View (AniList GraphQL News & Community Updates) */}
          {(activeView === 'aninews' || activeView === 'news') && (
            <AniNewsView
              onSelectVideo={handleSelectVideo}
              onOpenProfile={(video) => {
                setProfileVideo(video);
                setIsProfileModalOpen(true);
              }}
              onSearchAnime={(query) => {
                setSearchQuery(query);
                setActiveView('home');
                setSelectedCategory('All');
                setSelectedVideo(null);
              }}
            />
          )}

          {/* Subscribed View */}
          {activeView === 'subscriptions' && (
            <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
              <div className="flex items-center justify-between border-b border-[#272727] pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-white" />
                  <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    <span>Subscribed Anime</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#272727] text-gray-300 font-normal">
                      {watchLaterItems.length} {watchLaterItems.length === 1 ? 'anime' : 'animes'}
                    </span>
                  </h1>
                </div>
              </div>

              {watchLaterItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center bg-[#151515] rounded-2xl border border-[#252525]">
                  <div className="w-16 h-16 rounded-full bg-[#272727] flex items-center justify-center text-gray-400 mb-4">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white">No Subscribed Anime Yet</h3>
                  <p className="text-xs text-gray-400 mt-1 max-w-sm">
                    Click "Subscribe" on any anime details page to add it to your Subscribed collection and sidebar feed.
                  </p>
                  <button
                    onClick={handleHomeClick}
                    className="mt-5 px-5 py-2.5 rounded-full bg-white text-black text-xs font-bold hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    Explore Anime Hub
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                  {watchLaterItems.map((video) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      onSelectVideo={handleSelectVideo}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Watch Later Dedicated View */}
          {activeView === 'watch_later' && (
            <SavedListView
              type="watch_later"
              watchLaterItems={watchLaterItems}
              likedItems={likedItems}
              onSelectVideo={handleSelectVideo}
              onBackToHome={handleHomeClick}
              onRefresh={() => setWatchLaterItems(getWatchLaterList())}
            />
          )}

          {/* Liked Episodes Dedicated View */}
          {activeView === 'liked' && (
            <SavedListView
              type="liked"
              watchLaterItems={watchLaterItems}
              likedItems={likedItems}
              onSelectVideo={handleSelectVideo}
              onBackToHome={handleHomeClick}
              onRefresh={() => setLikedItems(getLikedEpisodesList())}
            />
          )}

          {/* History View */}
          {activeView === 'history' && (
            <WatchHistoryView
              historyItems={watchHistoryItems}
              onSelectVideo={handleSelectVideo}
              onBackToHome={handleHomeClick}
              onRefresh={() => setWatchHistoryItems(getWatchHistoryList())}
            />
          )}

          {/* Library / You View */}
          {activeView === 'library' && (
            <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-8">
              <div className="flex items-center gap-4 border-b border-[#272727] pb-4">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"
                  alt="User avatar"
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-red-500"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h1 className="text-2xl font-bold text-white">Otaku Explorer</h1>
                  <p className="text-xs text-gray-400">@anitube_user • {watchLaterItems.length} Watch Later • {likedItems.length} Liked Episodes</p>
                </div>
              </div>

              {/* Quick Playlists: Watch Later & Liked */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Watch Later Card */}
                <div
                  onClick={() => setActiveView('watch_later')}
                  className="p-5 rounded-2xl bg-[#181818] border border-[#272727] hover:border-[#444] transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-950/40 border border-blue-800/40 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">Watch Later</h3>
                      <p className="text-xs text-gray-400">{watchLaterItems.length} anime saved</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                </div>

                {/* Liked Episodes Card */}
                <div
                  onClick={() => setActiveView('liked')}
                  className="p-5 rounded-2xl bg-[#181818] border border-[#272727] hover:border-[#444] transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-950/40 border border-red-800/40 flex items-center justify-center text-red-400 group-hover:scale-105 transition-transform">
                      <ThumbsUp className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-red-400 transition-colors">Liked Episodes</h3>
                      <p className="text-xs text-gray-400">{likedItems.length} episodes liked</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                </div>
              </div>

              {/* History Shelf */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <History className="w-5 h-5 text-gray-400" />
                    <span>Recent History</span>
                  </h2>
                  <button 
                    onClick={() => setActiveView('history')}
                    className="text-xs text-blue-400 hover:underline font-medium cursor-pointer"
                  >
                    See all
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {watchHistoryItems.slice(0, 4).map((video) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      onSelectVideo={handleSelectVideo}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Home Feed View */}
          {activeView === 'home' && (
            <div>
              {/* Category Filter Chips Bar */}
              <FilterBar
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                categories={dynamicCategories}
              />

              {/* Main Feed Content */}
              <div className="p-4 sm:p-6 space-y-6">
                {/* Status Bar / API Meta */}
                {apiVideos.length > 0 && !searchQuery && selectedCategory === 'All' && (
                  <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-[#1a1a1a]/70 border border-[#282828] text-xs text-gray-400">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-gray-300 font-medium">
                        Live Anikoto Anime Hub ({apiVideos.length + popularVideos.length} loaded of {totalApiCount > 0 ? totalApiCount.toLocaleString() : '8,900+'})
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={randomizeReels}
                        className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white transition-colors cursor-pointer"
                        title="Randomize and shuffle category reels order"
                      >
                        <Shuffle className="w-3.5 h-3.5 text-white" />
                        <span>Randomize Reels</span>
                      </button>
                      <span className="text-gray-600">|</span>
                      <button
                        onClick={() => {
                          loadAnimePage(1, true);
                          loadAllCategories();
                        }}
                        className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white transition-colors cursor-pointer"
                        title="Refresh all anime feeds from API"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-white" />
                        <span>Refresh Feeds</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* API Warning Notice if any */}
                {apiError && (
                  <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-xs text-amber-300 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-white" />
                      <span>{apiError}</span>
                    </div>
                    <button
                      onClick={() => {
                        loadAnimePage(1, true);
                        loadAllCategories();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-amber-900/50 hover:bg-amber-800 text-white text-[11px] font-semibold cursor-pointer"
                    >
                      Retry API
                    </button>
                  </div>
                )}

                {/* Search status header */}
                {searchQuery && (
                  <div className="text-sm text-gray-400 pb-1">
                    Results for <span className="text-white font-semibold">"{searchQuery}"</span> {!isSearching && `(${searchResults.length} anime found)`}
                  </div>
                )}

                {/* Genre status header when category selected */}
                {!searchQuery && selectedCategory !== 'All' && (
                  <div className="flex items-center justify-between pb-3 border-b border-[#252525]">
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <span>Genre: {selectedCategory}</span>
                        {!isGenreLoading && (
                          <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-[#272727] text-gray-300">
                            {filteredVideos.length} anime
                          </span>
                        )}
                      </h2>
                      <p className="text-xs text-gray-400 mt-0.5">Top-rated anime matching {selectedCategory}</p>
                    </div>
                    <button
                      onClick={() => setSelectedCategory('All')}
                      className="text-xs px-3 py-1.5 rounded-full bg-[#272727] text-gray-300 hover:text-white hover:bg-[#383838] transition-colors cursor-pointer"
                    >
                      Clear filter
                    </button>
                  </div>
                )}

                {/* Watch History Horizontal Slider (Limit 10 items) */}
                {!searchQuery && selectedCategory === 'All' && watchHistoryItems.length > 0 && (
                  <AnimeHorizontalSlider
                    title="Watch History"
                    subtitle="Continue watching where you left off"
                    icon="history"
                    videos={watchHistoryItems.slice(0, 10)}
                    onSelectVideo={handleSelectVideo}
                    onViewAll={() => setActiveView('history')}
                    isLandscape={true}
                  />
                )}

                {/* Main Video Grid Feed Header: Recent Anime Catalogue & Updates FIRST */}
                {!searchQuery && selectedCategory === 'All' && (
                  <div className="pt-2">
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-white" />
                        <h2 className="text-lg font-bold text-white">
                          Recent Anime Catalogue & Updates
                        </h2>
                      </div>
                    </div>
                  </div>
                )}

                {/* Loading Skeletons for Initial Load, Search, or Genre Switch */}
                {isInitialLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <VideoCardSkeleton
                        key={`skeleton-${i}`}
                        label="Loading AniTube..."
                        delayMs={i * 60}
                      />
                    ))}
                  </div>
                ) : isSearching ? (
                  <GenreListSkeleton />
                ) : isGenreLoading && selectedCategory !== 'All' ? (
                  <GenreListSkeleton />
                ) : isGenreLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <VideoCardSkeleton
                        key={`skeleton-${i}`}
                        label={`Loading ${selectedCategory}...`}
                        delayMs={i * 60}
                      />
                    ))}
                  </div>
                ) : (searchQuery ? searchResults.length === 0 : filteredVideos.length === 0) ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 rounded-full bg-[#272727] flex items-center justify-center text-white mb-4">
                      <Tv className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-white">No anime found</h3>
                    <p className="text-xs text-gray-400 mt-1 max-w-sm">
                      {searchError || (searchQuery ? 'No results matched your search keywords.' : `No anime found matching genre "${selectedCategory}".`)}
                    </p>
                    <button
                      onClick={() => {
                        setSelectedCategory('All');
                        setSearchQuery('');
                      }}
                      className="mt-4 px-4 py-2 rounded-full bg-[#272727] hover:bg-[#383838] text-white text-xs font-semibold cursor-pointer"
                    >
                      Reset filters
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Search or Specific Genre */}
                    {searchQuery ? (
                      <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4">
                        {searchResults.map((video) => (
                          <VideoCard
                            key={video.id}
                            video={video}
                            onSelectVideo={handleSelectVideo}
                            onSelectInfo={(v) => {
                              setProfileVideo(v);
                              setIsProfileModalOpen(true);
                            }}
                            layout="list"
                            isGenreCard={true}
                            isGenreBlurOverlay={isGenreBlurOverlay}
                          />
                        ))}
                      </div>
                    ) : selectedCategory !== 'All' ? (
                      <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4">
                        {filteredVideos.map((video) => (
                          <VideoCard
                            key={video.id}
                            video={video}
                            onSelectVideo={handleSelectVideo}
                            onSelectInfo={(v) => {
                              setProfileVideo(v);
                              setIsProfileModalOpen(true);
                            }}
                            layout="list"
                            isGenreCard={true}
                            isGenreBlurOverlay={isGenreBlurOverlay}
                          />
                        ))}
                      </div>
                    ) : (
                      /* Home Feed: Recent Catalogue Batch 0 FIRST, followed by Reels interleaved */
                      <div className="space-y-8">
                        {videoBatches.map((batch, batchIdx) => {
                          const currentReel = orderedReels[batchIdx];
                          return (
                            <Fragment key={`feed-batch-${batchIdx}`}>
                              {/* Grid of Anime Cards for this Recent Catalogue Batch */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                                {batch.map((video) => (
                                  <VideoCard
                                    key={video.id}
                                    video={video}
                                    onSelectVideo={handleSelectVideo}
                                    onSelectInfo={(v) => {
                                      setProfileVideo(v);
                                      setIsProfileModalOpen(true);
                                    }}
                                    isGenreCard={false}
                                    isGenreBlurOverlay={isGenreBlurOverlay}
                                  />
                                ))}
                              </div>

                              {/* AniReels Shorts & AniTrail Shelf appearing periodically while scrolling down (every 2 batches) with different page content */}
                              {batchIdx % 2 === 0 && (
                                <HomeReelsShelf
                                  shelfIndex={Math.floor(batchIdx / 2)}
                                  onSelectVideo={handleSelectVideo}
                                  onOpenReelsView={(video, mode) => {
                                    setSelectedReelVideo(video || null);
                                    setActiveView(mode === 'anitrail' ? 'anitrail' : 'reels');
                                  }}
                                  fallbackVideos={apiVideos.length > 0 ? apiVideos : popularVideos}
                                />
                              )}

                              {/* Category Reel appearing directly AFTER this Recent Catalogue Batch */}
                              {currentReel && (
                                <div className="pt-2">
                                  <AnimeHorizontalSlider
                                    key={currentReel.id}
                                    title={currentReel.title}
                                    subtitle={currentReel.subtitle}
                                    icon={currentReel.icon}
                                    videos={currentReel.videos}
                                    onSelectVideo={handleSelectVideo}
                                    onViewAll={() => setActiveView(currentReel.view)}
                                    isLoading={isCategoriesLoading}
                                  />
                                </div>
                              )}
                            </Fragment>
                          );
                        })}
                      </div>
                    )}

                    {/* Additional Skeleton placeholders when lazy loading next page */}
                    {(isLoadingMore || isLoadingMoreGenre) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8 mt-8">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <VideoCardSkeleton
                            key={`loading-more-skeleton-${i}`}
                            label="Fetching Next Page..."
                            delayMs={i * 60}
                          />
                        ))}
                      </div>
                    )}

                    {/* Lazy loading sentinel trigger */}
                    {!searchQuery && (
                      <div className="mt-12 flex flex-col items-center justify-center pb-8">
                        <div ref={loadMoreSentinelRef} className="h-10 w-full" />

                        {selectedCategory === 'All' ? (
                          hasMore ? (
                            isLoadingMore ? (
                              <div className="flex items-center gap-2 text-xs text-gray-400 py-4">
                                <Loader2 className="w-4 h-4 animate-spin text-white" />
                                <span>Loading page {currentPage + 1}...</span>
                              </div>
                            ) : null
                          ) : (
                            <div className="text-xs text-gray-500 py-4">
                              You have reached the end of recent anime updates.
                            </div>
                          )
                        ) : (
                          (genrePagination[selectedCategory.toLowerCase()]?.hasMore ?? true) ? (
                            <button
                              onClick={loadMoreGenre}
                              disabled={isLoadingMoreGenre}
                              className="px-6 py-2.5 rounded-full bg-[#272727] hover:bg-[#383838] active:scale-95 text-white text-xs font-semibold flex items-center gap-2 border border-[#383838] transition-all shadow-lg cursor-pointer"
                            >
                              {isLoadingMoreGenre ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                                  <span>Loading more {selectedCategory}...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-4 h-4 text-white" />
                                  <span>Load More {selectedCategory}</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <div className="text-xs text-gray-500 py-4">
                              You have reached the end of {selectedCategory} anime.
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Voice Search Modal */}
      <VoiceSearchModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onVoiceResult={(query) => {
          setSearchQuery(query);
          setActiveView('home');
        }}
      />
        </>
      )}

      {/* Profile Avatar Setup Modal */}
      <AvatarSetupModal
        isOpen={isAvatarModalOpen}
        currentProfile={userProfile}
        onClose={() => setIsAvatarModalOpen(false)}
        onSaveComplete={(updatedProfile) => {
          setUserProfile(updatedProfile);
          setHasVisitedLanding(true);
          setShowLanding(false);
        }}
      />

      {/* Anime Studio / YouTuber Profile & Episodes Modal */}
      <AnimeProfileModal
        video={profileVideo}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSelectVideoWithEpisode={handleSelectVideoWithEpisode}
      />

      {/* Developer Diagnostics Floating Panel */}
      {isDevMode && (
        <DeveloperPanel
          onClose={() => {
            devLogger.setDevMode(false);
            setIsDevMode(false);
          }}
        />
      )}
    </div>
  );
}

