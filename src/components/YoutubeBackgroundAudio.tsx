import React, { useEffect, useRef } from 'react';

type YtPlayer = {
  loadVideoById: (id: string) => void;
  cueVideoById: (id: string) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  mute: () => void;
  unMute: () => void;
  destroy: () => void;
};

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: HTMLElement | string,
        opts: {
          height: string;
          width: string;
          videoId: string;
          playerVars: Record<string, number | string>;
          events: {
            onReady?: (e: { target: YtPlayer }) => void;
            onStateChange?: (e: { data: number; target: YtPlayer }) => void;
          };
        }
      ) => YtPlayer;
      PlayerState?: { PLAYING: number; PAUSED: number; ENDED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<void> | null = null;

function loadYoutubeIframeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      document.head.appendChild(script);
    }
    if (window.YT?.Player) resolve();
  });

  return apiPromise;
}

interface YoutubeBackgroundAudioProps {
  videoId: string | null;
  playing: boolean;
  muted: boolean;
}

export const YoutubeBackgroundAudio: React.FC<YoutubeBackgroundAudioProps> = ({
  videoId,
  playing,
  muted,
}) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YtPlayer | null>(null);
  const readyRef = useRef(false);
  const videoIdRef = useRef(videoId);
  const playingRef = useRef(playing);
  const mutedRef = useRef(muted);

  videoIdRef.current = videoId;
  playingRef.current = playing;
  mutedRef.current = muted;

  const applyState = (player: YtPlayer) => {
    try {
      if (mutedRef.current) player.mute();
      else player.unMute();
      if (playingRef.current && videoIdRef.current) player.playVideo();
      else player.pauseVideo();
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    let cancelled = false;

    const setup = async () => {
      if (!hostRef.current) return;
      await loadYoutubeIframeApi();
      if (cancelled || !hostRef.current || !window.YT?.Player) return;

      const initialId = videoIdRef.current || '';
      playerRef.current = new window.YT.Player(hostRef.current, {
        height: '0',
        width: '0',
        videoId: initialId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (e) => {
            readyRef.current = true;
            applyState(e.target);
          },
          onStateChange: (e) => {
            if (e.data === window.YT?.PlayerState?.ENDED && playingRef.current && videoIdRef.current) {
              e.target.playVideo();
            }
          },
        },
      });
    };

    setup();

    return () => {
      cancelled = true;
      readyRef.current = false;
      try {
        playerRef.current?.destroy();
      } catch {
        /* ignore */
      }
      playerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const player = playerRef.current;
    if (!readyRef.current || !player || !videoId) return;
    try {
      if (playingRef.current) player.loadVideoById(videoId);
      else player.cueVideoById(videoId);
    } catch {
      /* player still initializing */
    }
  }, [videoId]);

  useEffect(() => {
    const player = playerRef.current;
    if (!readyRef.current || !player) return;
    applyState(player);
  }, [playing, muted, videoId]);

  return (
    <div
      className="pointer-events-none absolute overflow-hidden"
      style={{ width: 1, height: 1, opacity: 0, left: 0, bottom: 0 }}
      aria-hidden="true"
    >
      <div ref={hostRef} />
    </div>
  );
};
