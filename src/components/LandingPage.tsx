import React from 'react';
import { Play, Sparkles, Tv, History, Mic, ShieldCheck, Flame, ArrowRight, UserCheck, Star } from 'lucide-react';
import { MOCK_VIDEOS } from '../data/mockVideos';
import { FadeImage } from './FadeImage';

interface LandingPageProps {
  onGetStarted: () => void;
  onBrowseDirectly: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onBrowseDirectly,
}) => {
  const featuredPosters = MOCK_VIDEOS.slice(0, 6);

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col font-sans selection:bg-red-600 selection:text-white">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-[#0d0d0d]/90 backdrop-blur-md border-b border-[#222222]">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center w-8 h-6 rounded-md bg-red-600 text-white shadow-md shadow-red-900/40">
            <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[7px] border-l-white border-b-[4px] border-b-transparent ml-0.5" />
          </div>
          <span className="text-xl font-black tracking-tighter text-white">
            Ani<span className="text-red-600">Tube</span>
          </span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-[#222] px-1.5 py-0.5 rounded ml-1">
            ANIME
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onBrowseDirectly}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white hover:bg-[#222222] transition-colors cursor-pointer"
          >
            Browse Catalog
          </button>
          <button
            onClick={onGetStarted}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-lg shadow-red-900/30 cursor-pointer active:scale-95"
          >
            <UserCheck className="w-4 h-4" />
            <span>Setup Profile</span>
          </button>
        </div>
      </header>

      {/* Main Hero Section */}
      <section className="relative py-16 px-6 max-w-7xl mx-auto w-full flex flex-col items-center text-center space-y-8 my-auto">
        {/* Glow ambient background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-red-600/15 blur-[120px] rounded-full pointer-events-none z-0" />

        {/* Badge */}
        <div className="relative z-10 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1c1c1c] border border-[#333333] text-red-400 text-xs font-semibold shadow-lg">
          <Sparkles className="w-4 h-4 text-red-500" />
          <span>The Premier Anime Streaming Platform</span>
        </div>

        {/* Headline */}
        <div className="relative z-10 max-w-4xl space-y-4">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
            Unlimited Anime Streaming & <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-red-500 via-rose-400 to-amber-300 bg-clip-text text-transparent">
              Customized Avatar Profiles
            </span>
          </h1>
          <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Watch thousands of latest episodes, ongoing series, and completed classics. Track your viewing history, create custom DiceBear avatars, and enjoy seamless HD playback.
          </p>
        </div>

        {/* Primary Action CTA Buttons */}
        <div className="relative z-10 flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            onClick={onGetStarted}
            className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-extrabold text-sm sm:text-base transition-all shadow-2xl shadow-red-900/50 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Setup Profile & Start Watching</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={onBrowseDirectly}
            className="flex items-center gap-2.5 px-7 py-4 rounded-2xl bg-[#1c1c1c] hover:bg-[#282828] active:scale-95 text-gray-200 hover:text-white font-bold text-sm sm:text-base border border-[#333333] transition-all cursor-pointer shadow-lg"
          >
            <Tv className="w-5 h-5 text-gray-400" />
            <span>Direct Home Feed</span>
          </button>
        </div>

        {/* Feature Highlights Grid */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full pt-10 text-left">
          <div className="p-5 rounded-2xl bg-[#161616] border border-[#282828] space-y-3 hover:border-[#3d3d3d] transition-colors">
            <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-800/40 flex items-center justify-center text-red-500">
              <Tv className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Full Anime Catalogue</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Browse Popular, Latest Episodes, Ongoing, Upcoming, and Completed categories smoothly.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#161616] border border-[#282828] space-y-3 hover:border-[#3d3d3d] transition-colors">
            <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-800/40 flex items-center justify-center text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">DiceBear Custom Avatars</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Generate unique Lorelei, Adventurer, Pixel Art, and Notionist avatars powered by your username.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#161616] border border-[#282828] space-y-3 hover:border-[#3d3d3d] transition-colors">
            <div className="w-10 h-10 rounded-xl bg-blue-950/60 border border-blue-800/40 flex items-center justify-center text-blue-400">
              <History className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Watch History Tracker</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Keep track of watched episodes with multi-item batch deletion and session persistence.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#161616] border border-[#282828] space-y-3 hover:border-[#3d3d3d] transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
              <Mic className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">AI Voice Search</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Hands-free anime search with real-time speech recognition for titles, characters, and genres.
            </p>
          </div>
        </div>

        {/* Featured Posters Showcase */}
        <div className="relative z-10 w-full space-y-4 pt-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-bold text-white">Trending Anime Previews</h2>
            </div>
            <span className="text-xs text-gray-400 font-medium">Updated Daily</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {featuredPosters.map((anime) => (
              <div
                key={anime.id}
                onClick={onBrowseDirectly}
                className="group relative rounded-xl overflow-hidden aspect-[3/4] bg-[#1a1a1a] border border-[#282828] cursor-pointer hover:border-red-500/60 transition-all shadow-md"
              >
                <FadeImage
                  src={anime.thumbnail}
                  alt={anime.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-2.5 flex flex-col justify-end">
                  <div className="flex items-center gap-1 text-[10px] text-amber-400 font-bold mb-0.5">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>{anime.duration || '24m'}</span>
                  </div>

                  <h4 className="text-xs font-bold text-white truncate">{anime.title}</h4>
                  <span className="text-[10px] text-gray-400 truncate">{anime.category}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#1a1a1a] py-6 px-6 bg-[#090909] text-center text-xs text-gray-500">
        <p>© 2026 AniTube Platform. Built for Otakus worldwide.</p>
      </footer>
    </div>
  );
};
