import React from 'react';
import { 
  Home, 
  Flame, 
  Tv, 
  History, 
  Clock, 
  ThumbsUp, 
  Music2, 
  Trophy, 
  Settings, 
  HelpCircle, 
  Flag, 
  Radio, 
  ChevronRight, 
  ListVideo, 
  Sparkles, 
  Zap, 
  PlaySquare, 
  Calendar 
} from 'lucide-react';
import { ViewMode } from '../types';
import { MOCK_CHANNELS } from '../data/mockVideos';
import { FadeImage } from './FadeImage';

interface SidebarProps {
  isOpen: boolean;
  activeView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  onSelectCategory?: (category: string) => void;
  selectedCategory?: string;
  isWatchPage?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  activeView,
  onSelectView,
  onSelectCategory,
  isWatchPage = false,
  onClose
}) => {
  const handleItemClick = (view: ViewMode) => {
    onSelectView(view);
    if (isWatchPage && onClose) {
      onClose();
    }
  };

  const handleCategoryClick = (category: string) => {
    if (onSelectCategory) {
      onSelectCategory(category);
    }
    if (isWatchPage && onClose) {
      onClose();
    }
  };

  // Content for the full expanded sidebar
  const renderFullContent = () => (
    <div className="space-y-4">
      {/* Section 1: Main Anime Discovery Categories */}
      <div className="space-y-0.5 pb-3 border-b border-[#272727]">
        <button
          onClick={() => handleItemClick('home')}
          className={`flex items-center gap-4 w-full px-3 py-2.5 rounded-xl font-normal transition-colors cursor-pointer ${
            activeView === 'home' ? 'bg-[#272727] font-semibold text-white' : 'text-gray-300 hover:bg-[#222222]'
          }`}
        >
          <Home className="w-5 h-5 text-white shrink-0" />
          <span className="truncate">Home</span>
        </button>

        <button
          onClick={() => handleItemClick('popular')}
          className={`flex items-center gap-4 w-full px-3 py-2.5 rounded-xl font-normal transition-colors cursor-pointer ${
            activeView === 'popular' || activeView === 'trending' ? 'bg-[#272727] font-semibold text-white' : 'text-gray-300 hover:bg-[#222222]'
          }`}
        >
          <Flame className="w-5 h-5 text-red-500 shrink-0" />
          <div className="flex items-center justify-between flex-1 truncate">
            <span className="truncate">Popular & Trending</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-600 text-white ml-2 shrink-0">HOT</span>
          </div>
        </button>

        <button
          onClick={() => handleItemClick('latest')}
          className={`flex items-center gap-4 w-full px-3 py-2.5 rounded-xl font-normal transition-colors cursor-pointer ${
            activeView === 'latest' ? 'bg-[#272727] font-semibold text-white' : 'text-gray-300 hover:bg-[#222222]'
          }`}
        >
          <Zap className="w-5 h-5 text-white shrink-0" />
          <div className="flex items-center justify-between flex-1 truncate">
            <span className="truncate">Latest Episodes</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#333] text-gray-200 ml-2 shrink-0">NEW</span>
          </div>
        </button>

        <button
          onClick={() => handleItemClick('ongoing')}
          className={`flex items-center gap-4 w-full px-3 py-2.5 rounded-xl font-normal transition-colors cursor-pointer ${
            activeView === 'ongoing' ? 'bg-[#272727] font-semibold text-white' : 'text-gray-300 hover:bg-[#222222]'
          }`}
        >
          <Tv className="w-5 h-5 text-white shrink-0" />
          <span className="truncate">Ongoing Anime</span>
        </button>

        <button
          onClick={() => handleItemClick('upcoming')}
          className={`flex items-center gap-4 w-full px-3 py-2.5 rounded-xl font-normal transition-colors cursor-pointer ${
            activeView === 'upcoming' ? 'bg-[#272727] font-semibold text-white' : 'text-gray-300 hover:bg-[#222222]'
          }`}
        >
          <Calendar className="w-5 h-5 text-white shrink-0" />
          <span className="truncate">Upcoming Releases</span>
        </button>

        <button
          onClick={() => handleItemClick('completed')}
          className={`flex items-center gap-4 w-full px-3 py-2.5 rounded-xl font-normal transition-colors cursor-pointer ${
            activeView === 'completed' ? 'bg-[#272727] font-semibold text-white' : 'text-gray-300 hover:bg-[#222222]'
          }`}
        >
          <Trophy className="w-5 h-5 text-white shrink-0" />
          <span className="truncate">Completed Series</span>
        </button>
      </div>

      {/* Section 2: You / Library */}
      <div className="space-y-0.5 py-3 border-b border-[#272727]">
        <button
          onClick={() => handleItemClick('library')}
          className="flex items-center justify-between w-full px-3 py-2 text-white font-bold hover:bg-[#222222] rounded-xl cursor-pointer"
        >
          <span className="text-sm font-semibold">You</span>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </button>

        <button
          onClick={() => handleItemClick('history')}
          className={`flex items-center gap-4 w-full px-3 py-2.5 rounded-xl font-normal transition-colors cursor-pointer ${
            activeView === 'history' ? 'bg-[#272727] font-semibold text-white' : 'text-gray-300 hover:bg-[#222222]'
          }`}
        >
          <History className="w-5 h-5 text-white shrink-0" />
          <span className="truncate">Watch History</span>
        </button>

        <button
          onClick={() => handleItemClick('subscriptions')}
          className={`flex items-center gap-4 w-full px-3 py-2.5 rounded-xl font-normal transition-colors cursor-pointer ${
            activeView === 'subscriptions' ? 'bg-[#272727] font-semibold text-white' : 'text-gray-300 hover:bg-[#222222]'
          }`}
        >
          <Sparkles className="w-5 h-5 text-white shrink-0" />
          <span className="truncate">Subscriptions</span>
        </button>

        <button
          onClick={() => handleItemClick('library')}
          className="flex items-center gap-4 w-full px-3 py-2.5 rounded-xl text-gray-300 hover:bg-[#222222] transition-colors cursor-pointer"
        >
          <ListVideo className="w-5 h-5 text-white shrink-0" />
          <span className="truncate">Playlists</span>
        </button>

        <button
          onClick={() => handleItemClick('watch_later')}
          className={`flex items-center gap-4 w-full px-3 py-2.5 rounded-xl font-normal transition-colors cursor-pointer ${
            activeView === 'watch_later' ? 'bg-[#272727] font-semibold text-white' : 'text-gray-300 hover:bg-[#222222]'
          }`}
        >
          <Clock className="w-5 h-5 text-white shrink-0" />
          <span className="truncate">Watch Later</span>
        </button>

        <button
          onClick={() => handleItemClick('liked')}
          className={`flex items-center gap-4 w-full px-3 py-2.5 rounded-xl font-normal transition-colors cursor-pointer ${
            activeView === 'liked' ? 'bg-[#272727] font-semibold text-white' : 'text-gray-300 hover:bg-[#222222]'
          }`}
        >
          <ThumbsUp className="w-5 h-5 text-white shrink-0" />
          <span className="truncate">Liked videos</span>
        </button>
      </div>

      {/* Section 3: Subscriptions List */}
      <div className="py-3 border-b border-[#272727]">
        <div className="px-3 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Channels
        </div>
        <div className="space-y-0.5">
          {MOCK_CHANNELS.map((channel) => (
            <button
              key={channel.id}
              onClick={() => handleCategoryClick(channel.name)}
              className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-gray-300 hover:bg-[#222222] transition-colors group text-left cursor-pointer"
            >
              <div className="flex items-center gap-3 truncate">
                <FadeImage
                  src={channel.avatar}
                  alt={channel.name}
                  className="w-6 h-6 rounded-full object-cover shrink-0"
                  containerClassName="w-6 h-6 rounded-full shrink-0"
                />
                <span className="text-xs truncate">{channel.name}</span>
              </div>
              {channel.id === 'ch-anitrack' && (
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse shrink-0" title="Streaming Live" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Section 4: Explore Music & Live */}
      <div className="py-3 border-b border-[#272727]">
        <div className="px-3 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Explore
        </div>
        <div className="space-y-0.5">
          <button
            onClick={() => handleCategoryClick('Soundtracks')}
            className="flex items-center gap-4 w-full px-3 py-2.5 rounded-xl text-gray-300 hover:bg-[#222222] transition-colors cursor-pointer"
          >
            <Music2 className="w-5 h-5 text-white shrink-0" />
            <span className="truncate">Anime OSTs & Music</span>
          </button>

          <button
            onClick={() => handleCategoryClick('Live')}
            className="flex items-center gap-4 w-full px-3 py-2.5 rounded-xl text-gray-300 hover:bg-[#222222] transition-colors cursor-pointer"
          >
            <Radio className="w-5 h-5 text-white shrink-0" />
            <span className="truncate">Live Broadcasts</span>
          </button>
        </div>
      </div>

      {/* Section 5: Settings & Info */}
      <div className="py-3 border-b border-[#272727] space-y-0.5">
        <button className="flex items-center gap-4 w-full px-3 py-2.5 rounded-xl text-gray-300 hover:bg-[#222222] transition-colors cursor-pointer">
          <Settings className="w-5 h-5 text-white shrink-0" />
          <span className="truncate">Settings</span>
        </button>

        <button className="flex items-center gap-4 w-full px-3 py-2.5 rounded-xl text-gray-300 hover:bg-[#222222] transition-colors cursor-pointer">
          <Flag className="w-5 h-5 text-white shrink-0" />
          <span className="truncate">Report history</span>
        </button>

        <button className="flex items-center gap-4 w-full px-3 py-2.5 rounded-xl text-gray-300 hover:bg-[#222222] transition-colors cursor-pointer">
          <HelpCircle className="w-5 h-5 text-white shrink-0" />
          <span className="truncate">Help</span>
        </button>
      </div>

      {/* Section 6: Footer info */}
      <div className="px-3 pt-3 pb-6 text-[11px] text-[#717171] space-y-2">
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          <span className="hover:underline cursor-pointer">About</span>
          <span className="hover:underline cursor-pointer">Press</span>
          <span className="hover:underline cursor-pointer">Copyright</span>
          <span className="hover:underline cursor-pointer">Terms</span>
          <span className="hover:underline cursor-pointer">Privacy</span>
        </div>
        <div className="pt-2 font-mono text-[10px] text-[#555555]">
          © 2026 AniTube • Anikoto Sync
        </div>
      </div>
    </div>
  );

  // Content for the mini collapsed sidebar
  const renderMiniContent = () => (
    <div className="flex flex-col items-center w-full py-1 space-y-1">
      <button
        onClick={() => onSelectView('home')}
        className={`flex flex-col items-center justify-center w-16 h-18 rounded-xl transition-colors cursor-pointer ${
          activeView === 'home' ? 'bg-[#272727] text-white font-medium' : 'text-gray-400 hover:bg-[#272727] hover:text-white'
        }`}
        title="Home"
      >
        <Home className="w-5 h-5 mb-1.5 text-white" />
        <span className="text-[10px] truncate max-w-full px-1">Home</span>
      </button>

      <button
        onClick={() => onSelectView('popular')}
        className={`flex flex-col items-center justify-center w-16 h-18 rounded-xl transition-colors cursor-pointer ${
          activeView === 'popular' || activeView === 'trending' ? 'bg-[#272727] text-white font-medium' : 'text-gray-400 hover:bg-[#272727] hover:text-white'
        }`}
        title="Popular & Trending"
      >
        <Flame className="w-5 h-5 mb-1.5 text-white" />
        <span className="text-[10px] truncate max-w-full px-1">Popular</span>
      </button>

      <button
        onClick={() => onSelectView('latest')}
        className={`flex flex-col items-center justify-center w-16 h-18 rounded-xl transition-colors cursor-pointer ${
          activeView === 'latest' ? 'bg-[#272727] text-white font-medium' : 'text-gray-400 hover:bg-[#272727] hover:text-white'
        }`}
        title="Latest Episodes"
      >
        <Zap className="w-5 h-5 mb-1.5 text-white" />
        <span className="text-[10px] truncate max-w-full px-1">Latest</span>
      </button>

      <button
        onClick={() => onSelectView('ongoing')}
        className={`flex flex-col items-center justify-center w-16 h-18 rounded-xl transition-colors cursor-pointer ${
          activeView === 'ongoing' ? 'bg-[#272727] text-white font-medium' : 'text-gray-400 hover:bg-[#272727] hover:text-white'
        }`}
        title="Ongoing Anime"
      >
        <Tv className="w-5 h-5 mb-1.5 text-white" />
        <span className="text-[10px] truncate max-w-full px-1">Ongoing</span>
      </button>

      <button
        onClick={() => onSelectView('upcoming')}
        className={`flex flex-col items-center justify-center w-16 h-18 rounded-xl transition-colors cursor-pointer ${
          activeView === 'upcoming' ? 'bg-[#272727] text-white font-medium' : 'text-gray-400 hover:bg-[#272727] hover:text-white'
        }`}
        title="Upcoming Releases"
      >
        <Calendar className="w-5 h-5 mb-1.5 text-white" />
        <span className="text-[10px] truncate max-w-full px-1">Upcoming</span>
      </button>

      <button
        onClick={() => onSelectView('completed')}
        className={`flex flex-col items-center justify-center w-16 h-18 rounded-xl transition-colors cursor-pointer ${
          activeView === 'completed' ? 'bg-[#272727] text-white font-medium' : 'text-gray-400 hover:bg-[#272727] hover:text-white'
        }`}
        title="Completed Anime"
      >
        <Trophy className="w-5 h-5 mb-1.5 text-white" />
        <span className="text-[10px] truncate max-w-full px-1">Completed</span>
      </button>

      <button
        onClick={() => onSelectView('subscriptions')}
        className={`flex flex-col items-center justify-center w-16 h-18 rounded-xl transition-colors cursor-pointer ${
          activeView === 'subscriptions' ? 'bg-[#272727] text-white font-medium' : 'text-gray-400 hover:bg-[#272727] hover:text-white'
        }`}
        title="Subscriptions"
      >
        <Sparkles className="w-5 h-5 mb-1.5 text-white" />
        <span className="text-[10px] truncate max-w-full px-1">Subs</span>
      </button>

      <button
        onClick={() => onSelectView('library')}
        className={`flex flex-col items-center justify-center w-16 h-18 rounded-xl transition-colors cursor-pointer ${
          activeView === 'library' ? 'bg-[#272727] text-white font-medium' : 'text-gray-400 hover:bg-[#272727] hover:text-white'
        }`}
        title="You"
      >
        <PlaySquare className="w-5 h-5 mb-1.5 text-white" />
        <span className="text-[10px] truncate max-w-full px-1">You</span>
      </button>
    </div>
  );

  // Watch Page: Slide-out drawer on top of video with smooth translate-x & backdrop fade
  if (isWatchPage) {
    return (
      <>
        {/* Backdrop for Watch Page Drawer */}
        <div 
          onClick={onClose || (() => {})} 
          className={`fixed inset-0 top-14 bg-black/65 backdrop-blur-xs z-40 transition-opacity duration-300 ease-in-out ${
            isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`} 
        />

        {/* Drawer Aside */}
        <aside 
          className={`fixed top-14 left-0 z-50 h-[calc(100vh-3.5rem)] w-60 shrink-0 bg-[#0f0f0f] shadow-2xl border-r border-[#212121] overflow-y-auto px-3 py-3 text-sm select-none transition-transform duration-300 ease-in-out scrollbar-thin scrollbar-thumb-[#252525] ${
            isOpen ? 'translate-x-0 shadow-2xl shadow-black/80' : '-translate-x-full pointer-events-none'
          }`}
        >
          {renderFullContent()}
        </aside>
      </>
    );
  }

  // Non-watch pages (Home, Category feeds, etc.)
  return (
    <>
      {/* Mobile Backdrop for Small Screens */}
      <div 
        onClick={onClose || (() => {})} 
        className={`fixed inset-0 top-14 bg-black/65 z-40 md:hidden transition-opacity duration-300 ease-in-out ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`} 
      />

      {/* Mobile Drawer (visible only on mobile when toggled) */}
      <aside 
        className={`fixed top-14 left-0 z-50 h-[calc(100vh-3.5rem)] w-60 shrink-0 bg-[#0f0f0f] shadow-2xl border-r border-[#212121] overflow-y-auto px-3 py-3 text-sm select-none transition-transform duration-300 ease-in-out md:hidden scrollbar-thin scrollbar-thumb-[#252525] ${
          isOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        }`}
      >
        {renderFullContent()}
      </aside>

      {/* Desktop Animated Sidebar Container (animates between 240px and 72px width) */}
      <aside 
        className={`hidden md:flex flex-col sticky top-14 h-[calc(100vh-3.5rem)] shrink-0 bg-[#0f0f0f] border-r border-[#212121] overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out select-none text-sm scrollbar-thin scrollbar-thumb-[#252525] ${
          isOpen ? 'w-60 px-3 py-3' : 'w-[72px] px-1 py-2 items-center'
        }`}
      >
        {isOpen ? (
          <div className="w-full animate-in fade-in duration-200">
            {renderFullContent()}
          </div>
        ) : (
          <div className="w-full animate-in fade-in duration-200">
            {renderMiniContent()}
          </div>
        )}
      </aside>
    </>
  );
};
