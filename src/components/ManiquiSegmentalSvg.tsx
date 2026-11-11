import React from 'react';

export type SegmentoKey = 'BD' | 'BI' | 'TR' | 'PD' | 'PI';

interface SegmentoMetric {
  musculoKg: number;
  musculoPct: number;
  grasaKg: number;
}

interface ManiquiSegmentalSvgProps {
  selected: SegmentoKey;
  onSelect: (seg: SegmentoKey) => void;
  sexo?: 'M' | 'F';
  isDark?: boolean;
  metrics: Record<SegmentoKey, SegmentoMetric>;
}

export const ManiquiSegmentalSvg: React.FC<ManiquiSegmentalSvgProps> = ({
  selected,
  onSelect,
  sexo = 'M',
  isDark = true,
  metrics,
}) => {
  const isF = sexo === 'F';

  const getStatusColor = (seg: SegmentoKey) => {
    const pct = metrics[seg]?.musculoPct ?? 100;
    const isSel = selected === seg;
    if (isSel) {
      return {
        fill: 'url(#segSelectedGrad)',
        stroke: '#38bdf8',
        glow: 'drop-shadow(0 0 12px rgba(56, 189, 248, 0.75))',
      };
    }
    if (pct >= 100) {
      return {
        fill: isDark ? 'rgba(16, 185, 129, 0.22)' : 'rgba(16, 185, 129, 0.28)',
        stroke: '#10b981',
        glow: 'none',
      };
    }
    if (pct >= 90) {
      return {
        fill: isDark ? 'rgba(59, 130, 246, 0.20)' : 'rgba(59, 130, 246, 0.25)',
        stroke: '#3b82f6',
        glow: 'none',
      };
    }
    return {
      fill: isDark ? 'rgba(244, 63, 94, 0.24)' : 'rgba(244, 63, 94, 0.30)',
      stroke: '#f43f5e',
      glow: 'none',
    };
  };

  // Trazos anatómicos (Vista frontal táctica: Izquierda visual = Brazo/Pierna Derecha del evaluado, o etiquetado directo)
  const paths = {
    // Tronco / Dorso / Core
    TR: isF
      ? 'M82,66 C92,63 108,63 118,66 L124,96 C121,112 116,122 118,136 L124,162 C112,170 88,170 76,162 L82,136 C84,122 79,112 76,96 Z'
      : 'M76,64 C90,60 110,60 124,64 L130,102 C127,122 124,142 122,164 C108,171 92,171 78,164 C76,142 73,122 70,102 Z',
    // Brazo Derecho (BD - lado izquierdo del visor)
    BD: isF
      ? 'M80,67 L66,74 C58,92 53,115 48,142 L44,166 C43,172 51,175 55,169 L65,144 C70,124 74,108 77,94 Z'
      : 'M74,65 L58,73 C49,92 44,116 39,145 L35,170 C34,177 44,180 48,173 L60,145 C66,125 69,108 72,96 Z',
    // Brazo Izquierdo (BI - lado derecho del visor)
    BI: isF
      ? 'M120,67 L134,74 C142,92 147,115 152,142 L156,166 C157,172 149,175 145,169 L135,144 C130,124 126,108 123,94 Z'
      : 'M126,65 L142,73 C151,92 156,116 161,145 L165,170 C166,177 156,180 152,173 L140,145 C134,125 131,108 128,96 Z',
    // Pierna Derecha (PD - lado izquierdo del visor)
    PD: isF
      ? 'M76,165 L98,168 L95,235 L92,298 C91,306 79,306 78,298 L74,238 C71,210 72,186 76,165 Z'
      : 'M78,166 L98,169 L96,238 L94,302 C93,310 79,310 78,302 L73,238 C70,212 73,188 78,166 Z',
    // Pierna Izquierda (PI - lado derecho del visor)
    PI: isF
      ? 'M124,165 L102,168 L105,235 L108,298 C109,306 121,306 122,298 L126,238 C129,210 128,186 124,165 Z'
      : 'M122,166 L102,169 L104,238 L106,302 C107,310 121,310 122,302 L127,238 C130,212 127,188 122,166 Z',
  };

  const labels: Array<{ key: SegmentoKey; tag: string; x: number; y: number }> = [
    { key: 'BD', tag: 'B. Der', x: 32, y: 122 },
    { key: 'BI', tag: 'B. Izq', x: 168, y: 122 },
    { key: 'TR', tag: 'Tronco', x: 100, y: 115 },
    { key: 'PD', tag: 'P. Der', x: 64, y: 245 },
    { key: 'PI', tag: 'P. Izq', x: 136, y: 245 },
  ];

  return (
    <div className="relative flex h-full w-full items-center justify-center select-none">
      <svg
        viewBox="0 0 200 330"
        className="h-auto w-full max-h-[210px] lg:h-full lg:w-auto lg:max-h-[340px] max-w-full overflow-visible"
        role="img"
        aria-label="Mapa anatómico segmental interactivo"
      >
        <defs>
          <linearGradient id="segSelectedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.85" />
          </linearGradient>
          <radialGradient id="hudGridGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Halo táctico de fondo */}
        <circle cx="100" cy="165" r="92" fill="url(#hudGridGlow)" />
        <ellipse
          cx="100"
          cy="314"
          rx="52"
          ry="7"
          fill={isDark ? 'rgba(56,189,248,0.15)' : 'rgba(37,99,235,0.12)'}
          stroke="#0284c7"
          strokeWidth="1"
          strokeDasharray="3 3"
        />

        {/* Cabeza y cuello (no seleccionable, decorativo) */}
        <circle
          cx="100"
          cy="34"
          r="16"
          fill={isDark ? '#1e293b' : '#cbd5e1'}
          stroke={isDark ? '#475569' : '#64748b'}
          strokeWidth="1.8"
        />
        <rect
          x="94"
          y="50"
          width="12"
          height="11"
          rx="3"
          fill={isDark ? '#1e293b' : '#cbd5e1'}
          stroke={isDark ? '#475569' : '#64748b'}
          strokeWidth="1.5"
        />

        {/* 5 Zonas Interactivas */}
        {(['TR', 'BD', 'BI', 'PD', 'PI'] as SegmentoKey[]).map((key) => {
          const st = getStatusColor(key);
          const isSel = selected === key;
          return (
            <path
              key={key}
              d={paths[key]}
              fill={st.fill}
              stroke={st.stroke}
              strokeWidth={isSel ? 2.6 : 1.6}
              style={{ filter: st.glow, transition: 'all 220ms ease' }}
              onClick={() => onSelect(key)}
              className="cursor-pointer hover:opacity-95"
            />
          );
        })}

        {/* Puntos y etiquetas flotantes de cada segmento */}
        {labels.map(({ key, tag, x, y }) => {
          const isSel = selected === key;
          const m = metrics[key];
          return (
            <g
              key={`lbl-${key}`}
              onClick={() => onSelect(key)}
              className="cursor-pointer"
            >
              <rect
                x={x - 24}
                y={y - 11}
                width="48"
                height="22"
                rx="6"
                fill={isSel ? '#0284c7' : isDark ? '#0f172a' : '#ffffff'}
                stroke={isSel ? '#7dd3fc' : isDark ? '#334155' : '#cbd5e1'}
                strokeWidth={isSel ? '1.5' : '1'}
                opacity="0.92"
              />
              <text
                x={x}
                y={y - 1}
                textAnchor="middle"
                fill={isSel ? '#ffffff' : isDark ? '#e2e8f0' : '#0f172a'}
                fontSize="7.5"
                fontWeight="800"
              >
                {tag}
              </text>
              <text
                x={x}
                y={y + 7.5}
                textAnchor="middle"
                fill={isSel ? '#bae6fd' : '#10b981'}
                fontSize="7"
                fontWeight="700"
              >
                {m ? `${m.musculoKg.toFixed(1)}kg` : ''}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
