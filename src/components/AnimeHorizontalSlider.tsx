import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Shuffle, Play, Sparkles, Flame, Tv, Calendar, Trophy, Zap } from 'lucide-react';
import { Video } from '../types';

interface AnimeHorizontalSliderProps {
  title: string;
  subtitle?: string;
  icon?: 'flame' | 'sparkles' | 'tv' | 'calendar' | 'trophy' | 'zap';
  videos: Video[];
  onSelectVideo: (video: Video) => void;
  onViewAll?: () => void;
  isLoading?: boolean;
}

export const AnimeHorizontalSlider: React.FC<AnimeHorizontalSliderProps> = ({
  title,
  subtitle,
  icon = 'flame',
  videos,
  onSelectVideo,
  onViewAll,
  isLoading = false,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [shuffledVideos, setShuffledVideos] = useState<Video[]>([]);
  const [isShuffled, setIsShuffled] = useState(false);

  // Active display list
  const displayVideos = isShuffled && shuffledVideos.length > 0 ? shuffledVideos : videos;

  const handleShuffle = () => {
    const list = [...videos];
    // Fisher-Yates shuffle
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    setShuffledVideos(list);
    setIsShuffled(true);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollContainerRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const renderIcon = () => {
    switch (icon) {
      case 'flame':
        return <Flame className="w-5 h-5 text-red-500 fill-red-500/20" />;
      case 'zap':
        return <Zap className="w-5 h-5 text-amber-400 fill-amber-400/20" />;
      case 'tv':
        return <Tv className="w-5 h-5 text-blue-400" />;
      case 'calendar':
        return <Calendar className="w-5 h-5 text-emerald-400" />;
      case 'trophy':
        return <Trophy className="w-5 h-5 text-yellow-500 fill-yellow-500/20" />;
      case 'sparkles':
      default:
        return <Sparkles className="w-5 h-5 text-purple-400" />;
    }
  };

  if (!isLoading && videos.length === 0) {
    return null;
  }

  return (
    <section className="relative py-4 border-t border-[#222222]/80 group/shelf">
      {/* Header with Title, Badges, Shuffle & Navigation Controls */}
      <div className="flex items-center justify-between gap-4 mb-3 px-1">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-[#222222] border border-[#333333] shrink-0">
            {renderIcon()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
                {title}
              </h2>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#262626] text-gray-300 border border-[#383838]">
                {videos.length} Anime
              </span>
            </div>
            {subtitle && (
              <p className="text-[11px] text-gray-400 truncate hidden md:block">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Shuffle / Randomize Button */}
          <button
            onClick={handleShuffle}
            title="Randomize & shuffle anime list"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1f1f1f] hover:bg-[#2c2c2c] active:scale-95 text-xs text-gray-300 hover:text-white border border-[#333333] transition-all cursor-pointer shadow-sm"
          >
            <Shuffle className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden sm:inline text-[11px] font-medium">Shuffle</span>
          </button>

          {/* View All Button */}
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="px-2.5 py-1.5 rounded-lg bg-[#1f1f1f] hover:bg-[#2c2c2c] text-xs font-semibold text-red-400 hover:text-red-300 border border-[#333333] transition-colors cursor-pointer"
            >
              <span className="text-[11px]">View all</span>
            </button>
          )}

          {/* Left / Right Scroll Buttons */}
          <div className="hidden sm:flex items-center gap-1 ml-1">
            <button
              onClick={() => scroll('left')}
              className="p-1.5 rounded-lg bg-[#1e1e1e] hover:bg-[#2d2d2d] active:scale-90 text-gray-300 hover:text-white border border-[#333333] transition-all cursor-pointer shadow-md"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-1.5 rounded-lg bg-[#1e1e1e] hover:bg-[#2d2d2d] active:scale-90 text-gray-300 hover:text-white border border-[#333333] transition-all cursor-pointer shadow-md"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Scrollable Row */}
      <div
        ref={scrollContainerRef}
        className="flex items-stretch gap-3.5 overflow-x-auto pb-3 pt-1 scroll-smooth no-scrollbar scrollbar-none select-none -mx-1 px-1"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={`loading-${i}`}
                className="w-44 sm:w-52 shrink-0 flex flex-col space-y-2 animate-pulse"
              >
                <div className="w-full aspect-[3/4] rounded-xl bg-[#222222]" />
                <div className="h-3.5 bg-[#262626] rounded w-3/4" />
                <div className="h-3 bg-[#1e1e1e] rounded w-1/2" />
              </div>
            ))
          : displayVideos.map((video) => {
              const subCount = video.tags?.find((t) => t.startsWith('Sub:'))?.replace('Sub: ', '');
              const dubCount = video.tags?.find((t) => t.startsWith('Dub:'))?.replace('Dub: ', '');
              const animeType = video.tags?.[1] || video.category || 'TV';

              return (
                <div
                  key={video.id}
                  onClick={() => onSelectVideo(video)}
                  className="w-38 sm:w-48 shrink-0 flex flex-col group/card cursor-pointer rounded-xl transition-all duration-200 hover:-translate-y-1"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  {/* Poster Thumbnail Container (Real JSON Image) */}
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#1a1a1a] border border-[#2a2a2a] group-hover/card:border-red-600/50 shadow-md transition-all">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />

                    {/* Top Overlay Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1 items-start pointer-events-none">
                      {animeType && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-black/80 backdrop-blur-md text-amber-300 border border-white/10 shadow">
                          {animeType}
                        </span>
                      )}
                    </div>

                    {/* Top Right Sub / Dub Badges */}
                    <div className="absolute top-2 right-2 flex items-center gap-1 pointer-events-none">
                      {subCount && subCount !== 'null' && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-950/90 text-emerald-300 backdrop-blur-md border border-emerald-500/30 shadow">
                          SUB {subCount}
                        </span>
                      )}
                      {dubCount && dubCount !== 'null' && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-950/90 text-purple-300 backdrop-blur-md border border-purple-500/30 shadow">
                          DUB {dubCount}
                        </span>
                      )}
                    </div>

                    {/* Play Hover Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg transform scale-75 group-hover/card:scale-100 transition-transform">
                        <Play className="w-5 h-5 fill-white ml-0.5" />
                      </div>
                    </div>

                    {/* Bottom Total Episodes Badge */}
                    <div className="absolute bottom-2 right-2 pointer-events-none">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-black/80 text-gray-200 backdrop-blur-sm border border-white/10">
                        {video.totalEpisodes || video.duration}
                      </span>
                    </div>
                  </div>

                  {/* Anime Meta Details with Real Poster Avatar */}
                  <div className="mt-2.5 flex items-start gap-2 px-0.5">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-6 h-6 rounded-full object-cover shrink-0 ring-1 ring-white/10 mt-0.5"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs font-semibold text-white line-clamp-2 leading-tight group-hover/card:text-red-400 transition-colors" title={video.title}>
                        {video.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-1">
                        <span className="truncate">{video.category}</span>
                        <span>•</span>
                        <span className="text-[10px] text-gray-400 shrink-0">{video.views}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
      </div>
    </section>
  );
};
