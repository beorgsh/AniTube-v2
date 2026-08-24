import React from 'react';
import { Tv } from 'lucide-react';

interface VideoCardSkeletonProps {
  label?: string;
  delayMs?: number;
}

export const VideoCardSkeleton: React.FC<VideoCardSkeletonProps> = ({
  delayMs = 0,
}) => {
  return (
    <div
      className="flex flex-col animate-skeleton-fade opacity-0 transition-all duration-300 select-none"
      style={{ animationDelay: `${delayMs}ms`, animationFillMode: 'forwards' }}
    >
      {/* Thumbnail Skeleton */}
      <div className="aspect-video w-full rounded-2xl bg-[#1a1a1a] border border-[#272727] relative overflow-hidden flex flex-col justify-between p-3">
        {/* Shimmer sweep */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-[#2d2d2d]/60 to-transparent z-[1]" />

        {/* Top Badges */}
        <div className="relative z-10 flex justify-between items-center">
          <div className="w-12 h-4 rounded bg-[#2b2b2b] animate-pulse" />
          <div className="w-8 h-4 rounded bg-[#2b2b2b] animate-pulse" />
        </div>

        {/* Center watermark icon behind skeleton layer */}
        <div className="absolute inset-0 flex items-center justify-center text-[#222222] pointer-events-none z-0">
          <Tv className="w-10 h-10 opacity-30" />
        </div>
      </div>

      {/* Details Row Skeleton */}
      <div className="flex gap-3 mt-3 items-start">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-[#242424] shrink-0 animate-pulse border border-[#333333]/40" />

        {/* Text lines */}
        <div className="flex-1 space-y-2 py-1">
          <div className="h-3.5 bg-[#262626] rounded-md w-11/12 animate-pulse" />
          <div className="h-3 bg-[#222222] rounded-md w-7/12 animate-pulse" />
        </div>
      </div>
    </div>
  );
};


