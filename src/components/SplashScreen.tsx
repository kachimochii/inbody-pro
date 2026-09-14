import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface SplashScreenProps {
  onFinish: () => void;
}

const PLAYBACK_MS = 4000;
const FADE_MS = 500;

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [fading, setFading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const onFinishRef = useRef(onFinish);
  const mountedRef = useRef(true);
  const exitingRef = useRef(false);
  const playbackTimerRef = useRef<number | null>(null);
  const fadeTimerRef = useRef<number | null>(null);

  onFinishRef.current = onFinish;

  useEffect(() => {
    mountedRef.current = true;
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');

    const beginExit = () => {
      if (!mountedRef.current || exitingRef.current) return;
      exitingRef.current = true;

      if (playbackTimerRef.current !== null) {
        window.clearTimeout(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }

      setFading(true);
      fadeTimerRef.current = window.setTimeout(() => {
        if (mountedRef.current) onFinishRef.current();
      }, FADE_MS);
    };

    const startPlaybackTimer = () => {
      if (playbackTimerRef.current !== null || exitingRef.current) return;
      playbackTimerRef.current = window.setTimeout(beginExit, PLAYBACK_MS);
    };

    const handleEnded = () => beginExit();
    const handlePlaying = () => startPlaybackTimer();
    const handleError = () => {
      if (!mountedRef.current) return;
      startPlaybackTimer();
    };

    video.addEventListener('ended', handleEnded);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('error', handleError);

    const playPromise = video.play();
    if (playPromise) {
      playPromise.catch((err: unknown) => {
        const name = err && typeof err === 'object' && 'name' in err ? String(err.name) : '';
        if (name === 'AbortError' || !mountedRef.current) return;
        startPlaybackTimer();
      });
    }

    return () => {
      mountedRef.current = false;
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('error', handleError);
      if (playbackTimerRef.current !== null) {
        window.clearTimeout(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }
      if (fadeTimerRef.current !== null) {
        window.clearTimeout(fadeTimerRef.current);
        fadeTimerRef.current = null;
      }
      video.pause();
    };
  }, []);

  return createPortal(
    <div
      id="inbody-splash"
      className={`fixed inset-0 z-[9999] bg-black flex items-center justify-center transition-opacity ease-out ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ transitionDuration: `${FADE_MS}ms` }}
      role="dialog"
      aria-label="Video de bienvenida"
      aria-modal="true"
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        autoPlay
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        controls={false}
      >
        <source src="/INBODY-INTRO.mp4" type="video/mp4" />
      </video>
    </div>,
    document.body
  );
};
