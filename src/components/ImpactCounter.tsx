import React, { useEffect, useRef, useState } from 'react';
import { Users } from 'lucide-react';

interface ImpactCounterProps {
  value: number;
  texto: string;
  isDark?: boolean;
  /** Solo anima al entrar en pantalla (ficha del evaluado). */
  runWhenVisible?: boolean;
  /** Frases a la izquierda (solo layout ficha). */
  withMissionPhrases?: boolean;
  frase1?: string;
  frase1Color?: string;
  frase2?: string;
  frase2Color?: string;
}

/** La coma en el texto baja de línea (ej. "línea 1, línea 2"). */
function splitImpactoTexto(texto: string): string[] {
  return String(texto || '')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
}

export const ImpactCounter: React.FC<ImpactCounterProps> = ({
  value,
  texto,
  isDark = true,
  runWhenVisible = false,
  withMissionPhrases = false,
  frase1 = 'Conoce tu cuerpo',
  frase1Color = '#67e8f9',
  frase2 = 'Transforma tu vida',
  frase2Color = '#fb7185',
}) => {
  const [n, setN] = useState(0);
  const [started, setStarted] = useState(!runWhenVisible);
  const rootRef = useRef<HTMLDivElement>(null);
  const lineas = splitImpactoTexto(texto);

  useEffect(() => {
    if (!runWhenVisible) {
      setStarted(true);
      return;
    }
    const el = rootRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setStarted(true);
          obs.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [runWhenVisible]);

  useEffect(() => {
    if (!started) return;
    const target = Math.max(0, Math.round(value));
    const duration = 1000;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setN(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, started]);

  const shell = (
    <div
      className={`relative overflow-hidden rounded-3xl border ${
        isDark
          ? 'border-rose-900/50 bg-gradient-to-r from-rose-950 via-slate-950 to-slate-900'
          : 'border-rose-200 bg-gradient-to-r from-rose-50 via-white to-slate-50'
      }`}
    >
      <div
        className="absolute inset-0 opacity-[0.14] bg-[radial-gradient(ellipse_at_left,_var(--tw-gradient-stops))] from-rose-600 via-transparent to-transparent"
        aria-hidden
      />
      <div
        className={`relative flex flex-col gap-4 px-5 py-5 sm:px-7 sm:py-6 ${
          withMissionPhrases ? 'sm:flex-row sm:items-center sm:justify-between' : 'sm:flex-row sm:items-center'
        }`}
      >
        {withMissionPhrases && (
          <div className="min-w-0 sm:max-w-[42%]">
            <p
              className="text-2xl sm:text-3xl font-black tracking-tight leading-tight"
              style={{ color: frase1Color }}
            >
              {frase1}
            </p>
            <p
              className="mt-1 text-xl sm:text-2xl font-black tracking-tight leading-tight"
              style={{ color: frase2Color }}
            >
              {frase2}
            </p>
          </div>
        )}
        <div
          className={`flex items-start sm:items-center gap-4 min-w-0 ${
            withMissionPhrases ? 'sm:justify-end sm:text-right' : ''
          }`}
        >
          {!withMissionPhrases && (
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                isDark
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                  : 'bg-rose-100 border-rose-200 text-rose-700'
              }`}
            >
              <Users className="w-6 h-6" />
            </div>
          )}
          <div className="min-w-0">
            <div
              className={`text-4xl sm:text-5xl font-black tracking-tight tabular-nums ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              {n.toLocaleString('es-EC')}
              <span className="text-rose-400">+</span>
            </div>
            <div
              className={`mt-1 text-xs sm:text-sm leading-snug max-w-xl space-y-0.5 ${
                isDark ? 'text-rose-100/80' : 'text-slate-600'
              } ${withMissionPhrases ? 'sm:ml-auto' : ''}`}
            >
              {lineas.map((linea, i) => (
                <p key={i}>{linea}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div ref={rootRef} className="w-full">
      {shell}
    </div>
  );
};
