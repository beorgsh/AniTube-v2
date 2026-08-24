export const VideoCardSkeleton = () => {
  return (
    <div className="flex flex-col animate-pulse">
      {/* Thumbnail Skeleton */}
      <div className="aspect-video w-full rounded-2xl bg-[#272727] relative overflow-hidden">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-[#333333] to-transparent" />
      </div>

      {/* Details Row Skeleton */}
      <div className="flex gap-3 mt-3 items-start">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-[#272727] shrink-0" />

        {/* Text lines */}
        <div className="flex-1 space-y-2 py-1">
          <div className="h-3.5 bg-[#272727] rounded-md w-11/12" />
          <div className="h-3 bg-[#272727] rounded-md w-7/12" />
          <div className="h-2.5 bg-[#272727] rounded-md w-1/3" />
        </div>
      </div>
    </div>
  );
};
