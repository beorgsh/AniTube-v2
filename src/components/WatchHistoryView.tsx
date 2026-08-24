import React, { useState } from 'react';
import { History, Trash2, CheckSquare, Square, AlertTriangle, ArrowLeft, Play, Tv, Check } from 'lucide-react';
import { Video } from '../types';
import { FadeImage } from './FadeImage';
import {
  removeFromWatchHistory,
  removeMultipleFromWatchHistory,
  clearWatchHistory,
} from '../services/sessionStorage';

interface WatchHistoryViewProps {
  historyItems: Video[];
  onSelectVideo: (video: Video) => void;
  onBackToHome: () => void;
  onRefresh: () => void;
}

// Helper to format seconds to M:SS or MM:SS
function formatWatchTime(seconds?: number): string {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export const WatchHistoryView: React.FC<WatchHistoryViewProps> = ({
  historyItems,
  onSelectVideo,
  onBackToHome,
  onRefresh,
}) => {
  // Selection state for batch deletion
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Confirmation Modal state
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: 'single' | 'multiple' | 'clear_all';
    targetVideo?: Video;
  }>({
    isOpen: false,
    type: 'single',
  });

  const toggleSelectItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === historyItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(historyItems.map((item) => item.id));
    }
  };

  // Open modal triggers
  const promptDeleteSingle = (video: Video, e: React.MouseEvent) => {
    e.stopPropagation();
    setModalConfig({
      isOpen: true,
      type: 'single',
      targetVideo: video,
    });
  };

  const promptDeleteMultiple = () => {
    if (selectedIds.length === 0) return;
    setModalConfig({
      isOpen: true,
      type: 'multiple',
    });
  };

  const promptClearAll = () => {
    if (historyItems.length === 0) return;
    setModalConfig({
      isOpen: true,
      type: 'clear_all',
    });
  };

  // Execute deletion after modal confirmation
  const handleConfirmDelete = () => {
    if (modalConfig.type === 'single' && modalConfig.targetVideo) {
      removeFromWatchHistory(modalConfig.targetVideo.id);
      setSelectedIds((prev) => prev.filter((id) => id !== modalConfig.targetVideo?.id));
    } else if (modalConfig.type === 'multiple') {
      removeMultipleFromWatchHistory(selectedIds);
      setSelectedIds([]);
      setIsSelectMode(false);
    } else if (modalConfig.type === 'clear_all') {
      clearWatchHistory();
      setSelectedIds([]);
      setIsSelectMode(false);
    }

    setModalConfig({ isOpen: false, type: 'single' });
    onRefresh();
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#1a1a1a] via-[#151515] to-[#111111] border border-[#272727] shadow-xl">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToHome}
            className="p-2.5 rounded-xl bg-[#252525] hover:bg-[#333333] text-gray-300 hover:text-white transition-all cursor-pointer shrink-0"
            title="Back to Home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <History className="w-6 h-6 text-white shrink-0" />
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Watch History
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#272727] text-gray-300 border border-[#383838]">
                {historyItems.length} {historyItems.length === 1 ? 'anime' : 'animes'}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Keep track of anime series and episodes you have recently watched
            </p>
          </div>
        </div>

        {/* Top Actions: Select Multiple / Clear History */}
        {historyItems.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#252525]">
            {!isSelectMode ? (
              <>
                <button
                  onClick={() => setIsSelectMode(true)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#222222] hover:bg-[#303030] active:scale-95 text-xs font-semibold text-gray-200 border border-[#383838] transition-all cursor-pointer"
                >
                  <CheckSquare className="w-4 h-4 text-blue-400" />
                  <span>Select Multiple</span>
                </button>
                <button
                  onClick={promptClearAll}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#222222] hover:bg-red-950/40 hover:text-red-400 active:scale-95 text-xs font-semibold text-gray-300 border border-[#383838] hover:border-red-800/50 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear History</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSelectAll}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#2a2a2a] hover:bg-[#383838] text-xs font-semibold text-white border border-[#444] transition-all cursor-pointer"
                >
                  {selectedIds.length === historyItems.length ? (
                    <>
                      <Square className="w-4 h-4 text-gray-400" />
                      <span>Deselect All</span>
                    </>
                  ) : (
                    <>
                      <CheckSquare className="w-4 h-4 text-blue-400" />
                      <span>Select All ({selectedIds.length}/{historyItems.length})</span>
                    </>
                  )}
                </button>

                <button
                  onClick={promptDeleteMultiple}
                  disabled={selectedIds.length === 0}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedIds.length > 0
                      ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/30'
                      : 'bg-[#222222] text-gray-500 border border-[#333] cursor-not-allowed'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Selected ({selectedIds.length})</span>
                </button>

                <button
                  onClick={() => {
                    setIsSelectMode(false);
                    setSelectedIds([]);
                  }}
                  className="px-3 py-2 rounded-xl bg-[#222222] hover:bg-[#303030] text-xs text-gray-300 hover:text-white border border-[#333] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* History Items List */}
      {historyItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-[#151515] rounded-2xl border border-[#252525]">
          <div className="w-16 h-16 rounded-full bg-[#272727] flex items-center justify-center text-gray-400 mb-4">
            <History className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-bold text-white">Your Watch History is Empty</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm">
            Watch any anime series or episode to automatically keep track of your viewing history.
          </p>
          <button
            onClick={onBackToHome}
            className="mt-5 px-5 py-2.5 rounded-full bg-white text-black text-xs font-bold hover:bg-gray-200 transition-colors cursor-pointer"
          >
            Explore Anime Catalogue
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {historyItems.map((video) => {
            const isSelected = selectedIds.includes(video.id);

            return (
              <div
                key={video.id}
                onClick={() => {
                  if (isSelectMode) {
                    toggleSelectItem(video.id);
                  } else {
                    onSelectVideo(video);
                  }
                }}
                className={`group relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-950/20 border-blue-500/60 ring-1 ring-blue-500/40'
                    : 'bg-[#161616] border-[#262626] hover:bg-[#1f1f1f] hover:border-[#383838]'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 min-w-0 flex-1 w-full">
                  {/* Select Checkbox (visible in multi-select mode) */}
                  {isSelectMode && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectItem(video.id);
                      }}
                      className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors shrink-0 self-center ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'border-2 border-gray-500 hover:border-gray-300'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                  )}

                  {/* 16:9 Landscape Poster Thumbnail Container */}
                  <div className="relative w-full sm:w-60 md:w-72 aspect-video rounded-xl overflow-hidden shrink-0 bg-[#222222] shadow-lg group-hover:shadow-2xl transition-shadow">
                    <FadeImage
                      src={video.thumbnail || video.poster}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    
                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 bg-black/25 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-red-600/90 text-white flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity transform group-hover:scale-110 shadow-lg">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </div>

                    {/* EP Badge on top-left of poster */}
                    {video.episodeNumber && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-red-600/90 backdrop-blur-sm text-[10px] font-extrabold text-white shadow-md border border-red-500/50 z-10">
                        EP {video.episodeNumber}
                      </span>
                    )}

                    {/* Duration / Progress Time Badge on bottom-right of poster */}
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm text-[10px] font-mono font-bold text-white z-10 border border-white/10 shadow-md">
                      {video.currentTime && video.durationSeconds
                        ? `${formatWatchTime(video.currentTime)} / ${formatWatchTime(video.durationSeconds)}`
                        : video.duration || '24:00'}
                    </div>

                    {/* RED YOUTUBE PROGRESS BAR AT BOTTOM OF POSTER OVERLAY */}
                    {typeof video.progressPercent === 'number' && video.progressPercent > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-black/60 overflow-hidden z-20">
                        <div
                          className="h-full bg-red-600 transition-all duration-300 shadow-sm"
                          style={{ width: `${Math.min(100, Math.max(3, video.progressPercent))}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Info Details */}
                  <div className="min-w-0 flex-1 space-y-1.5 py-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#272727] text-gray-300 border border-[#383838]">
                        {video.category}
                      </span>

                      {video.episodeNumber && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-red-950/70 text-red-400 border border-red-800/50">
                          Episode {video.episodeNumber}
                        </span>
                      )}

                      {typeof video.progressPercent === 'number' && video.progressPercent > 0 && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/70 text-emerald-400 border border-emerald-800/50">
                          {video.progressPercent}% Watched
                        </span>
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-red-400 transition-colors leading-snug line-clamp-2">
                      {video.title}
                    </h3>

                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                      {video.description}
                    </p>

                    <div className="flex items-center gap-2 pt-1 text-[11px] text-gray-500 font-medium">
                      <span>{video.channel?.name || 'AniTube Player'}</span>
                      <span>•</span>
                      <span>Watched in HD Stream</span>
                    </div>
                  </div>
                </div>

                {/* Individual Delete Button */}
                {!isSelectMode && (
                  <button
                    onClick={(e) => promptDeleteSingle(video, e)}
                    title="Remove from Watch History"
                    className="p-2.5 rounded-xl bg-[#222222] hover:bg-red-950/60 text-gray-400 hover:text-red-400 border border-[#333] hover:border-red-800/60 transition-all cursor-pointer shrink-0 self-start sm:self-center opacity-80 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#181818] border border-[#2e2e2e] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-950/50 border border-red-800/40 flex items-center justify-center text-red-500 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {modalConfig.type === 'single'
                    ? 'Delete from Watch History?'
                    : modalConfig.type === 'multiple'
                    ? `Delete ${selectedIds.length} Selected Items?`
                    : 'Clear Entire Watch History?'}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Confirm deletion from your account session
                </p>
              </div>
            </div>

            <div className="text-xs text-gray-300 leading-relaxed bg-[#121212] p-3.5 rounded-xl border border-[#252525]">
              {modalConfig.type === 'single' && modalConfig.targetVideo ? (
                <span>
                  Are you sure you want to remove <strong className="text-white">"{modalConfig.targetVideo.title}"</strong> from your watch history?
                </span>
              ) : modalConfig.type === 'multiple' ? (
                <span>
                  Are you sure you want to remove <strong className="text-white">{selectedIds.length} selected item(s)</strong> from your watch history?
                </span>
              ) : (
                <span>
                  Are you sure you want to clear your <strong className="text-white">entire Watch History ({historyItems.length} items)</strong>? This action cannot be undone.
                </span>
              )}
            </div>

            {/* Modal Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#252525]">
              <button
                type="button"
                onClick={() => setModalConfig({ isOpen: false, type: 'single' })}
                className="px-4 py-2.5 rounded-xl bg-[#252525] hover:bg-[#333333] text-gray-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-lg shadow-red-900/30 cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
