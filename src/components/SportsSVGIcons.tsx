import React from 'react';

interface SVGProps {
  className?: string;
  color?: string;
}

// 1. FUERZA TÁCTICA & LEVANTAMIENTO DE POTENCIA (Halterofilia militar, barra, discos olímpicos)
export const TacticalStrengthSVG: React.FC<SVGProps> = ({ className = "w-12 h-12" }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="strGrad" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3B82F6" />
        <stop offset="1" stopColor="#1D4ED8" />
      </linearGradient>
      <linearGradient id="plateGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
        <stop stopColor="#60A5FA" />
        <stop offset="1" stopColor="#2563EB" />
      </linearGradient>
    </defs>
    {/* Fondo halo suave */}
    <circle cx="50" cy="50" r="46" fill="url(#strGrad)" fillOpacity="0.12" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="3 3" />
    
    {/* Barra Olímpica */}
    <rect x="8" y="28" width="84" height="4" rx="2" fill="#93C5FD" stroke="#1E40AF" strokeWidth="1" />
    
    {/* Discos externos e internos */}
    <rect x="14" y="16" width="6" height="28" rx="2" fill="url(#plateGrad)" />
    <rect x="22" y="20" width="5" height="20" rx="1.5" fill="#3B82F6" />
    <rect x="80" y="16" width="6" height="28" rx="2" fill="url(#plateGrad)" />
    <rect x="73" y="20" width="5" height="20" rx="1.5" fill="#3B82F6" />
    
    {/* Cabeza del Atleta */}
    <circle cx="50" cy="24" r="6" fill="#60A5FA" stroke="#1E3A8A" strokeWidth="1" />
    
    {/* Torso atlético en tracción / arranque */}
    <path d="M42 34 L58 34 L55 52 L45 52 Z" fill="#3B82F6" stroke="#1E40AF" strokeWidth="1.5" />
    
    {/* Brazos sujetando la barra sobre hombros */}
    <path d="M42 34 L32 29 L28 29" stroke="#93C5FD" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M58 34 L68 29 L72 29" stroke="#93C5FD" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    
    {/* Cinturón de Fuerza Táctico */}
    <rect x="44" y="50" width="12" height="4" rx="1" fill="#F59E0B" />
    
    {/* Piernas en posición de sentadilla profunda / potencia */}
    <path d="M46 54 L36 66 L30 82" stroke="#60A5FA" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M54 54 L64 66 L70 82" stroke="#60A5FA" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    
    {/* Zapatos de halterofilia */}
    <path d="M26 82 L34 82" stroke="#1D4ED8" strokeWidth="3" strokeLinecap="round" />
    <path d="M66 82 L74 82" stroke="#1D4ED8" strokeWidth="3" strokeLinecap="round" />
    
    {/* Destello de energía */}
    <polygon points="50,10 52,15 57,15 53,18 55,23 50,20 45,23 47,18 43,15 48,15" fill="#FBBF24" />
  </svg>
);

// 2. RESISTENCIA CARDIOVASCULAR & CARRERA TÁCTICA (Velocidad, zancada, fondo militar)
export const TacticalRunningSVG: React.FC<SVGProps> = ({ className = "w-12 h-12" }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="runGrad" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
        <stop stopColor="#10B981" />
        <stop offset="1" stopColor="#047857" />
      </linearGradient>
    </defs>
    {/* Halo y líneas cinéticas */}
    <circle cx="50" cy="50" r="46" fill="url(#runGrad)" fillOpacity="0.12" stroke="#10B981" strokeWidth="1.5" strokeDasharray="3 3" />
    
    {/* Líneas de velocidad */}
    <line x1="14" y1="36" x2="30" y2="36" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.7" />
    <line x1="8" y1="46" x2="26" y2="46" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.5" />
    <line x1="16" y1="56" x2="34" y2="56" stroke="#34D399" strokeWidth="1.8" strokeLinecap="round" strokeOpacity="0.8" />
    
    {/* Cabeza del Corredor */}
    <circle cx="62" cy="22" r="6" fill="#34D399" stroke="#065F46" strokeWidth="1" />
    
    {/* Torso inclinado hacia adelante */}
    <path d="M60 28 L48 46 L42 43 L54 26 Z" fill="#10B981" stroke="#047857" strokeWidth="1" />
    
    {/* Brazos en carrera */}
    <path d="M56 31 L44 33 L40 43" stroke="#6EE7B7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M58 31 L70 38 L80 34" stroke="#6EE7B7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    
    {/* Pierna delantera en avance zancada */}
    <path d="M46 45 L62 55 L74 52 L80 66" stroke="#34D399" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    
    {/* Pierna trasera en despegue */}
    <path d="M46 45 L32 54 L20 62 L18 70" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    
    {/* Suelo / sombra de velocidad */}
    <ellipse cx="56" cy="80" rx="24" ry="3" fill="#10B981" fillOpacity="0.3" />
  </svg>
);

