import React, { useState } from 'react';
import { X, Printer, Shield, Target, Award, Dumbbell, Salad, CheckCircle2, ChevronRight, BookOpen, Layers, Flame, Scale, Heart } from 'lucide-react';
import { DEFINICIONES_SOMATOTIPOS, MAPEO_SOMATOTIPOS } from '../data/mockData';

interface GuiaInbodyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuiaInbodyModal: React.FC<GuiaInbodyModalProps> = ({ isOpen, onClose }) => {
  const [generoGuia, setGeneroGuia] = useState<'M' | 'F'>('M');
  const [tabActiva, setTabActiva] = useState<'semaforo' | 'somatotipos' | 'segmental' | 'planes'>('semaforo');

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 print:max-h-none print:m-0 print:border-none print:bg-white print:text-black"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado Institucional del Documento */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 border-b border-slate-800 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:bg-transparent print:border-b-2 print:border-black">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-black text-xl shadow-inner print:hidden">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20 print:border-black print:text-black">
                  Doctrina & Guía Técnica Oficial
                </span>
                <span className="text-[10px] text-slate-400 font-mono print:text-gray-600">Ref: INBODY-270S-DOC-2025</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1 print:text-black">
                Manual Guía de Diagnóstico Antropométrico & Somatotipos
              </h2>
              <p className="text-xs text-slate-400 print:text-gray-600">
                Criterios de Semafórica, Metodología 3x3, Composición Segmental y Planes Operativos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden self-end sm:self-auto">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 cursor-pointer shadow-sm"
              title="Imprimir o exportar documento a PDF"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span>Imprimir / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de Pestañas de Navegación Rápida */}
        <div className="flex items-center gap-2 bg-slate-950 p-2.5 border-b border-slate-800 overflow-x-auto print:hidden">
          <button
            onClick={() => setTabActiva('semaforo')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              tabActiva === 'semaforo'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>1. Semáforo de Rendimiento (3 Niveles)</span>
          </button>
          <button
            onClick={() => setTabActiva('somatotipos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              tabActiva === 'somatotipos'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>2. Matriz de Somatotipos 3x3 (M & F)</span>
          </button>
          <button
            onClick={() => setTabActiva('segmental')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              tabActiva === 'segmental'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>3. Análisis de 5 Cilindros & Visceral</span>
          </button>
          <button
            onClick={() => setTabActiva('planes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              tabActiva === 'planes'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Salad className="w-4 h-4" />
            <span>4. Nutrición Regional & Fichas de Edad</span>
          </button>
        </div>

        {/* Contenido del Documento */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-8 print:overflow-visible print:p-0 print:space-y-6">
          
          {/* TAB 1: SEMÁFORO DE RENDIMIENTO INSTITUCIONAL */}
          {(tabActiva === 'semaforo' || typeof window !== 'undefined') && (
            <section className={`space-y-6 ${tabActiva !== 'semaforo' ? 'hidden print:block' : 'block'}`}>
              <div className="border-b border-slate-800 pb-3">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                  Capítulo I • Escala de Calificación
                </span>
                <h3 className="text-lg sm:text-xl font-black text-white mt-1">
                  Sistema de Semáforo de Rendimiento Físico (0 a 100 Puntos)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Criterio unificado institucional para clasificar el estado de salud, composición y capacidad operativa del personal evaluado.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* NIVEL 3: VERDE */}
                <div className="bg-emerald-500/10 border-2 border-emerald-500/50 rounded-2xl p-5 space-y-3 relative overflow-hidden shadow-lg shadow-emerald-500/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/50 animate-pulse" />
                      <span className="text-sm font-black text-emerald-400">NIVEL 3 | ALTO</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-md">
                      85 - 100 pts
                    </span>
                  </div>
                  <h4 className="text-base font-black text-white">Sobresaliente / Óptimo</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Personal en condición física superior. Equilibrio exacto entre masa muscular densa y bajo porcentaje de grasa corporal. Apto para misiones de alta exigencia física y combate continuo.
                  </p>
                  <div className="pt-2 border-t border-emerald-500/20 text-[11px] font-bold text-emerald-300">
                    Directiva: Mantenimiento táctico y liderazgo físico.
                  </div>
                </div>

                {/* NIVEL 2: AMARILLO */}
                <div className="bg-amber-500/10 border-2 border-amber-500/50 rounded-2xl p-5 space-y-3 relative overflow-hidden shadow-lg shadow-amber-500/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-amber-500 shadow-md shadow-amber-500/50 animate-pulse" />
                      <span className="text-sm font-black text-amber-400">NIVEL 2 | MEDIO</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-md">
                      70 - 84 pts
                    </span>
                  </div>
                  <h4 className="text-base font-black text-white">Aceptable / En Progreso</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Condición física estándar con margen de optimización. Requiere ajustes moderados en quema de grasa y aumento de tono muscular para ascender a Nivel 3.
                  </p>
                  <div className="pt-2 border-t border-amber-500/20 text-[11px] font-bold text-amber-300">
                    Directiva: Plan de nutrición 4 sesiones semanales de fuerza.
                  </div>
                </div>

                {/* NIVEL 1: ROJO */}
                <div className="bg-rose-500/10 border-2 border-rose-500/50 rounded-2xl p-5 space-y-3 relative overflow-hidden shadow-lg shadow-rose-500/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-rose-500 shadow-md shadow-rose-500/50 animate-pulse" />
                      <span className="text-sm font-black text-rose-400">NIVEL 1 | BAJO</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded-md">
                      &lt; 70 pts
                    </span>
                  </div>
                  <h4 className="text-base font-black text-white">Alerta / Reacondicionamiento</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Estado antropométrico por debajo de los estándares operativos (exceso de grasa o marcada debilidad muscular sarcopénica). Requiere intervención prioritaria.
                  </p>
                  <div className="pt-2 border-t border-rose-500/20 text-[11px] font-bold text-rose-300">
                    Directiva: Protocolo intensivo de reacondicionamiento físico.
                  </div>
                </div>

              </div>

              {/* Tabla de Fórmulas y Criterios */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Matriz de Composición y Ponderación del Score InBody:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-400">
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-blue-400 font-bold block mb-1">Masa Muscular Esquelética (SMM)</span>
                    Aporta hasta 40 puntos del puntaje final. Se evalúa la densidad en kg respecto a la estatura.
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-pink-400 font-bold block mb-1">Porcentaje de Grasa Corporal (PBF)</span>
                    Aporta hasta 40 puntos. Rango óptimo militar: 10-18% (hombres) / 18-24% (mujeres).
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-emerald-400 font-bold block mb-1">Simetría & Grasa Visceral</span>
                    Aporta hasta 20 puntos. Se penalizan asimetrías &gt;0.4kg entre extremidades y grasa visceral &gt;9.
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* TAB 2: MATRIZ DE SOMATOTIPOS 3x3 */}
          {(tabActiva === 'somatotipos' || typeof window !== 'undefined') && (
            <section className={`space-y-6 ${tabActiva !== 'somatotipos' ? 'hidden print:block' : 'block'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-cyan-400">
                    Capítulo II • Biometría Corpórea
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-white mt-1">
                    Matriz de los 9 Somatotipos InBody (Mapeo Oficial 3x3)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Clasificación antropométrica cruzando porcentaje de grasa (eje vertical) y masa muscular (eje horizontal).
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0 print:hidden">
                  <span className="text-xs text-slate-400 px-2 font-bold">Ver Siluetas:</span>
                  <button
                    onClick={() => setGeneroGuia('M')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      generoGuia === 'M' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Masculino (1M - 9M)
                  </button>
                  <button
                    onClick={() => setGeneroGuia('F')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      generoGuia === 'F' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Femenino (1F - 9F)
                  </button>
                </div>
              </div>

              {/* Grilla 3x3 con miniaturas de siluetas reales */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(DEFINICIONES_SOMATOTIPOS).map(([key, def], idx) => {
                  const imagenSilueta = MAPEO_SOMATOTIPOS[def.nombre]?.[generoGuia];
                  const esIdeal = def.nombre === 'Tipo muscular estándar' || def.nombre === 'Tipo musculoso desarrollado';
                  const esAlerta = def.nombre === 'Tipo obeso edematoso' || def.nombre === 'Falta de tipo de ejercicio';

                  return (
                    <div 
                      key={key}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                        esIdeal 
                          ? 'bg-cyan-500/10 border-cyan-500/50' 
                          : esAlerta 
                          ? 'bg-rose-500/10 border-rose-500/40' 
                          : 'bg-slate-950/70 border-slate-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                            #{idx + 1} • {def.clave}
                          </span>
                          {esIdeal && (
                            <span className="text-[9px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30">
                              Meta Táctica
                            </span>
                          )}
                          {esAlerta && (
                            <span className="text-[9px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/30">
                              Prioritario
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 mb-3">
                          {imagenSilueta && (
                            <div className="w-14 h-20 bg-slate-900 rounded-xl p-1 border border-slate-800 flex items-center justify-center shrink-0">
                              <img
                                src={imagenSilueta}
                                alt={def.nombre}
                                className="max-h-full max-w-full object-contain filter drop-shadow"
                              />
                            </div>
                          )}
                          <div>
                            <h4 className="text-sm font-black text-white leading-tight">
                              {def.nombre}
                            </h4>
                            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                              {def.descripcion}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 text-[10px] space-y-1">
                        <div className="text-slate-300">
                          <span className="text-blue-400 font-bold">Fuerza:</span> {def.enfoqueEntrenamiento}
                        </div>
                        <div className="text-slate-300">
                          <span className="text-emerald-400 font-bold">Nutrición:</span> {def.enfoqueNutricion}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* TAB 3: 5 CILINDROS SEGMENTALES & GRASA VISCERAL */}
          {(tabActiva === 'segmental' || typeof window !== 'undefined') && (
            <section className={`space-y-6 ${tabActiva !== 'segmental' ? 'hidden print:block' : 'block'}`}>
              <div className="border-b border-slate-800 pb-3">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-400">
                  Capítulo III • Análisis Anatómico Segmental
                </span>
                <h3 className="text-lg sm:text-xl font-black text-white mt-1">
                  Evaluación de los 5 Cilindros Corporales & Grasa Visceral
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Principio de bioimpedancia multifrecuencia tetrapolar para medir masa magra y grasa independiente en cada extremidad y tronco.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Los 5 Cilindros */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <Scale className="w-4 h-4 text-blue-400" />
                    <span>Criterios de Simetría en los 5 Segmentos</span>
                  </h4>
                  <ul className="space-y-2.5 text-xs text-slate-300">
                    <li className="flex items-start gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                      <div>
                        <strong className="text-white">Brazos (Derecho e Izquierdo):</strong>
                        <p className="text-slate-400 text-[11px] mt-0.5">
                          Diferencia máxima permitida: ≤ 0.3 kg. Asimetrías superiores revelan compensación unilateral que puede generar lesiones posturales.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                      <div>
                        <strong className="text-white">Tronco / Dorso:</strong>
                        <p className="text-slate-400 text-[11px] mt-0.5">
                          Representa más del 50% de la masa muscular total. Base de soporte para la mochila y el chaleco balístico.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                      <div>
                        <strong className="text-white">Piernas (Derecha e Izquierda):</strong>
                        <p className="text-slate-400 text-[11px] mt-0.5">
                          Diferencia máxima permitida: ≤ 0.4 kg. Fundamental para la marcha militar y saltos tácticos.
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>

                {/* Grasa Visceral */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-400" />
                    <span>Semáforo de Grasa Visceral (Salud Interna)</span>
                  </h4>
                  <div className="space-y-3 text-xs">
                    <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="font-bold text-emerald-400 block text-xs">Nivel 1 a 9 • ESTADO BIEN (Saludable)</span>
                        <span className="text-[11px] text-slate-300">Órganos protegidos, riesgo cardiovascular bajo.</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-black">
                        🟢 BIEN
                      </span>
                    </div>

                    <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="font-bold text-rose-400 block text-xs">Nivel 10 a 20 • ESTADO MAL (Alerta de Riesgo)</span>
                        <span className="text-[11px] text-slate-300">Grasa profunda rodeando órganos vitales; inflamación metabólica.</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 text-xs font-black">
                        🔴 ALERTA
                      </span>
                    </div>

                    <p className="text-slate-400 text-[11px] leading-relaxed pt-1">
                      A diferencia de la grasa subcutánea (debajo de la piel), la grasa visceral se reduce rápidamente con ejercicio aeróbico regular (caminata a ritmo vivo o trote continuo de 40 min) y eliminación de azúcares refinados.
                    </p>
                  </div>
                </div>

              </div>
            </section>
          )}

          {/* TAB 4: PLANES REGIONALES Y FICHAS DE EDAD */}
          {(tabActiva === 'planes' || typeof window !== 'undefined') && (
            <section className={`space-y-6 ${tabActiva !== 'planes' ? 'hidden print:block' : 'block'}`}>
              <div className="border-b border-slate-800 pb-3">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  Capítulo IV • Prescripción Operativa
                </span>
                <h3 className="text-lg sm:text-xl font-black text-white mt-1">
                  Estructura de Planes por Región Geográfica y Fichas de Edad
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Adaptación calórica y de ejercicios al piso climático (Sierra, Costa, Oriente) y la edad cronológica.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Nutrición por Región */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <Salad className="w-4 h-4" />
                    <span>Planes Nutricionales por Región Geográfica</span>
                  </div>
                  <div className="space-y-2 text-xs text-slate-300">
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <strong className="text-white block">📍 Región Sierra (Granos, tubérculos andinos y carnes magras):</strong>
                      <span className="text-slate-400 text-[11px]">Diseñado para clima frío y altitud. Mayor aporte de carbohidratos complejos de absorción lenta.</span>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <strong className="text-white block">📍 Región Costa (Pescados, plátano verde y mariscos):</strong>
                      <span className="text-slate-400 text-[11px]">Enfocado en hidratación y electrolitos debido a la alta humedad y temperatura costera.</span>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <strong className="text-white block">📍 Región Oriente / Selva (Yuca, chonta y proteínas locales):</strong>
                      <span className="text-slate-400 text-[11px]">Resistencia y recuperación en ambientes de selva con alto desgaste térmico.</span>
                    </div>
                  </div>
                </div>

                {/* Entrenamiento por Ficha de Edad */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                    <Dumbbell className="w-4 h-4" />
                    <span>Fichas de Entrenamiento por Rango Etario</span>
                  </div>
                  <div className="space-y-2 text-xs text-slate-300">
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <strong className="text-white block">Ficha 1 (20 a 30 años) • Potencia & Fuerza Máxima:</strong>
                      <span className="text-slate-400 text-[11px]">Enfoque en alta intensidad, sobrecarga progresiva y velocidad de reacción.</span>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <strong className="text-white block">Ficha 2 (31 a 40 años) • Fuerza Funcional & HIIT:</strong>
                      <span className="text-slate-400 text-[11px]">Mantenimiento de masa muscular magra y prevención de desgaste articular.</span>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <strong className="text-white block">Ficha 3 (41 a 50 años) • Resistencia & Movilidad:</strong>
                      <span className="text-slate-400 text-[11px]">Trabajo cardiovascular en zona aeróbica 2 y fortalecimiento de faja lumbopélvica.</span>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <strong className="text-white block">Ficha 4 (&gt; 50 años) • Salud Metabólica & Longevidad:</strong>
                      <span className="text-slate-400 text-[11px]">Control de presión arterial, preservación muscular y bajo impacto articular.</span>
                    </div>
                  </div>
                </div>

              </div>
            </section>
          )}

        </div>

        {/* Pie del Documento */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 print:border-t-2 print:border-black print:text-black">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-500" />
            <span>Documento Guía Institucional InBody 270S • Acreditado y Homologado</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer print:hidden"
          >
            Cerrar Guía
          </button>
        </div>

      </div>
    </div>
  );
};
