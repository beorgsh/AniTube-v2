import React from 'react';

export const GenreListSkeleton: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-4">
      {[1, 2, 3, 4, 5].map((item) => (
        <div 
          key={item}
          className="flex flex-col sm:flex-row gap-2.5 sm:gap-5 p-1 sm:p-3.5 rounded-2xl bg-[#181818]/40 sm:border sm:border-white/5 animate-pulse"
        >
          {/* Thumbnail Skeleton */}
          <div className="w-full sm:w-56 md:w-64 lg:w-72 aspect-video rounded-2xl sm:rounded-xl bg-[#222222] shrink-0" />
          
          {/* Desktop/Tablet Info Skeleton */}
          <div className="hidden sm:flex flex-1 py-1 flex-col justify-between space-y-2">
            <div className="space-y-2">
              <div className="h-5 bg-[#262626] rounded-md w-4/5" />
              <div className="h-3 bg-[#202020] rounded-md w-2/5" />
              <div className="h-3 bg-[#202020] rounded-md w-3/5" />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-16 h-4 rounded-full bg-[#222222]" />
              <div className="w-20 h-4 rounded-full bg-[#222222]" />
            </div>
          </div>

          {/* Mobile Info Skeleton */}
          <div className="flex sm:hidden gap-3 mt-1 px-1 items-start">
            <div className="w-9 h-9 rounded-full bg-[#242424] shrink-0" />
            <div className="flex-1 space-y-2 py-0.5">
              <div className="h-4 bg-[#262626] rounded w-11/12" />
              <div className="h-3 bg-[#202020] rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
