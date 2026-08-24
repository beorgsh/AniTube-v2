import React from 'react';
import { Flame, Sparkles, Tv, Calendar, Trophy, Zap, ArrowLeft } from 'lucide-react';
import { Video } from '../types';
import { VideoCard } from './VideoCard';
import { VideoCardSkeleton } from './VideoCardSkeleton';

interface AnimeCategoryViewProps {
  category: 'popular' | 'latest' | 'ongoing' | 'upcoming' | 'completed' | 'trending';
  title: string;
  subtitle: string;
  videos: Video[];
  isLoading: boolean;
  onSelectVideo: (video: Video) => void;
  onBackToHome: () => void;
}

export const AnimeCategoryView: React.FC<AnimeCategoryViewProps> = ({
  category,
  title,
  subtitle,
  videos,
  isLoading,
  onSelectVideo,
  onBackToHome,
}) => {
  const getCategoryIcon = () => {
    switch (category) {
      case 'popular':
      case 'trending':
        return <Flame className="w-6 h-6 text-white" />;
      case 'latest':
        return <Zap className="w-6 h-6 text-white" />;
      case 'ongoing':
        return <Tv className="w-6 h-6 text-white" />;
      case 'upcoming':
        return <Calendar className="w-6 h-6 text-white" />;
      case 'completed':
        return <Trophy className="w-6 h-6 text-white" />;
      default:
        return <Sparkles className="w-6 h-6 text-white" />;
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Navigation & Category Header Banner */}
      <div className="flex items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#1b1b1b] via-[#161616] to-[#121212] border border-[#2a2a2a] shadow-xl">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToHome}
            className="p-2.5 rounded-xl bg-[#252525] hover:bg-[#333333] text-gray-300 hover:text-white transition-all cursor-pointer shrink-0"
            title="Back to Home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="shrink-0 flex items-center justify-center text-white">
              {getCategoryIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
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
      </div>

      {/* Grid of Video Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <VideoCardSkeleton
              key={`skeleton-${i}`}
              delayMs={i * 60}
            />
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-[#272727] flex items-center justify-center text-gray-400 mb-4">
            <Tv className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-bold text-white">No anime found</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm">
            Anime list is currently loading or empty.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onSelectVideo={onSelectVideo}
            />
          ))}
        </div>
      )}
    </div>
  );
};

