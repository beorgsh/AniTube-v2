import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Film, 
  Play, 
  ChevronLeft, 
  ChevronRight, 
  Shuffle, 
  Sparkles, 
  Loader2, 
  ArrowRight,
  Maximize2
} from 'lucide-react';
import { Video } from '../types';
import { fetchRecentAnime } from '../services/animeApi';
import { fetchJikanAnimeTrailers } from '../services/jikanApi';
import { FadeImage } from './FadeImage';

interface HomeReelsShelfProps {
  onSelectVideo: (video: Video) => void;
  onOpenReelsView: (startingVideo?: Video, mode?: 'anireels' | 'anitrail') => void;
  fallbackVideos?: Video[];
  shelfIndex?: number;
}

export const HomeReelsShelf: React.FC<HomeReelsShelfProps> = ({
  onSelectVideo,
  onOpenReelsView,
  fallbackVideos = [],
  shelfIndex = 0,
}) => {
  const [activeTab, setActiveTab] = useState<'anireels' | 'anitrail'>(
    shelfIndex % 2 === 1 ? 'anitrail' : 'anireels'
  );
  const [reels, setReels] = useState<Video[]>([]);
  const [loadedPages, setLoadedPages] = useState<number[]>([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [hoveredVideoId, setHoveredVideoId] = useState<string | null>(null);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
  const [canScrollRight, setCanScrollRight] = useState<boolean>(true);
  
  const isFetchingRef = useRef<boolean>(false);
  const totalCataloguePages = 34;

  // Helper to pick a random unvisited page number
  const getRandomPage = useCallback((exclude: number[] = []): number => {
    const available = Array.from({ length: totalCataloguePages }, (_, i) => i + 1)
      .filter(p => !exclude.includes(p));
    
    if (available.length === 0) {
      return Math.floor(Math.random() * totalCataloguePages) + 1;
    }
    return available[Math.floor(Math.random() * available.length)];
  }, [totalCataloguePages]);

  // Fetch 10 reels/trailers for a given page number
  const fetchPageItems = useCallback(async (page: number): Promise<Video[]> => {
    try {
      if (activeTab === 'anitrail') {
        const jikanRes = await fetchJikanAnimeTrailers(page, 10);
        if (jikanRes && jikanRes.trailers.length > 0) {
          return jikanRes.trailers;
        }
      } else {
        const res = await fetchRecentAnime(page, 10);
        if (res && res.videos && res.videos.length > 0) {
          return res.videos;
        }
      }
    } catch (err) {
      console.warn(`Failed to load page ${page} items for ${activeTab}`, err);
    }

    if (fallbackVideos.length > 0) {
      const start = ((page - 1) * 10) % fallbackVideos.length;
      const slice = fallbackVideos.slice(start, start + 10);
      return slice.length > 0 ? slice : fallbackVideos.slice(0, 10);
    }
    return [];
  }, [activeTab, fallbackVideos]);

  // Initial load of items (varies initial page by shelfIndex so each shelf on vertical scroll has different content)
  const initItems = useCallback(async () => {
    setIsLoadingInitial(true);
    isFetchingRef.current = true;
    
    let startPage = 1;
    if (activeTab === 'anitrail') {
      startPage = ((shelfIndex * 2) % 4) + 1;
    } else {
      const baseOffset = (shelfIndex * 5) % totalCataloguePages;
      const excludes = Array.from({ length: baseOffset }, (_, i) => i + 1);
      startPage = getRandomPage(excludes);
    }
    
    const vids = await fetchPageItems(startPage);
    setReels(vids);
    setLoadedPages([startPage]);
    setIsLoadingInitial(false);
    isFetchingRef.current = false;
  }, [activeTab, shelfIndex, getRandomPage, fetchPageItems]);

  useEffect(() => {
    initItems();
  }, [initItems]);

  // Lazy load another random page when scrolling near the right end
  const loadNextPageLazy = useCallback(async () => {
    if (isFetchingRef.current || isLoadingMore) return;
    
    isFetchingRef.current = true;
    setIsLoadingMore(true);

    const nextPage = getRandomPage(loadedPages);
    const newVids = await fetchPageItems(nextPage);

    if (newVids.length > 0) {
      // Append non-duplicate videos
      setReels(prev => {
        const existingIds = new Set(prev.map(v => v.id));
        const filtered = newVids.filter(v => !existingIds.has(v.id));
        return [...prev, ...(filtered.length > 0 ? filtered : newVids)];
      });
      setLoadedPages(prev => [...prev, nextPage]);
    }

    setIsLoadingMore(false);
    isFetchingRef.current = false;
  }, [getRandomPage, loadedPages, fetchPageItems, isLoadingMore]);

  // Handle scroll events & lazy loading trigger
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);

    // Trigger lazy loading when scrolled within 300px of the right end
    if (scrollLeft + clientWidth >= scrollWidth - 300) {
      loadNextPageLazy();
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth * 0.75;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Reshuffle all reels with a fresh random page
  const handleShuffle = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
    initItems();
  };

  return (
    <section className="relative py-4 border-t border-[#222222]/80 group/shelf">
      {/* Header matching standard completed sliders with AniReels / AniTrail tab switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 px-1">
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0 flex items-center justify-center text-pink-500">
            {activeTab === 'anitrail' ? (
              <Sparkles className="w-5 h-5 text-amber-400" />
            ) : (
              <Film className="w-5 h-5 text-pink-500" />
            )}
          </div>
          
          {/* Tab Switcher Pills */}
          <div className="flex items-center bg-[#181818] p-1 rounded-full border border-white/10 shadow-sm">
            <button
              onClick={() => setActiveTab('anireels')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'anireels'
                  ? 'bg-pink-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>AniReels Shorts</span>
            </button>
            <button
              onClick={() => setActiveTab('anitrail')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'anitrail'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>AniTrail Trailers</span>
            </button>
          </div>
        </div>

        {/* Right Action Controls: Chevrons, Reshuffle & Fullscreen Player */}
        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
          <button
            onClick={handleShuffle}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-[#1e1e1e] hover:bg-[#2a2a2a] border border-white/10 text-gray-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Shuffle Random Page Items"
          >
            <Shuffle className={`w-3.5 h-3.5 ${activeTab === 'anitrail' ? 'text-amber-400' : 'text-pink-400'}`} />
            <span className="hidden sm:inline">Shuffle</span>
          </button>

          <button
            onClick={() => {
              const startVid = reels[0] || fallbackVideos[0];
              onOpenReelsView(startVid, activeTab);
            }}
            className={`p-1.5 sm:px-3 sm:py-1.5 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
              activeTab === 'anitrail' ? 'bg-amber-600 hover:bg-amber-500' : 'bg-pink-600 hover:bg-pink-500'
            }`}
            title="Open Fullscreen Feed"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Launch Player</span>
          </button>

          <div className="flex items-center gap-1 ml-1">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className={`p-1.5 rounded-full bg-[#1e1e1e] border border-white/10 text-white transition-all ${
                canScrollLeft ? 'hover:bg-pink-600 hover:scale-105 cursor-pointer opacity-100' : 'opacity-30 cursor-not-allowed'
              }`}
              title="Scroll Left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight && !isLoadingMore}
              className={`p-1.5 rounded-full bg-[#1e1e1e] border border-white/10 text-white transition-all ${
                canScrollRight || isLoadingMore ? 'hover:bg-pink-600 hover:scale-105 cursor-pointer opacity-100' : 'opacity-30 cursor-not-allowed'
              }`}
              title="Scroll Right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Carousel Shelf with Realtime Lazy Loading */}
      <div className="relative">
        {isLoadingInitial ? (
          <div className="flex gap-3 overflow-x-hidden py-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={`reels-skel-${i}`}
                className="w-36 sm:w-44 shrink-0 aspect-[9/16] rounded-2xl bg-[#1c1c1c] border border-white/5 animate-pulse flex flex-col justify-end p-3 space-y-2"
              >
                <div className="w-8 h-8 rounded-full bg-[#272727] self-center mb-auto mt-auto" />
                <div className="h-3 bg-[#272727] rounded w-3/4" />
                <div className="h-2 bg-[#222222] rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : reels.length === 0 ? (
          <div className="py-8 text-center text-gray-500 text-xs bg-[#161616] rounded-xl border border-white/5">
            No reels available at the moment.
          </div>
        ) : (
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-none py-1 scroll-smooth snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {reels.map((anime, index) => {
              const isHovered = hoveredVideoId === anime.id;
              const epNum = anime.episodeNumber || 1;

              return (
                <div
                  key={`reel-item-${anime.id}-${index}`}
                  onMouseEnter={() => setHoveredVideoId(anime.id)}
                  onMouseLeave={() => setHoveredVideoId(null)}
                  onClick={() => onOpenReelsView(anime)}
                  className="group relative w-36 sm:w-44 shrink-0 aspect-[9/16] rounded-2xl overflow-hidden bg-[#181818] border border-white/10 hover:border-pink-500/80 shadow-lg hover:shadow-2xl hover:shadow-pink-950/40 transition-all duration-300 cursor-pointer flex flex-col justify-between snap-start select-none"
                >
                  {/* Background Poster Image */}
                  <div className="absolute inset-0 overflow-hidden">
                    <FadeImage
                      src={anime.poster || anime.thumbnail}
                      alt={anime.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      containerClassName="w-full h-full"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black via-black/30 to-black/60" />
                  </div>

                  {/* Top Badges */}
                  <div className="relative z-10 p-2 sm:p-2.5 flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-white/15 text-[10px] font-bold text-pink-400 shadow-sm">
                      EP {epNum}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-pink-600/90 text-white shadow-xs">
                      #{index + 1}
                    </span>
                  </div>

                  {/* Center Play Icon Overlay on Hover */}
                  <div className="relative z-10 flex items-center justify-center my-auto pointer-events-none">
                    <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-pink-600/90 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-2xl transition-all duration-300 ${
                      isHovered ? 'scale-110 opacity-100' : 'opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100'
                    }`}>
                      <Play className="w-5 h-5 ml-0.5 fill-current text-white" />
                    </div>
                  </div>

                  {/* Bottom Video Metadata */}
                  <div className="relative z-10 p-2.5 sm:p-3 space-y-1 bg-linear-to-t from-black via-black/90 to-transparent">
                    <span className="text-[9px] sm:text-[10px] font-medium text-pink-300 block truncate">
                      {anime.channel?.name || anime.category || 'AniTube Reel'}
                    </span>
                    <h4 className="text-[11px] sm:text-xs font-bold text-white line-clamp-2 leading-tight group-hover:text-pink-200 transition-colors drop-shadow-md">
                      {anime.title}
                    </h4>
                    <div className="pt-0.5 flex items-center justify-between text-[9px] sm:text-[10px] text-gray-400">
                      <span>{anime.views || '95K'} views</span>
                      <span className="text-pink-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                        Play <ArrowRight className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Lazy Load Spinner Card at right edge */}
            {isLoadingMore && (
              <div className="w-36 sm:w-44 shrink-0 aspect-[9/16] rounded-2xl bg-[#161616] border border-white/10 flex flex-col items-center justify-center p-4 text-center space-y-3 snap-start">
                <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
                <span className="text-xs font-bold text-gray-300">Loading random reels...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
