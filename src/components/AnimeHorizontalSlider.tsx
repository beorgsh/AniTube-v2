import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Shuffle, Play, Sparkles, Flame, Tv, Calendar, Trophy, Zap } from 'lucide-react';
import { Video } from '../types';
import { FadeImage } from './FadeImage';

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
        return <Flame className="w-5 h-5 text-white" />;
      case 'zap':
        return <Zap className="w-5 h-5 text-white" />;
      case 'tv':
        return <Tv className="w-5 h-5 text-white" />;
      case 'calendar':
        return <Calendar className="w-5 h-5 text-white" />;
      case 'trophy':
        return <Trophy className="w-5 h-5 text-white" />;
      case 'sparkles':
      default:
        return <Sparkles className="w-5 h-5 text-white" />;
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
          <div className="shrink-0 flex items-center justify-center text-white">
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
            <Shuffle className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline text-[11px] font-medium">Shuffle</span>
          </button>

          {/* View All Button */}
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="px-2.5 py-1.5 rounded-lg bg-[#1f1f1f] hover:bg-[#2c2c2c] text-xs font-semibold text-white hover:text-gray-300 border border-[#333333] transition-colors cursor-pointer"
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
        className="flex items-stretch gap-3.5 overflow-x-auto pb-4 pt-1 scroll-smooth no-scrollbar scrollbar-none select-none -mx-1 px-1"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={`loading-${i}`}
                className="w-40 sm:w-50 shrink-0 aspect-[9/15] rounded-2xl bg-[#1c1c1c] animate-pulse border border-[#272727]"
              />
            ))
          : displayVideos.map((video) => {
              const subCount = video.tags?.find((t) => t.startsWith('Sub:'))?.replace('Sub: ', '');
              const dubCount = video.tags?.find((t) => t.startsWith('Dub:'))?.replace('Dub: ', '');
              const animeType = video.tags?.[1] || video.category || 'TV';

              return (
                <div
                  key={video.id}
                  onClick={() => onSelectVideo(video)}
                  className="relative w-40 sm:w-50 shrink-0 aspect-[9/15] rounded-2xl overflow-hidden bg-[#161616] border border-[#272727] hover:border-white/40 shadow-xl group/card cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl flex flex-col justify-between"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  {/* Background Full-Bleed Poster */}
                  <FadeImage
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                    containerClassName="absolute inset-0 w-full h-full"
                  />

                  {/* Top Glass Scrim & Badges */}
                  <div className="relative z-10 p-2.5 flex items-start justify-between gap-1.5 pointer-events-none bg-gradient-to-b from-black/80 via-black/30 to-transparent">
                    {/* Left: Anime Type Pill */}
                    {animeType && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-black/70 backdrop-blur-md text-amber-300 border border-amber-400/20 shadow-sm">
                        {animeType}
                      </span>
                    )}

                    {/* Right: Sub/Dub Pills */}
                    <div className="flex items-center gap-1">
                      {subCount && subCount !== 'null' && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-950/90 text-emerald-300 backdrop-blur-md border border-emerald-500/30 shadow-sm">
                          SUB {subCount}
                        </span>
                      )}
                      {dubCount && dubCount !== 'null' && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-950/90 text-purple-300 backdrop-blur-md border border-purple-500/30 shadow-sm">
                          DUB {dubCount}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Center Play Button Overlay on Hover */}
                  <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity bg-black/25 backdrop-blur-[1px] pointer-events-none">
                    <div className="w-12 h-12 rounded-full bg-white/95 text-black flex items-center justify-center shadow-2xl transform scale-75 group-hover/card:scale-100 transition-transform duration-200">
                      <Play className="w-5 h-5 fill-black ml-0.5 text-black" />
                    </div>
                  </div>

                  {/* Bottom YouTube Reels/Shorts Inside-Poster Content Overlay */}
                  <div className="relative z-10 pt-16 pb-3 px-3 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col justify-end pointer-events-none space-y-1.5">
                    {/* Title */}
                    <h3 
                      className="text-xs sm:text-sm font-bold text-white leading-snug line-clamp-2 drop-shadow-md group-hover/card:text-white" 
                      title={video.title}
                    >
                      {video.title}
                    </h3>

                    {/* Bottom Metadata inside poster */}
                    <div className="flex items-center justify-between gap-1 text-[11px] text-gray-300">
                      <span className="truncate max-w-[90px] font-medium text-gray-200 drop-shadow">
                        {video.category}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white/20 backdrop-blur-md text-white border border-white/20 shrink-0">
                        {video.totalEpisodes || video.duration}
                      </span>
                    </div>

                    <div className="text-[10px] text-gray-400 font-medium">
                      {video.views} views
                    </div>
                  </div>
                </div>
              );
            })}
      </div>
    </section>
  );
};
