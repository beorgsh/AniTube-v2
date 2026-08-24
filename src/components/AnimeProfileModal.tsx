import React, { useState, useEffect } from 'react';
import { X, Play, Star, Calendar, Tv, Users, Film, Info, Layers, Sparkles, CheckCircle2 } from 'lucide-react';
import { Video, AnimeInfoData, AnimeEpisodeDetail } from '../types';
import { fetchAnimeInfo, fetchAnimeEpisodesMetadata } from '../services/animeApi';
import { FadeImage, VerifiedBadge } from './FadeImage';

interface AnimeProfileModalProps {
  video: Video | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectVideoWithEpisode: (video: Video, episodeNum: number) => void;
}

export const AnimeProfileModal: React.FC<AnimeProfileModalProps> = ({
  video,
  isOpen,
  onClose,
  onSelectVideoWithEpisode,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'episodes' | 'related'>('details');
  const [animeInfo, setAnimeInfo] = useState<AnimeInfoData | null>(null);
  const [episodesList, setEpisodesList] = useState<AnimeEpisodeDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!isOpen || !video) {
      setAnimeInfo(null);
      setEpisodesList([]);
      return;
    }

    let isMounted = true;
    const loadDetails = async () => {
      setIsLoading(true);
      try {
        const identifier = video.slug || video.id || video.malId;
        if (!identifier) return;

        const info = await fetchAnimeInfo(String(identifier));
        if (!isMounted) return;
        setAnimeInfo(info);

        // Fetch episodes metadata using anilistId or malId or slug
        const targetId = info?.anilistId || info?.malId || video.aniId || video.malId || video.slug;
        if (targetId) {
          const meta = await fetchAnimeEpisodesMetadata(targetId);
          if (isMounted && meta && meta.episodes.length > 0) {
            setEpisodesList(meta.episodes);
          } else if (info && Array.isArray(info.episodes) && info.episodes.length > 0) {
            // fallback to info episodes array
            const fallbackEps: AnimeEpisodeDetail[] = info.episodes.map((ep: any, idx: number) => ({
              number: typeof ep === 'object' && ep.number ? ep.number : idx + 1,
              title: typeof ep === 'object' && ep.title ? ep.title : `Episode ${idx + 1}`,
              description: `Watch episode ${idx + 1} of ${video.title}`,
              image: video.thumbnail,
            }));
            if (isMounted) setEpisodesList(fallbackEps);
          }
        }
      } catch (err) {
        console.error('Failed to load anime profile details:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadDetails();
    return () => {
      isMounted = false;
    };
  }, [isOpen, video]);

  if (!isOpen || !video) return null;

  const bannerImg = animeInfo?.banner || animeInfo?.background_image || video.banner || video.thumbnail;
  const avatarImg = animeInfo?.poster || video.channel.avatar || video.thumbnail;
  const studioName = animeInfo?.studios?.[0] || video.channel.name;
  const descriptionText = animeInfo?.description || video.description;
  const genresList = animeInfo?.genres || video.tags || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-4xl max-h-[80vh] bg-[#181818] text-white rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header / Banner Area */}
        <div className="relative h-36 sm:h-48 w-full bg-[#222] shrink-0 overflow-hidden">
          <FadeImage
            src={bannerImg}
            alt={video.title}
            className="w-full h-full object-cover filter brightness-90"
            containerClassName="w-full h-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-[#181818]/30 to-transparent" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-black/60 hover:bg-black text-white backdrop-blur-md transition-colors border border-white/10"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* YouTuber Profile Info Bar */}
        <div className="px-6 sm:px-8 pb-4 pt-2 bg-[#181818] border-b border-white/10 shrink-0 relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-3 relative z-10">
            <div className="flex items-end gap-4">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-4 border-[#181818] shadow-2xl bg-[#222] shrink-0">
                <FadeImage
                  src={avatarImg}
                  alt={video.title}
                  className="w-full h-full object-cover"
                  containerClassName="w-full h-full"
                />
              </div>
              <div className="pb-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    {animeInfo?.title || video.title}
                  </h1>
                  <VerifiedBadge className="w-5 h-5 text-blue-400 shrink-0" />
                </div>
                <p className="text-sm text-gray-400 mt-0.5 font-medium flex items-center gap-2">
                  <span>{studioName}</span>
                  <span>•</span>
                  <span>{video.channel.subscribers} subscribers</span>
                  <span>•</span>
                  <span>{episodesList.length > 0 ? `${episodesList.length} episodes` : video.duration}</span>
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSubscribed(!isSubscribed)}
                className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all shadow-lg flex items-center gap-2 ${
                  isSubscribed 
                    ? 'bg-[#272727] text-gray-300 hover:bg-[#333]' 
                    : 'bg-white text-black hover:bg-gray-200'
                }`}
              >
                {isSubscribed ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                    <span>Subscribed</span>
                  </>
                ) : (
                  <span>Subscribe</span>
                )}
              </button>
              <button
                onClick={() => {
                  onClose();
                  onSelectVideoWithEpisode(video, 1);
                }}
                className="px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-lg flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Play Ep 1</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-8 border-t border-white/10 pt-3 text-sm font-semibold">
            <button
              onClick={() => setActiveTab('details')}
              className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'details'
                  ? 'border-white text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Info className="w-4 h-4" />
              <span>Details & Overview</span>
            </button>
            <button
              onClick={() => setActiveTab('episodes')}
              className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'episodes'
                  ? 'border-white text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Episodes List ({episodesList.length > 0 ? episodesList.length : 'Live'})</span>
            </button>
            {animeInfo?.related && animeInfo.related.length > 0 && (
              <button
                onClick={() => setActiveTab('related')}
                className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === 'related'
                    ? 'border-white text-white'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Film className="w-4 h-4" />
                <span>Related Anime ({animeInfo.related.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-[#121212]">
          {isLoading && episodesList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm">Loading studio profile & episodes from API...</p>
            </div>
          ) : (
            <>
              {activeTab === 'details' && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Synopsis Box */}
                  <div className="bg-[#1e1e1e] p-6 rounded-2xl border border-white/5 shadow-inner">
                    <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-2">About Studio & Series</h3>
                    <p className="text-gray-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                      {descriptionText}
                    </p>
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5">
                      <span className="text-xs text-gray-400 block">Status</span>
                      <span className="text-sm font-bold text-white mt-1 block">
                        {animeInfo?.status?.[0] || 'Airing'}
                      </span>
                    </div>
                    <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5">
                      <span className="text-xs text-gray-400 block">Type</span>
                      <span className="text-sm font-bold text-white mt-1 block">
                        {animeInfo?.type?.[0] || 'TV Series'}
                      </span>
                    </div>
                    <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5">
                      <span className="text-xs text-gray-400 block">Premiered</span>
                      <span className="text-sm font-bold text-white mt-1 block">
                        {animeInfo?.premiered?.[0] || '2026'}
                      </span>
                    </div>
                    <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5">
                      <span className="text-xs text-gray-400 block">Total Episodes</span>
                      <span className="text-sm font-bold text-white mt-1 block">
                        {episodesList.length > 0 ? episodesList.length : (video.totalEpisodes || 'Ongoing')}
                      </span>
                    </div>
                  </div>

                  {/* Genres / Tags */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-400 mb-3">Genres & Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {genresList.map((genre, idx) => (
                        <span 
                          key={idx}
                          className="px-3 py-1 rounded-full bg-[#252525] text-xs font-semibold text-gray-200 border border-white/5"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'episodes' && (
                <div className="space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-white">All Episodes ({episodesList.length})</h3>
                    <span className="text-xs text-gray-400">Official HLS Streams & Metadata</span>
                  </div>

                  {episodesList.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <p>No episode metadata found. Click Play to start streaming latest episode.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {episodesList.map((ep) => (
                        <div
                          key={ep.number}
                          onClick={() => {
                            onClose();
                            onSelectVideoWithEpisode(video, ep.number);
                          }}
                          className="flex items-center gap-3 p-3 rounded-xl bg-[#1a1a1a] hover:bg-[#252525] border border-white/5 cursor-pointer transition-all group"
                        >
                          <div className="relative w-28 aspect-video rounded-lg overflow-hidden bg-[#222] shrink-0">
                            <FadeImage
                              src={ep.image || video.thumbnail}
                              alt={ep.title || `Episode ${ep.number}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              containerClassName="w-full h-full"
                            />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Play className="w-6 h-6 fill-white text-white" />
                            </div>
                            <div className="absolute bottom-1 right-1 px-1 rounded bg-black/80 text-[10px] font-bold text-white">
                              EP {ep.number}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                              {ep.number}. {ep.title || `Episode ${ep.number}`}
                            </h4>
                            <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                              {ep.description || `Stream episode ${ep.number} in HD`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'related' && animeInfo?.related && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fadeIn">
                  {animeInfo.related.map((rel, idx) => (
                    <div key={idx} className="bg-[#1a1a1a] rounded-xl overflow-hidden border border-white/5 p-2 flex flex-col">
                      <div className="aspect-[3/4] w-full rounded-lg overflow-hidden bg-[#222] mb-2">
                        <FadeImage
                          src={rel.image}
                          alt={rel.title}
                          className="w-full h-full object-cover"
                          containerClassName="w-full h-full"
                        />
                      </div>
                      <h4 className="text-xs font-semibold text-white line-clamp-2">{rel.title}</h4>
                      <span className="text-[10px] text-gray-400 mt-1">{rel.relationType || 'Related'}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
