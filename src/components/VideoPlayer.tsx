import React, { useEffect, useRef, useState, useCallback } from 'react';
import videojs from 'video.js';
import type Player from 'video.js/dist/types/player';
import { Subtitles, Server, AlertCircle, CheckCircle, FastForward, Radio, Check, ArrowLeft, Settings, Sliders } from 'lucide-react';
import { SubtitleTrack, StreamSource, SkipInterval } from '../types';

interface VideoPlayerProps {
  streamUrl: string;
  poster?: string;
  autoPlay?: boolean;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  title?: string;
  subtitles?: SubtitleTrack[];
  servers?: StreamSource[];
  activeServerIndex?: number;
  onSelectServer?: (index: number) => void;
  onNext?: () => void;
  onPrev?: () => void;
  isLoadingStream?: boolean;
  malId?: string | number;
  slug?: string;
  episode?: number;
  intro?: SkipInterval;
  outro?: SkipInterval;
  sourceType?: 'mal' | 'slug';
  initialTime?: number;
}

export const VideoPlayer = ({
  streamUrl,
  poster,
  autoPlay = true,
  onEnded,
  onTimeUpdate,
  title,
  subtitles = [],
  servers = [],
  activeServerIndex = 0,
  onSelectServer,
  onNext,
  onPrev,
  isLoadingStream = false,
  malId,
  slug,
  episode = 1,
  intro,
  outro,
  sourceType = 'mal',
  initialTime = 0,
}: VideoPlayerProps) => {
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);
  const lastStreamUrlRef = useRef<string>('');
  const onEndedRef = useRef(onEnded);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const lastProgressReportTimeRef = useRef<number>(0);
  const initialTimeRef = useRef(initialTime);

  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showStreamInfo, setShowStreamInfo] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaybackReady, setIsPlaybackReady] = useState(false);

  // Custom premium player states
  const [isFastForwarding, setIsFastForwarding] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'stream' | 'subs' | 'cc'>('stream');
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const isControlsVisibleRef = useRef(true);
  
  useEffect(() => {
    isControlsVisibleRef.current = isControlsVisible;
  }, [isControlsVisible]);
  const [activeSubtitleIndex, setActiveSubtitleIndex] = useState<number>(-1);

  // Bottom sheet drag states
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);

  // Whenever subtitles or stream URL changes, reset or select default English subtitle track
  useEffect(() => {
    if (subtitles.length > 0) {
      const defaultIdx = subtitles.findIndex(sub => 
        sub.isDefault || 
        sub.lang?.toLowerCase() === 'en' || 
        sub.label?.toLowerCase().includes('english')
      );
      setActiveSubtitleIndex(defaultIdx !== -1 ? defaultIdx : 0);
    } else {
      setActiveSubtitleIndex(-1);
    }
  }, [subtitles, streamUrl]);

  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - dragStartY.current;
    if (deltaY > 0) {
      setDragY(deltaY);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (dragY > 80) {
      setShowStreamInfo(false);
    }
    setDragY(0);
  };

  // Custom CC subtitle states (default is medium size, white text, 75% dark backplate)
  const [ccSize, setCcSize] = useState<string>('medium');
  const [ccColor, setCcColor] = useState<string>('#ffffff');
  const [ccBg, setCcBg] = useState<string>('rgba(0,0,0,0.75)');

  // Dynamic document-level fullscreen change listeners
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isFull);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Keep refs in sync without triggering re-render effects
  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  useEffect(() => {
    onTimeUpdateRef.current = onTimeUpdate;
  }, [onTimeUpdate]);

  useEffect(() => {
    initialTimeRef.current = initialTime;
  }, [initialTime]);

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
        player.addRemoteTextTrack(
          {
            kind: 'subtitles',
            srclang: sub.lang || 'en',
            label: sub.label || 'English',
            src: sub.url,
            default: isEnglish,
          },
          false
        );
      } catch (err) {
        console.warn('Could not attach remote text track:', err);
      }
    });

    // Configure text tracks so ONLY English is enabled/showing and others are disabled
    setTimeout(() => {
      const tracks = player.textTracks();
      let hasActivatedEnglish = false;
      
      for (let i = 0; i < tracks.length; i++) {
        const t = tracks[i];
        const isEnglishTrack = t.language?.toLowerCase() === 'en' || 
                             t.label?.toLowerCase().includes('english') || 
                             t.srclang?.toLowerCase() === 'en';
        if (isEnglishTrack && !hasActivatedEnglish) {
          t.mode = 'showing';
          hasActivatedEnglish = true;
        } else {
          t.mode = 'disabled';
        }
      }
      
      // Fallback: if no English track was explicitly found, activate the first track and disable the rest
      if (!hasActivatedEnglish && tracks.length > 0) {
        tracks[0].mode = 'showing';
        for (let i = 1; i < tracks.length; i++) {
          tracks[i].mode = 'disabled';
        }
      }
    }, 400);
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
        inactivityTimeout: 2500,
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
            'currentTimeDisplay',
            'progressControl',
            'durationDisplay',
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
        
        const tech = player.tech({ IWillNotUseThisInPlugins: true });
        if (tech && tech.el()) {
          const el = tech.el() as any;
          el.preservesPitch = true;
          el.mozPreservesPitch = true;
          el.webkitPreservesPitch = true;

          const playerContainer = player.el() as HTMLElement;

          let holdTimer: any = null;
          let tapTimer: any = null;
          let lastTapTime = 0;
          let wasControlsVisibleOnTap = false;

          const handlePointerDown = (e: any) => {
            // Ignore if clicking on interactive controls
            const target = e.target as HTMLElement;
            if (target && (
              target.closest('.vjs-control-bar') || 
              target.closest('button') || 
              target.closest('.vjs-modal-dialog') || 
              target.closest('.vjs-menu') ||
              target.closest('#btn-custom-play-pause') ||
              target.closest('#btn-custom-fullscreen') ||
              target.closest('#btn-custom-prev') ||
              target.closest('#btn-custom-next')
            )) {
              return;
            }

            // Stop native VideoJS tap/click controls-toggle behavior from firing
            e.preventDefault();
            e.stopPropagation();

            wasControlsVisibleOnTap = isControlsVisibleRef.current;
            const rect = playerContainer.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const now = Date.now();

            if (now - lastTapTime < 320) {
              // DOUBLE TAP: Skip 10s
              if (tapTimer) {
                clearTimeout(tapTimer);
                tapTimer = null;
              }
              clearTimeout(holdTimer);
              
              const ct = player.currentTime() || 0;
              if (x < rect.width / 2) {
                player.currentTime(Math.max(0, ct - 10));
              } else {
                player.currentTime(ct + 10);
              }
              lastTapTime = 0;
              return;
            }

            lastTapTime = now;
            
            // Start long press check
            holdTimer = setTimeout(() => {
              player.playbackRate(2);
              setIsFastForwarding(true);
            }, 500);
          };

          const handlePointerUp = (e: any) => {
            clearTimeout(holdTimer);
            setIsFastForwarding(false);
            if (player.playbackRate() > 1) {
              player.playbackRate(1);
            }

            // Ignore taps on interactive controls, buttons, menus or modal dialogs
            const target = e.target as HTMLElement;
            if (target && (
              target.closest('.vjs-control-bar') || 
              target.closest('button') || 
              target.closest('.vjs-modal-dialog') || 
              target.closest('.vjs-menu') ||
              target.closest('#btn-custom-play-pause') ||
              target.closest('#btn-custom-fullscreen') ||
              target.closest('#btn-custom-prev') ||
              target.closest('#btn-custom-next')
            )) {
              return;
            }

            // Stop native VideoJS tap/click controls-toggle behavior from firing
            e.preventDefault();
            e.stopPropagation();

            const now = Date.now();
            // Single tap toggles controls visibility
            if (now - lastTapTime < 500 && !isFastForwarding && lastTapTime !== 0) {
              if (tapTimer) {
                clearTimeout(tapTimer);
              }
              tapTimer = setTimeout(() => {
                if (wasControlsVisibleOnTap) {
                  player.userActive(false);
                } else {
                  player.userActive(true);
                }
                tapTimer = null;
              }, 400);
            }
          };

          playerContainer.addEventListener('pointerdown', handlePointerDown);
          playerContainer.addEventListener('pointerup', handlePointerUp);
          playerContainer.addEventListener('pointercancel', handlePointerUp);
        }
      }
    ));

    // Monitor VideoJS built-in control bar visibility
    player.on('useractive', () => {
      setIsControlsVisible(true);
    });

    player.on('userinactive', () => {
      setIsControlsVisible(false);
    });

    player.on('loadedmetadata', () => {
      const seekTime = initialTimeRef.current;
      if (seekTime > 0) {
        player.currentTime(seekTime);
        initialTimeRef.current = 0; // Prevent duplicate seeks
      }
      
      // Force Highest Quality (VHS)
      try {
        const tech = player.tech({ IWillNotUseThisInPlugins: true }) as any;
        if (tech && tech.vhs && tech.vhs.representations) {
          const reps = tech.vhs.representations();
          if (reps && reps.length > 0) {
            // Sort by bandwidth descending
            reps.sort((a: any, b: any) => (b.bandwidth || 0) - (a.bandwidth || 0));
            // Disable lower qualities, enable only highest
            reps.forEach((rep: any, index: number) => {
              rep.enabled(index === 0);
            });
          }
        }
      } catch (e) {
        console.warn('Could not force highest quality:', e);
      }
    });

    player.on('playing', () => {
      setIsPlaybackReady(true);
      setIsPlaying(true);
    });

    player.on('play', () => {
      setIsPlaying(true);
    });

    player.on('pause', () => {
      setIsPlaying(false);
    });

    player.on('fullscreenchange', () => {
      setIsFullscreen(player.isFullscreen() || false);
    });

    player.on('loadstart', () => {
      setIsPlaybackReady(false);
    });

    player.on('timeupdate', () => {
      try {
        const time = player.currentTime() || 0;
        const dur = player.duration() || 0;
        setCurrentTime(time);
        if (time > 0.05) {
          setIsPlaybackReady(true);
        }
        if (dur > 0 && onTimeUpdateRef.current && Math.abs(time - lastProgressReportTimeRef.current) >= 1) {
          lastProgressReportTimeRef.current = time;
          onTimeUpdateRef.current(time, dur);
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

      {/* Custom CC Styling Injection */}
      <style>{`
        .video-js .vjs-tech {
          pointer-events: auto !important;
        }
        .video-js .vjs-text-track-display,
        .video-js .vjs-text-track-cue {
          pointer-events: none !important;
        }
        .video-js .vjs-text-track-cue {
          background-color: transparent !important;
          display: flex !important;
          justify-content: center !important;
          align-items: flex-end !important;
        }
        .video-js .vjs-text-track-cue > div {
          background-color: transparent !important;
          background: none !important;
          color: ${ccColor} !important;
          font-size: ${
            ccSize === 'small' ? '1.1em' : 
            ccSize === 'large' ? '2.1em' : 
            ccSize === 'xl' ? '2.7em' : 
            '1.6em'
          } !important;
          font-family: "Roboto", "YouTube Sans", -apple-system, BlinkMacSystemFont, sans-serif !important;
          font-weight: 800 !important;
          text-shadow: ${
            ccBg === 'rgba(0,0,0,0)' 
              ? 'none !important' 
              : '2px 2px 0px #000000, -2px -2px 0px #000000, 2px -2px 0px #000000, -2px 2px 0px #000000, 0px 3px 6px rgba(0,0,0,0.9) !important'
          };
          border-radius: 6px !important;
          padding: 2px 4px !important;
          line-height: 1.4 !important;
          box-shadow: none !important;
          border: none !important;
          letter-spacing: 0.02em !important;
        }
        /* Hide native built-in Play/Pause and Fullscreen buttons */
        .video-js .vjs-play-control,
        .video-js .vjs-fullscreen-control {
          display: none !important;
        }
        /* Reserve 48px at the right of control bar for our custom aligned Fullscreen button */
        .video-js .vjs-control-bar {
          padding-right: 48px !important;
          transition: opacity 150ms ease, visibility 150ms ease !important;
        }
      `}</style>

      {/* 2x Fast-Forward holding indicator */}
      {isFastForwarding && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 bg-black/85 backdrop-blur-md border border-white/10 text-white font-bold py-1.5 px-3.5 rounded-full flex items-center gap-1.5 shadow-xl select-none animate-pulse text-xs sm:text-sm pointer-events-none">
          <FastForward className="w-4 h-4 text-red-500 fill-red-500 animate-bounce" />
          <span className="uppercase tracking-widest text-[11px] sm:text-xs">2x Speed</span>
        </div>
      )}

      {/* Fullscreen Premium Overlay Top Bar */}
      {isFullscreen && (() => {
        const parseTitle = () => {
          if (!title) return { animeName: 'Anime Series', epText: `Episode ${episode}`, epTitle: '' };
          const parts = title.split(':');
          if (parts.length >= 3) {
            return {
              animeName: parts[0].trim(),
              epText: parts[1].trim(),
              epTitle: parts.slice(2).join(':').trim()
            };
          } else if (parts.length === 2) {
            return {
              animeName: parts[0].trim(),
              epText: `Episode ${episode}`,
              epTitle: parts[1].trim()
            };
          }
          return {
            animeName: title,
            epText: `Episode ${episode}`,
            epTitle: ''
          };
        };
        const parsed = parseTitle();
        return (
          <div className="absolute top-0 left-0 right-0 z-30 p-6 bg-gradient-to-b from-black/95 via-black/50 to-transparent flex items-center gap-4 transition-all pointer-events-auto">
            <button
              onClick={() => {
                if (playerRef.current) {
                  playerRef.current.exitFullscreen();
                }
              }}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer backdrop-blur-md active:scale-95 border border-white/10 shadow-lg"
              title="Exit Fullscreen"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex flex-col text-left">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-white font-black text-sm sm:text-base md:text-lg tracking-tight drop-shadow-md">
                  {parsed.animeName}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-red-600 text-[10px] sm:text-xs font-black tracking-wide text-white uppercase shadow-md border border-red-500/50">
                  {parsed.epText}
                </span>
              </div>
              {parsed.epTitle && (
                <span className="text-gray-300 font-medium text-[11px] sm:text-xs drop-shadow-sm line-clamp-1 mt-0.5">
                  {parsed.epTitle}
                </span>
              )}
            </div>
          </div>
        );
      })()}

      {/* Custom Settings floating absolute button in top-right corner with fill and no bg */}
      <button
        onClick={() => setShowStreamInfo(!showStreamInfo)}
        className={`absolute top-4 right-4 h-9 w-9 flex items-center justify-center z-35 text-[#cccccc] hover:text-white hover:scale-110 active:scale-95 transition-all cursor-pointer ${
          isControlsVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        title="Player Settings"
        id="btn-player-settings"
      >
        <Settings className="w-[18px] h-[18px]" fill="currentColor" />
      </button>

      {/* Custom Centered Play/Pause/Prev/Next Controls */}
      {isPlaybackReady && (
        <div 
          className={`absolute inset-0 m-auto flex items-center justify-center gap-6 z-35 transition-all duration-150 pointer-events-none ${
            isControlsVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
          }`}
        >
          {/* Previous Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onPrev) onPrev();
              else if (playerRef.current) playerRef.current.currentTime(Math.max(0, playerRef.current.currentTime() - 10));
            }}
            className="w-12 h-12 flex items-center justify-center bg-black/45 hover:bg-black/70 border border-white/10 rounded-full text-white active:scale-95 transition-transform pointer-events-auto cursor-pointer"
            title="Previous (10s)"
            id="btn-custom-prev"
          >
            <svg className="w-6 h-6 fill-current text-white" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
            </svg>
          </button>

          {/* Play/Pause Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (playerRef.current) {
                if (playerRef.current.paused()) {
                  playerRef.current.play()?.catch(() => {});
                } else {
                  playerRef.current.pause();
                }
              }
            }}
            className="h-20 w-20 bg-black/45 hover:bg-black/70 border border-white/10 rounded-full flex items-center justify-center text-white active:scale-95 hover:scale-105 transition-transform shadow-xl pointer-events-auto cursor-pointer"
            title={isPlaying ? "Pause" : "Play"}
            id="btn-custom-play-pause"
          >
            {isPlaying ? (
              <svg className="w-10 h-10 fill-current text-white" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            ) : (
              <svg className="w-10 h-10 fill-current text-white translate-x-1" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>

          {/* Next Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onNext) onNext();
              else if (playerRef.current) playerRef.current.currentTime(playerRef.current.currentTime() + 10);
            }}
            className="w-12 h-12 flex items-center justify-center bg-black/45 hover:bg-black/70 border border-white/10 rounded-full text-white active:scale-95 transition-transform pointer-events-auto cursor-pointer"
            title="Next (10s)"
            id="btn-custom-next"
          >
            <svg className="w-6 h-6 fill-current text-white" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
            </svg>
          </button>
        </div>
      )}

      {/* Custom Fullscreen button aligned perfectly in line with timestamps and progress bar */}
      <button
        onClick={() => {
          if (playerRef.current) {
            if (playerRef.current.isFullscreen()) {
              playerRef.current.exitFullscreen();
            } else {
              playerRef.current.requestFullscreen();
            }
          }
        }}
        className={`absolute bottom-0 right-3 h-12 w-11 flex items-center justify-center z-30 text-[#aaaaaa] hover:text-white hover:scale-110 active:scale-95 transition-all cursor-pointer ${
          isControlsVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        id="btn-custom-fullscreen"
      >
        {isFullscreen ? (
          <svg className="w-[18px] h-[18px] fill-none stroke-current stroke-2" viewBox="0 0 24 24">
            <path d="M4 14h6v6m0-6l-7 7m17-11h-6V4m0 6l7-7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <svg className="w-[18px] h-[18px] fill-none stroke-current stroke-2" viewBox="0 0 24 24">
            <path d="M15 3h6v6m0-6l-7 7M9 21H3v-6m0 6l7-7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      {/* Center of the Whole Viewport Settings Modal with Backdrop Blur */}
      {showStreamInfo && (
        <div
          onClick={(e) => {
            // Close when clicking the backdrop overlay
            if (e.target === e.currentTarget) {
              setShowStreamInfo(false);
            }
          }}
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:justify-end sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="bg-[#141414]/98 border-t border-x sm:border border-[#333333] shadow-2xl p-6 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-[400px] text-white flex flex-col relative select-none animate-in slide-in-from-bottom duration-300">
            {/* Grab/drag handle bar like a real native mobile bottom sheet */}
            <div className="w-12 h-1 bg-white/15 rounded-full mx-auto mb-4 block sm:hidden" />
            {/* Modal Header */}
            <div className="flex items-center justify-between w-full pb-3 border-b border-white/5">
              <span className="text-xs uppercase tracking-wider text-gray-400 font-extrabold flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-gray-400" />
                Player Settings
              </span>
              <button
                onClick={() => setShowStreamInfo(false)}
                className="text-gray-400 hover:text-white text-xs bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-full transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Three Tab triggers (Server, Subtitles, CC Style) */}
            <div className="flex bg-[#0a0a0a] p-1 rounded-xl gap-1 border border-white/5 mt-3.5">
              <button
                onClick={() => setActiveSettingsTab('stream')}
                className={`flex-1 py-1.5 text-center font-bold flex items-center justify-center gap-1.5 rounded-lg transition-all text-[11px] cursor-pointer ${
                  activeSettingsTab === 'stream' ? 'bg-white/15 text-white shadow-md' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Radio className="w-3 h-3" />
                <span>Server</span>
              </button>
              <button
                onClick={() => setActiveSettingsTab('subs')}
                className={`flex-1 py-1.5 text-center font-bold flex items-center justify-center gap-1.5 rounded-lg transition-all text-[11px] cursor-pointer ${
                  activeSettingsTab === 'subs' ? 'bg-white/15 text-white shadow-md' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Subtitles className="w-3 h-3" />
                <span>Subtitles</span>
              </button>
              <button
                onClick={() => setActiveSettingsTab('cc')}
                className={`flex-1 py-1.5 text-center font-bold flex items-center justify-center gap-1.5 rounded-lg transition-all text-[11px] cursor-pointer ${
                  activeSettingsTab === 'cc' ? 'bg-white/15 text-white shadow-md' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Sliders className="w-3 h-3" />
                <span>CC Style</span>
              </button>
            </div>

            {/* Tab content wrapper (Scrollable area) */}
            <div className="overflow-y-auto max-h-[220px] mt-4 pr-1 space-y-4 scrollbar-thin">
              {activeSettingsTab === 'stream' && (
                <div className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-2 bg-[#0d0d0d] p-2.5 rounded-xl text-[11px] text-gray-300 border border-white/5">
                    <div>
                      <span className="text-gray-400">MAL ID: </span>
                      <span className="text-white font-semibold">{malId || 'None'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Episode: </span>
                      <span className="text-white font-semibold">{episode}</span>
                    </div>
                    <div className="col-span-2 truncate">
                      <span className="text-gray-400">Slug: </span>
                      <span className="text-white font-mono">{slug || 'auto'}</span>
                    </div>
                  </div>

                  {servers.length > 0 && onSelectServer && (
                    <div className="space-y-2">
                      <div className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Switch Server:</div>
                      <div className="grid grid-cols-2 gap-2">
                        {servers.map((srv, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              onSelectServer(idx);
                              setShowStreamInfo(false);
                            }}
                            className={`px-3 py-2 rounded-xl text-[11px] font-bold text-left truncate transition-colors flex items-center justify-between border cursor-pointer ${
                              activeServerIndex === idx
                                ? 'bg-red-600 text-white border-red-500'
                                : 'bg-[#222] hover:bg-[#333] text-gray-300 border-white/5'
                            }`}
                          >
                            <span>{srv.serverName}</span>
                            {activeServerIndex === idx && <Check className="w-3.5 h-3.5" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeSettingsTab === 'subs' && (
                <div className="space-y-2">
                  <div className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Subtitle Language:</div>
                  <div className="space-y-1.5">
                    {/* Off Button */}
                    <button
                      onClick={() => {
                        setActiveSubtitleIndex(-1);
                        if (playerRef.current) {
                          const tracks = playerRef.current.textTracks();
                          for (let i = 0; i < tracks.length; i++) {
                            tracks[i].mode = 'disabled';
                          }
                        }
                      }}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-bold text-left transition-colors flex items-center justify-between border cursor-pointer ${
                        activeSubtitleIndex === -1
                          ? 'bg-red-600 text-white border-red-500 shadow-md'
                          : 'bg-[#222] hover:bg-[#333] text-gray-300 border-white/5'
                      }`}
                    >
                      <span>Subtitles Off</span>
                      {activeSubtitleIndex === -1 && <Check className="w-4 h-4 text-white" />}
                    </button>

                    {/* Available Subtitle Tracks */}
                    {subtitles.map((sub, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setActiveSubtitleIndex(idx);
                          if (playerRef.current) {
                            const tracks = playerRef.current.textTracks();
                            const targetSub = subtitles[idx];
                            for (let i = 0; i < tracks.length; i++) {
                              const t = tracks[i];
                              const isTarget = t.label === targetSub.label || 
                                               t.language === targetSub.lang || 
                                               t.srclang === targetSub.lang;
                              if (isTarget) {
                                t.mode = 'showing';
                              } else {
                                t.mode = 'disabled';
                              }
                            }
                          }
                        }}
                        className={`w-full px-3 py-2 rounded-xl text-xs font-bold text-left transition-colors flex items-center justify-between border cursor-pointer ${
                          activeSubtitleIndex === idx
                            ? 'bg-red-600 text-white border-red-500 shadow-md'
                            : 'bg-[#222] hover:bg-[#333] text-gray-300 border-white/5'
                        }`}
                      >
                        <span>{sub.label || `Subtitle Track ${idx + 1}`}</span>
                        {activeSubtitleIndex === idx && <Check className="w-4 h-4 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeSettingsTab === 'cc' && (
                <div className="space-y-4 pt-1 text-[11px]">
                  {/* Text Size */}
                  <div className="space-y-1.5">
                    <span className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Font Size:</span>
                    <div className="grid grid-cols-4 gap-1.5 bg-[#0d0d0d] p-1 rounded-xl border border-white/5">
                      {[
                        { id: 'small', label: 'Small' },
                        { id: 'medium', label: 'Normal' },
                        { id: 'large', label: 'Large' },
                        { id: 'xl', label: 'Extra' }
                      ].map(sz => (
                        <button
                          key={sz.id}
                          onClick={() => setCcSize(sz.id)}
                          className={`py-1.5 rounded-lg text-center transition-all text-[10px] font-bold cursor-pointer ${
                            ccSize === sz.id ? 'bg-red-600 text-white shadow-sm font-extrabold' : 'hover:bg-white/5 text-gray-400'
                          }`}
                        >
                          {sz.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Text Color */}
                  <div className="space-y-1.5">
                    <span className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Text Color:</span>
                    <div className="grid grid-cols-4 gap-1.5 bg-[#0d0d0d] p-1 rounded-xl border border-white/5">
                      {[
                        { val: '#ffffff', label: 'White', bg: 'bg-white text-black' },
                        { val: '#ffff00', label: 'Yellow', bg: 'bg-yellow-400 text-black' },
                        { val: '#00ffff', label: 'Cyan', bg: 'bg-cyan-400 text-black' },
                        { val: '#39ff14', label: 'Lime', bg: 'bg-green-400 text-black' }
                      ].map(col => (
                        <button
                          key={col.val}
                          onClick={() => setCcColor(col.val)}
                          className={`py-1.5 rounded-lg text-[10px] font-extrabold transition-all truncate text-center cursor-pointer ${
                            ccColor === col.val 
                              ? 'ring-2 ring-red-500 scale-105 font-black' 
                              : 'opacity-70 hover:opacity-100'
                          } ${col.bg}`}
                        >
                          {col.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Background */}
                  <div className="space-y-1.5">
                    <span className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Subtitle Backplate:</span>
                    <div className="grid grid-cols-3 gap-1.5 bg-[#0d0d0d] p-1 rounded-xl border border-white/5">
                      {[
                        { val: 'rgba(0,0,0,0)', label: 'None' },
                        { val: 'rgba(0,0,0,0.45)', label: 'Translucent' },
                        { val: 'rgba(0,0,0,0.85)', label: 'Dark Solid' }
                      ].map(bgOpt => (
                        <button
                          key={bgOpt.val}
                          onClick={() => setCcBg(bgOpt.val)}
                          className={`py-1.5 rounded-lg text-center transition-all text-[10px] font-bold cursor-pointer ${
                            ccBg === bgOpt.val ? 'bg-red-600 text-white shadow-sm' : 'hover:bg-white/5 text-gray-400'
                          }`}
                        >
                          {bgOpt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
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
