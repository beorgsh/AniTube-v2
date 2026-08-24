import { useState } from 'react';
import { MoreVertical, Clock, ListPlus, Share2, Ban, Flag, Play } from 'lucide-react';
import { Video } from '../types';
import { formatRelativeTime } from '../services/timeUtils';
import { FadeImage, VerifiedBadge } from './FadeImage';

export interface VideoCardProps {
  video: Video;
  onSelectVideo: (video: Video) => void;
  onSelectInfo?: (video: Video) => void;
  layout?: 'grid' | 'list';
  isGenreCard?: boolean;
  isGenreBlurOverlay?: boolean;
  key?: string | number;
}

export const VideoCard = ({
  video,
  onSelectVideo,
  onSelectInfo,
  layout = 'grid',
  isGenreCard = false,
  isGenreBlurOverlay = false,
}: VideoCardProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  if (layout === 'list') {
    return (
      <div 
        className="flex gap-4 sm:gap-6 p-3 rounded-2xl hover:bg-[#212121] cursor-pointer transition-colors group border border-transparent hover:border-white/10"
      >
        {/* Left: Card / Thumbnail Container */}
        <div 
          onClick={() => onSelectVideo(video)}
          className="relative w-44 sm:w-56 md:w-64 aspect-video rounded-xl overflow-hidden bg-[#212121] shrink-0 shadow-md"
        >
          {isGenreCard && isGenreBlurOverlay ? (
            <>
              {/* Background blurred image */}
              <div className="absolute inset-0 overflow-hidden">
                <FadeImage
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover filter blur-lg scale-125 opacity-70"
                  containerClassName="w-full h-full"
                />
                <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />
              </div>

              {/* Center Overlay: Poster Portrait with Blur BG */}
              <div className="absolute inset-0 flex items-center justify-center p-1.5 z-10">
                <div className="h-[92%] aspect-[2/3] rounded-lg overflow-hidden shadow-xl border border-white/20 bg-[#181818]">
                  <FadeImage
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover"
                    containerClassName="w-full h-full"
                  />
                </div>
              </div>
            </>
          ) : (
            <FadeImage
              src={video.thumbnail}
              alt={video.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              containerClassName="w-full h-full"
            />
          )}

          {/* Duration badge */}
          <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-tight bg-black/80 text-white z-20">
            {video.duration}
          </div>
        </div>

        {/* Right: Video Info (YouTube result style) */}
        <div 
          onClick={() => {
            if (onSelectInfo) {
              onSelectInfo(video);
            } else {
              onSelectVideo(video);
            }
          }}
          className="flex-1 min-w-0 py-1 flex flex-col justify-between"
        >
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-white line-clamp-2 leading-snug group-hover:text-blue-400 transition-colors">
              {video.title}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-xs text-[#aaaaaa]">
              <span>{video.views}</span>
              <span>•</span>
              <span>{formatRelativeTime(video.uploadedAt)}</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1.5">
                <FadeImage
                  src={video.channel.avatar}
                  alt={video.channel.name}
                  className="w-5 h-5 rounded-full object-cover"
                  containerClassName="w-5 h-5 rounded-full"
                />
                <span className="text-xs text-gray-300 font-medium">{video.channel.name}</span>
                {video.channel.isVerified && <VerifiedBadge className="w-3 h-3 shrink-0" />}
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2 line-clamp-2 leading-relaxed hidden sm:block">
              {video.description}
            </p>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#272727] text-gray-300 font-medium">
              {video.category}
            </span>
            {video.tags && video.tags.slice(0, 3).map((tag, idx) => (
              <span key={idx} className="text-[10px] px-2 py-0.5 rounded-full bg-[#212121] text-gray-400 hidden md:inline-block">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowMenu(false);
      }}
    >
      {/* Thumbnail Container */}
      <div 
        onClick={() => onSelectVideo(video)}
        className="relative aspect-video w-full rounded-2xl overflow-hidden bg-[#212121] shadow-lg"
      >
        {isGenreCard && isGenreBlurOverlay ? (
          <>
            {/* Background blurred image */}
            <div className="absolute inset-0 overflow-hidden">
              <FadeImage
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover filter blur-xl scale-125 opacity-70"
                containerClassName="w-full h-full"
              />
              <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />
            </div>

            {/* Center Overlay: Poster Portrait with Blur BG */}
            <div className="absolute inset-0 flex items-center justify-center p-2 z-10">
              <div className="h-[92%] aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border border-white/20 bg-[#181818] transform group-hover:scale-105 transition-transform duration-300">
                <FadeImage
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover"
                  containerClassName="w-full h-full"
                />
              </div>
            </div>
          </>
        ) : (
          <FadeImage
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 group-hover:brightness-105 transition-all duration-300"
            containerClassName="w-full h-full"
          />
        )}

        {/* Hover quick play action badge */}
        {isHovered && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
            <div className="w-12 h-12 rounded-full bg-black/70 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
              <Play className="w-5 h-5 ml-0.5 fill-current text-white" />
            </div>
          </div>
        )}

        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md text-xs font-semibold bg-black/85 text-white tracking-wide shadow-md z-20">
          {video.duration}
        </div>

        {/* HLS .m3u8 indicator */}
        <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-black/70 backdrop-blur-sm text-gray-300 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          .m3u8
        </div>
      </div>

      {/* Details Row */}
      <div className="flex gap-3 mt-3 items-start relative">
        {/* Channel Avatar */}
        <div 
          onClick={(e) => {
            e.stopPropagation();
            onSelectVideo(video);
          }}
          className="shrink-0"
        >
          <FadeImage
            src={video.channel.avatar}
            alt={video.channel.name}
            className="w-9 h-9 rounded-full object-cover ring-1 ring-white/10 hover:ring-white/30 transition-all"
            containerClassName="w-9 h-9 rounded-full"
          />
        </div>

        {/* Title and Metadata */}
        <div 
          onClick={() => {
            if (onSelectInfo) {
              onSelectInfo(video);
            } else {
              onSelectVideo(video);
            }
          }}
          className="flex-1 min-w-0 pr-6 cursor-pointer"
        >
          <h3 className="text-sm font-semibold text-[#f1f1f1] leading-tight line-clamp-2 group-hover:text-white transition-colors" title={video.title}>
            {video.title}
          </h3>

          <div className="text-xs text-[#aaaaaa] mt-1 space-y-0.5">
            <div className="flex items-center gap-1 hover:text-white transition-colors">
              <span className="truncate">{video.channel.name}</span>
              {video.channel.isVerified && <VerifiedBadge className="w-3.5 h-3.5 shrink-0" />}
            </div>

            <div>
              <span>{video.views}</span>
              <span className="mx-1">•</span>
              <span>{formatRelativeTime(video.uploadedAt)}</span>
            </div>
          </div>
        </div>

        {/* 3-Dots Action Menu */}
        <div className="absolute right-0 top-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-[#272727] text-gray-400 hover:text-white transition-all focus:outline-none"
            aria-label="Action menu"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <div 
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-6 z-30 w-52 bg-[#282828] border border-[#383838] rounded-xl shadow-2xl py-1.5 text-xs text-gray-200"
            >
              <div 
                onClick={() => setShowMenu(false)}
                className="flex items-center gap-3 px-3 py-2 hover:bg-[#383838] cursor-pointer"
              >
                <Clock className="w-4 h-4 text-gray-400" />
                <span>Save to Watch Later</span>
              </div>
              <div 
                onClick={() => setShowMenu(false)}
                className="flex items-center gap-3 px-3 py-2 hover:bg-[#383838] cursor-pointer"
              >
                <ListPlus className="w-4 h-4 text-gray-400" />
                <span>Save to playlist</span>
              </div>
              <div 
                onClick={() => setShowMenu(false)}
                className="flex items-center gap-3 px-3 py-2 hover:bg-[#383838] cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-gray-400" />
                <span>Share video</span>
              </div>
              <div 
                onClick={() => setShowMenu(false)}
                className="flex items-center gap-3 px-3 py-2 hover:bg-[#383838] cursor-pointer"
              >
                <Ban className="w-4 h-4 text-gray-400" />
                <span>Not interested</span>
              </div>
              <div 
                onClick={() => setShowMenu(false)}
                className="flex items-center gap-3 px-3 py-2 hover:bg-[#383838] cursor-pointer"
              >
                <Flag className="w-4 h-4 text-gray-400" />
                <span>Report</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
