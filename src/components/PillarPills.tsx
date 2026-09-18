import React, { useEffect, useState } from 'react';
import { Activity, Dumbbell, Salad, TrendingUp } from 'lucide-react';

const PILARES = [
  { key: 'medir', label: 'Medir', Icon: Activity, color: 'text-cyan-300 border-cyan-500/30 bg-cyan-500/10' },
  { key: 'entrenar', label: 'Entrenar', Icon: Dumbbell, color: 'text-orange-300 border-orange-500/30 bg-orange-500/10' },
  { key: 'nutrir', label: 'Nutrir', Icon: Salad, color: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10' },
  { key: 'progresar', label: 'Progresar', Icon: TrendingUp, color: 'text-violet-300 border-violet-500/30 bg-violet-500/10' },
] as const;

interface PillarPillsProps {
  isDark?: boolean;
  /** Centrar el grupo de pills. */
  centered?: boolean;
}

export const PillarPills: React.FC<PillarPillsProps> = ({ isDark = true, centered = false }) => {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    setVisibleCount(0);
    const timers: number[] = [];
    PILARES.forEach((_, i) => {
      timers.push(window.setTimeout(() => setVisibleCount(i + 1), 180 + i * 220));
    });
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);

  return (
    <div className={`flex flex-wrap gap-2 pt-2 ${centered ? 'justify-center' : ''}`}>
      {PILARES.map((p, i) => {
        const show = i < visibleCount;
        return (
          <span
            key={p.key}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-black uppercase tracking-wider transition-all duration-500 ${
              p.color
            } ${show ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95'} ${
              isDark ? '' : 'brightness-95'
            }`}
          >
            <p.Icon className="w-3.5 h-3.5" />
            {p.label}
          </span>
        );
      })}
    </div>
  );
};
