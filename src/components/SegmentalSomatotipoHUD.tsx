import React, { useState } from 'react';
import { InBodyRecord, SomatotipoTipo, SegmentalValues } from '../types/inbody';
import { MAPEO_SOMATOTIPOS, DEFINICIONES_SOMATOTIPOS } from '../data/mockData';
import { 
  Activity, 
  Layers, 
  Dumbbell, 
  Flame, 
  Maximize2, 
  Info, 
  CheckCircle2, 
  AlertCircle,
  Eye
} from 'lucide-react';

interface SegmentalSomatotipoHUDProps {
  medicion: InBodyRecord;
  sexo: 'M' | 'F';
  onOpenSomatotipoInfo?: (somatotipo: SomatotipoTipo) => void;
}

export const SegmentalSomatotipoHUD: React.FC<SegmentalSomatotipoHUDProps> = ({
  medicion,
  sexo,
  onOpenSomatotipoInfo
}) => {
  const [activeMetric, setActiveMetric] = useState<'musculo' | 'grasa'>('musculo');
  const [imgGender, setImgGender] = useState<'M' | 'F'>(sexo);
  const [selectedSegment, setSelectedSegment] = useState<'BD' | 'BI' | 'TR' | 'PD' | 'PI' | null>(null);
  const [showAll9Modal, setShowAll9Modal] = useState(false);
  const [viewingSomatotype, setViewingSomatotype] = useState<SomatotipoTipo>(medicion.tipoCuerpo);

  const seg = medicion.segmental;
  const tipo = medicion.tipoCuerpo;
  const imagenUrl = MAPEO_SOMATOTIPOS[tipo]?.[imgGender] || MAPEO_SOMATOTIPOS["Tipo estándar"]?.[imgGender];

  // Cálculo de asimetrías
  const diffBrazos = Math.abs(seg.musculoBD - seg.musculoBI);
  const diffPiernas = Math.abs(seg.musculoPD - seg.musculoPI);
  const asimetriaBrazosPct = Math.round((diffBrazos / Math.max(seg.musculoBD, seg.musculoBI)) * 100);
  const asimetriaPiernasPct = Math.round((diffPiernas / Math.max(seg.musculoPD, seg.musculoPI)) * 100);

  const getStatusText = (pct: number) => {
    if (pct < 90) return { label: 'Bajo', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    if (pct <= 115) return { label: 'Normal', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
    return { label: 'Desarrollado', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' };
  };

  const getFatStatusText = (pct: number) => {
    if (pct < 85) return { label: 'Bajo', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' };
    if (pct <= 115) return { label: 'Normal', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
    if (pct <= 140) return { label: 'Ligero Aumento', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    return { label: 'Exceso', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl">
      
      {/* Encabezado del HUD */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-4 bg-cyan-500 rounded-full" />
            <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
              Anatomía Segmental InBody 270S & Silueta del Somatotipo
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluación segmental de los 5 cilindros corporales (Brazo D/I, Tronco/Dorso, Pierna D/I)
          </p>
        </div>

        {/* Controles: Músculo vs Grasa y Selector de Género */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Botón Ver los 9 Somatotipos */}
          <button
            onClick={() => setShowAll9Modal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Ver los 9 Somatotipos</span>
          </button>

          {/* Toggle Músculo / Grasa */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveMetric('musculo')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeMetric === 'musculo'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Dumbbell className="w-3.5 h-3.5" />
              <span>Músculo</span>
            </button>
            <button
              onClick={() => setActiveMetric('grasa')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeMetric === 'grasa'
                  ? 'bg-pink-500 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Grasa</span>
            </button>
          </div>

          {/* Toggle Silueta M/F */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setImgGender('M')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                imgGender === 'M' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              M
            </button>
            <button
              onClick={() => setImgGender('F')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                imgGender === 'F' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              F
            </button>
          </div>

        </div>
      </div>

      {/* Somatotipo Actual Notificación */}
      <div className="flex items-center justify-between p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-sm shadow">
            9S
          </div>
          <div>
            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block">
              Somatotipo Detectado por InBody:
            </span>
            <h4 className="text-sm sm:text-base font-black text-white">{tipo}</h4>
          </div>
        </div>

        {onOpenSomatotipoInfo && (
          <button
            onClick={() => onOpenSomatotipoInfo(tipo)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
          >
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>Ficha Clínica</span>
          </button>
        )}
      </div>

      {/* ÁREA CENTRAL: SILUETA ANATÓMICA CON LLAMADAS HUD A LOS 5 CILINDROS */}
      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* COLUMNA IZQUIERDA: BRAZO DERECHO Y PIERNA DERECHA (Perspectiva Anatómica Frontal) */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Brazo Derecho (BD) */}
          <div 
            onClick={() => setSelectedSegment('BD')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              selectedSegment === 'BD'
                ? 'bg-blue-950/70 border-cyan-400 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                Brazo Derecho (BD)
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                activeMetric === 'musculo' 
                  ? getStatusText(seg.musculoBDPct).color 
                  : getFatStatusText(seg.grasaBDPct).color
              }`}>
                {activeMetric === 'musculo' 
                  ? getStatusText(seg.musculoBDPct).label 
                  : getFatStatusText(seg.grasaBDPct).label}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Masa Muscular</span>
                <span className="text-sm font-mono font-black text-cyan-400">{seg.musculoBD} kg</span>
                <span className="text-[10px] text-slate-500 block">({seg.musculoBDPct}% norm)</span>
              </div>
              <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Grasa Estimada</span>
                <span className="text-sm font-mono font-black text-pink-400">{seg.grasaBD} kg</span>
                <span className="text-[10px] text-slate-500 block">({seg.grasaBDPct}%)</span>
              </div>
            </div>
          </div>

          {/* Pierna Derecha (PD) */}
          <div 
            onClick={() => setSelectedSegment('PD')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              selectedSegment === 'PD'
                ? 'bg-blue-950/70 border-cyan-400 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                Pierna Derecha (PD)
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                activeMetric === 'musculo' 
                  ? getStatusText(seg.musculoPDPct).color 
                  : getFatStatusText(seg.grasaPDPct).color
              }`}>
                {activeMetric === 'musculo' 
                  ? getStatusText(seg.musculoPDPct).label 
                  : getFatStatusText(seg.grasaPDPct).label}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Masa Muscular</span>
                <span className="text-sm font-mono font-black text-cyan-400">{seg.musculoPD} kg</span>
                <span className="text-[10px] text-slate-500 block">({seg.musculoPDPct}% norm)</span>
              </div>
              <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Grasa Estimada</span>
                <span className="text-sm font-mono font-black text-pink-400">{seg.grasaPD} kg</span>
                <span className="text-[10px] text-slate-500 block">({seg.grasaPDPct}%)</span>
              </div>
            </div>
          </div>

        </div>

        {/* COLUMNA CENTRAL: SILUETA ANATÓMICA DEL SOMATOTIPO (IMAGEN + HUD VECTORIAL) */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center relative min-h-[380px] bg-slate-950/50 rounded-3xl p-4 border border-slate-800/80 overflow-hidden">
          
          {/* Fondo de rejilla táctica */}
          <div 
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(56, 189, 248, 0.4) 1px, transparent 0)',
              backgroundSize: '24px 24px'
            }}
          />

          {/* Círculo de pulso central */}
          <div className="absolute w-64 h-64 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />

          {/* Imagen real del somatotipo */}
          <div className="relative z-10 w-52 sm:w-60 h-[340px] flex items-center justify-center">
            <img
              src={imagenUrl}
              alt={`Silueta ${tipo} ${imgGender}`}
              className="max-h-full max-w-full object-contain filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)] transition-all duration-300"
              onError={(e) => {
                // Fallback elegante a silueta vectorial si la imagen no carga
                (e.target as HTMLElement).style.display = 'none';
                const fallbackEl = document.getElementById('vector-silhouette-fallback');
                if (fallbackEl) fallbackEl.style.display = 'flex';
              }}
            />

            {/* Fallback Vectorial si la URL remota no estuviese disponible */}
            <div 
              id="vector-silhouette-fallback" 
              className="hidden flex-col items-center justify-center text-center p-4"
            >
              <div className="w-24 h-48 border-2 border-dashed border-cyan-500/40 rounded-full flex items-center justify-center bg-cyan-500/5">
                <span className="text-xs font-bold text-cyan-400">Silueta {imgGender}</span>
              </div>
            </div>
          </div>

          {/* Etiqueta flotante inferior del Somatotipo */}
          <div className="relative z-10 mt-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-700 text-xs font-bold text-slate-300 shadow">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>{tipo} ({imgGender === 'M' ? 'Masculino' : 'Femenino'})</span>
          </div>

        </div>

        {/* COLUMNA DERECHA: TRONCO/DORSO, BRAZO IZQUIERDO Y PIERNA IZQUIERDA */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Tronco / Dorso (TR) */}
          <div 
            onClick={() => setSelectedSegment('TR')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              selectedSegment === 'TR'
                ? 'bg-blue-950/70 border-cyan-400 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                Tronco / Dorso (TR)
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                activeMetric === 'musculo' 
                  ? getStatusText(seg.musculoTRPct).color 
                  : getFatStatusText(seg.grasaTRPct).color
              }`}>
                {activeMetric === 'musculo' 
                  ? getStatusText(seg.musculoTRPct).label 
                  : getFatStatusText(seg.grasaTRPct).label}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Masa Muscular</span>
                <span className="text-sm font-mono font-black text-cyan-400">{seg.musculoTR} kg</span>
                <span className="text-[10px] text-slate-500 block">({seg.musculoTRPct}% norm)</span>
              </div>
              <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Grasa Estimada</span>
                <span className="text-sm font-mono font-black text-pink-400">{seg.grasaTR} kg</span>
                <span className="text-[10px] text-slate-500 block">({seg.grasaTRPct}%)</span>
              </div>
            </div>
          </div>

          {/* Brazo Izquierdo (BI) */}
          <div 
            onClick={() => setSelectedSegment('BI')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              selectedSegment === 'BI'
                ? 'bg-blue-950/70 border-cyan-400 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                Brazo Izquierdo (BI)
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                activeMetric === 'musculo' 
                  ? getStatusText(seg.musculoBIPct).color 
                  : getFatStatusText(seg.grasaBIPct).color
              }`}>
                {activeMetric === 'musculo' 
                  ? getStatusText(seg.musculoBIPct).label 
                  : getFatStatusText(seg.grasaBIPct).label}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Masa Muscular</span>
                <span className="text-sm font-mono font-black text-cyan-400">{seg.musculoBI} kg</span>
                <span className="text-[10px] text-slate-500 block">({seg.musculoBIPct}% norm)</span>
              </div>
              <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Grasa Estimada</span>
                <span className="text-sm font-mono font-black text-pink-400">{seg.grasaBI} kg</span>
                <span className="text-[10px] text-slate-500 block">({seg.grasaBIPct}%)</span>
              </div>
            </div>
          </div>

          {/* Pierna Izquierda (PI) */}
          <div 
            onClick={() => setSelectedSegment('PI')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              selectedSegment === 'PI'
                ? 'bg-blue-950/70 border-cyan-400 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                Pierna Izquierda (PI)
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                activeMetric === 'musculo' 
                  ? getStatusText(seg.musculoPIPct).color 
                  : getFatStatusText(seg.grasaPIPct).color
              }`}>
                {activeMetric === 'musculo' 
                  ? getStatusText(seg.musculoPIPct).label 
                  : getFatStatusText(seg.grasaPIPct).label}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Masa Muscular</span>
                <span className="text-sm font-mono font-black text-cyan-400">{seg.musculoPI} kg</span>
                <span className="text-[10px] text-slate-500 block">({seg.musculoPIPct}% norm)</span>
              </div>
              <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Grasa Estimada</span>
                <span className="text-sm font-mono font-black text-pink-400">{seg.grasaPI} kg</span>
                <span className="text-[10px] text-slate-500 block">({seg.grasaPIPct}%)</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* SECCIÓN INFERIOR: DIAGNÓSTICO DE SIMETRÍA Y BALANCE BILATERAL */}
      <div className="mt-6 pt-5 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Balance Brazos */}
        <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800 flex flex-col justify-between gap-2.5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-base">
                💪
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Simetría de Brazos (D vs I)</span>
                <span className="text-sm font-black text-white">
                  {diffBrazos < 0.15 ? 'Excelente Equilibrio Bilateral' : seg.musculoBD > seg.musculoBI ? 'Mayor Masa en Brazo Derecho' : 'Mayor Masa en Brazo Izquierdo'}
                </span>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
              diffBrazos < 0.2 ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
            }`}>
              {diffBrazos < 0.2 ? 'Balanceado' : 'Observación'}
            </span>
          </div>

          <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-800/80 flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-slate-500 block text-[10px]">Brazo Derecho</span>
              <strong className="text-white text-sm">{seg.musculoBD} kg</strong>
            </div>
            <div className="text-center px-2">
              <span className="text-[10px] text-cyan-400 font-bold uppercase block">Diferencia</span>
              <span className="text-cyan-300 font-bold text-xs">{diffBrazos.toFixed(2)} kg ({asimetriaBrazosPct}%)</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block text-[10px]">Brazo Izquierdo</span>
              <strong className="text-white text-sm">{seg.musculoBI} kg</strong>
            </div>
          </div>
        </div>

        {/* Balance Piernas */}
        <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800 flex flex-col justify-between gap-2.5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-base">
                🦵
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Simetría de Piernas (D vs I)</span>
                <span className="text-sm font-black text-white">
                  {diffPiernas < 0.25 ? 'Base Sólida y Simétrica' : seg.musculoPD > seg.musculoPI ? 'Mayor Masa en Pierna Derecha' : 'Mayor Masa en Pierna Izquierda'}
                </span>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
              diffPiernas < 0.3 ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
            }`}>
              {diffPiernas < 0.3 ? 'Balanceado' : 'Observación'}
            </span>
          </div>

          <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-800/80 flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-slate-500 block text-[10px]">Pierna Derecha</span>
              <strong className="text-white text-sm">{seg.musculoPD} kg</strong>
            </div>
            <div className="text-center px-2">
              <span className="text-[10px] text-cyan-400 font-bold uppercase block">Diferencia</span>
              <span className="text-cyan-300 font-bold text-xs">{diffPiernas.toFixed(2)} kg ({asimetriaPiernasPct}%)</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block text-[10px]">Pierna Izquierda</span>
              <strong className="text-white text-sm">{seg.musculoPI} kg</strong>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================== */}
      {/* MODAL / GALERÍA DE LOS 9 SOMATOTIPOS CON IMÁGENES COMPLETAS */}
      {/* ========================================================== */}
      {showAll9Modal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
          onClick={() => setShowAll9Modal(false)}
        >
          <div 
            className="w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Atlas Antropométrico InBody 270S
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white mt-1.5">
                  Los 9 Somatotipos Oficiales & Siluetas Anatómicas
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Visualice las siluetas masculinas y femeninas con su caracterización física y muscular.
                </p>
              </div>

              <button
                onClick={() => setShowAll9Modal(false)}
                className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Grid con las 9 Fichas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(Object.keys(MAPEO_SOMATOTIPOS) as SomatotipoTipo[]).map((stKey) => {
                const def = Object.values(DEFINICIONES_SOMATOTIPOS).find(d => d.nombre === stKey);
                const isSelected = stKey === tipo;
                const imgM = MAPEO_SOMATOTIPOS[stKey]?.M;
                const imgF = MAPEO_SOMATOTIPOS[stKey]?.F;

                return (
                  <div
                    key={stKey}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-950/60 border-cyan-400 ring-2 ring-cyan-500/30'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      {/* Cabecera Tarjeta */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black text-white">{stKey}</span>
                        {isSelected && (
                          <span className="text-[10px] font-black uppercase bg-cyan-500 text-slate-950 px-2 py-0.5 rounded-full">
                            Tu Tipo
                          </span>
                        )}
                      </div>

                      {/* Imágenes Silueta (M y F lado a lado) */}
                      <div className="grid grid-cols-2 gap-2 bg-slate-900/80 p-2 rounded-xl border border-slate-800/80 my-3">
                        <div className="flex flex-col items-center">
                          <span className="text-[9px] text-blue-400 font-bold uppercase mb-1">Masculino</span>
                          <div className="h-28 flex items-center justify-center">
                            <img 
                              src={imgM} 
                              alt={`Silueta M ${stKey}`} 
                              className="max-h-full max-w-full object-contain"
                              loading="lazy"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col items-center border-l border-slate-800 pl-2">
                          <span className="text-[9px] text-pink-400 font-bold uppercase mb-1">Femenino</span>
                          <div className="h-28 flex items-center justify-center">
                            <img 
                              src={imgF} 
                              alt={`Silueta F ${stKey}`} 
                              className="max-h-full max-w-full object-contain"
                              loading="lazy"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Descripción Breve */}
                      <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                        {def?.descripcion || 'Clasificación de composición antropométrica basada en la relación grasa/músculo.'}
                      </p>
                    </div>

                    {/* Foco de Entrenamiento y Nutrición */}
                    <div className="pt-3 border-t border-slate-800 text-[10px] space-y-1">
                      <div className="text-slate-300">
                        <strong className="text-cyan-400">Entrenamiento:</strong> {def?.enfoqueEntrenamiento.substring(0, 75)}...
                      </div>
                      <div className="text-slate-300">
                        <strong className="text-emerald-400">Nutrición:</strong> {def?.enfoqueNutricion.substring(0, 75)}...
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowAll9Modal(false)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
              >
                Cerrar Atlas
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
