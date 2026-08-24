import { useEffect, useRef, useState, useCallback } from 'react';
import videojs from 'video.js';
import type Player from 'video.js/dist/types/player';
import { Subtitles, Server, AlertCircle, CheckCircle, FastForward, Radio, Check } from 'lucide-react';
import { SubtitleTrack, StreamSource, SkipInterval } from '../types';

interface VideoPlayerProps {
  streamUrl: string;
  poster?: string;
  autoPlay?: boolean;
  onEnded?: () => void;
  title?: string;
  subtitles?: SubtitleTrack[];
  servers?: StreamSource[];
  activeServerIndex?: number;
  onSelectServer?: (index: number) => void;
  isLoadingStream?: boolean;
  malId?: string | number;
  slug?: string;
  episode?: number;
  intro?: SkipInterval;
  outro?: SkipInterval;
  sourceType?: 'mal' | 'slug';
}

export const VideoPlayer = ({
  streamUrl,
  poster,
  autoPlay = true,
  onEnded,
  title,
  subtitles = [],
  servers = [],
  activeServerIndex = 0,
  onSelectServer,
  isLoadingStream = false,
  malId,
  slug,
  episode = 1,
  intro,
  outro,
  sourceType = 'mal',
}: VideoPlayerProps) => {
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);
  const lastStreamUrlRef = useRef<string>('');
  const onEndedRef = useRef(onEnded);

  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showStreamInfo, setShowStreamInfo] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaybackReady, setIsPlaybackReady] = useState(false);

  // Keep onEnded ref in sync without triggering effects
  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  // Immediately pause and stop background audio when streamUrl is cleared or loading
  useEffect(() => {
    if (!streamUrl || isLoadingStream) {
      setIsPlaybackReady(false);
      if (playerRef.current && !playerRef.current.isDisposed()) {
        try {
          playerRef.current.pause();
        } catch {
          // ignore
        }
      }
    }
  }, [streamUrl, isLoadingStream]);

  // Determine if currently within intro or outro intervals
  const isIntroActive =
    intro &&
    intro.end > intro.start &&
    currentTime >= intro.start &&
    currentTime < intro.end;

  const isOutroActive =
    outro &&
    outro.end > outro.start &&
    currentTime >= outro.start &&
    currentTime < outro.end;

  const handleSkipIntro = () => {
    if (playerRef.current && intro) {
      playerRef.current.currentTime(intro.end);
    }
  };

  const handleSkipOutro = () => {
    if (playerRef.current && outro) {
      playerRef.current.currentTime(outro.end);
    }
  };

  // Attach subtitle tracks to an active player instance
  const applySubtitles = useCallback((player: Player, tracksList: SubtitleTrack[]) => {
    if (!tracksList || tracksList.length === 0) return;

    // Clear existing remote text tracks if any
    try {
      const existing = player.remoteTextTracks();
      if (existing) {
        for (let i = existing.length - 1; i >= 0; i--) {
          player.removeRemoteTextTrack(existing[i]);
        }
      }
    } catch {
      // ignore
    }

    tracksList.forEach((sub) => {
      const isEnglish =
        sub.isDefault ||
        sub.lang?.toLowerCase() === 'en' ||
        sub.label?.toLowerCase().includes('english');

      try {
        const track = player.addRemoteTextTrack(
          {
            kind: 'subtitles',
            srclang: sub.lang || 'en',
            label: sub.label || 'English',
            src: sub.url,
            default: isEnglish,
          },
          false
        );

        if (isEnglish && track) {
          setTimeout(() => {
            const tracks = player.textTracks();
            for (let i = 0; i < tracks.length; i++) {
              const t = tracks[i];
              if (t.label === sub.label || t.language === 'en') {
                t.mode = 'showing';
              }
            }
          }, 300);
        }
      } catch (err) {
        console.warn('Could not attach remote text track:', err);
      }
    });
  }, []);

  // Initialize or update player ONLY when streamUrl changes
  useEffect(() => {
    if (!videoContainerRef.current) return;

    if (!streamUrl) {
      setIsPlaybackReady(false);
      if (playerRef.current && !playerRef.current.isDisposed()) {
        try {
          playerRef.current.pause();
        } catch {
          // ignore
        }
      }
      return;
    }

    // Reset playback ready on new stream URL
    setIsPlaybackReady(false);

    // If streamUrl has not changed and player already exists, do not reload
    if (playerRef.current && lastStreamUrlRef.current === streamUrl) {
      return;
    }

    const isHls = streamUrl.includes('.m3u8') || streamUrl.includes('/manifest');
    const mediaType = isHls ? 'application/x-mpegURL' : 'video/mp4';

    // If player already exists, simply change the source smoothly without DOM recreation
    if (playerRef.current && !playerRef.current.isDisposed()) {
      const player = playerRef.current;
      lastStreamUrlRef.current = streamUrl;
      setHasError(false);
      setErrorMessage('');

      try {
        player.pause();
        player.src({
          src: streamUrl,
          type: mediaType,
        });

        applySubtitles(player, subtitles);

        if (autoPlay) {
          player.play()?.catch(() => {});
        }
      } catch (e) {
        console.warn('Error updating existing player src:', e);
      }
      return;
    }

    // Otherwise, create new player
    lastStreamUrlRef.current = streamUrl;
    videoContainerRef.current.innerHTML = '';
    const videoElement = document.createElement('video-js');
    videoElement.classList.add('vjs-big-play-centered', 'vjs-theme-youtube');
    videoElement.setAttribute('crossOrigin', 'anonymous');
    videoContainerRef.current.appendChild(videoElement);

    const player = (playerRef.current = videojs(
      videoElement,
      {
        autoplay: autoPlay,
        controls: true,
        responsive: true,
        fluid: true,
        poster: poster,
        playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
        html5: {
          vhs: {
            overrideNative: true,
            handlePartialData: true,
          },
          nativeAudioTracks: false,
          nativeVideoTracks: false,
        },
        controlBar: {
          children: [
            'playToggle',
            'volumePanel',
            'currentTimeDisplay',
            'timeDivider',
            'durationDisplay',
            'progressControl',
            'playbackRateMenuButton',
            'subsCapsButton',
            'pictureInPictureToggle',
            'fullscreenToggle',
          ],
        },
        sources: [
          {
            src: streamUrl,
            type: mediaType,
          },
        ],
      },
      () => {
        setHasError(false);
        applySubtitles(player, subtitles);
      }
    ));

    player.on('playing', () => {
      setIsPlaybackReady(true);
    });

    player.on('loadstart', () => {
      setIsPlaybackReady(false);
    });

    player.on('timeupdate', () => {
      try {
        const time = player.currentTime() || 0;
        setCurrentTime(time);
        if (time > 0.05) {
          setIsPlaybackReady(true);
        }
      } catch {
        // ignore
      }
    });

    player.on('error', () => {
      const err = player.error();
      console.warn('VideoJS stream error:', err);
      setIsPlaybackReady(false);
      setHasError(true);
      setErrorMessage(
        err?.message || 'Streaming playback error. Check HLS stream or CORS proxy.'
      );
    });

    player.on('ended', () => {
      if (onEndedRef.current) {
        onEndedRef.current();
      }
    });

    return () => {
      // Only clean up on total unmount
    };
  }, [streamUrl, autoPlay, poster, applySubtitles, subtitles]);

  // Clean up on component unmount only
  useEffect(() => {
    return () => {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose();
        playerRef.current = null;
        lastStreamUrlRef.current = '';
      }
    };
  }, []);

  const activeServer = servers[activeServerIndex];

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl group border border-[#272727]">
      {/* VideoJS Container */}
      <div data-vjs-player ref={videoContainerRef} className="w-full h-full" />

      {/* Episode Thumbnail / Anime Fanart Banner Backdrop & Smooth Fade Overlay */}
      <div
        className={`absolute inset-0 z-15 bg-black overflow-hidden flex items-center justify-center transition-opacity duration-700 ease-out ${
          isPlaybackReady && !isLoadingStream && streamUrl && !hasError
            ? 'opacity-0 pointer-events-none'
            : 'opacity-100 pointer-events-auto'
        }`}
      >
        {poster && (
          <img
            src={poster}
            alt={title || `Episode ${episode}`}
            className="w-full h-full object-cover select-none filter brightness-90 transform scale-105"
            referrerPolicy="no-referrer"
          />
        )}

        {/* Ambient dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/70" />

        {/* Loading Spinner & Episode Info Indicator */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center space-y-3 z-20">
          <div className="w-12 h-12 rounded-full border-3 border-white/20 border-t-white animate-spin shadow-2xl" />
          <div className="space-y-1">
            <p className="text-white font-bold text-sm sm:text-base drop-shadow-md">
              {isLoadingStream ? `Loading Episode ${episode}...` : `Buffering Episode ${episode}...`}
            </p>
            {servers[activeServerIndex] && (
              <p className="text-gray-300 text-xs drop-shadow">
                {servers[activeServerIndex].serverName}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Skip Intro Button Overlay */}
      {isIntroActive && (
        <button
          onClick={handleSkipIntro}
          className="absolute bottom-16 right-5 z-20 flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-200 text-black font-bold text-xs sm:text-sm rounded-lg shadow-2xl transition-all transform hover:scale-105 active:scale-95 animate-fade-in"
          id="btn-skip-intro"
        >
          <FastForward className="w-4 h-4 text-black fill-black" />
          <span>Skip Intro</span>
          <span className="text-[10px] text-gray-700 bg-gray-200 px-1.5 py-0.5 rounded font-mono">
            {Math.floor(intro!.end / 60)}:{(intro!.end % 60).toString().padStart(2, '0')}
          </span>
        </button>
      )}

      {/* Skip Outro Button Overlay */}
      {isOutroActive && (
        <button
          onClick={handleSkipOutro}
          className="absolute bottom-16 right-5 z-20 flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-200 text-black font-bold text-xs sm:text-sm rounded-lg shadow-2xl transition-all transform hover:scale-105 active:scale-95 animate-fade-in"
          id="btn-skip-outro"
        >
          <FastForward className="w-4 h-4 text-black fill-black" />
          <span>Skip Outro</span>
          <span className="text-[10px] text-gray-700 bg-gray-200 px-1.5 py-0.5 rounded font-mono">
            {Math.floor(outro!.end / 60)}:{(outro!.end % 60).toString().padStart(2, '0')}
          </span>
        </button>
      )}

      {/* Loading Overlay */}
      {isLoadingStream && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center z-20 space-y-3">
          <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-white font-medium text-sm">
            Loading stream (Episode {episode})...
          </p>
        </div>
      )}

      {/* Stream Diagnostics Overlay Toggle */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        <button
          onClick={() => setShowStreamInfo(!showStreamInfo)}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-black/70 hover:bg-black/90 text-white transition-all border border-white/10 shadow-lg"
          title="Stream Info"
          id="btn-stream-info"
        >
          <Radio className="w-3.5 h-3.5 text-white" />
          <span>{sourceType === 'slug' ? 'Slug Source' : 'MAL Source'}</span>
        </button>
      </div>

      {/* Stream Diagnostics Modal */}
      {showStreamInfo && (
        <div className="absolute top-12 left-3 z-30 w-80 max-w-[90vw] p-4 rounded-xl bg-[#1f1f1f] border border-[#333333] shadow-2xl text-xs space-y-3 text-white">
          <div className="flex items-center justify-between font-semibold border-b border-[#333] pb-2">
            <span>Stream Diagnostics</span>
            <button
              onClick={() => setShowStreamInfo(false)}
              className="text-gray-400 hover:text-white px-1.5"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 bg-[#121212] p-2 rounded text-[11px] text-gray-300">
            <div>
              <span className="text-gray-400">MAL ID: </span>
              <span className="text-white font-medium">{malId || 'None'}</span>
            </div>
            <div>
              <span className="text-gray-400">Episode: </span>
              <span className="text-white font-medium">{episode}</span>
            </div>
            <div className="col-span-2 truncate">
              <span className="text-gray-400">Slug: </span>
              <span className="text-white font-mono">{slug || 'auto'}</span>
            </div>
          </div>

          {servers.length > 0 && onSelectServer && (
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] text-gray-400 font-medium">Switch Server:</div>
              <div className="grid grid-cols-2 gap-1.5">
                {servers.map((srv, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      onSelectServer(idx);
                      setShowStreamInfo(false);
                    }}
                    className={`px-2 py-1.5 rounded text-[11px] font-medium text-left truncate transition-colors flex items-center justify-between ${
                      activeServerIndex === idx
                        ? 'bg-white text-black'
                        : 'bg-[#272727] hover:bg-[#383838] text-white'
                    }`}
                  >
                    <span>{srv.serverName}</span>
                    {activeServerIndex === idx && <Check className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stream Error Recovery Overlay */}
      {hasError && (
        <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-6 text-center z-30 space-y-3">
          <div className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="text-white font-medium text-base">Stream Loading Error</div>
          <p className="text-[#aaaaaa] text-xs max-w-md">
            {errorMessage || 'Connecting to stream server...'}
          </p>

          {servers.length > 1 && onSelectServer && (
            <div className="pt-2 space-y-2">
              <p className="text-xs text-white">Switch server:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {servers.map((srv, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSelectServer(idx)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      activeServerIndex === idx
                        ? 'bg-white text-black'
                        : 'bg-[#272727] hover:bg-[#383838] text-white'
                    }`}
                  >
                    {srv.serverName}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
