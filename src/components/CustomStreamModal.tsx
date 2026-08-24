import { useState, type FormEvent } from 'react';
import { X, Play, Link as LinkIcon, Radio, Check, Search, Tv } from 'lucide-react';
import { Video } from '../types';
import { fetchAnimeStreamByMalId } from '../services/animeApi';

interface CustomStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayCustomStream: (video: Video) => void;
}

export const CustomStreamModal = ({
  isOpen,
  onClose,
  onPlayCustomStream
}: CustomStreamModalProps) => {
  const [activeTab, setActiveTab] = useState<'mal' | 'direct'>('mal');
  const [malId, setMalId] = useState('21');
  const [episode, setEpisode] = useState('1');
  const [directUrl, setDirectUrl] = useState('');
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const popularAnimePresets = [
    { name: 'One Piece (Ep 1)', malId: '21', ep: '1', title: 'One Piece - Episode 1' },
    { name: 'Frieren (Ep 1)', malId: '52991', ep: '1', title: 'Frieren: Beyond Journey\'s End - Episode 1' },
    { name: 'Jujutsu Kaisen (Ep 1)', malId: '40748', ep: '1', title: 'Jujutsu Kaisen - Episode 1' },
    { name: 'Demon Slayer (Ep 1)', malId: '38000', ep: '1', title: 'Demon Slayer: Kimetsu no Yaiba - Episode 1' },
    { name: 'Attack on Titan (Ep 1)', malId: '16498', ep: '1', title: 'Attack on Titan - Episode 1' },
    { name: 'Death Note (Ep 1)', malId: '1535', ep: '1', title: 'Death Note - Episode 1' },
  ];

  const handleSelectPreset = (preset: { name: string; malId: string; ep: string; title: string }) => {
    setMalId(preset.malId);
    setEpisode(preset.ep);
    setTitle(preset.title);
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (activeTab === 'mal') {
        const streamData = await fetchAnimeStreamByMalId(malId.trim(), parseInt(episode) || 1);
        const customVideo: Video = {
          id: `mal-${malId}-${episode}-${Date.now()}`,
          malId: malId.trim(),
          episodeNumber: parseInt(episode) || 1,
          title: title.trim() || `Anime Stream (MAL ID: ${malId} • Ep ${episode})`,
          description: `Live HLS stream from aniapikoto with Megaplay referer & automatic English VTT subtitles.\nMAL ID: ${malId}\nEpisode: ${episode}`,
          thumbnail: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
          duration: '24:00',
          views: '1.2K views',
          viewsCount: 1200,
          uploadedAt: 'Just now',
          channel: {
            id: 'ch-mal',
            name: 'AniTube Live Engine',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
            subscribers: '2.5M',
            isVerified: true,
            handle: '@AniTubeEngine'
          },
          streamUrl: streamData.streamUrl,
          rawM3u8Url: streamData.rawM3u8Url,
          subtitles: streamData.subtitles,
          availableServers: streamData.servers,
          category: 'Anime Stream',
          tags: ['MAL', 'HLS', 'CORS', 'EnglishSub', 'Megaplay'],
          likes: '120',
          likesCount: 120,
          commentsCount: '0',
          comments: [],
        };

        onPlayCustomStream(customVideo);
        onClose();
      } else {
        if (!directUrl.trim()) return;
        const customVideo: Video = {
          id: `direct-${Date.now()}`,
          title: title.trim() || 'Direct HLS Stream Playback',
          description: `Direct HLS stream URL: ${directUrl}`,
          thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
          duration: 'LIVE',
          views: '1 watching',
          viewsCount: 1,
          uploadedAt: 'Just now',
          channel: {
            id: 'ch-direct',
            name: 'Direct Stream Player',
            avatar: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=100&auto=format&fit=crop&q=80',
            subscribers: '100K',
            isVerified: true,
            handle: '@DirectStream'
          },
          streamUrl: directUrl.trim(),
          category: 'Direct Stream',
          tags: ['DirectStream', 'HLS', 'VideoJS'],
          likes: '10',
          likesCount: 10,
          commentsCount: '0',
          comments: [],
        };

        onPlayCustomStream(customVideo);
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to resolve stream for this MAL ID. Check episode number or try another ID.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="w-full max-w-lg bg-[#212121] border border-[#383838] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d2d2d]">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-red-500 animate-pulse" />
            <h2 className="text-base font-bold text-white">Stream by MAL ID / API</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-[#2e2e2e] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-[#2d2d2d] bg-[#1a1a1a]">
          <button
            type="button"
            onClick={() => { setActiveTab('mal'); setError(null); }}
            className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'mal'
                ? 'text-red-500 border-b-2 border-red-500 bg-[#212121]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>MAL ID Stream API</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('direct'); setError(null); }}
            className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'direct'
                ? 'text-red-500 border-b-2 border-red-500 bg-[#212121]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            <span>Direct .m3u8 URL</span>
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {activeTab === 'mal' ? (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    MyAnimeList (MAL) ID
                  </label>
                  <div className="flex items-center bg-[#121212] border border-[#383838] focus-within:border-red-500 rounded-xl px-3 py-2 transition-colors">
                    <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                    <input
                      type="number"
                      id="input-mal-id"
                      value={malId}
                      onChange={(e) => setMalId(e.target.value)}
                      placeholder="e.g. 21"
                      className="w-full bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Episode #
                  </label>
                  <input
                    type="number"
                    id="input-mal-ep"
                    min="1"
                    value={episode}
                    onChange={(e) => setEpisode(e.target.value)}
                    className="w-full bg-[#121212] border border-[#383838] focus:border-red-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none text-center"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2">
                  Popular Anime MAL Presets:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {popularAnimePresets.map((preset) => (
                    <button
                      key={preset.malId}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-left transition-all border ${
                        malId === preset.malId
                          ? 'bg-red-950/40 border-red-500 text-white font-medium'
                          : 'bg-[#181818] border-[#2e2e2e] text-gray-300 hover:bg-[#282828]'
                      }`}
                    >
                      <span className="truncate">{preset.name}</span>
                      {malId === preset.malId && <Check className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                HLS Stream (.m3u8) URL
              </label>
              <div className="flex items-center bg-[#121212] border border-[#383838] focus-within:border-red-500 rounded-xl px-3 py-2 transition-colors">
                <LinkIcon className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                <input
                  type="url"
                  id="input-direct-url"
                  value={directUrl}
                  onChange={(e) => setDirectUrl(e.target.value)}
                  placeholder="https://example.com/stream/master.m3u8"
                  className="w-full bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Custom Title (Optional)
            </label>
            <input
              type="text"
              id="input-stream-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. One Piece - Episode 1"
              className="w-full bg-[#121212] border border-[#383838] focus:border-red-500 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none"
            />
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-red-950/50 border border-red-500/40 text-red-300 text-xs">
              {error}
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#2d2d2d]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-semibold text-gray-300 hover:bg-[#2d2d2d] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold bg-[#ff0000] hover:bg-red-700 disabled:opacity-50 text-white transition-colors shadow-md"
            >
              {isLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              <span>{isLoading ? 'Connecting Stream...' : 'Play Anime Stream'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
