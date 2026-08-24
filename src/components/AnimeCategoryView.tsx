import React, { useState, useMemo } from 'react';
import { Flame, Sparkles, Tv, Calendar, Trophy, Zap, Shuffle, Filter, Search, ArrowLeft } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [shuffledList, setShuffledList] = useState<Video[]>([]);
  const [isShuffled, setIsShuffled] = useState(false);

  const baseList = isShuffled && shuffledList.length > 0 ? shuffledList : videos;

  const handleShuffle = () => {
    const list = [...videos];
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    setShuffledList(list);
    setIsShuffled(true);
  };

  const typesList = useMemo(() => {
    const set = new Set<string>();
    videos.forEach((v) => {
      const t = v.tags?.[1];
      if (t) set.add(t);
    });
    return ['All', ...Array.from(set)];
  }, [videos]);

  const filteredVideos = useMemo(() => {
    return baseList.filter((v) => {
      const matchesSearch =
        !searchQuery ||
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.description.toLowerCase().includes(searchQuery.toLowerCase());

      const animeType = v.tags?.[1] || v.category;
      const matchesType = selectedType === 'All' || animeType.toLowerCase() === selectedType.toLowerCase();

      return matchesSearch && matchesType;
    });
  }, [baseList, searchQuery, selectedType]);

  const getCategoryIcon = () => {
    switch (category) {
      case 'popular':
      case 'trending':
        return <Flame className="w-7 h-7 text-red-500 fill-red-500/20" />;
      case 'latest':
        return <Zap className="w-7 h-7 text-amber-400 fill-amber-400/20" />;
      case 'ongoing':
        return <Tv className="w-7 h-7 text-blue-400" />;
      case 'upcoming':
        return <Calendar className="w-7 h-7 text-emerald-400" />;
      case 'completed':
        return <Trophy className="w-7 h-7 text-yellow-500 fill-yellow-500/20" />;
      default:
        return <Sparkles className="w-7 h-7 text-purple-400" />;
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Navigation & Category Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#1b1b1b] via-[#161616] to-[#121212] border border-[#2a2a2a] shadow-xl">
        <div className="flex items-start gap-4">
          <button
            onClick={onBackToHome}
            className="p-2.5 rounded-xl bg-[#252525] hover:bg-[#333333] text-gray-300 hover:text-white transition-all cursor-pointer shrink-0 mt-0.5"
            title="Back to Home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#222222] border border-[#333333]">
                {getCategoryIcon()}
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {title}
                </h1>
                <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls: Shuffle & Search */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleShuffle}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#222222] hover:bg-[#303030] active:scale-95 text-xs font-semibold text-gray-200 border border-[#3a3a3a] transition-all cursor-pointer shadow-md"
          >
            <Shuffle className="w-4 h-4 text-red-400" />
            <span>Shuffle List</span>
          </button>

          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search in ${title}...`}
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#222222] text-white placeholder-gray-400 rounded-xl border border-[#3a3a3a] focus:outline-none focus:border-red-500"
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs by Type */}
      {typesList.length > 2 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <Filter className="w-4 h-4 text-gray-400 shrink-0 ml-1" />
          {typesList.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedType === type
                  ? 'bg-white text-black font-semibold'
                  : 'bg-[#222222] text-gray-300 hover:bg-[#2e2e2e] hover:text-white border border-[#333333]'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      )}

      {/* Grid of Video Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <VideoCardSkeleton key={`skeleton-${i}`} />
          ))}
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-[#272727] flex items-center justify-center text-gray-400 mb-4">
            <Tv className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">No anime found</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm">
            {searchQuery
              ? `No anime matched "${searchQuery}" in this category.`
              : 'Anime list is currently loading or empty.'}
          </p>
          {(searchQuery || selectedType !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedType('All');
              }}
              className="mt-4 px-4 py-2 rounded-full bg-[#272727] hover:bg-[#383838] text-white text-xs font-semibold"
            >
              Reset filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
          {filteredVideos.map((video) => (
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
