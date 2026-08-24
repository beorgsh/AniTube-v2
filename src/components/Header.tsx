import { useState, useRef } from 'react';
import { 
  Menu, 
  Search, 
  Mic, 
  Bell, 
  X, 
  User,
  Settings,
  HelpCircle,
  Moon
} from 'lucide-react';

import { UserProfile } from '../services/sessionStorage';

interface HeaderProps {
  onToggleSidebar: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectVideoById?: (id: string) => void;
  onOpenVoiceModal: () => void;
  onHomeClick: () => void;
  onLogoClick?: () => void;
  userProfile?: UserProfile;
  onOpenAvatarModal?: () => void;
}

export const Header = ({
  onToggleSidebar,
  searchQuery,
  onSearchChange,
  onOpenVoiceModal,
  onHomeClick,
  onLogoClick,
  userProfile,
  onOpenAvatarModal,
}: HeaderProps) => {

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const searchSuggestions = [
    'Jujutsu Kaisen Season 3 trailer',
    'One Piece Gear 5 fight 4K',
    'Demon Slayer Infinity Castle OST',
    'Solo Leveling Sung Jinwoo transformation',
    'Attack on Titan Levi sakuga',
    'Anime Lofi hip hop 24/7',
    'Chainsaw Man Reze Arc movie',
    'Top 10 anime 2026'
  ].filter(item => 
    !searchQuery || item.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between h-14 px-4 bg-[#0f0f0f]/95 backdrop-blur-md border-b border-[#212121] select-none">
      {/* Left section: Hamburger & Logo */}
      <div className="flex items-center gap-4 min-w-[170px]">
        <button
          onClick={onToggleSidebar}
          id="btn-sidebar-toggle"
          aria-label="Guide"
          className="p-2 rounded-full hover:bg-[#272727] text-white transition-colors focus:outline-none"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand Logo */}
        <div 
          onClick={onLogoClick || onHomeClick}
          id="btn-brand-logo"
          className="flex items-center gap-1.5 cursor-pointer group"
          title="AniTube Landing Page / Home"
        >
          <div className="relative flex items-center justify-center w-8 h-6 rounded-md bg-[#ff0000] text-white group-hover:scale-105 transition-transform shadow-md shadow-red-900/30">
            {/* Play triangle */}
            <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[7px] border-l-white border-b-[4px] border-b-transparent ml-0.5" />
          </div>
          <div className="flex items-center">
            <span className="text-[19px] font-black tracking-tighter text-white font-sans">
              Ani<span className="text-[#ff0000]">Tube</span>
            </span>
            <span className="ml-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-[#222222] px-1 py-0.5 rounded">
              ANIME
            </span>
          </div>
        </div>
      </div>

      {/* Middle section: Search & Voice */}
      <div className={`flex-1 max-w-[720px] mx-4 ${showMobileSearch ? 'flex absolute inset-x-2 top-2 z-50 bg-[#0f0f0f] px-2 py-1 rounded-lg' : 'hidden md:flex'} items-center justify-center`}>
        <div className="relative flex items-center w-full max-w-[600px]">
          <div className={`flex items-center w-full h-10 bg-[#121212] border ${isSearchFocused ? 'border-[#1c62b9]' : 'border-[#303030]'} rounded-l-full overflow-hidden transition-colors pl-4`}>
            {isSearchFocused && (
              <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
            )}
            <input
              ref={searchInputRef}
              type="text"
              id="input-main-search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              placeholder="Search anime, episodes, trailers, OSTs..."
              className="w-full bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none pr-2"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  onSearchChange('');
                  searchInputRef.current?.focus();
                }}
                className="p-1 mr-2 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            id="btn-search-submit"
            aria-label="Search"
            className="flex items-center justify-center w-16 h-10 bg-[#222222] hover:bg-[#272727] border border-l-0 border-[#303030] rounded-r-full text-gray-300 transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Autocomplete Dropdown */}
          {isSearchFocused && searchSuggestions.length > 0 && (
            <div className="absolute top-11 left-0 right-16 z-50 bg-[#212121] border border-[#303030] rounded-2xl shadow-2xl py-2 overflow-hidden text-sm">
              <div className="px-4 py-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Trending Searches
              </div>
              {searchSuggestions.map((item, idx) => (
                <div
                  key={idx}
                  onMouseDown={() => {
                    onSearchChange(item);
                    setIsSearchFocused(false);
                  }}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-[#303030] cursor-pointer text-gray-200 transition-colors"
                >
                  <Search className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="truncate">{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Voice Search Button */}
        <button
          onClick={onOpenVoiceModal}
          id="btn-voice-search"
          aria-label="Search with voice"
          className="p-2.5 ml-3 rounded-full bg-[#222222] hover:bg-[#272727] text-white transition-colors shrink-0"
          title="Search with your voice"
        >
          <Mic className="w-5 h-5" />
        </button>

        {showMobileSearch && (
          <button
            onClick={() => setShowMobileSearch(false)}
            className="p-2 ml-2 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Right section: Create, Notifications, Profile */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Mobile Search Toggle */}
        <button
          onClick={() => setShowMobileSearch(true)}
          className="md:hidden p-2 rounded-full hover:bg-[#272727] text-white"
          aria-label="Open search"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            id="btn-notifications"
            className="relative p-2 rounded-full hover:bg-[#272727] text-white transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold bg-[#cc0000] text-white rounded-full">
              3
            </span>
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 bg-[#212121] border border-[#303030] rounded-xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between p-3.5 border-b border-[#2d2d2d]">
                <h3 className="font-semibold text-sm text-white">Notifications</h3>
                <span className="text-xs text-blue-400 cursor-pointer hover:underline">Mark all as read</span>
              </div>
              <div className="max-h-96 overflow-y-auto divide-y divide-[#2a2a2a]">
                <div className="p-3 hover:bg-[#2a2a2a] cursor-pointer flex gap-3 transition-colors">
                  <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 shrink-0" />
                  <img
                    src="https://images.unsplash.com/photo-1578632767115-351597cf2477?w=100&auto=format&fit=crop&q=80"
                    alt="MAPPA"
                    className="w-9 h-9 rounded-full object-cover shrink-0"
                  />
                  <div>
                    <p className="text-xs text-gray-200 line-clamp-2">
                      <span className="font-semibold text-white">MAPPA Channel</span> uploaded: Jujutsu Kaisen S3 Shibuya Climax Teaser.
                    </p>
                    <span className="text-[11px] text-gray-400">2 hours ago</span>
                  </div>
                </div>
                <div className="p-3 hover:bg-[#2a2a2a] cursor-pointer flex gap-3 transition-colors">
                  <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 shrink-0" />
                  <img
                    src="https://images.unsplash.com/photo-1534447677768-be436bb09401?w=100&auto=format&fit=crop&q=80"
                    alt="Toei"
                    className="w-9 h-9 rounded-full object-cover shrink-0"
                  />
                  <div>
                    <p className="text-xs text-gray-200 line-clamp-2">
                      <span className="font-semibold text-white">Toei Animation</span> scheduled a live broadcast for One Piece Episode 1120.
                    </p>
                    <span className="text-[11px] text-gray-400">5 hours ago</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            id="btn-user-menu"
            className="flex items-center justify-center p-0.5 rounded-full ring-2 ring-transparent hover:ring-red-500/80 transition-all focus:outline-none"
            title="User Settings & Avatar"
          >
            <img
              src={userProfile?.avatarUrl || "https://api.dicebear.com/9.x/adventurer/png?seed=otaku_master"}
              alt="User profile avatar"
              className="w-8 h-8 rounded-full object-cover bg-[#222] border border-[#333]"
              referrerPolicy="no-referrer"
            />
          </button>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 top-12 z-50 w-64 bg-[#212121] border border-[#303030] rounded-xl shadow-2xl py-2 text-sm text-gray-200">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2d2d2d]">
                <img
                  src={userProfile?.avatarUrl || "https://api.dicebear.com/9.x/adventurer/png?seed=otaku_master"}
                  alt="User"
                  className="w-10 h-10 rounded-full object-cover bg-[#1c1c1c] border border-[#333]"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white text-sm truncate">
                    {userProfile?.name || 'Otaku Explorer'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    @{userProfile?.username || 'otaku_master'}
                  </p>
                </div>
              </div>
              <div className="py-1">
                {onOpenAvatarModal && (
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenAvatarModal();
                    }}
                    className="w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-[#2d2d2d] text-red-400 hover:text-red-300 font-semibold cursor-pointer transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span>Change Avatar / Profile</span>
                  </button>
                )}
                <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#2d2d2d] cursor-pointer">
                  <Moon className="w-4 h-4 text-gray-400" />
                  <span>Appearance: Dark Mode (Fixed)</span>
                </div>
                <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#2d2d2d] cursor-pointer">
                  <Settings className="w-4 h-4 text-gray-400" />
                  <span>Settings</span>
                </div>
                <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#2d2d2d] cursor-pointer">
                  <HelpCircle className="w-4 h-4 text-gray-400" />
                  <span>Help & Feedback</span>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
