import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Download, Share2, X } from 'lucide-react';
import { InBodyRecord, UserAccount } from '../types/inbody';
import { resolveAnalisisCorporal, resolveTipoCuerpo } from '../utils/inbodyCalculations';
import { getNivelSalud } from '../utils/composicionCorporal';
import { resolveGradoTituloLinea, resolveNombreCompleto } from '../utils/militarDisplay';

interface CarneInbodyModalProps {
  user: UserAccount;
  medicion: InBodyRecord;
  edadCronologica: number;
  onClose: () => void;
}

const W = 1080;
const H = 1920;

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 3
): number {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  const shown = lines.slice(0, maxLines);
  shown.forEach((l, i) => {
    ctx.fillText(l, x, y + i * lineHeight);
  });
  return shown.length;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function fileName(cedula: string): string {
  return `Carne_InBody_${cedula}.png`;
}

export const CarneInbodyModal: React.FC<CarneInbodyModalProps> = ({
  user,
  medicion,
  edadCronologica,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analisis = resolveAnalisisCorporal(medicion, edadCronologica, user.sexo);
  const nivel = getNivelSalud(medicion.inbodyScore);
  const somatotipo = resolveTipoCuerpo(medicion, edadCronologica, user.sexo);
  const nombre = resolveNombreCompleto(user);
  const grado = resolveGradoTituloLinea(user).linea;
  const unidad = user.unidadActual || 'Unidad no registrada';

  const draw = useCallback(
    async (canvas: HTMLCanvasElement) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = W;
      canvas.height = H;

      const medal = await loadImage(`/medallas/n${nivel}.png`);

      ctx.fillStyle = '#070b14';
      ctx.fillRect(0, 0, W, H);

      const grid = ctx.createLinearGradient(0, 0, W, H);
      grid.addColorStop(0, 'rgba(14, 116, 144, 0.18)');
      grid.addColorStop(0.5, 'rgba(30, 58, 138, 0.10)');
      grid.addColorStop(1, 'rgba(15, 23, 42, 0.0)');
      ctx.fillStyle = grid;
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
      ctx.lineWidth = 1;
      for (let y = 80; y < H; y += 48) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(0, 0, W, 10);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(0, 10, W, 6);

      ctx.fillStyle = '#22d3ee';
      ctx.font = '800 28px Segoe UI, Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('INBODY PRO 270S  ·  DIAGNÓSTICO ANTROPOMÉTRICO', W / 2, 78);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '700 22px Segoe UI, Inter, sans-serif';
      ctx.fillText('CARNÉ TÁCTICO DE COMPOSICIÓN CORPORAL', W / 2, 118);

      roundRect(ctx, 64, 150, W - 128, 220, 28);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.35)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.fillStyle = '#fbbf24';
      ctx.font = '800 26px Segoe UI, Inter, sans-serif';
      ctx.fillText(grado.toUpperCase() || 'GRADO', 96, 210);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 42px Segoe UI, Inter, sans-serif';
      wrapText(ctx, nombre.toUpperCase(), 96, 268, W - 224, 48, 2);

      ctx.fillStyle = '#67e8f9';
      ctx.font = '700 24px Segoe UI, Inter, sans-serif';
      wrapText(ctx, unidad.toUpperCase(), 96, 330, W - 224, 32, 1);

      const scoreY = 430;
      roundRect(ctx, 64, scoreY, W - 128, 520, 36);
      ctx.fillStyle = 'rgba(2, 6, 23, 0.9)';
      ctx.fill();
      ctx.strokeStyle =
        nivel === 3
          ? 'rgba(16, 185, 129, 0.55)'
          : nivel === 2
            ? 'rgba(245, 158, 11, 0.55)'
            : 'rgba(244, 63, 94, 0.55)';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#94a3b8';
      ctx.font = '800 22px Segoe UI, Inter, sans-serif';
      ctx.fillText('INBODY SCORE', W / 2, scoreY + 56);

      const scoreColor = nivel === 3 ? '#34d399' : nivel === 2 ? '#fbbf24' : '#fb7185';
      ctx.fillStyle = scoreColor;
      ctx.font = '900 210px Segoe UI, Inter, sans-serif';
      ctx.fillText(String(Math.round(medicion.inbodyScore)), W / 2, scoreY + 250);

      ctx.fillStyle = '#64748b';
      ctx.font = '800 36px Segoe UI, Inter, sans-serif';
      ctx.fillText('/ 100', W / 2, scoreY + 310);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '900 36px Segoe UI, Inter, sans-serif';
      ctx.fillText(`NIVEL ${nivel}`, W / 2 - 70, scoreY + 390);

      if (medal) {
        ctx.drawImage(medal, W / 2 + 70, scoreY + 330, 110, 110);
      }

      const edadCorp = analisis.edadCorporal;
      const metrics: [string, string][] = [
        ['EDAD CORPORAL', `${edadCorp} años`],
        ['EDAD REAL (C.I.)', `${edadCronologica} años`],
        ['PESO', `${medicion.peso.toFixed(1)} kg`],
        ['MÚSCULO SMM', `${medicion.musculoKg.toFixed(1)} kg`],
        ['% GRASA', `${medicion.pctGrasa.toFixed(1)} %`],
        ['SOMATOTIPO', somatotipo],
      ];

      const boxW = 440;
      const boxH = 150;
      const gap = 24;
      const startX = (W - (boxW * 2 + gap)) / 2;
      const startY = 1000;

      metrics.forEach(([label, value], i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = startX + col * (boxW + gap);
        const y = startY + row * (boxH + gap);
        roundRect(ctx, x, y, boxW, boxH, 22);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.textAlign = 'left';
        ctx.fillStyle = '#67e8f9';
        ctx.font = '800 18px Segoe UI, Inter, sans-serif';
        ctx.fillText(label, x + 28, y + 46);
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 34px Segoe UI, Inter, sans-serif';
        wrapText(ctx, value, x + 28, y + 100, boxW - 56, 36, 2);
      });

      ctx.textAlign = 'center';
      ctx.fillStyle = '#64748b';
      ctx.font = '700 20px Segoe UI, Inter, sans-serif';
      ctx.fillText(`C.I. ${user.cedula}  ·  Evaluación ${medicion.fecha}`, W / 2, H - 90);
      ctx.fillStyle = '#334155';
      ctx.font = '700 18px Segoe UI, Inter, sans-serif';
      ctx.fillText('USO INSTITUCIONAL  ·  INBODY 270S', W / 2, H - 52);
    },
    [analisis.edadCorporal, edadCronologica, grado, medicion, nombre, nivel, somatotipo, unidad, user.cedula]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    void draw(canvas);
  }, [draw]);

  const exportBlob = async (): Promise<Blob> => {
    const canvas = canvasRef.current;
    if (!canvas) throw new Error('Canvas no disponible');
    await draw(canvas);
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('No se pudo generar la imagen'));
      }, 'image/png');
    });
  };

  const handleDownload = async () => {
    setBusy(true);
    setError(null);
    try {
      const blob = await exportBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName(user.cedula);
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('No se pudo descargar el carné. Intenta de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  const handleShare = async () => {
    setBusy(true);
    setError(null);
    try {
      const blob = await exportBlob();
      const file = new File([blob], fileName(user.cedula), { type: 'image/png' });
      const nav = navigator as Navigator & {
        canShare?: (data: ShareData) => boolean;
      };
      const payload: ShareData = {
        files: [file],
        title: 'Carné InBody 270S',
        text: `${nombre} · Score ${medicion.inbodyScore}/100 · Nivel ${nivel}`,
      };
      if (typeof navigator.share === 'function' && (!nav.canShare || nav.canShare(payload))) {
        await navigator.share(payload);
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName(user.cedula);
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      if ((err as { name?: string })?.name === 'AbortError') return;
      setError('No se pudo compartir. Se intentará la descarga.');
      try {
        await handleDownload();
      } catch {
        /* already handled */
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 p-4 border-b border-slate-800">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
              Historia de WhatsApp · 1080×1920
            </p>
            <h2 className="text-lg font-black text-white">Carné Táctico InBody</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer border border-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          <canvas
            ref={canvasRef}
            className="w-full h-auto rounded-2xl border border-slate-800 shadow-xl bg-slate-950"
            style={{ aspectRatio: '1080 / 1920' }}
          />
          {error && <p className="mt-3 text-xs font-bold text-rose-400">{error}</p>}
        </div>

        <div className="p-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleDownload()}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-black uppercase tracking-wider cursor-pointer border border-slate-700 disabled:opacity-60"
          >
            <Download className="w-4 h-4 text-cyan-300" />
            📥 Descargar Imagen (PNG)
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleShare()}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black uppercase tracking-wider cursor-pointer border border-emerald-400/30 disabled:opacity-60"
          >
            <Share2 className="w-4 h-4" />
            📲 Compartir en WhatsApp / Móvil
          </button>
        </div>
      </div>
    </div>
  );
};
