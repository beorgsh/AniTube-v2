import React from 'react';
export const GenreListSkeleton: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-3">
      {[1, 2, 3, 4].map((item) => (
        <div 
          key={item}
          className="flex gap-4 sm:gap-6 p-3 rounded-2xl bg-[#181818] border border-white/5 animate-pulse"
        >
          {/* Thumbnail Skeleton */}
          <div className="w-44 sm:w-56 md:w-64 aspect-video rounded-xl bg-[#222222] shrink-0" />
          {/* Info Skeleton */}
          <div className="flex-1 py-1 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="h-5 bg-[#252525] rounded-md w-4/5" />
              <div className="h-3 bg-[#202020] rounded-md w-2/5" />
              <div className="h-3 bg-[#202020] rounded-md w-3/5 hidden sm:block" />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-16 h-4 rounded-full bg-[#222222]" />
              <div className="w-20 h-4 rounded-full bg-[#222222] hidden md:block" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