// 3. COMBATE CUERPO A CUERPO & AGILIDAD TÁCTICA (Defensa personal militar, artes marciales)
export const TacticalCombatSVG: React.FC<SVGProps> = ({ className = "w-12 h-12" }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="comGrad" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F59E0B" />
        <stop offset="1" stopColor="#B45309" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="46" fill="url(#comGrad)" fillOpacity="0.12" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="3 3" />
    
    {/* Cabeza en guardia */}
    <circle cx="48" cy="24" r="6" fill="#FBBF24" stroke="#78350F" strokeWidth="1" />
    
    {/* Torso compacto */}
    <path d="M44 32 L56 30 L52 50 L42 50 Z" fill="#D97706" stroke="#78350F" strokeWidth="1.5" />
    
    {/* Brazo adelantado (guardia de bloqueo) */}
    <path d="M44 33 L34 32 L36 22" stroke="#FCD34D" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    
    {/* Brazo atrasado (puño cargado) */}
    <path d="M54 32 L64 36 L68 28" stroke="#FCD34D" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    
    {/* Pierna base apoyada */}
    <path d="M44 50 L38 64 L34 82" stroke="#F59E0B" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    
    {/* Pierna en patada alta / impacto táctico */}
    <path d="M52 50 L66 50 L84 38" stroke="#FBBF24" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    
    {/* Impacto / destello de combate */}
    <path d="M84 34 L88 30 M88 38 L94 38 M86 42 L92 46" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// 4. NATACIÓN & CRUCE DE OBSTÁCULOS MILITARES (Anfibio, resistencia acuática)
export const TacticalSwimmingSVG: React.FC<SVGProps> = ({ className = "w-12 h-12" }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="swimGrad" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
        <stop stopColor="#06B6D4" />
        <stop offset="1" stopColor="#0E7490" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="46" fill="url(#swimGrad)" fillOpacity="0.12" stroke="#06B6D4" strokeWidth="1.5" strokeDasharray="3 3" />
    
    {/* Olas del agua dinámicas */}
    <path d="M12 56 Q24 50 36 56 T60 56 T84 56" stroke="#22D3EE" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    <path d="M18 68 Q30 62 42 68 T66 68 T90 68" stroke="#0891B2" strokeWidth="2" fill="none" strokeLinecap="round" />
    <path d="M10 80 Q22 74 34 80 T58 80 T82 80" stroke="#0E7490" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    
    {/* Cabeza en respiración lateral */}
    <circle cx="64" cy="38" r="5.5" fill="#67E8F9" stroke="#164E63" strokeWidth="1" />
    
    {/* Cuerpo en posición horizontal hidrodinámica */}
    <path d="M60 41 L34 46 L36 52 L62 46 Z" fill="#0891B2" stroke="#155E75" strokeWidth="1.5" />
    
    {/* Brazo en brazada de crol sobre el agua */}
    <path d="M58 42 L66 26 L76 30" stroke="#A5F3FC" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    
    {/* Brazo bajo agua de propulsión */}
    <path d="M50 44 L40 50 L34 60" stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    
    {/* Piernas con batido de aletas */}
    <path d="M34 47 L20 44 L14 40" stroke="#22D3EE" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M34 50 L18 54 L12 59" stroke="#0891B2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// 5. CALISTENIA & DOMINADAS EN BARRA (Tracción táctica, dorsal, core)
export const TacticalCalisthenicsSVG: React.FC<SVGProps> = ({ className = "w-12 h-12" }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="calGrad" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
        <stop stopColor="#8B5CF6" />
        <stop offset="1" stopColor="#6D28D9" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="46" fill="url(#calGrad)" fillOpacity="0.12" stroke="#8B5CF6" strokeWidth="1.5" strokeDasharray="3 3" />
    
    {/* Barra fija de dominadas */}
    <rect x="12" y="18" width="76" height="4" rx="2" fill="#C4B5FD" stroke="#5B21B6" strokeWidth="1" />
    <line x1="20" y1="18" x2="20" y2="8" stroke="#7C3AED" strokeWidth="3" />
    <line x1="80" y1="18" x2="80" y2="8" stroke="#7C3AED" strokeWidth="3" />
    
    {/* Manos sujetando la barra */}
    <circle cx="38" cy="19" r="2.5" fill="#DDD6FE" />
    <circle cx="62" cy="19" r="2.5" fill="#DDD6FE" />
    
    {/* Brazos en flexión de dominada (pecho a la barra) */}
    <path d="M38 20 L40 28 L45 32" stroke="#C4B5FD" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M62 20 L60 28 L55 32" stroke="#C4B5FD" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    
    {/* Cabeza sobrepasando la barra */}
    <circle cx="50" cy="17" r="5" fill="#A78BFA" stroke="#4C1D95" strokeWidth="1" />
    
    {/* Espalda en "V" hipertrófica */}
    <path d="M44 32 L56 32 L53 50 L47 50 Z" fill="#7C3AED" stroke="#4C1D95" strokeWidth="1.5" />
    
    {/* Piernas suspendidas y cruzadas con tensión abdominal */}
    <path d="M48 50 L46 66 L50 82" stroke="#8B5CF6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M52 50 L54 66 L52 82" stroke="#6D28D9" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
