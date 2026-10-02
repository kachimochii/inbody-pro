import React, { useEffect, useMemo, useState } from 'react';

interface LevelUpConfettiProps {
  show: boolean;
  nivel?: number;
  /** Cumpleaños usa el mismo confeti, con otro mensaje. */
  variante?: 'nivel' | 'cumple';
  edad?: number;
  onDone?: () => void;
}

/** Confeti militar (verdes oscuros) + mensaje al subir de nivel InBody. */
export const LevelUpConfetti: React.FC<LevelUpConfettiProps> = ({
  show,
  nivel = 1,
  variante = 'nivel',
  edad,
  onDone,
}) => {
  const [visible, setVisible] = useState(false);
  const pieces = useMemo(
    () =>
      Array.from({ length: 42 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 1.8 + Math.random() * 1.4,
        size: 4 + Math.random() * 6,
        color: (variante === 'cumple'
          ? ['#14532d', '#166534', '#fbbf24', '#f59e0b', '#a3e635', '#fde68a']
          : ['#14532d', '#166534', '#3f6212', '#365314', '#052e16', '#a3e635'])[i % 6],
        rotate: Math.random() * 360,
      })),
    [show, variante]
  );

  useEffect(() => {
    if (!show) return;
    setVisible(true);
    const t = window.setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, 4200);
    return () => window.clearTimeout(t);
  }, [show, onDone]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[90] overflow-hidden" aria-live="polite">
      <style>{`
        @keyframes militaryConfettiFall {
          0% { transform: translate3d(0,-20px,0) rotate(0deg); opacity: 0; }
          12% { opacity: 1; }
          100% { transform: translate3d(var(--dx), 110vh, 0) rotate(720deg); opacity: 0; }
        }
        @keyframes levelUpPop {
          0% { transform: scale(0.7); opacity: 0; }
          20% { transform: scale(1.05); opacity: 1; }
          80% { transform: scale(1); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0; }
        }
      `}</style>
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 rounded-sm"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 1.6,
            background: p.color,
            ['--dx' as string]: `${(Math.random() - 0.5) * 120}px`,
            animation: `militaryConfettiFall ${p.duration}s linear ${p.delay}s forwards`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <div
          className={`rounded-3xl border px-6 py-5 text-center shadow-2xl ${
            variante === 'cumple'
              ? 'border-amber-400/50 bg-slate-950/95 shadow-amber-950/40'
              : 'border-emerald-700/50 bg-emerald-950/95 shadow-emerald-950/50'
          }`}
          style={{ animation: 'levelUpPop 3.8s ease-out forwards' }}
        >
          <p className={`text-[10px] font-black uppercase tracking-[0.25em] ${
            variante === 'cumple' ? 'text-amber-300/90' : 'text-lime-400/90'
          }`}>
            {variante === 'cumple' ? 'Día de aniversario' : 'Ascenso operativo'}
          </p>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-emerald-50 tracking-wide">
            {variante === 'cumple' ? `Hoy cumples ${edad ?? ''} años` : '¡Subiste de nivel!'}
          </p>
          <p className={`mt-1 text-sm font-bold ${variante === 'cumple' ? 'text-amber-200/90' : 'text-lime-300/90'}`}>
            {variante === 'cumple' ? 'Que el año sume fuerza.' : `Ahora estás en Nivel ${nivel}`}
          </p>
        </div>
      </div>
    </div>
  );
};
