import React from 'react';
import { ExternalLink, Video } from 'lucide-react';
import { extractYoutubeVideoId, generateIframeUrl, isExternalVideoLink } from '../utils/inbodyCalculations';

interface PlanVideoEmbedProps {
  videoUrl: string;
  title?: string;
}

/**
 * Embed del video del plan con controles nativos (play/pausa/barra)
 * y acceso directo a YouTube / enlace externo.
 */
export const PlanVideoEmbed: React.FC<PlanVideoEmbedProps> = ({
  videoUrl,
  title = 'Video del plan',
}) => {
  if (!videoUrl) return null;

  const youtubeId = extractYoutubeVideoId(videoUrl);
  const isYoutube = Boolean(youtubeId);
  const watchUrl = youtubeId
    ? `https://www.youtube.com/watch?v=${youtubeId}`
    : videoUrl;

  if (isExternalVideoLink(videoUrl) && !isYoutube) {
    return (
      <div className="space-y-2">
        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
          <Video className="w-3.5 h-3.5" />
          Video de este plan
        </span>
        <a
          href={videoUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-cyan-600/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold hover:bg-cyan-600/30 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Abrir video
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
          <Video className="w-3.5 h-3.5" />
          Video de este plan
        </span>
        {isYoutube && (
          <a
            href={watchUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/20 border border-rose-500/40 text-rose-300 text-[10px] font-bold uppercase tracking-wider hover:bg-rose-600/30 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Ver en YouTube
          </a>
        )}
      </div>
      <div className="aspect-video rounded-xl overflow-hidden border border-slate-800 bg-black">
        <iframe
          src={generateIframeUrl(videoUrl)}
          title={title}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      <p className="text-[10px] text-slate-500">
        Usa play / pausa y la barra del reproductor para adelantar o retroceder el video.
      </p>
    </div>
  );
};
