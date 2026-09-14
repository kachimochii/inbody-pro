import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { 
  Award, 
  Sparkles, 
  ChevronRight, 
  X, 
  CheckCircle2, 
  TrendingUp, 
  Dumbbell, 
  HeartPulse, 
  ShieldCheck, 
  Zap,
  Target
} from 'lucide-react';
import {
  TacticalStrengthSVG,
  TacticalRunningSVG,
  TacticalCombatSVG,
  TacticalCalisthenicsSVG,
  TacticalSwimmingSVG
} from './SportsSVGIcons';

interface InsigniasDeportivasProps {
  inbodyScore: number;
  musculoKg: number;
  pctGrasa: number;
}

interface InsigniaItem {
  id: string;
  titulo: string;
  categoria: string;
  svg: React.ReactNode;
  estado: string;
  estadoTipo: 'elite' | 'avanzado' | 'desarrollo';
  colorGrad: string;
  borderGrad: string;
  tagColor: string;
  descripcion: string;
  metricasClave: string;
  requisitoMilitar: string;
  pruebaFisica: string;
  recomendacion: string;
}

export const InsigniasDeportivas: React.FC<InsigniasDeportivasProps> = ({
  inbodyScore,
  musculoKg,
  pctGrasa
}) => {
  const { isDark } = useTheme();
  const [insigniaModal, setInsigniaModal] = useState<InsigniaItem | null>(null);

  // Determinación de insignias según métricas reales
  const insignias: InsigniaItem[] = [
    {
      id: 'fuerza',
      titulo: 'Potencia Muscular & Levantamiento',
      categoria: 'Fuerza Táctica & Sobrecarga',
      svg: <TacticalStrengthSVG className="w-14 h-14" />,
      estado: musculoKg >= 32 ? 'Nivel Élite' : musculoKg >= 26 ? 'Avanzado' : 'En Desarrollo',
      estadoTipo: musculoKg >= 32 ? 'elite' : musculoKg >= 26 ? 'avanzado' : 'desarrollo',
      colorGrad: 'from-blue-600/20 via-indigo-600/20 to-blue-900/20',
      borderGrad: 'border-blue-500/30',
      tagColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      descripcion: 'Capacidad de tracción, arrancada y empuje para marcha táctica con equipo pesado.',
      metricasClave: `Masa Muscular: ${musculoKg.toFixed(1)} kg (Meta Élite: ≥ 32.0 kg)`,
      requisitoMilitar: 'Sentadilla 1.5x peso corporal, Peso Muerto 1.75x peso y Press de Banca 1x.',
      pruebaFisica: 'Test de Potencia Muscular Militar (Prueba de Transporte de Cargas y Levantamiento).',
      recomendacion: 'Entrenamiento de sobrecarga progresiva en rangos de 4 a 6 repeticiones pesadas 3 veces por semana.'
    },
    {
      id: 'resistencia',
      titulo: 'Resistencia Cardiovascular Táctica',
      categoria: 'Capacidad Aeróbica & Marcha',
      svg: <TacticalRunningSVG className="w-14 h-14" />,
      estado: inbodyScore >= 80 ? 'Nivel Élite' : inbodyScore >= 70 ? 'Avanzado' : 'En Desarrollo',
      estadoTipo: inbodyScore >= 80 ? 'elite' : inbodyScore >= 70 ? 'avanzado' : 'desarrollo',
      colorGrad: 'from-emerald-600/20 via-teal-600/20 to-emerald-900/20',
      borderGrad: 'border-emerald-500/30',
      tagColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      descripcion: 'Eficiencia cardiorrespiratoria en carrera continua, patrullaje prolongado e infiltración.',
      metricasClave: `InBody Score: ${inbodyScore} pts (Meta Élite: ≥ 80 pts)`,
      requisitoMilitar: 'Test de Cooper: 3,200 metros en menos de 13 minutos a nivel del mar / 15 min en altura.',
      pruebaFisica: 'Prueba de Trote Militar 3,200m y Marcha de Campaña de 15 km con mochila.',
      recomendacion: '2 sesiones semanales de Zona 2 (45 min continuos) y 1 sesión de intervalos HIIT de alta intensidad.'
    },
    {
      id: 'combate',
      titulo: 'Combate Cercano & Agilidad',
      categoria: 'Defensa Personal & Reacción',
      svg: <TacticalCombatSVG className="w-14 h-14" />,
      estado: pctGrasa <= 16 ? 'Nivel Élite' : pctGrasa <= 22 ? 'Avanzado' : 'En Reacondicionamiento',
      estadoTipo: pctGrasa <= 16 ? 'elite' : pctGrasa <= 22 ? 'avanzado' : 'desarrollo',
      colorGrad: 'from-amber-600/20 via-orange-600/20 to-amber-900/20',
      borderGrad: 'border-amber-500/30',
      tagColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      descripcion: 'Velocidad de reacción, balance neuromuscular y bajo porcentaje adiposo para combate.',
      metricasClave: `Grasa Corporal: ${pctGrasa.toFixed(1)}% (Meta Élite: ≤ 16.0%)`,
      requisitoMilitar: 'Flexibilidad funcional, equilibrio dinámico y pruebas de destreza táctica cuerpo a cuerpo.',
      pruebaFisica: 'Test de Agilidad en ' + 'Zig-Zag' + ' y Evaluación de Técnicas de Autodefensa Militar.',
      recomendacion: 'Circuitos pliométricos, sombras de combate con bandas de resistencia y control estricto de carbohidratos simples.'
    },
    {
      id: 'calistenia',
      titulo: 'Tracción Dorsal & Dominadas',
      categoria: 'Calistenia Militar en Barra',
      svg: <TacticalCalisthenicsSVG className="w-14 h-14" />,
      estado: musculoKg >= 29 && pctGrasa <= 20 ? 'Nivel Élite' : musculoKg >= 24 ? 'Avanzado' : 'En Desarrollo',
      estadoTipo: musculoKg >= 29 && pctGrasa <= 20 ? 'elite' : musculoKg >= 24 ? 'avanzado' : 'desarrollo',
      colorGrad: 'from-purple-600/20 via-pink-600/20 to-purple-900/20',
      borderGrad: 'border-purple-500/30',
      tagColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      descripcion: 'Fuerza relativa con peso corporal para superación de muros, cuerdas y obstáculos.',
      metricasClave: `Relación Músculo/Grasa: ${(musculoKg / (pctGrasa || 1)).toFixed(2)} índice`,
      requisitoMilitar: 'Mínimo 15 dominadas estrictas sin balanceo y 50 flexiones de pecho en 2 minutos.',
      pruebaFisica: 'Prueba Oficial de Barra Fija y Flexiones de Pecho de las Fuerzas Armadas.',
      recomendacion: 'Series piramidales en barra fija con lastre progresivo (chaleco táctico de 5 a 10 kg).'
    },
    {
      id: 'anfibio',
      titulo: 'Capacidad Anfibia & Natación',
      categoria: 'Medio Acuático & Flotabilidad',
      svg: <TacticalSwimmingSVG className="w-14 h-14" />,
      estado: inbodyScore >= 75 ? 'Aptitud Completa' : 'En Adiestramiento',
      estadoTipo: inbodyScore >= 75 ? 'elite' : 'desarrollo',
      colorGrad: 'from-cyan-600/20 via-blue-600/20 to-cyan-900/20',
      borderGrad: 'border-cyan-500/30',
      tagColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      descripcion: 'Desplazamiento eficiente en agua, resistencia respiratoria y nado táctico de combate.',
      metricasClave: `Densidad Hidrostática / Score: ${inbodyScore} pts`,
      requisitoMilitar: '50 metros estilo crol táctico en menos de 45 segundos y 15 minutos de flotación continua.',
      pruebaFisica: 'Prueba de Salvamento y Cruce de Río con uniforme militar.',
      recomendacion: 'Sesiones de 1,000m continuos con aletas y técnicas de control respiratorio hipóxico.'
    }
  ];

  return (
    <div className={`rounded-3xl border p-6 sm:p-7 transition-all shadow-xl space-y-5 ${
      isDark 
        ? 'bg-slate-900 border-slate-800' 
        : 'bg-white border-slate-200 text-slate-800'
    }`}>
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-black uppercase tracking-wider text-amber-500 dark:text-amber-400">
              Aptitud & Rendimiento Táctico
            </span>
          </div>
          <h3 className={`text-xl sm:text-2xl font-black mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Insignias y Disciplinas Deportivas • SVG Vectorial
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Haz clic en cualquier disciplina deportiva para consultar los requisitos militares y su protocolo de entrenamiento.
          </p>
        </div>

        <div className={`px-3 py-1.5 rounded-2xl border text-xs font-black flex items-center gap-1.5 self-start sm:self-center ${
          isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
        }`}>
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>5 Disciplinas • Clic para Información</span>
        </div>
      </div>

      {/* Grid de Insignias Deportivas con Ilustraciones Vectoriales SVG */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 pt-1">
        {insignias.map((ins) => (
          <div
            key={ins.id}
            onClick={() => setInsigniaModal(ins)}
            className={`p-4 rounded-2xl border transition-all hover:scale-[1.03] cursor-pointer flex flex-col justify-between space-y-3 shadow-lg group relative overflow-hidden ${
              isDark 
                ? `bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 ${ins.borderGrad} hover:border-cyan-500/50` 
                : 'bg-gradient-to-b from-white to-slate-50 border-slate-200 hover:border-blue-400 hover:shadow-md'
            }`}
          >
            {/* Resplandor superior */}
            <div className={`absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br ${ins.colorGrad} rounded-full blur-xl group-hover:scale-150 transition-all`} />

            <div>
              {/* Header de la insignia: Ilustración SVG real + Estado */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="p-1.5 rounded-xl bg-slate-950/60 border border-slate-800/80 shadow-inner group-hover:scale-110 transition-transform">
                  {ins.svg}
                </div>
                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${ins.tagColor}`}>
                  {ins.estado}
                </span>
              </div>

              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {ins.categoria}
              </span>
              <h4 className={`text-xs sm:text-sm font-black mt-0.5 leading-snug group-hover:text-cyan-400 transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {ins.titulo}
              </h4>
              <p className={`text-[11px] mt-1.5 leading-relaxed line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {ins.descripcion}
              </p>
            </div>

            <div className={`pt-2.5 border-t flex items-center justify-between text-[10px] font-bold ${
              isDark ? 'border-slate-800/80 text-slate-400' : 'border-slate-200 text-slate-500'
            }`}>
              <span className="text-cyan-400">Ver Ficha y Test</span>
              <span className="text-cyan-400 flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL DETALLADO DE DISCIPLINA DEPORTIVA */}
      {insigniaModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setInsigniaModal(null)}
        >
          <div 
            className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden text-white space-y-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-2xl bg-slate-950 border border-slate-800 shadow-lg shrink-0">
                  {insigniaModal.svg}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-300 border border-blue-500/30">
                      {insigniaModal.categoria}
                    </span>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${insigniaModal.tagColor}`}>
                      {insigniaModal.estado}
                    </span>
                  </div>
                  <h3 className="text-xl font-black mt-1 text-white">
                    {insigniaModal.titulo}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setInsigniaModal(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Métrica Actual del Evaluado */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Tu Medición InBody para esta Disciplina:
              </span>
              <div className="text-base font-black text-cyan-400 font-mono">
                {insigniaModal.metricasClave}
              </div>
            </div>

            {/* Pruebas Militares y Requisitos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Estándar Operativo Militar</span>
                </span>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {insigniaModal.requisitoMilitar}
                </p>
              </div>

              <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                  <Target className="w-3.5 h-3.5" />
                  <span>Prueba Física Asociada</span>
                </span>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {insigniaModal.pruebaFisica}
                </p>
              </div>
            </div>

            {/* Recomendación del Entrenador */}
            <div className="bg-gradient-to-r from-blue-950/40 via-indigo-950/40 to-slate-950 p-4 rounded-2xl border border-blue-500/20 space-y-1.5">
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider flex items-center gap-1">
                <Dumbbell className="w-3.5 h-3.5" />
                <span>Protocolo de Entrenamiento Recomendado:</span>
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {insigniaModal.recomendacion}
              </p>
            </div>

            {/* Botón Cerrar */}
            <button
              onClick={() => setInsigniaModal(null)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer text-center"
            >
              Entendido • Cerrar Ficha de Disciplina
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
