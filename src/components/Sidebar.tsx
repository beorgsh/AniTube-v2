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
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { ViewMode } from '../types';
import { MOCK_CHANNELS } from '../data/mockVideos';

interface SidebarProps {
  isOpen: boolean;
  activeView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  onSelectCategory?: (category: string) => void;
  selectedCategory?: string;
  isWatchPage?: boolean;
}

export const Sidebar = ({
  isOpen,
  activeView,
  onSelectView,
  onSelectCategory,
  isWatchPage = false
}: SidebarProps) => {
  // Mini sidebar for collapsed desktop state
  if (!isOpen && !isWatchPage) {
    return (
      <aside className="hidden md:flex flex-col items-center py-2 w-[72px] shrink-0 bg-[#0f0f0f] select-none">
        <button
          onClick={() => onSelectView('home')}
          className={`flex flex-col items-center justify-center w-16 h-18 rounded-xl my-1 transition-colors ${
            activeView === 'home' ? 'bg-[#272727] text-white font-medium' : 'text-gray-400 hover:bg-[#272727] hover:text-white'
          }`}
          title="Home"
        >
          <Home className="w-5 h-5 mb-1.5" />
          <span className="text-[10px]">Home</span>
        </button>

        <button
          onClick={() => onSelectView('popular')}
          className={`flex flex-col items-center justify-center w-16 h-18 rounded-xl my-1 transition-colors ${
            activeView === 'popular' || activeView === 'trending' ? 'bg-[#272727] text-white font-medium' : 'text-gray-400 hover:bg-[#272727] hover:text-white'
          }`}
          title="Popular & Trending"
        >
          <Flame className="w-5 h-5 mb-1.5 text-red-500" />
          <span className="text-[10px]">Popular</span>
        </button>

        <button
          onClick={() => onSelectView('latest')}
          className={`flex flex-col items-center justify-center w-16 h-18 rounded-xl my-1 transition-colors ${
            activeView === 'latest' ? 'bg-[#272727] text-white font-medium' : 'text-gray-400 hover:bg-[#272727] hover:text-white'
          }`}
          title="Latest Episodes"
        >
          <Zap className="w-5 h-5 mb-1.5 text-amber-400" />
          <span className="text-[10px]">Latest</span>
        </button>

        <button
          onClick={() => onSelectView('ongoing')}
          className={`flex flex-col items-center justify-center w-16 h-18 rounded-xl my-1 transition-colors ${
            activeView === 'ongoing' ? 'bg-[#272727] text-white font-medium' : 'text-gray-400 hover:bg-[#272727] hover:text-white'
          }`}
          title="Ongoing Anime"
        >
          <Tv className="w-5 h-5 mb-1.5 text-blue-400" />
          <span className="text-[10px]">Ongoing</span>
        </button>

        <button
          onClick={() => onSelectView('upcoming')}
          className={`flex flex-col items-center justify-center w-16 h-18 rounded-xl my-1 transition-colors ${
            activeView === 'upcoming' ? 'bg-[#272727] text-white font-medium' : 'text-gray-400 hover:bg-[#272727] hover:text-white'
          }`}
          title="Upcoming Releases"
        >
          <Calendar className="w-5 h-5 mb-1.5 text-emerald-400" />
          <span className="text-[10px]">Upcoming</span>
        </button>

        <button
          onClick={() => onSelectView('completed')}
          className={`flex flex-col items-center justify-center w-16 h-18 rounded-xl my-1 transition-colors ${
            activeView === 'completed' ? 'bg-[#272727] text-white font-medium' : 'text-gray-400 hover:bg-[#272727] hover:text-white'
          }`}
          title="Completed Anime"
        >
          <Trophy className="w-5 h-5 mb-1.5 text-yellow-400" />
          <span className="text-[10px]">Completed</span>
        </button>

        <button
          onClick={() => onSelectView('subscriptions')}
          className={`flex flex-col items-center justify-center w-16 h-18 rounded-xl my-1 transition-colors ${
            activeView === 'subscriptions' ? 'bg-[#272727] text-white font-medium' : 'text-gray-400 hover:bg-[#272727] hover:text-white'
          }`}
          title="Subscriptions"
        >
          <Sparkles className="w-5 h-5 mb-1.5 text-purple-400" />
          <span className="text-[10px]">Subs</span>
        </button>

        <button
          onClick={() => onSelectView('library')}
          className={`flex flex-col items-center justify-center w-16 h-18 rounded-xl my-1 transition-colors ${
            activeView === 'library' ? 'bg-[#272727] text-white font-medium' : 'text-gray-400 hover:bg-[#272727] hover:text-white'
          }`}
          title="You"
        >
          <PlaySquare className="w-5 h-5 mb-1.5" />
          <span className="text-[10px]">You</span>
        </button>
      </aside>
    );
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && isWatchPage && (
        <div 
          onClick={() => onSelectView(activeView)} 
          className="fixed inset-0 bg-black/60 z-40 md:hidden" 
        />
      )}

      <aside className={`fixed md:sticky top-14 left-0 z-40 h-[calc(100vh-3.5rem)] w-60 bg-[#0f0f0f] overflow-y-auto px-3 py-3 text-sm select-none border-r border-[#212121] transition-transform duration-200 ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        {/* Section 1: Main Anime Discovery Categories */}
        <div className="space-y-0.5 pb-3 border-b border-[#272727]">
          <button
            onClick={() => onSelectView('home')}
            className={`flex items-center gap-4 w-full px-3 py-2.5 rounded-xl font-normal transition-colors cursor-pointer ${
              activeView === 'home' ? 'bg-[#272727] font-semibold text-white' : 'text-gray-300 hover:bg-[#222222]'
            }`}
          >
            <Home className="w-5 h-5" />
            <span>Home</span>
          </button>

          <button
            onClick={() => onSelectView('popular')}
            className={`flex items-center gap-4 w-full px-3 py-2.5 rounded-xl font-normal transition-colors cursor-pointer ${
              activeView === 'popular' || activeView === 'trending' ? 'bg-[#272727] font-semibold text-white' : 'text-gray-300 hover:bg-[#222222]'
            }`}
          >
            <Flame className="w-5 h-5 text-red-500" />
            <div className="flex items-center justify-between flex-1">
              <span>Popular & Trending</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-600/30 text-red-400">HOT</span>
            </div>
          </button>

          <button
            onClick={() => onSelectView('latest')}
            className={`flex items-center gap-4 w-full px-3 py-2.5 rounded-xl font-normal transition-colors cursor-pointer ${
              activeView === 'latest' ? 'bg-[#272727] font-semibold text-white' : 'text-gray-300 hover:bg-[#222222]'
            }`}
          >
            <Zap className="w-5 h-5 text-amber-400" />
            <div className="flex items-center justify-between flex-1">
              <span>Latest Episodes</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-400/20 text-amber-300">NEW</span>
            </div>
          </button>

          <button
            onClick={() => onSelectView('ongoing')}
            className={`flex items-center gap-4 w-full px-3 py-2.5 rounded-xl font-normal transition-colors cursor-pointer ${
              activeView === 'ongoing' ? 'bg-[#272727] font-semibold text-white' : 'text-gray-300 hover:bg-[#222222]'
            }`}
          >
            <Tv className="w-5 h-5 text-blue-400" />
            <span>Ongoing Anime</span>
          </button>

          <button
            onClick={() => onSelectView('upcoming')}
            className={`flex items-center gap-4 w-full px-3 py-2.5 rounded-xl font-normal transition-colors cursor-pointer ${
              activeView === 'upcoming' ? 'bg-[#272727] font-semibold text-white' : 'text-gray-300 hover:bg-[#222222]'
            }`}
          >
            <Calendar className="w-5 h-5 text-emerald-400" />
            <span>Upcoming Releases</span>
          </button>

          <button
            onClick={() => onSelectView('completed')}
            className={`flex items-center gap-4 w-full px-3 py-2.5 rounded-xl font-normal transition-colors cursor-pointer ${
              activeView === 'completed' ? 'bg-[#272727] font-semibold text-white' : 'text-gray-300 hover:bg-[#222222]'
            }`}
          >
            <CheckCircle2 className="w-5 h-5 text-yellow-400" />
            <span>Completed Series</span>
          </button>
        </div>

        {/* Section 2: You / Library */}
        <div className="space-y-0.5 py-3 border-b border-[#272727]">
          <button
            onClick={() => onSelectView('library')}
            className="flex items-center justify-between w-full px-3 py-2 text-white font-bold hover:bg-[#222222] rounded-xl cursor-pointer"
          >
            <span className="text-sm font-semibold">You</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          <button
            onClick={() => onSelectView('history')}
            className={`flex items-center gap-4 w-full px-3 py-2.5 rounded-xl font-normal transition-colors cursor-pointer ${
              activeView === 'history' ? 'bg-[#272727] font-semibold text-white' : 'text-gray-300 hover:bg-[#222222]'
            }`}
          >
            <History className="w-5 h-5" />
            <span>Watch History</span>
          </button>

          <button
            onClick={() => onSelectView('subscriptions')}
            className={`flex items-center gap-4 w-full px-3 py-2.5 rounded-xl font-normal transition-colors cursor-pointer ${
              activeView === 'subscriptions' ? 'bg-[#272727] font-semibold text-white' : 'text-gray-300 hover:bg-[#222222]'
            }`}
          >
            <Sparkles className="w-5 h-5 text-purple-400" />
            <span>Subscriptions</span>
          </button>

          <button
            onClick={() => onSelectView('library')}
            className="flex items-center gap-4 w-full px-3 py-2.5 rounded-xl text-gray-300 hover:bg-[#222222] transition-colors cursor-pointer"
          >
            <ListVideo className="w-5 h-5" />
            <span>Playlists</span>
          </button>

          <button
            onClick={() => onSelectView('library')}
            className="flex items-center gap-4 w-full px-3 py-2.5 rounded-xl text-gray-300 hover:bg-[#222222] transition-colors cursor-pointer"
          >
            <Clock className="w-5 h-5" />
            <span>Watch Later</span>
          </button>

          <button
            onClick={() => onSelectView('library')}
            className="flex items-center gap-4 w-full px-3 py-2.5 rounded-xl text-gray-300 hover:bg-[#222222] transition-colors cursor-pointer"
          >
            <ThumbsUp className="w-5 h-5" />
            <span>Liked videos</span>
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
                onClick={() => {
                  if (onSelectCategory) onSelectCategory(channel.name);
                }}
                className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-gray-300 hover:bg-[#222222] transition-colors group text-left cursor-pointer"
              >
                <div className="flex items-center gap-3 truncate">
                  <img
                    src={channel.avatar}
                    alt={channel.name}
                    className="w-6 h-6 rounded-full object-cover shrink-0"
                    referrerPolicy="no-referrer"
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
              onClick={() => onSelectCategory && onSelectCategory('Soundtracks')}
              className="flex items-center gap-4 w-full px-3 py-2.5 rounded-xl text-gray-300 hover:bg-[#222222] transition-colors cursor-pointer"
            >
              <Music2 className="w-5 h-5 text-pink-400" />
              <span>Anime OSTs & Music</span>
            </button>

            <button
              onClick={() => onSelectCategory && onSelectCategory('Live')}
              className="flex items-center gap-4 w-full px-3 py-2.5 rounded-xl text-gray-300 hover:bg-[#222222] transition-colors cursor-pointer"
            >
              <Radio className="w-5 h-5 text-red-500" />
              <span>Live Broadcasts</span>
            </button>
          </div>
        </div>

        {/* Section 5: Settings & Info */}
        <div className="py-3 border-b border-[#272727] space-y-0.5">
          <button className="flex items-center gap-4 w-full px-3 py-2.5 rounded-xl text-gray-300 hover:bg-[#222222] transition-colors cursor-pointer">
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </button>

          <button className="flex items-center gap-4 w-full px-3 py-2.5 rounded-xl text-gray-300 hover:bg-[#222222] transition-colors cursor-pointer">
            <Flag className="w-5 h-5" />
            <span>Report history</span>
          </button>

          <button className="flex items-center gap-4 w-full px-3 py-2.5 rounded-xl text-gray-300 hover:bg-[#222222] transition-colors cursor-pointer">
            <HelpCircle className="w-5 h-5" />
            <span>Help</span>
          </button>
        </div>

        {/* Section 6: Copyright & Engine info */}
        <div className="px-3 pt-4 pb-8 text-[11px] text-[#717171] space-y-3">
          <div className="flex flex-wrap gap-x-2 gap-y-1">
            <span className="hover:underline cursor-pointer">About</span>
            <span className="hover:underline cursor-pointer">Press</span>
            <span className="hover:underline cursor-pointer">Copyright</span>
            <span className="hover:underline cursor-pointer">Terms</span>
            <span className="hover:underline cursor-pointer">Privacy</span>
          </div>
          <div className="pt-2 font-mono text-[10px] text-[#555555]">
            © 2026 AniTube • Powered by Anikoto API
          </div>
        </div>
      </aside>
    </>
  );
};
