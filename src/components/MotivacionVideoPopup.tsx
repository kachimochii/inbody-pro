import React, { useEffect } from 'react';
import { Play, Sparkles, X } from 'lucide-react';
import { extractYoutubeVideoId, generateIframeUrl } from '../utils/inbodyCalculations';

interface MotivacionVideoPopupProps {
  url: string;
  titulo?: string;
  onContinuar: () => void;
}

export const MotivacionVideoPopup: React.FC<MotivacionVideoPopupProps> = ({
  url,
  titulo = 'Acepta el proceso. El dolor de hoy es la disciplina de mañana.',
  onContinuar,
}) => {
  const youtubeId = extractYoutubeVideoId(url);
  const embed = youtubeId
    ? `https://www.youtube.com/embed/${youtubeId}?rel=0&controls=1&autoplay=1&modestbranding=1&playsinline=1`
    : generateIframeUrl(url);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onContinuar();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onContinuar]);

  return (
    <div className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-2xl rounded-3xl border border-amber-500/30 bg-slate-950 shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between gap-3 p-4 sm:p-5 border-b border-slate-800">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
              <Sparkles className="w-3 h-3" />
              Mensaje táctico del día
            </span>
            <h3 className="text-base sm:text-lg font-black text-white mt-2 leading-snug">{titulo}</h3>
          </div>
          <button
            type="button"
            onClick={onContinuar}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer shrink-0"
            title="Saltar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="aspect-video bg-black">
          {embed ? (
            <iframe
              src={embed}
              title="Video motivacional"
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
              No se pudo cargar el video.
            </div>
          )}
        </div>
        <div className="p-4 sm:p-5">
          <button
            type="button"
            onClick={onContinuar}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4" />
            Saltar / Continuar al Entrenamiento →
          </button>
        </div>
      </div>
    </div>
  );
};
