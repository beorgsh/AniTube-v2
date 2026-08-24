import React from 'react';
import { Clock, ThumbsUp, Trash2, Play, ArrowLeft, Tv } from 'lucide-react';
import { Video } from '../types';
import { LikedEpisodeItem, removeFromWatchLater, removeLikedEpisode } from '../services/sessionStorage';
import { formatRelativeTime } from '../services/timeUtils';
import { FadeImage } from './FadeImage';

interface SavedListViewProps {
  type: 'watch_later' | 'liked';
  watchLaterItems: Video[];
  likedItems: LikedEpisodeItem[];
  onSelectVideo: (video: Video) => void;
  onBackToHome: () => void;
  onRefresh: () => void;
}

export const SavedListView: React.FC<SavedListViewProps> = ({
  type,
  watchLaterItems,
  likedItems,
  onSelectVideo,
  onBackToHome,
  onRefresh
}) => {
  const isWatchLater = type === 'watch_later';
  const title = isWatchLater ? 'Watch Later' : 'Liked Videos';
  const subtitle = isWatchLater
    ? 'Anime series bookmarked to watch later (synced in session)'
    : 'Specific anime episodes you have liked (saved in session cookies)';
  const count = isWatchLater ? watchLaterItems.length : likedItems.length;

  const handlePlayLikedEpisode = (item: LikedEpisodeItem) => {
    // Construct video object to play that specific episode
    const videoObj: Video = {
      id: item.slug || item.animeId,
      slug: item.slug,
      malId: item.malId,
      title: item.formattedTitle,
      description: `Liked Episode ${item.episodeNumber} of ${item.animeTitle}`,
      thumbnail: item.thumbnail,
      duration: '24:00',
      views: '1.2M',
      viewsCount: 1200000,
      uploadedAt: new Date(item.likedAt).toISOString(),
      channel: {
        id: 'ch-liked',
        name: item.channel?.name || item.animeTitle,
        avatar: item.channel?.avatar || item.thumbnail,
        subscribers: item.channel?.subscribers || '1M',
        handle: '@anitube',
      },
      streamUrl: item.streamUrl || '',
      category: 'Anime',
      tags: ['Liked Episode', `EP ${item.episodeNumber}`],
      likes: '1',
      likesCount: 1,
      isLiked: true,
      commentsCount: '0',
      comments: [],
      episodeNumber: item.episodeNumber
    };
    onSelectVideo(videoObj);
  };

  const handleRemoveWatchLater = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeFromWatchLater(id);
    onRefresh();
  };

  const handleRemoveLiked = (e: React.MouseEvent, key: string) => {
    e.stopPropagation();
    removeLikedEpisode(key);
    onRefresh();
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#272727] pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHome}
            className="p-2 rounded-full hover:bg-[#272727] text-gray-400 hover:text-white transition-colors cursor-pointer"
            title="Back to Home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-[#272727] flex items-center justify-center text-red-500">
            {isWatchLater ? <Clock className="w-5 h-5" /> : <ThumbsUp className="w-5 h-5" />}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <span>{title}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#272727] text-gray-300 font-normal">
                {count} {count === 1 ? 'item' : 'items'}
              </span>
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
          </div>
        </div>
      </div>

      {/* List Content */}
      {count === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-[#151515] rounded-2xl border border-[#252525]">
          <div className="w-16 h-16 rounded-full bg-[#272727] flex items-center justify-center text-gray-400 mb-4">
            {isWatchLater ? <Clock className="w-8 h-8" /> : <ThumbsUp className="w-8 h-8" />}
          </div>
          <h3 className="text-lg font-bold text-white">No {isWatchLater ? 'watch later' : 'liked'} items yet</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm">
            {isWatchLater
              ? 'Click "Subscribe" on any anime to automatically add it to your Watch Later list.'
              : 'Click the "Like" button on any specific episode in the player to save that episode here.'}
          </p>
          <button
            onClick={onBackToHome}
            className="mt-5 px-5 py-2.5 rounded-full bg-white text-black text-xs font-bold hover:bg-gray-200 transition-colors cursor-pointer"
          >
            Explore Anime Hub
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {isWatchLater
            ? watchLaterItems.map((video) => (
                <div
                  key={video.id}
                  onClick={() => onSelectVideo(video)}
                  className="group relative bg-[#181818] border border-[#272727] rounded-xl overflow-hidden hover:border-[#444] transition-all cursor-pointer flex flex-col"
                >
                  <div className="relative aspect-video bg-black overflow-hidden">
                    <FadeImage
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      containerClassName="w-full h-full"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                      <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </div>
                    {video.duration && (
                      <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-semibold text-white z-10">
                        {video.duration}
                      </span>
                    )}
                  </div>
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white line-clamp-2 leading-tight group-hover:text-red-400 transition-colors">
                        {video.title}
                      </h4>
                      <p className="text-[11px] text-gray-400 mt-1 truncate">
                        {video.channel.name}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#252525]">
                      <span className="text-[10px] text-gray-500">
                        {formatRelativeTime(video.uploadedAt)}
                      </span>
                      <button
                        onClick={(e) => handleRemoveWatchLater(e, video.id)}
                        className="p-1.5 rounded-lg hover:bg-red-950/40 text-gray-400 hover:text-red-400 transition-colors"
                        title="Remove from Watch Later"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            : likedItems.map((item) => (
                <div
                  key={item.key}
                  onClick={() => handlePlayLikedEpisode(item)}
                  className="group relative bg-[#181818] border border-[#272727] rounded-xl overflow-hidden hover:border-[#444] transition-all cursor-pointer flex flex-col"
                >
                  <div className="relative aspect-video bg-black overflow-hidden">
                    <FadeImage
                      src={item.thumbnail}
                      alt={item.formattedTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      containerClassName="w-full h-full"
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-red-600 text-[10px] font-bold text-white shadow z-10">
                      EP {item.episodeNumber}
                    </span>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                      <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white line-clamp-2 leading-tight group-hover:text-red-400 transition-colors">
                        {item.formattedTitle}
                      </h4>
                      <p className="text-[11px] text-gray-400 mt-1 truncate">
                        {item.animeTitle}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#252525]">
                      <span className="text-[10px] text-gray-500">
                        Liked {formatRelativeTime(new Date(item.likedAt).toISOString())}
                      </span>
                      <button
                        onClick={(e) => handleRemoveLiked(e, item.key)}
                        className="p-1.5 rounded-lg hover:bg-red-950/40 text-gray-400 hover:text-red-400 transition-colors"
                        title="Remove from Liked"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
        </div>
      )}
    </div>
  );
};
