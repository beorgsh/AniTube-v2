import { useState } from 'react';
import { MoreVertical, Clock, ListPlus, Share2, Ban, Flag, Play } from 'lucide-react';
import { Video } from '../types';
import { formatRelativeTime } from '../services/timeUtils';
import { FadeImage, VerifiedBadge } from './FadeImage';

export interface VideoCardProps {
  video: Video;
  onSelectVideo: (video: Video) => void;
  layout?: 'grid' | 'list';
  key?: string | number;
}

export const VideoCard = ({
  video,
  onSelectVideo,
  layout = 'grid',
}: VideoCardProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  if (layout === 'list') {
    return (
      <div 
        onClick={() => onSelectVideo(video)}
        className="flex gap-3 sm:gap-4 p-2 rounded-xl hover:bg-[#272727]/50 cursor-pointer transition-colors group"
      >
        {/* Thumbnail */}
        <div className="relative w-40 sm:w-48 aspect-video rounded-xl overflow-hidden bg-[#212121] shrink-0">
          <FadeImage
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            containerClassName="w-full h-full"
          />
          <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-tight bg-black/80 text-white z-10">
            {video.duration}
          </div>
        </div>

        {/* Video Info */}
        <div className="flex-1 min-w-0 pr-2">
          <h3 className="text-sm font-medium text-white line-clamp-2 leading-snug group-hover:text-blue-400 transition-colors">
            {video.title}
          </h3>
          <p className="text-xs text-[#aaaaaa] mt-1 flex items-center gap-1 hover:text-white">
            <span>{video.channel.name}</span>
            {video.channel.isVerified && <VerifiedBadge className="w-3.5 h-3.5 shrink-0" />}
          </p>
          <p className="text-xs text-[#aaaaaa] mt-0.5">
            {video.views} • {formatRelativeTime(video.uploadedAt)}
          </p>
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
        <FadeImage
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 group-hover:brightness-105 transition-all duration-300"
          containerClassName="w-full h-full"
        />

        {/* Hover quick play action badge */}
        {isHovered && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <div className="w-12 h-12 rounded-full bg-black/70 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
              <Play className="w-5 h-5 ml-0.5 fill-current text-white" />
            </div>
          </div>
        )}

        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md text-xs font-semibold bg-black/85 text-white tracking-wide shadow-md z-10">
          {video.duration}
        </div>

        {/* HLS .m3u8 indicator */}
        <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-black/70 backdrop-blur-sm text-gray-300 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          .m3u8
        </div>

        {/* EP Episode Number Badge if available */}
        {video.episodeNumber && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-red-600/90 text-white shadow-md z-10 border border-red-500/50">
            EP {video.episodeNumber}
          </div>
        )}
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
          onClick={() => onSelectVideo(video)}
          className="flex-1 min-w-0 pr-6"
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
