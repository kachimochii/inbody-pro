import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, TrendingDown, TrendingUp, Zap, Timer, RotateCcw } from 'lucide-react';
import { InBodyRecord, Sexo } from '../types/inbody';
import { resolveAnalisisCorporal } from '../utils/inbodyCalculations';
import {
  calcularAnalisisCorporal,
  pctMusculoBrazosFromSegmental,
  pctMusculoPiernasFromSegmental,
  pctMusculoTroncoFromSegmental,
  pctSmmFromKg,
} from '../utils/composicionCorporal';
import { useTheme } from '../context/ThemeContext';

interface EdadCorporalCardProps {
  medicion: InBodyRecord;
  edadCronologica: number;
  sexo?: Sexo;
}

function nivelMedallaLabel(n: 1 | 2 | 3): string {
  return n === 3 ? 'Nivel 3 · Excelente' : n === 2 ? 'Nivel 2 · Bueno' : 'Nivel 1 · A mejorar';
}

export const EdadCorporalCard: React.FC<EdadCorporalCardProps> = ({
  medicion,
  edadCronologica,
  sexo = 'M' as Sexo,
}) => {
  const { isDark } = useTheme();
  const [simOpen, setSimOpen] = useState(false);
  const simRef = useRef<HTMLDivElement>(null);
  const [bajarGrasa, setBajarGrasa] = useState(0);
  const [subirMusculo, setSubirMusculo] = useState(0);

  const analisis = useMemo(
    () => resolveAnalisisCorporal(medicion, edadCronologica, sexo),
    [medicion, edadCronologica, sexo]
  );

  const scoreSimulado = Math.min(
    100,
    Math.max(0, Math.round(medicion.inbodyScore + bajarGrasa * 2.2 + subirMusculo * 3.5))
  );

  const analisisSim = useMemo(() => {
    if (bajarGrasa <= 0 && subirMusculo <= 0) return analisis;
    const pesoSim = Math.max(40, medicion.peso - bajarGrasa + subirMusculo);
    const grasaKg = Math.max(1.5, (medicion.pctGrasa / 100) * medicion.peso - bajarGrasa);
    const pctGrasaSim = (grasaKg / pesoSim) * 100;
    const musculoSim = medicion.musculoKg + subirMusculo;
    return calcularAnalisisCorporal({
      edad: edadCronologica,
      sexo,
      pctGrasa: pctGrasaSim,
      pctSMM: pctSmmFromKg(musculoSim, pesoSim),
      grasaVisceral: Math.max(1, Math.round(medicion.grasaVisceral - bajarGrasa * 0.35)),
      pctMusculoPiernas: pctMusculoPiernasFromSegmental(
        medicion.segmental?.musculoPDPct,
        medicion.segmental?.musculoPIPct
      ),
      pctMusculoBrazos: pctMusculoBrazosFromSegmental(
        medicion.segmental?.musculoBDPct,
        medicion.segmental?.musculoBIPct
      ),
      pctMusculoTronco: pctMusculoTroncoFromSegmental(medicion.segmental?.musculoTRPct),
      puntajeSalud: scoreSimulado,
    });
  }, [analisis, bajarGrasa, subirMusculo, medicion, edadCronologica, sexo, scoreSimulado]);

  const edadCorp = analisis.edadCorporal;
  const edadReal = edadCronologica;
  const diferencia = edadCorp - edadReal;
  const { deltas } = analisis;
  const pctSmm = pctSmmFromKg(medicion.musculoKg, medicion.peso);

  const estadoColor =
    diferencia > 2 ? 'text-red-500' : diferencia < -1 ? 'text-emerald-500' : 'text-amber-500';
  const badgeClass =
    diferencia > 2
      ? 'bg-red-500/10 border-red-500/20'
      : diferencia < -1
        ? 'bg-emerald-500/10 border-emerald-500/20'
        : 'bg-amber-500/10 border-amber-500/20';
  const corpBorder =
    diferencia > 2
      ? 'border-red-500/70 shadow-[0_0_24px_rgba(239,68,68,0.28)]'
      : diferencia < -1
        ? 'border-emerald-500/70 shadow-[0_0_24px_rgba(16,185,129,0.28)]'
        : 'border-amber-500/70 shadow-[0_0_24px_rgba(245,158,11,0.28)]';
  const corpAccent =
    diferencia > 2 ? 'text-red-400' : diferencia < -1 ? 'text-emerald-400' : 'text-amber-400';

  const nivelNum = analisis.nivelSalud;
  const nivelTexto = nivelNum === 3 ? 'Excelente' : nivelNum === 2 ? 'Bueno' : 'A mejorar';
  const nivelColor =
    nivelNum === 3 ? 'text-emerald-400' : nivelNum === 2 ? 'text-amber-400' : 'text-red-400';

  const estadoMensaje =
    diferencia > 2
      ? 'Tu cuerpo opera con sobrecarga metabólica. Reduce grasa y viscerales para alinear la edad corporal con la cronológica.'
      : diferencia < -1
        ? 'Tu composición corporal te mantiene más joven que tu edad cronológica. Mantén músculo y control de grasa.'
        : 'Edad corporal y edad real están alineadas. Conserva el equilibrio de músculo y grasa.';

  const deltaSim = analisisSim.edadCorporal - edadCorp;
  const simActiva = bajarGrasa > 0 || subirMusculo > 0;
  const nivelSim = analisisSim.nivelSalud;

  const badgeMusculo =
    deltas.musculo < 0
      ? '🟢 ' + deltas.musculo + ' años'
      : deltas.musculo > 0
        ? '🔴 +' + deltas.musculo + ' años'
        : '🟢 0 años (Protege)';
  const badgeGrasa =
    deltas.grasa > 0 ? '🔴 +' + Math.round(deltas.grasa) + ' años' : '🟢 0 años (Óptimo)';
  const badgeVisceral =
    deltas.visceral > 0 ? '🔴 +' + deltas.visceral + ' años' : '🟢 0 años (Sano)';

  const shellCls = isDark
    ? 'bg-slate-900 border-slate-800 text-white'
    : 'bg-white border-slate-200 text-slate-900 shadow-xl shadow-slate-200/50';
  const innerCls = isDark
    ? 'bg-slate-950/50 border-slate-800'
    : 'bg-slate-50 border-slate-200';
  const factorCls = isDark
    ? 'bg-slate-950 border-slate-800'
    : 'bg-slate-50 border-slate-200';
  const titleCls = isDark ? 'text-white' : 'text-slate-900';
  const valueCls = isDark ? 'text-white' : 'text-slate-900';
  const mutedCls = isDark ? 'text-slate-400' : 'text-slate-500';
  const simCls = isDark
    ? 'bg-slate-950/80 border-slate-800'
    : 'bg-slate-50 border-slate-200';

  return (
    <div className={`${shellCls} border rounded-3xl p-6 shadow-xl`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`text-lg font-black uppercase tracking-tight ${titleCls}`}>
              Edad Corporal InBody 270S
            </h3>
          </div>
        </div>
        <div
          className={`px-3 py-1 rounded-lg border ${badgeClass} ${estadoColor} text-[10px] font-black uppercase tracking-widest`}
        >
          {diferencia > 0
            ? `+${diferencia} Años vs Edad Real`
            : diferencia < 0
              ? `${diferencia} Años vs Edad Real`
              : 'Edad Equilibrada'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* LADO IZQUIERDO: LAS DOS TARJETAS + EQUILIBRIO (REGLA DE ORO) */}
        <div className="flex flex-col justify-center space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className={`${innerCls} p-4 rounded-2xl border-2 ${corpBorder} text-center`}>
              <span
                className={`text-[10px] font-black uppercase tracking-widest ${corpAccent} block mb-1`}
              >
                Edad según tu cuerpo
              </span>
              <div className={`text-4xl font-black ${estadoColor} flex items-center justify-center gap-1`}>
                {edadCorp} <span className={`text-sm font-medium ${mutedCls}`}>años</span>
              </div>
              <div className="flex items-center justify-center mt-2">
                {diferencia > 0 ? (
                  <TrendingDown className="w-4 h-4 text-red-500 rotate-180" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                )}
                <span className={`text-[10px] font-bold ml-1 ${estadoColor}`}>
                  {diferencia > 0
                    ? `+${diferencia} años (Sobrecarga)`
                    : diferencia < 0
                      ? `${Math.abs(diferencia)} años más joven`
                      : 'En rango'}
                </span>
              </div>
            </div>
            <div className={`${innerCls} p-4 rounded-2xl border text-center`}>
              <span className={`text-[10px] font-black uppercase tracking-widest ${mutedCls} block mb-1`}>
                Edad Real (C.I.)
              </span>
              <div className={`text-4xl font-black ${valueCls} flex items-center justify-center gap-1`}>
                {edadReal} <span className={`text-sm font-medium ${mutedCls}`}>años</span>
              </div>
              <div className="flex items-center justify-center mt-2">
                <Timer className={`w-4 h-4 ${mutedCls}`} />
                <span className={`text-[10px] font-bold ml-1 ${mutedCls}`}>Cronológica InBody</span>
              </div>
            </div>
          </div>

          <div className="bg-indigo-500/5 border border-indigo-500/20 p-4 rounded-2xl">
            <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-2">
              Equilibrio Biológico InBody
            </h4>
            <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
              <div
                className={`h-full rounded-full ${
                  diferencia > 2 ? 'bg-red-500' : diferencia < -1 ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(15, 100 - diferencia * 8))}%` }}
              />
            </div>
            <p className={`text-[11px] mt-2 italic ${mutedCls}`}>{estadoMensaje}</p>
          </div>

          <button
            type="button"
            onClick={() => {
              setSimOpen((v) => {
                const next = !v;
                if (next) {
                  window.setTimeout(() => {
                    simRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                  }, 60);
                }
                return next;
              });
            }}
            className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider cursor-pointer border ${
              simOpen
                ? 'bg-slate-800 border-cyan-500/40 text-cyan-300'
                : 'bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-md shadow-cyan-500/20 border-cyan-400/30'
            }`}
          >
            🎛️ Simular cómo bajar mi Edad Corporal
          </button>

          {simOpen && (
            <p className="md:hidden text-[10px] font-black text-center text-cyan-300">
              El simulador está aquí abajo. Mueve las barras.
            </p>
          )}
        </div>

        {/* LADO DERECHO: FACTORES + SIMULADOR APARTE.
            En celular el simulador sube justo debajo del botón (order). */}
        <div className="contents md:flex md:flex-col md:gap-4">
          <div className="order-2 md:order-none space-y-2">
          <h4 className={`text-[10px] font-black uppercase tracking-widest mb-2 border-b pb-1.5 ${mutedCls} ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            Factores Determinantes (InBody 270S)
          </h4>

          <div className={`${factorCls} p-2.5 rounded-xl border flex items-center justify-between gap-3`}>
            <div className="min-w-0">
              <span className={`text-[10px] font-bold uppercase ${mutedCls}`}>Músculo SMM</span>
              <div className={`text-sm font-black ${valueCls}`}>
                {medicion.musculoKg.toFixed(1)} kg · {pctSmm.toFixed(1)}%
              </div>
            </div>
            <span
              className={`shrink-0 text-[11px] font-black px-2.5 py-1 rounded-lg border ${
                deltas.musculo > 0
                  ? 'bg-red-500/15 text-red-400 border-red-500/30'
                  : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              }`}
            >
              {badgeMusculo}
            </span>
          </div>

          <div className={`${factorCls} p-2.5 rounded-xl border flex items-center justify-between gap-3`}>
            <div className="min-w-0">
              <span className={`text-[10px] font-bold uppercase ${mutedCls}`}>% Grasa</span>
              <div className={`text-sm font-black ${valueCls}`}>
                {medicion.pctGrasa.toFixed(1)}%
              </div>
            </div>
            <span
              className={`shrink-0 text-[11px] font-black px-2.5 py-1 rounded-lg border ${
                deltas.grasa > 0
                  ? 'bg-red-500/15 text-red-400 border-red-500/30'
                  : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              }`}
            >
              {badgeGrasa}
            </span>
          </div>

          <div className={`${factorCls} p-2.5 rounded-xl border flex items-center justify-between gap-3`}>
            <div className="min-w-0">
              <span className={`text-[10px] font-bold uppercase ${mutedCls}`}>Grasa Visceral</span>
              <div className={`text-sm font-black ${valueCls}`}>
                Nivel {medicion.grasaVisceral}
              </div>
            </div>
            <span
              className={`shrink-0 text-[11px] font-black px-2.5 py-1 rounded-lg border ${
                deltas.visceral > 0
                  ? 'bg-red-500/15 text-red-400 border-red-500/30'
                  : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              }`}
            >
              {badgeVisceral}
            </span>
          </div>

          <div className={`p-2.5 rounded-xl flex items-center justify-between ${
            isDark ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-slate-900'
          }`}>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-400" />
              <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">
                InBody Score / Nivel
              </span>
            </div>
            <div className="text-right">
              <span className="text-sm font-black text-white">{medicion.inbodyScore} / 100</span>
              <span className={`ml-2 text-[10px] font-bold uppercase ${nivelColor}`}>{nivelTexto}</span>
            </div>
          </div>
          </div>

          {simOpen && (
            <div ref={simRef} className={`order-1 md:order-none rounded-2xl border p-3.5 space-y-3 ring-2 ring-cyan-400/70 ${simCls}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-cyan-400">
                  ¿Qué pasa si bajo grasa / subo músculo?
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setBajarGrasa(0);
                    setSubirMusculo(0);
                  }}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border cursor-pointer ${
                    isDark
                      ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                      : 'border-slate-300 text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  <RotateCcw className="w-3 h-3" />
                  Restablecer
                </button>
              </div>

              <label className="block">
                <div className="flex justify-between text-[11px] font-bold mb-1">
                  <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Bajar Grasa Corporal</span>
                  <span className="font-mono text-rose-400">{bajarGrasa.toFixed(1)} kg</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={12}
                  step={0.5}
                  value={bajarGrasa}
                  onChange={(e) => setBajarGrasa(Number(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
                <span className={`text-[10px] font-bold ${mutedCls}`}>0 a 12 kg</span>
              </label>
              <label className="block">
                <div className="flex justify-between text-[11px] font-bold mb-1">
                  <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Ganar Músculo SMM</span>
                  <span className="font-mono text-blue-400">{subirMusculo.toFixed(1)} kg</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={6}
                  step={0.5}
                  value={subirMusculo}
                  onChange={(e) => setSubirMusculo(Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
                <span className={`text-[10px] font-bold ${mutedCls}`}>0 a 6 kg</span>
              </label>

              <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 block">
                  Edad Corporal proyectada
                </span>
                <div className={`mt-0.5 text-xl font-black ${valueCls}`}>
                  {analisisSim.edadCorporal}{' '}
                  <span className={`text-sm font-medium ${mutedCls}`}>años</span>
                </div>
                <p className={`text-[11px] font-bold mt-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  de {edadCorp} años pasa en vivo a {analisisSim.edadCorporal} años
                  {deltaSim < 0
                    ? ` · ${deltaSim} años más joven`
                    : deltaSim > 0
                      ? ` · +${deltaSim} años`
                      : ' · sin cambio'}
                </p>
              </div>

              <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-2.5 flex items-center gap-3">
                <img
                  src={`/medallas/n${nivelSim}.png`}
                  alt={`Medalla ${nivelMedallaLabel(nivelSim)}`}
                  className="w-12 h-12 object-contain drop-shadow-lg"
                />
                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 block">
                    InBody Score / Medalla
                  </span>
                  <div className={`text-lg font-black ${valueCls}`}>
                    {scoreSimulado} <span className={`text-sm ${mutedCls}`}>/ 100</span>
                  </div>
                  <p className={`text-[11px] font-bold truncate ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {nivelMedallaLabel(nivelSim)} · {analisisSim.tipoCuerpo}
                  </p>
                  {simActiva && (
                    <p className="text-[10px] text-cyan-400 font-black uppercase tracking-wider mt-0.5">
                      Somatotipo proyectado
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
