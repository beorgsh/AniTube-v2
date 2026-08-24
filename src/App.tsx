import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { FilterBar } from './components/FilterBar';
import { VideoCard } from './components/VideoCard';
import { VideoCardSkeleton } from './components/VideoCardSkeleton';
import { WatchView } from './components/WatchView';
import { AnimeHorizontalSlider } from './components/AnimeHorizontalSlider';
import { AnimeCategoryView } from './components/AnimeCategoryView';
import { CustomStreamModal } from './components/CustomStreamModal';
import { VoiceSearchModal } from './components/VoiceSearchModal';
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
import { History, Tv, RefreshCw, Loader2, Sparkles, AlertCircle } from 'lucide-react';

export default function App() {
  const [activeView, setActiveView] = useState<ViewMode>('home');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isCustomStreamModalOpen, setIsCustomStreamModalOpen] = useState<boolean>(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);
  const [customVideos, setCustomVideos] = useState<Video[]>([]);

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
  const [isLoadingGenre, setIsLoadingGenre] = useState<boolean>(false);

  // Search State
  const [searchResults, setSearchResults] = useState<Video[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);

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

  // Fetch a specific page of recent anime
  const loadAnimePage = useCallback(async (pageToLoad: number, isInitial = false) => {
    if (isInitial) {
      setIsInitialLoading(true);
      setApiError(null);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const response = await fetchRecentAnime(pageToLoad, 10);
      
      setApiVideos((prev) => {
        const existingIds = new Set(isInitial ? [] : prev.map((v) => v.id));
        const newUnique = response.videos.filter((v) => !existingIds.has(v.id));
        return isInitial ? response.videos : [...prev, ...newUnique];
      });

      setCurrentPage(response.pagination.page);
      setTotalApiCount(response.pagination.total);
      setHasMore(response.pagination.page < response.pagination.total_pages);
      setApiError(null);
    } catch (err) {
      console.error('Error fetching recent anime from API:', err);
      if (isInitial) {
        setApiError('Unable to load live recent anime from primary API. Displaying high-definition catalogue.');
      }
    } finally {
      if (isInitial) {
        setIsInitialLoading(false);
      }
      setIsLoadingMore(false);
    }
  }, []);

  // Perform search
  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery || searchQuery.trim().length === 0) {
        setSearchResults([]);
        setSearchError(null);
        return;
      }
      
      setIsSearching(true);
      setSearchError(null);
      try {
        const { fetchAnimeSearch } = await import('./services/animeApi');
        const results = await fetchAnimeSearch(searchQuery);
        setSearchResults(results.videos);
      } catch (err: any) {
        console.error('Search error:', err);
        setSearchError(err.message || 'Failed to fetch search results.');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(performSearch, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Initial load on mount
  useEffect(() => {
    loadAnimePage(1, true);
    loadAllCategories();
  }, [loadAnimePage, loadAllCategories]);

  // Lazy loading observer for pagination
  useEffect(() => {
    if (activeView !== 'home' || isInitialLoading || isLoadingMore || !hasMore) {
      return;
    }

    if (selectedCategory !== 'All' || searchQuery.trim() !== '') {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && !isLoadingMore && hasMore) {
          loadAnimePage(currentPage + 1, false);
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
  }, [activeView, currentPage, hasMore, isInitialLoading, isLoadingMore, loadAnimePage, searchQuery, selectedCategory]);

  // Effect to fetch genre catalogue when category is selected
  useEffect(() => {
    if (selectedCategory === 'All') return;
    const catLower = selectedCategory.toLowerCase();
    if (genreVideosCache[catLower]) return;

    async function loadGenre() {
      setIsLoadingGenre(true);
      try {
        const fetched = await fetchAnimeByGenre(catLower);
        if (fetched && fetched.videos && fetched.videos.length > 0) {
          setGenreVideosCache((prev) => ({ ...prev, [catLower]: fetched.videos }));
        }
      } catch (e) {
        console.warn('Genre load error:', e);
      } finally {
        setIsLoadingGenre(false);
      }
    }

    loadGenre();
  }, [selectedCategory, genreVideosCache]);

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

  // Dynamic categories computed from loaded anime and default tags
  const dynamicCategories = useMemo(() => {
    const genreSet = new Set<string>();
    apiVideos.forEach((v) => {
      if (v.category && v.category !== 'Anime') genreSet.add(v.category);
      v.tags.forEach((tag) => {
        if (tag.length < 18 && !tag.includes('http')) genreSet.add(tag);
      });
    });

    const combined = ['All', ...Array.from(genreSet).slice(0, 10), ...CATEGORIES.filter((c) => c !== 'All')];
    return Array.from(new Set(combined));
  }, [apiVideos]);

  // Filtered video list based on category, dynamic genre API results, and search query
  const filteredVideos = useMemo(() => {
    const catLower = selectedCategory.toLowerCase();
    const genreList = selectedCategory !== 'All' ? (genreVideosCache[catLower] || []) : [];
    const sourceList = genreList.length > 0 ? [...genreList, ...allVideos] : allVideos;

    // Deduplicate by ID
    const seen = new Set<string>();
    const uniqueSource = sourceList.filter((v) => {
      if (seen.has(v.id)) return false;
      seen.add(v.id);
      return true;
    });

    return uniqueSource.filter((video) => {
      const matchesSearch =
        !searchQuery ||
        video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        video.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === 'All' ||
        video.category.toLowerCase() === selectedCategory.toLowerCase() ||
        video.tags.some((t) => t.toLowerCase() === selectedCategory.toLowerCase());

      return matchesSearch && matchesCategory;
    });
  }, [allVideos, searchQuery, selectedCategory, genreVideosCache]);

  const handleSelectVideo = (video: Video) => {
    setSelectedVideo(video);
    setActiveView('watch');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePlayCustomStream = (video: Video) => {
    setCustomVideos([video, ...customVideos]);
    setSelectedVideo(video);
    setActiveView('watch');
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
      {/* Top Navigation Bar */}
      <Header
        onToggleSidebar={handleToggleSidebar}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenCustomStreamModal={() => setIsCustomStreamModalOpen(true)}
        onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
        onHomeClick={handleHomeClick}
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

          {/* Popular & Trending Dedicated View */}
          {(activeView === 'popular' || activeView === 'trending') && (
            <AnimeCategoryView
              category="popular"
              title="Popular & Trending Anime"
              subtitle="Most-watched and highly rated anime series synced from Anikoto API"
              videos={popularVideos}
              isLoading={isCategoriesLoading}
              onSelectVideo={handleSelectVideo}
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
              onBackToHome={handleHomeClick}
            />
          )}

          {/* Subscriptions Feed */}
          {activeView === 'subscriptions' && (
            <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
              <div className="flex items-center justify-between border-b border-[#272727] pb-3">
                <div className="flex items-center gap-2">
                  <Tv className="w-6 h-6 text-red-500" />
                  <h1 className="text-xl font-bold text-white">Latest from Anime Subscriptions</h1>
                </div>
                <span className="text-xs text-blue-400 cursor-pointer hover:underline">Manage</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                {allVideos.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    onSelectVideo={handleSelectVideo}
                  />
                ))}
              </div>
            </div>
          )}

          {/* History View */}
          {activeView === 'history' && (
            <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
              <div className="flex items-center gap-3 border-b border-[#272727] pb-3">
                <History className="w-6 h-6 text-gray-400" />
                <h1 className="text-xl font-bold text-white">Watch History</h1>
              </div>
              <div className="space-y-3">
                {allVideos.slice(0, 8).map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    layout="list"
                    onSelectVideo={handleSelectVideo}
                  />
                ))}
              </div>
            </div>
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
                  <p className="text-xs text-gray-400">@anitube_user • {allVideos.length} anime cataloged</p>
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
                  {allVideos.slice(0, 4).map((video) => (
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
                    <button
                      onClick={() => {
                        loadAnimePage(1, true);
                        loadAllCategories();
                      }}
                      className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white transition-colors cursor-pointer"
                      title="Refresh all anime feeds from API"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Refresh Feeds</span>
                    </button>
                  </div>
                )}

                {/* API Warning Notice if any */}
                {apiError && (
                  <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-xs text-amber-300 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                      <span>{apiError}</span>
                    </div>
                    <button
                      onClick={() => {
                        loadAnimePage(1, true);
                        loadAllCategories();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-amber-900/50 hover:bg-amber-800 text-amber-200 text-[11px] font-semibold cursor-pointer"
                    >
                      Retry API
                    </button>
                  </div>
                )}

                {/* Search / Filter status header */}
                {searchQuery && (
                  <div className="text-sm text-gray-400">
                    Results for <span className="text-white font-semibold">"{searchQuery}"</span> ({searchResults.length} anime found)
                  </div>
                )}

                {/* 1. HORIZONTAL SLIDE: POPULAR & TRENDING ANIME */}
                {!searchQuery && selectedCategory === 'All' && popularVideos.length > 0 && (
                  <AnimeHorizontalSlider
                    title="Popular & Trending Anime"
                    subtitle="Top rated anime series streaming worldwide"
                    icon="flame"
                    videos={popularVideos}
                    onSelectVideo={handleSelectVideo}
                    onViewAll={() => setActiveView('popular')}
                    isLoading={isCategoriesLoading}
                  />
                )}

                {/* 2. HORIZONTAL SLIDE: LATEST EPISODES */}
                {!searchQuery && selectedCategory === 'All' && latestVideos.length > 0 && (
                  <AnimeHorizontalSlider
                    title="Latest Episode Releases"
                    subtitle="Newly released anime episodes with sub & dub"
                    icon="zap"
                    videos={latestVideos}
                    onSelectVideo={handleSelectVideo}
                    onViewAll={() => setActiveView('latest')}
                    isLoading={isCategoriesLoading}
                  />
                )}

                {/* 3. HORIZONTAL SLIDE: ONGOING ANIME */}
                {!searchQuery && selectedCategory === 'All' && ongoingVideos.length > 0 && (
                  <AnimeHorizontalSlider
                    title="Currently Airing & Ongoing Anime"
                    subtitle="Simulcast episodes airing every week"
                    icon="tv"
                    videos={ongoingVideos}
                    onSelectVideo={handleSelectVideo}
                    onViewAll={() => setActiveView('ongoing')}
                    isLoading={isCategoriesLoading}
                  />
                )}

                {/* 4. HORIZONTAL SLIDE: UPCOMING ANIME */}
                {!searchQuery && selectedCategory === 'All' && upcomingVideos.length > 0 && (
                  <AnimeHorizontalSlider
                    title="Upcoming Anime Releases"
                    subtitle="Anticipated seasons and anime premieres"
                    icon="calendar"
                    videos={upcomingVideos}
                    onSelectVideo={handleSelectVideo}
                    onViewAll={() => setActiveView('upcoming')}
                    isLoading={isCategoriesLoading}
                  />
                )}

                {/* 5. HORIZONTAL SLIDE: COMPLETED ANIME */}
                {!searchQuery && selectedCategory === 'All' && completedVideos.length > 0 && (
                  <AnimeHorizontalSlider
                    title="Completed Anime Series"
                    subtitle="Complete anime collections ready to binge"
                    icon="trophy"
                    videos={completedVideos}
                    onSelectVideo={handleSelectVideo}
                    onViewAll={() => setActiveView('completed')}
                    isLoading={isCategoriesLoading}
                  />
                )}

                {/* Main Video Grid Feed Header */}
                {!searchQuery && selectedCategory === 'All' && (
                  <div className="pt-6 border-t border-[#222222]">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-5 h-5 text-red-500" />
                      <h2 className="text-lg font-bold text-white">
                        Recent Anime Catalogue & Updates
                      </h2>
                    </div>
                  </div>
                )}

                {/* Initial Loading Skeletons */}
                {isInitialLoading || isSearching ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <VideoCardSkeleton key={`skeleton-${i}`} />
                    ))}
                  </div>
                ) : (searchQuery ? searchResults.length === 0 : filteredVideos.length === 0) ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 rounded-full bg-[#272727] flex items-center justify-center text-gray-400 mb-4">
                      <Tv className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-white">No anime found</h3>
                    <p className="text-xs text-gray-400 mt-1 max-w-sm">
                      {searchError || 'Try searching with different keywords or switch back to the "All" category filter.'}
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
                    {/* Grid of Anime Cards with Real Posters */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                      {(searchQuery ? searchResults : filteredVideos).map((video) => (
                        <VideoCard
                          key={video.id}
                          video={video}
                          onSelectVideo={handleSelectVideo}
                        />
                      ))}
                    </div>

                    {/* Additional Skeleton placeholders when lazy loading next page */}
                    {isLoadingMore && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8 mt-8">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <VideoCardSkeleton key={`loading-more-skeleton-${i}`} />
                        ))}
                      </div>
                    )}

                    {/* Lazy loading sentinel trigger & Load More button */}
                    {!searchQuery && selectedCategory === 'All' && (
                      <div className="mt-12 flex flex-col items-center justify-center pb-8">
                        <div ref={loadMoreSentinelRef} className="h-10 w-full" />

                        {hasMore ? (
                          <button
                            onClick={() => loadAnimePage(currentPage + 1, false)}
                            disabled={isLoadingMore}
                            className="px-6 py-2.5 rounded-full bg-[#272727] hover:bg-[#383838] active:scale-95 text-white text-xs font-semibold flex items-center gap-2 border border-[#383838] transition-all shadow-lg cursor-pointer"
                          >
                            {isLoadingMore ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                                <span>Loading page {currentPage + 1}...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4 text-red-500" />
                                <span>Load More Anime (Page {currentPage + 1})</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <div className="text-xs text-gray-500 py-4">
                            You have reached the end of recent anime updates.
                          </div>
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

      {/* Custom Stream / API Modal */}
      <CustomStreamModal
        isOpen={isCustomStreamModalOpen}
        onClose={() => setIsCustomStreamModalOpen(false)}
        onPlayCustomStream={handlePlayCustomStream}
      />

      {/* Voice Search Modal */}
      <VoiceSearchModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onVoiceResult={(query) => {
          setSearchQuery(query);
          setActiveView('home');
        }}
      />
    </div>
  );
}
