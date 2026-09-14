import React, { useState } from 'react';
import { SomatotipoDefinicion } from '../types/inbody';
import { MAPEO_SOMATOTIPOS } from '../data/mockData';
import { X, Dumbbell, Salad, AlertTriangle, CheckCircle2, User } from 'lucide-react';

interface SomatotipoModalProps {
  info?: SomatotipoDefinicion | null;
  definicion?: SomatotipoDefinicion | null;
  onClose: () => void;
  generoInicial?: 'M' | 'F';
}

export const SomatotipoModal: React.FC<SomatotipoModalProps> = ({ 
  info, 
  definicion, 
  onClose,
  generoInicial = 'M'
}) => {
  const activeInfo = info || definicion;
  const [generoSilueta, setGeneroSilueta] = useState<'M' | 'F'>(generoInicial);

  if (!activeInfo) return null;

  const imagenes = MAPEO_SOMATOTIPOS[activeInfo.nombre];
  const imagenActual = imagenes ? imagenes[generoSilueta] : null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-6 sm:pt-10 overflow-y-auto bg-slate-950/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado con Botón Cerrar */}
        <div className="flex items-start justify-between gap-4 mb-4 border-b border-slate-800 pb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Clasificación InBody 3x3 • Somatotipo Oficial
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white mt-1.5">{activeInfo.tituloModal}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sección Visual: Silueta del Somatotipo M / F */}
        {imagenActual && (
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">
                Silueta Antropométrica del Somatotipo:
              </span>
              <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setGeneroSilueta('M')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    generoSilueta === 'M' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Masculino
                </button>
                <button
                  onClick={() => setGeneroSilueta('F')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    generoSilueta === 'F' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Femenino
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
              <div className="w-40 h-52 flex items-center justify-center bg-slate-900/60 rounded-xl p-2 border border-slate-800">
                <img
                  src={imagenActual}
                  alt={`Silueta ${activeInfo.nombre} ${generoSilueta}`}
                  className="max-h-full max-w-full object-contain filter drop-shadow-md"
                />
              </div>
              <div className="text-xs space-y-2 flex-1 text-slate-300">
                <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-cyan-400 uppercase font-bold block mb-0.5">Distribución Muscular (Brazos / Dorso / Piernas):</span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {activeInfo.nombre.includes('musculoso') || activeInfo.nombre.includes('muscular') 
                      ? 'Desarrollo hipertrófico óptimo en tren superior y miembros inferiores. Simetría balanceada.'
                      : activeInfo.nombre.includes('delgado')
                      ? 'Masa muscular por debajo del percentil estándar en miembros y tronco. Requiere sobrecarga progresiva.'
                      : 'Masa muscular esquelética promedio con requerimiento de estímulo neuromuscular constante.'}
                  </p>
                </div>
                <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-pink-400 uppercase font-bold block mb-0.5">Distribución Adiposa Típica:</span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {activeInfo.nombre.includes('obeso') || activeInfo.nombre.includes('sobrepeso')
                      ? 'Mayor acumulación en tronco/abdomen y zona proximal de extremidades. Vigilar grasa visceral.'
                      : 'Nivel lipídico controlado en tronco y extremidades dentro de márgenes de salud táctica.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Descripción General */}
        <div className="space-y-4 text-sm">
          <p className="text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
            {activeInfo.descripcion}
          </p>

          {/* Diagnóstico Operativo */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200">
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-amber-400 mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span>Diagnóstico Operativo</span>
            </div>
            <p className="text-xs text-amber-200/90 leading-relaxed">
              {activeInfo.diagnosticoGeneral}
            </p>
          </div>

          {/* Enfoque de Entrenamiento */}
          <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-200">
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-blue-400 mb-1">
              <Dumbbell className="w-4 h-4" />
              <span>Prescripción de Entrenamiento</span>
            </div>
            <p className="text-xs text-blue-200/90 leading-relaxed">
              {activeInfo.enfoqueEntrenamiento}
            </p>
          </div>

          {/* Enfoque de Nutrición */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200">
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-emerald-400 mb-1">
              <Salad className="w-4 h-4" />
              <span>Estrategia Nutricional</span>
            </div>
            <p className="text-xs text-emerald-200/90 leading-relaxed">
              {activeInfo.enfoqueNutricion}
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
};

