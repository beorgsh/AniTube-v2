import React, { useState } from 'react';
import { Flame, Sparkles, Tv, Calendar, Trophy, Zap, ArrowLeft, LayoutList, LayoutGrid } from 'lucide-react';
import { Video } from '../types';
import { VideoCard } from './VideoCard';
import { VideoCardSkeleton } from './VideoCardSkeleton';
import { GenreListSkeleton } from './GenreListSkeleton';

interface AnimeCategoryViewProps {
  category: 'popular' | 'latest' | 'ongoing' | 'upcoming' | 'completed' | 'trending';
  title: string;
  subtitle: string;
  videos: Video[];
  isLoading: boolean;
  onSelectVideo: (video: Video) => void;
  onSelectInfo?: (video: Video) => void;
  onBackToHome: () => void;
}

export const AnimeCategoryView: React.FC<AnimeCategoryViewProps> = ({
  category,
  title,
  subtitle,
  videos,
  isLoading,
  onSelectVideo,
  onSelectInfo,
  onBackToHome,
}) => {
  const [layoutMode, setLayoutMode] = useState<'list' | 'grid'>('list');

  const getCategoryIcon = () => {
    switch (category) {
      case 'popular':
      case 'trending':
        return <Flame className="w-5 h-5 text-red-500" />;
      case 'latest':
        return <Zap className="w-5 h-5 text-amber-400" />;
      case 'ongoing':
        return <Tv className="w-5 h-5 text-emerald-400" />;
      case 'upcoming':
        return <Calendar className="w-5 h-5 text-blue-400" />;
      case 'completed':
        return <Trophy className="w-5 h-5 text-yellow-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-white" />;
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">
      {/* Top Navigation & Category Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-xl bg-linear-to-r from-[#1b1b1b] via-[#161616] to-[#121212] border border-[#272727] shadow-xl">
        <div className="flex items-center gap-3.5">
          <button
            onClick={onBackToHome}
            className="p-2.5 rounded-xl bg-[#252525] hover:bg-[#333333] text-gray-300 hover:text-white transition-all cursor-pointer shrink-0 border border-white/5"
            title="Back to Home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#242424] border border-white/10 flex items-center justify-center shrink-0">
              {getCategoryIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  {title}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#272727] text-gray-300 border border-[#383838]">
                  {videos.length} Anime
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
            </div>
          </div>
        </div>

        {/* View Layout Toggle (List / Grid) */}
        <div className="flex items-center self-end sm:self-auto gap-1 bg-[#202020] p-1 rounded-xl border border-[#333333]">
          <button
            onClick={() => setLayoutMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              layoutMode === 'list'
                ? 'bg-white text-black font-bold shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
            title="Genre-Style List Cards"
          >
            <LayoutList className="w-4 h-4" />
            <span className="hidden sm:inline">List Cards</span>
          </button>
          <button
            onClick={() => setLayoutMode('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              layoutMode === 'grid'
                ? 'bg-white text-black font-bold shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
            title="Grid Cards"
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Grid</span>
          </button>
        </div>
      </div>

      {/* Anime Video Cards Presentation */}
      {isLoading ? (
        layoutMode === 'list' ? (
          <GenreListSkeleton />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <VideoCardSkeleton key={`skeleton-${i}`} delayMs={i * 60} />
            ))}
          </div>
        )
      ) : videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-[#141414] rounded-2xl border border-[#252525]">
          <div className="w-16 h-16 rounded-full bg-[#272727] flex items-center justify-center text-gray-400 mb-4">
            <Tv className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-bold text-white">No anime found</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm">
            Anime list is currently loading or empty.
          </p>
        </div>
      ) : layoutMode === 'list' ? (
        <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onSelectVideo={onSelectVideo}
              onSelectInfo={onSelectInfo}
              layout="list"
              isGenreCard={true}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onSelectVideo={onSelectVideo}
              onSelectInfo={onSelectInfo}
              layout="grid"
              isGenreCard={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};

