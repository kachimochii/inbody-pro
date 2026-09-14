import React from 'react';
import { InBodyRecord } from '../types/inbody';
import { useTheme } from '../context/ThemeContext';
import {
  Zap,
  HeartPulse,
  Sparkles,
  Activity,
  TrendingDown,
  TrendingUp,
  Award,
  Flame,
  Dumbbell,
  ShieldCheck,
  Timer,
} from 'lucide-react';

interface EdadCorporalCardProps {
  medicion: InBodyRecord;
  edadCronologica: number;
}

export const EdadCorporalCard: React.FC<EdadCorporalCardProps> = ({
  medicion,
  edadCronologica,
}) => {
  const { isDark } = useTheme();

  const edadCorp =
    medicion.edadCorporal && medicion.edadCorporal > 0
      ? medicion.edadCorporal
      : Math.max(18, Math.round(edadCronologica - (medicion.inbodyScore - 74) / 2.5));

  const diferencia = edadCorp - edadCronologica;
  const esMasJoven = diferencia < 0;
  const esIgual = diferencia === 0;

  // Semáforo: más joven = verde; hasta +5 = amarillo; más de +5 = rojo
  let estadoColor: 'emerald' | 'amber' | 'rose' = 'emerald';
  let estadoTitulo = 'Excelente — cuerpo más joven';
  let estadoMensaje = `Tu masa muscular y metabolismo hacen que tu cuerpo rinda como el de alguien ${Math.abs(diferencia)} años más joven.`;
  let badgeClass = isDark
    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-emerald-500/20'
    : 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-emerald-200/50';

  if (diferencia > 5) {
    estadoColor = 'rose';
    estadoTitulo = 'Peligro — desgaste físico';
    estadoMensaje = `Tu edad corporal supera por ${diferencia} años a tu edad real. El exceso de grasa y bajo tono muscular aceleran el envejecimiento metabólico.`;
    badgeClass = isDark
      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-rose-500/20'
      : 'bg-rose-50 text-rose-700 border-rose-200 shadow-rose-200/50';
  } else if (diferencia >= 0) {
    estadoColor = 'amber';
    estadoTitulo = esIgual ? 'Moderado — edades alineadas' : 'Moderado — ligera sobrecarga';
    estadoMensaje = esIgual
      ? 'Tu edad biológica coincide con tu edad real. Con más estímulo de fuerza podrás rejuvenecer tu metabolismo.'
      : `Tu edad corporal está +${diferencia} años por encima. Ajustes en nutrición y entrenamiento devolverán tu juventud biológica.`;
    badgeClass = isDark
      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-amber-500/20'
      : 'bg-amber-50 text-amber-700 border-amber-200 shadow-amber-200/50';
  }

  const corpBorder =
    estadoColor === 'rose'
      ? 'border-rose-500/60 shadow-rose-500/15'
      : estadoColor === 'amber'
        ? 'border-amber-500/60 shadow-amber-500/15'
        : 'border-emerald-500/60 shadow-emerald-500/15';
  const corpAccent =
    estadoColor === 'rose' ? 'text-rose-400' : estadoColor === 'amber' ? 'text-amber-400' : 'text-emerald-400';

  return (
    <div
      className={`rounded-3xl border p-6 sm:p-7 transition-all shadow-xl relative overflow-hidden ${
        isDark
          ? 'bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border-slate-800'
          : 'bg-gradient-to-br from-white via-slate-50 to-blue-50/40 border-slate-200 text-slate-800'
      }`}
    >
      <div
        className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
          estadoColor === 'emerald'
            ? 'bg-emerald-500/10'
            : estadoColor === 'rose'
              ? 'bg-rose-500/10'
              : 'bg-amber-500/10'
        }`}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-slate-800/80">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:scale-105 ${
              isDark
                ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-blue-500/20'
                : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-blue-300/40'
            }`}
          >
            <HeartPulse className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${badgeClass}`}>
                Parámetro Vital InBody
              </span>
              <span className="flex items-center gap-1 text-[11px] font-bold text-cyan-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Biomarcador de Juventud</span>
              </span>
            </div>
            <h3 className={`text-xl sm:text-2xl font-black mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Edad Corporal vs. Edad Cronológica
            </h3>
          </div>
        </div>

        <div className={`px-4 py-2 rounded-2xl border text-right font-black text-xs sm:text-sm self-start sm:self-center shadow-sm ${badgeClass}`}>
          {estadoTitulo}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pt-6">
        <div className="lg:col-span-7 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            {/* PRIMERO: Edad Corporal (según el cuerpo) */}
            <div
              className={`p-4 sm:p-5 rounded-2xl border-2 text-center relative overflow-hidden transition-all shadow-lg ${corpBorder} ${
                isDark
                  ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950'
                  : 'bg-gradient-to-b from-white via-slate-50 to-white'
              }`}
            >
              <div className="absolute top-1.5 right-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full inline-block ${
                    estadoColor === 'rose'
                      ? 'bg-rose-400 inbody-pulse-danger'
                      : estadoColor === 'amber'
                        ? 'bg-amber-400 inbody-pulse-warn'
                        : 'bg-emerald-400'
                  }`}
                />
              </div>

              <div className={`flex items-center justify-center gap-1.5 text-xs font-black mb-1 ${corpAccent}`}>
                <Zap className="w-4 h-4" />
                <span>Edad según tu cuerpo</span>
              </div>

              <div className={`text-4xl sm:text-5xl font-black font-mono tracking-tight ${corpAccent}`}>
                {edadCorp}
                <span className="text-sm font-normal opacity-80 ml-1">años</span>
              </div>

              <div className="mt-1 flex items-center justify-center gap-1 text-xs font-black">
                {esMasJoven ? (
                  <span className="text-emerald-400 flex items-center gap-0.5">
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>-{Math.abs(diferencia)} años (Más Joven)</span>
                  </span>
                ) : diferencia > 0 ? (
                  <span className={`${diferencia > 5 ? 'text-rose-400' : 'text-amber-400'} flex items-center gap-0.5`}>
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>+{diferencia} años (Sobrecarga)</span>
                  </span>
                ) : (
                  <span className="text-amber-400">Nivel Paritario (0 años)</span>
                )}
              </div>
            </div>

            {/* SEGUNDO: Edad Real */}
            <div
              className={`p-4 sm:p-5 rounded-2xl border text-center transition-all ${
                isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-white border-slate-200 shadow-md shadow-slate-100'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 font-bold mb-1">
                <Timer className="w-4 h-4 text-slate-400" />
                <span>Edad Real (C.I.)</span>
              </div>
              <div className={`text-4xl sm:text-5xl font-black font-mono tracking-tight ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                {edadCronologica}
                <span className="text-sm font-normal text-slate-400 ml-1">años</span>
              </div>
              <span className="text-[11px] text-slate-400 block mt-1">Fecha de nacimiento</span>
            </div>
          </div>

          <div className={`p-4 rounded-2xl border space-y-2 ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-blue-400" />
                <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Equilibrio Biológico InBody</span>
              </span>
              <span
                className={`font-black text-xs ${
                  estadoColor === 'emerald' ? 'text-emerald-400' : estadoColor === 'rose' ? 'text-rose-400' : 'text-amber-400'
                }`}
              >
                {esMasJoven
                  ? `${Math.abs(diferencia)} años de ventaja biológica`
                  : diferencia > 0
                    ? `${diferencia} años de desgaste metabólico`
                    : 'Estado balanceado'}
              </span>
            </div>

            <div className="w-full h-3.5 bg-slate-800/80 rounded-full overflow-hidden p-0.5 relative">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  estadoColor === 'emerald'
                    ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400'
                    : estadoColor === 'rose'
                      ? 'bg-gradient-to-r from-rose-600 via-rose-500 to-orange-500'
                      : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-400'
                }`}
                style={{ width: `${Math.min(100, Math.max(15, 100 - diferencia * 8))}%` }}
              />
            </div>

            <p className={`text-xs leading-relaxed italic pt-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              "{estadoMensaje}"
            </p>
          </div>
        </div>

        {/* Solo 3 factores */}
        <div className={`lg:col-span-5 p-5 rounded-2xl border space-y-3.5 ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-200 shadow-md'}`}>
          <div className="flex items-center justify-between border-b pb-2 border-slate-800/80">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-blue-400" />
              <span>Factores Determinantes</span>
            </span>
            <span className="text-[10px] font-bold text-cyan-400">Algoritmo InBody</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-1.5 text-blue-400 text-xs font-bold">
                <Dumbbell className="w-3.5 h-3.5" />
                <span>Músculo SMM</span>
              </div>
              <div className={`text-base font-black font-mono mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {medicion.musculoKg.toFixed(1)} <span className="text-[11px] font-normal text-slate-400">kg</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold block">
                {medicion.musculoKg >= medicion.rangoSmmMin ? 'Preserva juventud' : 'Aumentar fuerza'}
              </span>
            </div>

            <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-1.5 text-rose-400 text-xs font-bold">
                <Flame className="w-3.5 h-3.5" />
                <span>% Grasa</span>
              </div>
              <div className={`text-base font-black font-mono mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {medicion.pctGrasa.toFixed(1)} <span className="text-[11px] font-normal text-slate-400">%</span>
              </div>
              <span className="text-[10px] font-bold block">
                {medicion.pctGrasa < 18 ? 'Magro atlético' : medicion.pctGrasa <= 24 ? 'Controlado' : 'Envejece tejidos'}
              </span>
            </div>

            <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Grasa Visceral</span>
              </div>
              <div className={`text-base font-black font-mono mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Nivel {medicion.grasaVisceral}
              </div>
              <span className="text-[10px] font-bold block">
                {medicion.grasaVisceral <= 5 ? 'Óptimo' : medicion.grasaVisceral <= 9 ? 'Moderado' : 'Riesgo alto'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
