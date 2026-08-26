import { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  Search, 
  Mic, 
  Bell, 
  X, 
  ArrowLeft,
  User,
  Settings,
  HelpCircle,
  Moon,
  Terminal,
  Layers
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
  isDevMode?: boolean;
  onToggleDevMode?: () => void;
  isGenreBlurOverlay?: boolean;
  onToggleGenreBlurOverlay?: () => void;
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
  isDevMode = false,
  onToggleDevMode,
  isGenreBlurOverlay = false,
  onToggleGenreBlurOverlay,
}: HeaderProps) => {

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showMobileSearch) {
      setTimeout(() => {
        mobileSearchInputRef.current?.focus();
      }, 60);
    }
  }, [showMobileSearch]);

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
    <header className="sticky top-0 z-50 flex items-center justify-between h-14 px-3 sm:px-4 bg-[#0f0f0f] border-b border-[#212121] select-none">
      {/* Dedicated Full-Width Mobile Search Bar Takeover (Prevents any background elements from showing) */}
      {showMobileSearch ? (
        <div className="absolute inset-0 z-50 flex items-center gap-2 px-2.5 sm:px-3 h-14 bg-[#0f0f0f] w-full border-b border-[#212121] animate-in fade-in duration-150">
          <button
            onClick={() => {
              setShowMobileSearch(false);
              setIsSearchFocused(false);
            }}
            aria-label="Back"
            className="p-2 rounded-full hover:bg-[#272727] text-white transition-colors shrink-0 cursor-pointer"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-200 hover:text-white" />
          </button>

          <div className="relative flex-1 flex items-center">
            <div className="flex items-center w-full h-10 bg-[#121212] border border-[#303030] focus-within:border-[#555555] rounded-full overflow-hidden px-3 transition-colors">
              <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
              <input
                ref={mobileSearchInputRef}
                type="text"
                id="input-mobile-search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search anime, episodes, trailers, OSTs..."
                className="w-full bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-0 pr-1"
              />
              {searchQuery && (
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSearchChange('');
                  }}
                  className="p-1 text-gray-400 hover:text-white shrink-0 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Mobile Autocomplete Suggestions Dropdown */}
            {searchSuggestions.length > 0 && searchQuery && (
              <div className="absolute top-12 left-0 right-0 z-50 bg-[#212121] border border-[#303030] rounded-xl shadow-2xl py-1.5 overflow-hidden text-sm">
                <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 border-b border-[#2a2a2a]">
                  Suggestions
                </div>
                {searchSuggestions.slice(0, 5).map((item, idx) => (
                  <div
                    key={idx}
                    onMouseDown={() => {
                      onSearchChange(item);
                      setShowMobileSearch(false);
                    }}
                    className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-[#303030] cursor-pointer text-gray-200 transition-colors"
                  >
                    <Search className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="truncate text-xs">{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => {
              setShowMobileSearch(false);
              onOpenVoiceModal();
            }}
            id="btn-mobile-voice-search"
            aria-label="Search with voice"
            className="p-2.5 rounded-full bg-[#222222] hover:bg-[#272727] text-white transition-colors shrink-0 cursor-pointer"
            title="Search with your voice"
          >
            <Mic className="w-5 h-5" />
          </button>
        </div>
      ) : null}

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
          className="flex items-center gap-1.5 cursor-pointer group relative"
          title="AniTube Landing Page / Home"
        >
          {/* YouTube style red rounded box with play triangle inside */}
          <div className="relative flex items-center justify-center w-8 h-5.5 rounded-xl bg-[#ff0000] text-white group-hover:scale-105 transition-transform shadow-md shadow-red-900/30">
            {/* Play triangle */}
            <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[7px] border-l-white border-b-[4px] border-b-transparent ml-0.5" />
          </div>
          {/* AniTube text: Ani in white, Tube in white font, with anime badge positioned above right */}
          <div className="relative flex items-center">
            <span className="text-[19px] font-black tracking-tight text-white font-sans">
              Ani<span className="text-white font-semibold">Tube</span>
            </span>
            {/* Anime Badge positioned above right */}
            <span className="absolute -top-2.5 -right-5 text-[9px] font-extrabold text-black bg-[#ffcc00] px-1 py-0.2 rounded-full shadow tracking-tighter">
              anime
            </span>
          </div>
        </div>
      </div>

      {/* Middle section: Desktop Search & Voice */}
      <div className="hidden md:flex flex-1 max-w-[720px] mx-4 items-center justify-center">
        <div className="relative flex items-center w-full max-w-[600px]">
          <div className={`flex items-center w-full h-10 bg-[#121212] border ${isSearchFocused ? 'border-[#555555]' : 'border-[#303030]'} rounded-l-full overflow-hidden transition-colors pl-4`}>
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
              className="w-full bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-0 pr-2"
            />
            {searchQuery && (
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSearchChange('');
                }}
                className="p-1 mr-2 text-gray-400 hover:text-white cursor-pointer"
                title="Clear search"
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
          className="p-2.5 ml-3 rounded-full bg-[#222222] hover:bg-[#272727] text-white transition-colors shrink-0 cursor-pointer"
          title="Search with your voice"
        >
          <Mic className="w-5 h-5" />
        </button>
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
                {onToggleDevMode && (
                  <div 
                    onClick={() => {
                      onToggleDevMode();
                    }}
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-[#2d2d2d] cursor-pointer text-emerald-400 font-medium transition-colors"
                    title="Toggle Floating Developer Diagnostics & Network Inspector"
                  >
                    <div className="flex items-center gap-3">
                      <Terminal className="w-4 h-4 text-emerald-400" />
                      <span>Developer Diagnostics</span>
                    </div>
                    <div className={`w-8 h-4 rounded-full transition-colors p-0.5 flex items-center ${isDevMode ? 'bg-emerald-500 justify-end' : 'bg-[#444] justify-start'}`}>
                      <div className="w-3 h-3 rounded-full bg-white shadow-sm" />
                    </div>
                  </div>
                )}
                {onToggleGenreBlurOverlay && (
                  <div 
                    onClick={() => {
                      onToggleGenreBlurOverlay();
                    }}
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-[#2d2d2d] cursor-pointer text-purple-300 font-medium transition-colors border-t border-[#333]"
                    title="Toggle genre cards blur background with centered portrait poster overlay"
                  >
                    <div className="flex items-center gap-3">
                      <Layers className="w-4 h-4 text-purple-400" />
                      <span>Genre Portrait Blur Mode</span>
                    </div>
                    <div className={`w-8 h-4 rounded-full transition-colors p-0.5 flex items-center ${isGenreBlurOverlay ? 'bg-purple-500 justify-end' : 'bg-[#444] justify-start'}`}>
                      <div className="w-3 h-3 rounded-full bg-white shadow-sm" />
                    </div>
                  </div>
                )}
                <div 
                  onClick={() => {
                    if (onToggleDevMode) onToggleDevMode();
                  }}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#2d2d2d] cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-gray-400" />
                  <span>Settings {isDevMode ? '(Dev Active)' : ''}</span>
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
