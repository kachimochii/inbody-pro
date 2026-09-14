import React, { useState, useEffect } from 'react';
import { UserAccount, SomatotipoDefinicion, SomatotipoTipo, PlanNutricion, PlanEntrenamiento, RegionEcuador, resolveTituloArma } from '../../types/inbody';
import { 
  DEFINICIONES_SOMATOTIPOS, 
  CAPAS_BASE, 
  MAPEO_SOMATOTIPOS, 
  MOCK_PLANES_NUTRICION, 
  MOCK_PLANES_ENTRENAMIENTO,
  FRASES_MANDO
} from '../../data/mockData';
import { 
  calculateAge, 
  calculateTimeInService, 
  generateIframeUrl,
  isExternalVideoLink,
  extractYoutubeVideoId
} from '../../utils/inbodyCalculations';
import { SomatotipoModal } from '../SomatotipoModal';
import { GuiaInbodyModal } from '../GuiaInbodyModal';
import { EdadCorporalCard } from '../EdadCorporalCard';
import { YoutubeBackgroundAudio } from '../YoutubeBackgroundAudio';
import { useTheme } from '../../context/ThemeContext';
import { getNombreCompletoUnidad, getProvinciaUnidad, getRegionUnidad } from '../../lib/unidadesCatalog';
import { 
  Flame, 
  Award, 
  Target, 
  CheckCircle, 
  Info, 
  Calendar, 
  Dumbbell, 
  Salad, 
  Video, 
  Activity, 
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Scale,
  Heart,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Users,
  X,
  History,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Music,
  Star
} from 'lucide-react';

interface EvaluadoDashboardProps {
  user: UserAccount;
  onBack?: () => void;
  planesNutricion?: PlanNutricion[];
  planesEntrenamiento?: PlanEntrenamiento[];
}

export const EvaluadoDashboard: React.FC<EvaluadoDashboardProps> = ({ 
  user, 
  onBack,
  planesNutricion = MOCK_PLANES_NUTRICION,
  planesEntrenamiento = MOCK_PLANES_ENTRENAMIENTO
}) => {
  const [modalSomatotipo, setModalSomatotipo] = useState<SomatotipoDefinicion | null>(null);
  const [modalGuiaAbierto, setModalGuiaAbierto] = useState(false);
  const [selectedGender, setSelectedGender] = useState<'M' | 'F'>((user.sexo as 'M' | 'F') || 'M');
  const [segmentoSeleccionado, setSegmentoSeleccionado] = useState<'BD' | 'BI' | 'TR' | 'PD' | 'PI'>('TR');
  
  // Modales interactivos para los apartados de Plan de Nutrición y Entrenamiento
  const [modalNutricionAbierto, setModalNutricionAbierto] = useState(false);
  const [modalEntrenamientoAbierto, setModalEntrenamientoAbierto] = useState(false);
  const [planEntrenoSeleccionadoId, setPlanEntrenoSeleccionadoId] = useState<string | null>(null);
  const [sesionEntrenoIniciada, setSesionEntrenoIniciada] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [matrizSomatotiposAbierta, setMatrizSomatotiposAbierta] = useState(false);

  // Historial: índice 0 = medición más reciente
  const [medIndex, setMedIndex] = useState(0);

  useEffect(() => {
    setMedIndex(0);
  }, [user.cedula, user.mediciones.length]);

  // Modal para parámetros metabólicos (Grasa Visceral, TMB, Ingesta Calórica, etc.)
  const [metabolicoModal, setMetabolicoModal] = useState<{
    titulo: string;
    valor: string;
    subvalor?: string;
    estado: string;
    estadoColor: string;
    descripcion: string;
    significadoMilitar: string;
    consejo: string;
  } | null>(null);

  // Selector de región dentro del plan nutricional (default según unidad o Sierra)
  const defaultRegion: RegionEcuador = user.unidadActual.toLowerCase().includes('selva') || user.unidadActual.toLowerCase().includes('oriente')
    ? 'Oriente'
    : user.unidadActual.toLowerCase().includes('naval') || user.unidadActual.toLowerCase().includes('costa')
    ? 'Costa'
    : 'Sierra';
  const [selectedRegion, setSelectedRegion] = useState<RegionEcuador>(defaultRegion);

  const { isDark } = useTheme();

  const cardCls = isDark 
    ? 'bg-slate-900 border-slate-800 text-white' 
    : 'bg-white border-slate-200 text-slate-900 shadow-xl shadow-slate-200/50';

  const subCardCls = isDark 
    ? 'bg-slate-950/80 border-slate-800' 
    : 'bg-slate-50 border-slate-200 text-slate-800';

  // Medición InBody seleccionada del historial (0 = más reciente)
  const safeMedIndex = Math.min(medIndex, Math.max(0, user.mediciones.length - 1));
  const medActual = user.mediciones[safeMedIndex];
  const medAnterior = user.mediciones[safeMedIndex + 1]; // la toma previa a la seleccionada (si existe)
  const medMasReciente = user.mediciones[0];

  if (!medActual) {
    return (
      <div className={`rounded-3xl border p-8 sm:p-12 text-center max-w-2xl mx-auto my-8 shadow-xl ${
        isDark 
          ? 'bg-slate-900 border-slate-800 text-slate-100' 
          : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/25 flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>
        
        <h3 className="text-xl font-black mb-3 uppercase tracking-wide">
          Medición InBody Pendiente
        </h3>
        
        <div className={`p-4 rounded-2xl mb-6 text-xs font-semibold leading-relaxed ${
          isDark ? 'bg-slate-950/80 text-amber-300 border border-slate-800' : 'bg-amber-50 text-amber-800 border border-amber-100'
        }`}>
          <p className="text-sm">
            "Sus datos aún no han sido cargados. Comuníquese con su unidad y pregunte si ya cargaron los datos."
          </p>
        </div>

        <div className={`text-xs text-left p-5 rounded-2xl space-y-2.5 ${
          isDark ? 'bg-slate-950 text-slate-400' : 'bg-slate-50 text-slate-600'
        }`}>
          <div className="flex justify-between border-b border-slate-800/40 dark:border-slate-800 pb-2">
            <span className="font-bold">Efectivo Militar:</span>
            <span>{user.grado} {user.nombres} {user.apellidos}</span>
          </div>
          <div className="flex justify-between border-b border-slate-800/40 dark:border-slate-800 pb-2">
            <span className="font-bold">Cédula de Identidad:</span>
            <span className="font-mono">{user.cedula}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold">Unidad Asignada:</span>
            <span>{user.unidadActual}</span>
          </div>
        </div>

        {onBack && (
          <button
            onClick={onBack}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a la Lista de Efectivos</span>
          </button>
        )}
      </div>
    );
  }

  const edad = calculateAge(user.fechaNacimiento);
  const tiempoServicio = calculateTimeInService(user.fechaIngreso);
  const score = medActual.inbodyScore;

  // Clasificación en 3 Niveles (Nivel 1: Bajo, Nivel 2: Medio, Nivel 3: Alto)
  let nivelNumero = 1;
  let nivelTexto = 'Nivel 1 | Bajo';
  let nivelColorClass = 'text-rose-400 border-rose-500/40 bg-rose-500/10';
  let puntosFaltantesTexto = '';
  let fraseGuia = '';

  if (score >= 85) {
    nivelNumero = 3;
    nivelTexto = 'Nivel 3 | Alto';
    nivelColorClass = 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
    puntosFaltantesTexto = score === 100 
      ? '¡Has alcanzado la máxima puntuación de 100 puntos!' 
      : `Te faltan solo ${100 - score} puntos para el puntaje perfecto de 100`;
    fraseGuia = '¡Extraordinario desempeño! Estás en el Nivel 3 (Alto). Mantén la constancia militar y el rigor táctico: el liderazgo físico se demuestra con el ejemplo diario.';
  } else if (score >= 70) {
    nivelNumero = 2;
    nivelTexto = 'Nivel 2 | Medio';
    nivelColorClass = 'text-amber-400 border-amber-500/40 bg-amber-500/10';
    puntosFaltantesTexto = `Te faltan ${85 - score} puntos para alcanzar el Nivel 3 (Alto)`;
    fraseGuia = `Te faltan solo ${85 - score} puntos para llegar al Nivel 3 (Alto). ¡No te rindas! Con pequeños ajustes en tu alimentación y 4 sesiones semanales de entrenamiento alcanzarás la cima.`;
  } else {
    nivelNumero = 1;
    nivelTexto = 'Nivel 1 | Bajo';
    nivelColorClass = 'text-rose-400 border-rose-500/40 bg-rose-500/10';
    puntosFaltantesTexto = `Te faltan ${70 - score} puntos para Nivel 2 y ${85 - score} puntos para Nivel 3 (Alto)`;
    fraseGuia = `Te faltan ${85 - score} puntos para el Nivel 3 ideal. La disciplina es el puente entre tus metas y tus logros: inicia hoy mismo tu plan y recupera tu capacidad operativa.`;
  }

  const medallaUrl = `/medallas/n${nivelNumero}.png`;
  const soldadoUrl = `/medallas/s${nivelNumero}.png`;
  const primerApellido = (user.apellidos || '').trim().split(/\s+/)[0] || '';
  const etiquetaMedallaNivel3 = `${(user.grado || '').trim()} ${primerApellido}`.trim().toUpperCase();
  const scoreBarPct = Math.min(100, Math.max(4, score));

  // Somatotipo actual y definición con selección de silueta según género
  const somatotipoActual = medActual.tipoCuerpo || 'Tipo estándar';
  const defActual = Object.values(DEFINICIONES_SOMATOTIPOS).find(d => d.nombre === somatotipoActual)
    || DEFINICIONES_SOMATOTIPOS.estandar;
  const imagenesActual = MAPEO_SOMATOTIPOS[somatotipoActual] || MAPEO_SOMATOTIPOS['Tipo estándar'];
  const siluetaActualUrl = imagenesActual[selectedGender] || imagenesActual.M;

  // Somatotipo Ideal Sugerido
  const somatotipoIdealNombre: SomatotipoTipo = (somatotipoActual === 'Tipo muscular estándar' || somatotipoActual === 'Tipo musculoso desarrollado')
    ? 'Tipo musculoso desarrollado'
    : 'Tipo muscular estándar';
  const defIdeal = Object.values(DEFINICIONES_SOMATOTIPOS).find(d => d.nombre === somatotipoIdealNombre)
    || DEFINICIONES_SOMATOTIPOS.muscular_estandar;
  const imagenesIdeal = MAPEO_SOMATOTIPOS[somatotipoIdealNombre] || MAPEO_SOMATOTIPOS['Tipo muscular estándar'];

  const siluetaIdealUrl = imagenesIdeal[selectedGender] || imagenesIdeal.M;

  const somatoColorRing = (color: string) => {
    if (color === 'rojo') return 'border-rose-500 bg-rose-500/10 shadow-rose-500/30 ring-rose-500/40';
    if (color === 'naranja') return 'border-amber-500 bg-amber-500/10 shadow-amber-500/30 ring-amber-500/40';
    if (color === 'verde') return 'border-emerald-500 bg-emerald-500/10 shadow-emerald-500/30 ring-emerald-500/40';
    return 'border-blue-500 bg-blue-500/10 shadow-blue-500/30 ring-blue-500/40';
  };
  const actualRing = somatoColorRing(defActual.color);
  const idealRing = 'border-cyan-500 bg-cyan-500/10 shadow-cyan-500/30 ring-cyan-500/40';

  // Ingesta calórica meta recomendada para entrenamiento militar
  const ingestaCaloricaMeta = medActual.caloriasRecomendadas || Math.round((medActual.tmb || 1650) * 1.55);

  // Cálculo de Simetría corporal y Segmental
  const seg = medActual.segmental || {
    musculoBD: 3.75, musculoBDPct: 105,
    musculoBI: 3.70, musculoBIPct: 104,
    musculoTR: 27.5, musculoTRPct: 105,
    musculoPD: 9.65, musculoPDPct: 104,
    musculoPI: 9.60, musculoPIPct: 103,
    grasaBD: 1.30, grasaBDPct: 105,
    grasaBI: 1.28, grasaBIPct: 104,
    grasaTR: 8.50, grasaTRPct: 110,
    grasaPD: 2.50, grasaPDPct: 105,
    grasaPI: 2.48, grasaPIPct: 104
  };

  const masaBrazosD = seg.musculoBD ?? 3.75;
  const masaBrazosI = seg.musculoBI ?? 3.70;
  const masaTronco = seg.musculoTR ?? 27.5;
  const masaPiernasD = seg.musculoPD ?? 9.65;
  const masaPiernasI = seg.musculoPI ?? 9.60;
  
  const diffBrazos = Math.abs(masaBrazosD - masaBrazosI);
  const diffPiernas = Math.abs(masaPiernasD - masaPiernasI);
  const esSimetrico = diffBrazos <= 0.3 && diffPiernas <= 0.4;
  const porcentajeSimetria = Math.round(100 - ((diffBrazos + diffPiernas) / (masaBrazosD + masaPiernasD || 1)) * 50);

  const getSegmentalEval = (pct?: number) => {
    if (!pct) return 'Normal';
    if (pct >= 115) return 'Sobre';
    if (pct >= 90) return 'Normal';
    return 'Bajo';
  };

  // Filtrado de planes para el evaluado
  // Planes de nutrición por somatotipo y región
  const planesNutricionUsuario = planesNutricion.filter(
    p => p.region === selectedRegion && (p.somatotipo === somatotipoActual || p.somatotipo === 'Tipo estándar')
  );
  const planNutricionPrincipal = planesNutricionUsuario[0] || planesNutricion[0];

  // Determinación de la ficha de edad del usuario (etiqueta informativa)
  let fichaEdadSugerida = 'Ficha 1 (20 a 30 años)';
  if (edad > 50) fichaEdadSugerida = 'Ficha 4 (Mayor a 50 años)';
  else if (edad > 40) fichaEdadSugerida = 'Ficha 3 (41 a 50 años)';
  else if (edad > 30) fichaEdadSugerida = 'Ficha 2 (31 a 40 años)';

  // Planes compatibles: somatotipo + rango edad + sexo (TODOS o del usuario)
  // Prioriza somatotipo exacto; si no hay, incluye Tipo estándar como fallback
  const planesPorSomatotipoExacto = planesEntrenamiento.filter(
    p =>
      p.somatotipo === somatotipoActual &&
      p.rangoEdadMin <= edad &&
      p.rangoEdadMax >= edad &&
      ((p.sexoDestino || 'TODOS') === 'TODOS' || p.sexoDestino === user.sexo)
  );
  const planesEntrenamientoUsuario =
    planesPorSomatotipoExacto.length > 0
      ? planesPorSomatotipoExacto
      : planesEntrenamiento.filter(
          p =>
            p.somatotipo === 'Tipo estándar' &&
            p.rangoEdadMin <= edad &&
            p.rangoEdadMax >= edad &&
            ((p.sexoDestino || 'TODOS') === 'TODOS' || p.sexoDestino === user.sexo)
        );

  const planEntrenamientoPrincipal =
    planesEntrenamientoUsuario.find(p => p.id === planEntrenoSeleccionadoId) ||
    planesEntrenamientoUsuario[0] ||
    planesEntrenamiento[0];

  const cerrarModalEntrenamiento = () => {
    setModalEntrenamientoAbierto(false);
    setSesionEntrenoIniciada(false);
    setAudioPlaying(false);
  };

  // Grasa visceral: BIEN o MAL
  const grasaVisceralBien = medActual.grasaVisceral <= 9;
  const nombreUnidadLargo = getNombreCompletoUnidad(user.unidadActual);
  const provinciaUnidad = getProvinciaUnidad(user.unidadActual);
  const regionUnidad = getRegionUnidad(user.unidadActual);
  const tituloArma = resolveTituloArma(user);

  return (
    <div className="space-y-8 pb-16">
      
      {/* Botón de Regreso si se está inspeccionando desde otro rol */}
      {onBack && (
        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-blue-400" />
            <span>← Regresar a la Lista Institucional</span>
          </button>
          <span className="text-xs font-semibold text-blue-400">
            Modo Inspección Técnica InBody
          </span>
        </div>
      )}

      {/* CABECERA INSTITUCIONAL DEL EVALUADO */}
      <div className={`${cardCls} rounded-3xl border p-6 sm:p-8 shadow-xl relative overflow-hidden transition-colors duration-300`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                isDark ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                {user.grado}{tituloArma ? ` ${tituloArma}` : ''}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                isDark ? 'bg-slate-950 text-slate-300 border-slate-800' : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}>
                {user.unidadActual}
              </span>
              {user.tipoUsuario && (
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${
                  isDark ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/25' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                }`}>
                  {user.tipoUsuario}
                </span>
              )}
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Ficha: #{user.cedula}
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black border ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-300'
              }`}>
                <span className={isDark ? 'text-white' : 'text-slate-900'}>IN</span>
                <span className="text-blue-500">BODY</span>
                <span className="text-[10px] font-mono text-cyan-400">270S</span>
              </span>
            </div>

            <h1 className={`text-2xl sm:text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {user.nombres} {user.apellidos}
            </h1>

            {(nombreUnidadLargo || provinciaUnidad || regionUnidad) && (
              <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {nombreUnidadLargo && (
                  <div className="max-w-3xl">
                    <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Unidad:</span>{' '}
                    {nombreUnidadLargo}
                  </div>
                )}
                {provinciaUnidad && (
                  <div className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Provincia:</span>{' '}
                    {provinciaUnidad}
                  </div>
                )}
                {regionUnidad && (
                  <div>
                    <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Región:</span>{' '}
                    {regionUnidad}
                  </div>
                )}
              </div>
            )}

            <div className={`flex flex-wrap items-center gap-4 text-xs pt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <div><span className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Cédula:</span> {user.cedula}</div>
              <div><span className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Edad:</span> {edad} años</div>
              <div><span className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Estatura:</span> {medActual.alturaCm} cm</div>
              <div><span className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Sexo:</span> {user.sexo === 'M' ? 'Masculino' : 'Femenino'}</div>
              <div><span className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Última Evaluación:</span> {medMasReciente?.fecha || medActual.fecha}</div>
              <div><span className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Viendo:</span> {medActual.fecha}{safeMedIndex === 0 ? ' (actual)' : ''}</div>
            </div>

            {/* Historial de mediciones InBody */}
            {user.mediciones.length > 0 && (
              <div className={`mt-4 p-3 rounded-2xl border ${
                isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <History className={`w-3.5 h-3.5 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                  <span className={`text-[10px] font-black uppercase tracking-wider ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
                    Historial InBody ({user.mediciones.length} toma{user.mediciones.length === 1 ? '' : 's'})
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {user.mediciones.map((m, i) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMedIndex(i)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                        i === safeMedIndex
                          ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                          : isDark
                            ? 'bg-slate-900 text-slate-300 border-slate-700 hover:border-blue-500/50'
                            : 'bg-white text-slate-700 border-slate-300 hover:border-blue-400'
                      }`}
                    >
                      {i === 0 ? 'Actual · ' : `#${i + 1} · `}{m.fecha}
                      <span className="ml-1.5 opacity-80 font-mono">{m.inbodyScore}</span>
                    </button>
                  ))}
                </div>

                {medAnterior && (
                  <div className={`mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    {[
                      { label: 'Score', actual: medActual.inbodyScore, prev: medAnterior.inbodyScore, better: 'up' as const },
                      { label: 'Peso (kg)', actual: medActual.peso, prev: medAnterior.peso, better: 'down' as const },
                      { label: '% Grasa', actual: medActual.pctGrasa, prev: medAnterior.pctGrasa, better: 'down' as const },
                      { label: 'Músculo (kg)', actual: medActual.musculoKg, prev: medAnterior.musculoKg, better: 'up' as const },
                    ].map((item) => {
                      const delta = Number((item.actual - item.prev).toFixed(1));
                      const improved = item.better === 'up' ? delta > 0 : delta < 0;
                      const worsened = item.better === 'up' ? delta < 0 : delta > 0;
                      const Icon = delta === 0 ? Minus : delta > 0 ? TrendingUp : TrendingDown;
                      return (
                        <div
                          key={item.label}
                          className={`rounded-xl border px-2.5 py-2 ${
                            isDark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white'
                          }`}
                        >
                          <div className={`text-[9px] font-bold uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            vs {medAnterior.fecha}
                          </div>
                          <div className="font-bold mt-0.5">{item.label}</div>
                          <div className={`flex items-center gap-1 mt-0.5 font-mono font-black ${
                            improved ? 'text-emerald-400' : worsened ? 'text-rose-400' : 'text-slate-400'
                          }`}>
                            <Icon className="w-3 h-3" />
                            <span>{delta > 0 ? '+' : ''}{delta}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Peso Actual y Botón de Guía Técnica */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className={`${subCardCls} border p-4 sm:p-5 rounded-2xl flex items-center gap-4`}>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Peso Actual InBody</span>
                <div className={`text-2xl sm:text-3xl font-black font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {medActual.peso.toFixed(1)} <span className="text-sm font-normal text-slate-400">kg</span>
                </div>
                <span className="text-[11px] text-slate-400">
                  Rango sugerido: {medActual.rangoPesoMin} - {medActual.rangoPesoMax} kg
                </span>
              </div>
            </div>

            <button
              onClick={() => setModalGuiaAbierto(true)}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-500/20 cursor-pointer border border-blue-400/30 group"
              title="Abrir Documento Guía Oficial de Parámetros InBody"
            >
              <BookOpen className="w-4 h-4 text-cyan-300 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <span className="block text-[9px] text-blue-200 font-normal normal-case">Manual Técnico</span>
                <span>Documento Guía</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: ANATOMÍA Y SILUETA CORPORAL INBODY */}
      <div className={`${cardCls} rounded-3xl border p-6 sm:p-8 shadow-xl space-y-6 transition-colors duration-300`}>
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-black uppercase tracking-wider text-cyan-500 dark:text-cyan-400">
                Análisis Anatómico Visual
              </span>
            </div>
            <h2 className={`text-xl sm:text-2xl font-black mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Anatomía y Siluetas InBody • Comparación Dual
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Tu somatotipo actual al lado de la meta ideal, con semaforización visual de impacto.
            </p>
          </div>

          <div className={`flex items-center gap-1 p-1.5 rounded-2xl border shrink-0 ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <span className={`text-xs font-bold px-2 flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <Users className="w-3.5 h-3.5 text-cyan-500" />
              <span className="hidden sm:inline">Ver Siluetas:</span>
            </span>
            <button
              onClick={() => setSelectedGender('M')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                selectedGender === 'M'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>♂ Masculino</span>
            </button>
            <button
              onClick={() => setSelectedGender('F')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                selectedGender === 'F'
                  ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>♀ Femenino</span>
            </button>
          </div>
        </div>

        {/* Primero: 2 siluetas | Luego: texto de métricas */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => setModalSomatotipo(defActual)}
              className={`rounded-3xl border-4 p-4 flex flex-col items-center cursor-pointer transition-all hover:scale-[1.01] shadow-xl ring-2 ${actualRing} ${
                isDark ? 'bg-slate-950/90' : 'bg-white'
              }`}
              title="Tu somatotipo actual — clic para ficha médica"
            >
              <div className="w-full max-w-[320px] h-80 sm:h-[22rem] flex items-center justify-center">
                <img
                  src={siluetaActualUrl}
                  alt={somatotipoActual}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain drop-shadow-2xl"
                />
              </div>
              <div className="w-full flex items-center justify-between gap-2 mt-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-500 block">Tu silueta actual</span>
                  <h3 className={`text-sm sm:text-base font-black leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {somatotipoActual}
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-600 text-white shrink-0">Sistema</span>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setModalSomatotipo(defActual); }}
                className="mt-2 text-[10px] font-bold text-blue-500 hover:text-blue-400 underline cursor-pointer"
              >
                Ficha Médica
              </button>
            </div>

            <div
              onClick={() => setModalSomatotipo(defIdeal)}
              className={`rounded-3xl border-4 p-4 flex flex-col items-center cursor-pointer transition-all hover:scale-[1.01] shadow-xl ring-2 ${idealRing} ${
                isDark ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/40' : 'bg-gradient-to-br from-cyan-50 via-white to-blue-50'
              }`}
              title="Somatotipo meta ideal — clic para ficha médica"
            >
              <div className="w-full max-w-[320px] h-80 sm:h-[22rem] flex items-center justify-center">
                <img
                  src={siluetaIdealUrl}
                  alt={somatotipoIdealNombre}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain drop-shadow-[0_8px_24px_rgba(6,182,212,0.35)]"
                />
              </div>
              <div className="w-full flex items-center justify-between gap-2 mt-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-cyan-500 block">Meta ideal</span>
                  <h3 className={`text-sm sm:text-base font-black leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {somatotipoIdealNombre}
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shrink-0">Objetivo</span>
              </div>
              <p className={`mt-2 text-[11px] text-center leading-snug ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {medActual.controlGrasa < 0
                  ? `Bajar ${Math.abs(medActual.controlGrasa)} kg grasa`
                  : 'Mantener grasa'}
                {' · '}
                {medActual.controlMuscular > 0
                  ? `Ganar +${medActual.controlMuscular} kg músculo`
                  : 'Consolidar músculo'}
              </p>
            </div>
          </div>

          {/* Luego el texto: grasa / músculo / simetría */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between gap-2">
                <span className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <Flame className="w-4 h-4 text-rose-400" />
                  <span>Grasa Corporal</span>
                </span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                  medActual.pctGrasa < 18 ? 'bg-emerald-500/20 text-emerald-400' :
                  medActual.pctGrasa <= 24 ? 'bg-amber-500/20 text-amber-400' :
                  'bg-rose-500/20 text-rose-400'
                }`}>
                  {medActual.pctGrasa < 18 ? 'Magro' : medActual.pctGrasa <= 24 ? 'Controlado' : 'Exceso'}
                </span>
              </div>
              <div className={`text-lg font-black font-mono mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {medActual.grasaKg.toFixed(1)} kg ({medActual.pctGrasa.toFixed(1)}%)
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                {medActual.pctGrasa < 18
                  ? 'Nivel magro y atlético, excelente control de tejido graso.'
                  : medActual.pctGrasa <= 24
                  ? 'Nivel saludable y controlado dentro de los estándares operativos.'
                  : 'Porcentaje elevado; se recomienda reducir tejido graso con la pauta nutricional.'}
              </p>
            </div>

            <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between gap-2">
                <span className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <Dumbbell className="w-4 h-4 text-blue-400" />
                  <span>Músculo Esquelético</span>
                </span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                  medActual.musculoKg >= medActual.rangoSmmMin ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {medActual.musculoKg >= medActual.rangoSmmMin ? 'Sólido' : 'Potenciar'}
                </span>
              </div>
              <div className={`text-lg font-black font-mono mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {medActual.musculoKg.toFixed(1)} kg
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                {medActual.musculoKg >= medActual.rangoSmmMin
                  ? 'Buena base de fuerza esquelética y tono muscular para tareas físicas.'
                  : 'Masa muscular en rango a potenciar con entrenamiento progresivo.'}
              </p>
            </div>

            <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between gap-2">
                <span className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Simetría Corporal</span>
                </span>
                <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  {porcentajeSimetria}% Equilibrio
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                {esSimetrico
                  ? 'Excelente equilibrio entre tu lado izquierdo y derecho (brazos y piernas nivelados).'
                  : 'Ligera variación entre extremidades; se recomienda trabajo unilateral compensatorio.'}
              </p>
            </div>
          </div>
        </div>

        {/* Debajo de las 2 siluetas: 5 segmentos */}
        <div className={`pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Distribución en los 5 Segmentos Corporales:
            </span>
            <span className="text-[10px] text-blue-500 dark:text-blue-400 font-bold flex items-center gap-1">
              <span>Haz clic en una zona para ver su diagnóstico</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>
          <div className="grid grid-cols-5 gap-2 text-center">
            <button
              onClick={() => setSegmentoSeleccionado('BD')}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                segmentoSeleccionado === 'BD'
                  ? 'bg-blue-600/20 border-blue-500 ring-2 ring-blue-500 shadow-md'
                  : isDark ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-slate-100 border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className="text-[9px] text-slate-400 block font-semibold">Brazo Der.</span>
              <span className={`text-xs font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{masaBrazosD.toFixed(2)} kg</span>
              <span className="text-[9px] text-emerald-400 block font-black">Normal</span>
            </button>
            <button
              onClick={() => setSegmentoSeleccionado('BI')}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                segmentoSeleccionado === 'BI'
                  ? 'bg-blue-600/20 border-blue-500 ring-2 ring-blue-500 shadow-md'
                  : isDark ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-slate-100 border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className="text-[9px] text-slate-400 block font-semibold">Brazo Izq.</span>
              <span className={`text-xs font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{masaBrazosI.toFixed(2)} kg</span>
              <span className="text-[9px] text-emerald-400 block font-black">Normal</span>
            </button>
            <button
              onClick={() => setSegmentoSeleccionado('TR')}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                segmentoSeleccionado === 'TR'
                  ? 'bg-blue-600/20 border-blue-500 ring-2 ring-blue-500 shadow-md'
                  : isDark ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-slate-100 border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className="text-[9px] text-slate-400 block font-semibold">Tronco</span>
              <span className={`text-xs font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{masaTronco.toFixed(1)} kg</span>
              <span className="text-[9px] text-emerald-400 block font-black">Óptimo</span>
            </button>
            <button
              onClick={() => setSegmentoSeleccionado('PD')}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                segmentoSeleccionado === 'PD'
                  ? 'bg-blue-600/20 border-blue-500 ring-2 ring-blue-500 shadow-md'
                  : isDark ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-slate-100 border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className="text-[9px] text-slate-400 block font-semibold">Pierna Der.</span>
              <span className={`text-xs font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{masaPiernasD.toFixed(2)} kg</span>
              <span className="text-[9px] text-emerald-400 block font-black">Normal</span>
            </button>
            <button
              onClick={() => setSegmentoSeleccionado('PI')}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                segmentoSeleccionado === 'PI'
                  ? 'bg-blue-600/20 border-blue-500 ring-2 ring-blue-500 shadow-md'
                  : isDark ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-slate-100 border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className="text-[9px] text-slate-400 block font-semibold">Pierna Izq.</span>
              <span className={`text-xs font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{masaPiernasI.toFixed(2)} kg</span>
              <span className="text-[9px] text-emerald-400 block font-black">Normal</span>
            </button>
          </div>

          {(() => {
            const infoSeg = {
              BD: {
                nombre: 'Brazo Derecho (Miembro Superior)',
                musculo: masaBrazosD,
                musculoPct: seg.musculoBDPct ?? 105,
                grasa: seg.grasaBD ?? 1.30,
                evaluacion: 'Masa magra adecuada para empuje, tiro táctico y transporte de armamento militar.',
                ejercicio: 'Dominadas con agarre supino, fondos en paralelas y press de banca.',
                simetriaVsOpuesto: `${Math.abs(masaBrazosD - masaBrazosI).toFixed(2)} kg de diferencia vs Brazo Izquierdo.`,
              },
              BI: {
                nombre: 'Brazo Izquierdo (Miembro Superior)',
                musculo: masaBrazosI,
                musculoPct: seg.musculoBIPct ?? 104,
                grasa: seg.grasaBI ?? 1.28,
                evaluacion: 'Excelente tono y simetría bilateral con el brazo dominante.',
                ejercicio: 'Flexiones asimétricas, curl unilateral con mancuerna y remo con polea.',
                simetriaVsOpuesto: `${Math.abs(masaBrazosD - masaBrazosI).toFixed(2)} kg de diferencia vs Brazo Derecho.`,
              },
              TR: {
                nombre: 'Tronco y Zona Media (Core & Columna)',
                musculo: masaTronco,
                musculoPct: seg.musculoTRPct ?? 105,
                grasa: seg.grasaTR ?? 8.50,
                evaluacion: 'Núcleo vertebral y caja torácica con densidad muscular sólida para soportar chaleco táctico y carga.',
                ejercicio: 'Planchas militares isométricas (2 min), elevación de piernas colgado y peso muerto.',
                simetriaVsOpuesto: 'Eje axial central. Estabilidad y soporte de carga a las cuatro extremidades.',
              },
              PD: {
                nombre: 'Pierna Derecha (Tren Inferior)',
                musculo: masaPiernasD,
                musculoPct: seg.musculoPDPct ?? 104,
                grasa: seg.grasaPD ?? 2.50,
                evaluacion: 'Potencia de propulsión y amortiguación para marcha con mochila y zancadas continuas.',
                ejercicio: 'Sentadilla búlgara, zancadas tácticas con sobrecarga y prensa inclinada.',
                simetriaVsOpuesto: `${Math.abs(masaPiernasD - masaPiernasI).toFixed(2)} kg de diferencia vs Pierna Izquierda.`,
              },
              PI: {
                nombre: 'Pierna Izquierda (Tren Inferior)',
                musculo: masaPiernasI,
                musculoPct: seg.musculoPIPct ?? 103,
                grasa: seg.grasaPI ?? 2.48,
                evaluacion: 'Soporte estructural sólido y equilibrio neuromuscular en zancada y saltos.',
                ejercicio: 'Sentadilla goblet profunda, saltos pliométricos y subida al banco militar con carga.',
                simetriaVsOpuesto: `${Math.abs(masaPiernasD - masaPiernasI).toFixed(2)} kg de diferencia vs Pierna Derecha.`,
              },
            }[segmentoSeleccionado];

            return (
              <div className={`mt-3 p-3.5 rounded-2xl border transition-all animate-in fade-in ${
                isDark ? 'bg-slate-900/90 border-blue-500/30' : 'bg-blue-50/80 border-blue-200 shadow-sm'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b pb-2 border-slate-700/50 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                      Diagnóstico: {infoSeg.nombre}
                    </span>
                  </div>
                  <span className={`text-xs font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {infoSeg.musculo.toFixed(2)} kg músculo ({infoSeg.musculoPct}% estándar) • {infoSeg.grasa.toFixed(2)} kg grasa
                  </span>
                </div>
                <p className={`text-xs mt-2 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {infoSeg.evaluacion}
                </p>
                <div className={`mt-2.5 pt-2 border-t flex flex-col sm:flex-row sm:items-center justify-between text-[11px] gap-2 ${
                  isDark ? 'border-slate-800 text-slate-400' : 'border-blue-100 text-slate-600'
                }`}>
                  <div>
                    <strong className="text-blue-500 dark:text-blue-400">Entrenamiento prescrito:</strong> {infoSeg.ejercicio}
                  </div>
                  <div className="text-cyan-600 dark:text-cyan-400 font-semibold shrink-0">
                    {infoSeg.simetriaVsOpuesto}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* SECCIÓN 1: SISTEMA DE 3 NIVELES (70% IZQUIERDA / 30% SEMÁFORO DERECHA) */}
      <div className={`${cardCls} rounded-3xl border p-6 sm:p-8 shadow-xl space-y-4 transition-colors duration-300`}>
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-black uppercase tracking-wider text-amber-400">
              Calificación Antropométrica Institucional
            </span>
          </div>
          <h2 className={`text-xl sm:text-2xl font-black mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Sistema de Rangos y Nivel de Condición Física
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch pt-2">
          
          {/* LADO IZQUIERDO: score + medalla + soldado sobre barra */}
          <div className={`lg:col-span-8 ${subCardCls} border rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-5`}>
            
            <div>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${nivelColorClass}`}>
                      {nivelTexto}
                    </span>
                    <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      InBody Score Global
                    </span>
                  </div>

                  <div className="mt-4 flex items-baseline gap-3">
                    <span className={`text-5xl sm:text-6xl font-black font-mono tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {score}
                    </span>
                    <span className="text-xl sm:text-2xl text-slate-400 font-bold">/ 100 pts</span>
                  </div>
                </div>

                {/* Medalla de nivel + etiqueta */}
                <div className="flex flex-col items-center shrink-0 self-center sm:self-start sm:pt-1">
                  <div className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 ${
                    nivelNumero === 3
                      ? 'shadow-[0_0_28px_rgba(16,185,129,0.35)]'
                      : nivelNumero === 2
                        ? 'shadow-[0_0_28px_rgba(245,158,11,0.35)]'
                        : 'shadow-[0_0_28px_rgba(244,63,94,0.35)]'
                  }`}>
                    <img
                      src={medallaUrl}
                      alt={`Medalla Nivel ${nivelNumero}`}
                      className="w-full h-full object-contain drop-shadow-xl"
                    />
                  </div>

                  {nivelNumero === 3 ? (
                    <span className="mt-2 text-sm sm:text-base font-black tracking-wide text-emerald-400 text-center max-w-[11rem] leading-tight">
                      {etiquetaMedallaNivel3 || 'EXCELENTE'}
                    </span>
                  ) : (
                    <div className={`mt-2 inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-black uppercase tracking-wide ${
                      nivelNumero === 2 ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        nivelNumero === 2 ? 'bg-amber-400 inbody-pulse-warn' : 'bg-rose-500 inbody-pulse-danger'
                      }`} />
                      <span>{nivelTexto}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Barra con silueta soldado sobre el puntaje */}
              <div className="mt-6 relative pt-20 sm:pt-24">
                <div
                  className="absolute bottom-7 z-20 pointer-events-none transition-all duration-700"
                  style={{
                    left: `clamp(1.5rem, ${scoreBarPct}%, calc(100% - 1.5rem))`,
                    transform: 'translateX(-50%)',
                  }}
                >
                  <img
                    src={soldadoUrl}
                    alt={`Soldado Nivel ${nivelNumero}`}
                    className={`h-20 sm:h-24 w-auto object-contain drop-shadow-[0_0_14px_rgba(0,0,0,0.55)] ${
                      nivelNumero === 3
                        ? 'drop-shadow-[0_0_18px_rgba(16,185,129,0.55)]'
                        : nivelNumero === 2
                          ? 'drop-shadow-[0_0_18px_rgba(245,158,11,0.45)]'
                          : 'drop-shadow-[0_0_18px_rgba(244,63,94,0.45)]'
                    }`}
                  />
                </div>

                <div className={`w-full h-4 rounded-full overflow-visible p-0.5 border relative ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-200 border-slate-300'}`}>
                  <div className="absolute left-[35%] top-1/2 -translate-y-1/2 -translate-x-1/2 z-10" title="Zona Nivel 1">
                    <span className={`block w-3 h-3 rounded-full border-2 border-white/80 ${
                      nivelNumero === 1 ? 'bg-rose-500 inbody-pulse-danger' : 'bg-rose-500/50'
                    }`} />
                  </div>
                  <div className="absolute left-[70%] top-1/2 -translate-y-1/2 -translate-x-1/2 z-10" title="Límite Nivel 2 (70 pts)">
                    <span className={`block w-3 h-3 rounded-full border-2 border-white/80 ${
                      nivelNumero === 2 ? 'bg-amber-400 inbody-pulse-warn' : 'bg-amber-500/70'
                    }`} />
                  </div>
                  <div className="absolute left-[85%] top-1/2 -translate-y-1/2 -translate-x-1/2 z-10" title="Límite Nivel 3 (85 pts)">
                    {nivelNumero === 3 ? (
                      <Star className="w-4 h-4 text-emerald-400 fill-emerald-400 -mt-0.5" />
                    ) : (
                      <span className="block w-3 h-3 rounded-full border-2 border-white/80 bg-emerald-500/70" />
                    )}
                  </div>

                  <div
                    className={`h-full rounded-full transition-all duration-1000 relative overflow-hidden ${
                      nivelNumero === 3 ? 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.45)]' :
                      nivelNumero === 2 ? 'bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.4)]' :
                      'bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_16px_rgba(244,63,94,0.4)]'
                    }`}
                    style={{ width: `${scoreBarPct}%` }}
                  />

                  {/* Marcador blanco en el puntaje actual */}
                  <div
                    className="absolute top-1/2 z-20 w-3.5 h-3.5 rounded-full bg-white border-2 border-slate-900 shadow-md"
                    style={{
                      left: `${scoreBarPct}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                </div>

                <div className="flex justify-between text-[11px] font-bold px-1 gap-2 mt-2">
                  <span className={`inline-flex items-center gap-1.5 ${nivelNumero === 1 ? 'text-rose-400' : 'text-rose-500/70'}`}>
                    <span className={`w-2.5 h-2.5 rounded-full bg-rose-500 ${nivelNumero === 1 ? 'inbody-pulse-danger' : ''}`} />
                    {nivelNumero === 1 ? <span className="font-black uppercase tracking-wide">Peligro</span> : <span>Nivel 1</span>}
                    <span className="opacity-70">0-69</span>
                  </span>
                  <span className={`inline-flex items-center gap-1.5 ${nivelNumero === 2 ? 'text-amber-400' : 'text-amber-500/70'}`}>
                    <span className={`w-2.5 h-2.5 rounded-full bg-amber-500 ${nivelNumero === 2 ? 'inbody-pulse-warn' : ''}`} />
                    {nivelNumero === 2 ? <span className="font-black uppercase tracking-wide">Moderado</span> : <span>Nivel 2</span>}
                    <span className="opacity-70">70-84</span>
                  </span>
                  <span className={`inline-flex items-center gap-1.5 ${nivelNumero === 3 ? 'text-emerald-400' : 'text-emerald-500/70'}`}>
                    {nivelNumero === 3 ? (
                      <Star className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    )}
                    {nivelNumero === 3 ? <span className="font-black uppercase tracking-wide">Excelente</span> : <span>Nivel 3</span>}
                    <span className="opacity-70">85-100</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Puntos faltantes y Frase Motivacional / Frase Guía */}
            <div className={`border rounded-2xl p-4 sm:p-5 space-y-3 ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-cyan-500 shrink-0" />
                <span className="text-xs font-black uppercase tracking-wider text-cyan-600 dark:text-cyan-300">
                  {puntosFaltantesTexto}
                </span>
              </div>

              <p className={`text-xs sm:text-sm leading-relaxed italic border-l-2 border-cyan-500 pl-3 ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}>
                "{fraseGuia}"
              </p>
            </div>

          </div>

          {/* LADO DERECHO: 30% (COL-SPAN-4) - SEMÁFORO DE 3 NIVELES CON RESUMEN E INDICADOR */}
          <div className={`lg:col-span-4 ${subCardCls} border rounded-3xl p-5 sm:p-6 flex flex-col justify-between space-y-4`}>
            
            <div className={`border-b pb-2 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Semáforo Institucional
              </span>
              <h3 className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Distribución de los 3 Niveles
              </h3>
            </div>

            <div className="space-y-3">
              
              {/* NIVEL 3: ALTO (VERDE) */}
              <div className={`p-3 rounded-2xl border transition-all ${
                nivelNumero === 3
                  ? 'bg-emerald-500/15 border-emerald-500/60 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500'
                  : isDark ? 'bg-slate-900/60 border-slate-800 opacity-60' : 'bg-white border-slate-200 opacity-60'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                    <span className="text-xs font-black text-emerald-500">NIVEL 3 | ALTO</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-400">85 - 100 pts</span>
                </div>
                <p className={`text-[11px] mt-1.5 leading-snug ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  Nivel óptimo sobresaliente. Excelente equilibrio corporal, masa muscular sólida y máxima resistencia táctica.
                </p>
                {nivelNumero === 3 && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-[10px] font-black uppercase">
                    <span>👉 ESTÁS EN ESTE NIVEL</span>
                  </div>
                )}
              </div>

              {/* NIVEL 2: MEDIO (AMARILLO / ÁMBAR) */}
              <div className={`p-3 rounded-2xl border transition-all ${
                nivelNumero === 2
                  ? 'bg-amber-500/15 border-amber-500/60 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500'
                  : isDark ? 'bg-slate-900/60 border-slate-800 opacity-60' : 'bg-white border-slate-200 opacity-60'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
                    <span className="text-xs font-black text-amber-500">NIVEL 2 | MEDIO</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-400">70 - 84 pts</span>
                </div>
                <p className={`text-[11px] mt-1.5 leading-snug ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  Nivel intermedio aceptable. Mantiene bases operativas con oportunidad de reducir grasa y tonificar masa muscular.
                </p>
                {nivelNumero === 2 && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-300 text-[10px] font-black uppercase">
                    <span>👉 ESTÁS EN ESTE NIVEL</span>
                  </div>
                )}
              </div>

              {/* NIVEL 1: BAJO (ROJO) */}
              <div className={`p-3 rounded-2xl border transition-all ${
                nivelNumero === 1
                  ? 'bg-rose-500/15 border-rose-500/60 shadow-lg shadow-rose-500/10 ring-1 ring-rose-500'
                  : isDark ? 'bg-slate-900/60 border-slate-800 opacity-60' : 'bg-white border-slate-200 opacity-60'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
                    <span className="text-xs font-black text-rose-500">NIVEL 1 | BAJO</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-400">&lt; 70 pts</span>
                </div>
                <p className={`text-[11px] mt-1.5 leading-snug ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  Requiere atención y reacondicionamiento prioritario para recuperar estándares de salud y capacidad operativa.
                </p>
                {nivelNumero === 1 && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-600 dark:text-rose-300 text-[10px] font-black uppercase">
                    <span>👉 ESTÁS EN ESTE NIVEL</span>
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>
      </div>

      {/* SECCIÓN BIOLÓGICA: EDAD CORPORAL & FACTORES DETERMINANTES */}
      <EdadCorporalCard
        medicion={medActual}
        edadCronologica={edad}
      />

      {/* SECCIÓN 3: MATRIZ DE SOMATOTIPOS — OCULTA POR DEFECTO (solo info) */}
      <div className={`${cardCls} rounded-3xl border shadow-xl transition-colors duration-300 overflow-hidden`}>
        <button
          type="button"
          onClick={() => setMatrizSomatotiposAbierta(v => !v)}
          className={`w-full flex items-center justify-between gap-3 p-5 sm:p-6 text-left cursor-pointer ${
            isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
          }`}
        >
          <div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-black uppercase tracking-wider text-blue-500">
                Información opcional
              </span>
            </div>
            <h2 className={`text-lg sm:text-xl font-black mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Matriz de Somatotipos 3×3
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {matrizSomatotiposAbierta
                ? 'Haz clic para ocultar esta referencia'
                : 'Pulsa para ver las 9 siluetas y protocolos (no es obligatorio)'}
            </p>
          </div>
          <ChevronDown className={`w-5 h-5 shrink-0 transition-transform ${matrizSomatotiposAbierta ? 'rotate-180' : ''} ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
        </button>

        {matrizSomatotiposAbierta && (
          <div className={`px-5 sm:px-6 pb-6 space-y-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <p className={`text-xs pt-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Siluetas {selectedGender === 'M' ? 'Masculinas' : 'Femeninas'} — haz clic en cualquier tipo para su ficha.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {Object.values(DEFINICIONES_SOMATOTIPOS).map((def) => {
                const isUserCurrent = def.nombre === somatotipoActual;
                const isUserIdeal = def.nombre === somatotipoIdealNombre;
                const imagenThumb = MAPEO_SOMATOTIPOS[def.nombre]?.[selectedGender];

                return (
                  <button
                    key={def.clave}
                    onClick={() => setModalSomatotipo(def)}
                    className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between group ${
                      isUserCurrent
                        ? 'bg-blue-600/15 border-blue-500 ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/10'
                        : isUserIdeal
                        ? 'bg-cyan-500/10 border-cyan-500/40 hover:border-cyan-500'
                        : isDark ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">{def.clave}</span>
                        {isUserCurrent && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-500 text-white shadow-sm">
                            Tu Posición
                          </span>
                        )}
                        {!isUserCurrent && isUserIdeal && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                            Meta Ideal
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        {imagenThumb && (
                          <div className="w-14 h-20 bg-slate-900 rounded-xl border border-slate-800 p-1 flex items-center justify-center shrink-0">
                            <img
                              src={imagenThumb}
                              alt={def.nombre}
                              referrerPolicy="no-referrer"
                              className="max-h-full max-w-full object-contain filter drop-shadow"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-xs font-black leading-snug truncate ${isUserCurrent ? 'text-blue-400' : 'text-slate-200'}`}>
                            {def.nombre}
                          </h4>
                          <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                            {def.descripcion}
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* SECCIÓN 4: 2 APARTADOS DIRECTOS - PLAN DE ENTRENAMIENTO Y PLAN DE NUTRICIÓN */}
      <div className="space-y-4">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-emerald-500">
            Prescripción Personalizada Directa
          </span>
          <h2 className={`text-xl sm:text-2xl font-black mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Planes de Entrenamiento & Nutrición Asignados
          </h2>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Accede a las directrices de tu entrenador físico y nutricionista según tu somatotipo ({somatotipoActual}), edad y región.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* APARTADO 1: PLAN DE ENTRENAMIENTO */}
          <div className={`${cardCls} rounded-3xl border overflow-hidden shadow-xl flex flex-col justify-between transition-all group`}>
            <div>
              <div className="relative h-48 w-full overflow-hidden bg-slate-950">
                <img
                  src={planEntrenamientoPrincipal.portadaUrl || planEntrenamientoPrincipal.imagenUrl}
                  alt={planEntrenamientoPrincipal.nombre}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/40" />

                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/30 text-blue-200 border border-blue-500/40 backdrop-blur-md">
                    🏋️ Plan de Entrenamiento
                  </span>
                  <span className="text-[10px] font-bold text-white bg-slate-950/80 px-2.5 py-1 rounded-full border border-slate-700 backdrop-blur-md">
                    {fichaEdadSugerida}
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 right-3">
                  <span className="text-xs font-bold text-white bg-slate-900/90 px-3 py-1 rounded-xl border border-slate-700/80 backdrop-blur">
                    {planEntrenamientoPrincipal.diasPorSemana || 4} sesiones por semana
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-3">
                <h3 className={`text-lg font-black leading-snug group-hover:text-blue-500 transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {planEntrenamientoPrincipal.nombre}
                </h3>

                <p className={`text-xs leading-relaxed line-clamp-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  {planEntrenamientoPrincipal.descripcion}
                </p>

                {planEntrenamientoPrincipal.ejerciciosClave && (
                  <div className={`pt-2 border-t space-y-1 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Ejercicios destacados:
                    </span>
                    <ul className={`text-xs space-y-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {planEntrenamientoPrincipal.ejerciciosClave.slice(0, 2).map((ej, idx) => (
                        <li key={idx} className="flex items-center gap-1.5 line-clamp-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                          <span>{ej}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className={`p-5 border-t ${isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              {planesEntrenamientoUsuario.length > 1 && (
                <p className={`text-[10px] mb-2 text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {planesEntrenamientoUsuario.length} planes disponibles para tu somatotipo / edad / sexo — elige al abrir
                </p>
              )}
              <button
                onClick={() => {
                  setPlanEntrenoSeleccionadoId(planesEntrenamientoUsuario[0]?.id || null);
                  setSesionEntrenoIniciada(false);
                  setAudioPlaying(false);
                  setAudioMuted(false);
                  setModalEntrenamientoAbierto(true);
                }}
                className="w-full py-3 px-5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
              >
                <span>Abrir Plan de Entrenamiento</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* APARTADO 2: PLAN DE NUTRICIÓN */}
          <div className={`${cardCls} rounded-3xl border overflow-hidden shadow-xl flex flex-col justify-between transition-all group`}>
            <div>
              <div className="relative h-48 w-full overflow-hidden bg-slate-950">
                <img
                  src={planNutricionPrincipal.imagenUrl}
                  alt={planNutricionPrincipal.nombre}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/40" />

                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 backdrop-blur-md">
                    🥗 Plan de Nutrición
                  </span>
                  <span className="text-[10px] font-bold text-white bg-slate-950/80 px-2.5 py-1 rounded-full border border-slate-700 backdrop-blur-md">
                    📍 {selectedRegion}
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 right-3">
                  <span className="text-xs font-bold text-white bg-slate-900/90 px-3 py-1 rounded-xl border border-slate-700/80 backdrop-blur">
                    {planNutricionPrincipal.caloriasAprox || 2150} kcal / día
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-3">
                <h3 className={`text-lg font-black leading-snug group-hover:text-emerald-500 transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {planNutricionPrincipal.nombre}
                </h3>

                <p className={`text-xs leading-relaxed line-clamp-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  {planNutricionPrincipal.descripcion}
                </p>

                {/* Macros rápidos */}
                <div className={`grid grid-cols-3 gap-2 pt-2 border-t text-center ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                  <div className={`p-2 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <span className="text-[9px] text-rose-500 font-bold block uppercase">Proteínas</span>
                    <span className={`text-xs font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{planNutricionPrincipal.proteinasG || 140}g</span>
                  </div>
                  <div className={`p-2 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <span className="text-[9px] text-blue-500 font-bold block uppercase">Carbos</span>
                    <span className={`text-xs font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{planNutricionPrincipal.carbosG || 210}g</span>
                  </div>
                  <div className={`p-2 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <span className="text-[9px] text-emerald-500 font-bold block uppercase">Grasas</span>
                    <span className={`text-xs font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{planNutricionPrincipal.grasasG || 55}g</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={`p-5 border-t ${isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <button
                onClick={() => setModalNutricionAbierto(true)}
                className="w-full py-3 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <span>Abrir Plan de Nutrición</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* SECCIÓN 5: PARÁMETROS METABÓLICOS & CONTROL */}
      <div className={`${cardCls} rounded-3xl border p-6 sm:p-8 shadow-xl space-y-6 transition-colors duration-300`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-500" />
              <span className="text-xs font-black uppercase tracking-wider text-cyan-500">
                Metabolismo & Directrices Operativas
              </span>
            </div>
            <h2 className={`text-xl sm:text-2xl font-black mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Parámetros Metabólicos & Metas de Control
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Metas cuantitativas claras para regular grasa y masa muscular según tu gasto calórico.
            </p>
          </div>
          <span className="text-[11px] font-bold text-blue-500 dark:text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-xl border border-blue-500/20 self-start sm:self-auto">
            💡 Haz clic en cada tarjeta para consultar su desglose clínico
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          
          {/* 1. Grasa Visceral */}
          <div 
            onClick={() => setMetabolicoModal({
              titulo: 'Grasa Visceral en Órganos Vitales',
              valor: `Nivel ${medActual.grasaVisceral}`,
              subvalor: grasaVisceralBien ? 'Nivel Saludable (≤ 9)' : 'Nivel de Riesgo (> 9)',
              estado: grasaVisceralBien ? 'BIEN (Protección Órganos)' : 'ATENCIÓN (Riesgo Metabólico)',
              estadoColor: grasaVisceralBien ? 'text-emerald-400' : 'text-rose-400',
              descripcion: 'Es la capa de tejido adiposo profundo que rodea el hígado, corazón e intestinos dentro de la cavidad abdominal. A diferencia de la grasa subcutánea visible bajo la piel, la grasa visceral produce citoquinas proinflamatorias que incrementan la resistencia a la insulina y la tensión arterial.',
              significadoMilitar: 'En maniobras de combate y marchas de campaña, mantener este valor menor a 9 garantiza una función respiratoria y diafragmática sin sobrepresión interna, previniendo la fatiga temprana y el riesgo cardiovascular en personal operativo.',
              consejo: 'Prioriza fibra hidrosoluble (avena, verduras de hoja verde), elimina azúcares refinados y alcohol, e integra 2 sesiones semanales de trote o natación continua en Zona 2 (45 min).'
            })}
            className={`rounded-2xl p-5 space-y-3 border transition-all cursor-pointer group hover:scale-[1.02] ${
              isDark 
                ? 'bg-slate-950/80 border-slate-800 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/5' 
                : 'bg-slate-50 border-slate-200 hover:border-emerald-500 hover:shadow-md'
            }`}
            title="Haz clic para consultar la ficha clínica de la grasa visceral"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Grasa Visceral en Órganos
              </span>
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 transition-colors" />
            </div>
            <div className={`text-3xl font-black font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Nivel {medActual.grasaVisceral}
            </div>
            
            <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
              grasaVisceralBien 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}>
              {grasaVisceralBien ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <div className="text-xs font-bold leading-tight">
                {grasaVisceralBien 
                  ? 'Estado: BIEN (Saludable, órganos protegidos)' 
                  : 'Estado: MAL (Nivel elevado, requiere atención)'}
              </div>
            </div>
            <p className="text-[11px] text-blue-500 dark:text-blue-400 font-semibold pt-1">
              Ver detalle y protocolo clínico &rarr;
            </p>
          </div>

          {/* 2. Tasa Metabólica Basal (TMB) */}
          <div 
            onClick={() => setMetabolicoModal({
              titulo: 'Tasa Metabólica Basal (TMB)',
              valor: `${medActual.tmb} kcal/día`,
              subvalor: 'Gasto metabólico en reposo absoluto (24 hrs)',
              estado: 'Motor Celular Activo',
              estadoColor: 'text-amber-400',
              descripcion: 'Representa la cantidad exacta de calorías que tu organismo quema únicamente para sostener las funciones vitales (latidos cardíacos, respiración celular, filtrado renal y termorregulación) mientras descansas sin moverte.',
              significadoMilitar: 'El tejido muscular es el mayor demandante de energía metabólica. A mayor masa esquelética, mayor será tu TMB, lo que te permite quemar más energía incluso durante periodos de descanso, patrullaje vehicular o guardias pasivas.',
              consejo: `Nunca ingieras un total calórico inferior a tu TMB (${medActual.tmb} kcal). Si consumes menos de este piso basal, el cuerpo activará el modo de supervivencia, ralentizará el metabolismo y consumirá tu propia masa muscular para obtener energía.`
            })}
            className={`rounded-2xl p-5 space-y-3 border transition-all cursor-pointer group hover:scale-[1.02] ${
              isDark 
                ? 'bg-slate-950/80 border-slate-800 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/5' 
                : 'bg-slate-50 border-slate-200 hover:border-amber-500 hover:shadow-md'
            }`}
            title="Haz clic para consultar la tasa metabólica basal"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Tasa Metabólica Basal (TMB)
              </span>
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400 transition-colors" />
            </div>
            <div className={`text-3xl font-black font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {medActual.tmb} <span className="text-sm font-normal text-slate-400">kcal</span>
            </div>
            <p className="text-xs text-slate-400 leading-snug">
              Calorías mínimas que quema tu cuerpo en reposo absoluto (cuando no haces ejercicio, solo para mantenerte con vida).
            </p>
            <p className="text-[11px] text-blue-500 dark:text-blue-400 font-semibold pt-1">
              Ver cálculo y recomendaciones &rarr;
            </p>
          </div>

          {/* 3. Ingesta Calórica Meta */}
          <div 
            onClick={() => setMetabolicoModal({
              titulo: 'Ingesta Calórica Meta Diaria Recomendada',
              valor: `${ingestaCaloricaMeta} kcal/día`,
              subvalor: `TMB Basal (${medActual.tmb} kcal) + Gasto Deportivo (+${ingestaCaloricaMeta - medActual.tmb} kcal)`,
              estado: 'Combustible Óptimo de Rendimiento',
              estadoColor: 'text-cyan-400',
              descripcion: 'Es el volumen energético total recomendado para cubrir tu gasto basal más el desgaste físico de instrucción militar, trote, entrenamiento de fuerza y actividades de unidad.',
              significadoMilitar: 'Asegura que tus depósitos de glucógeno muscular permanezcan llenos para ejercicios tácticos de alta intensidad, facilitando una rápida síntesis proteica post-entrenamiento y evitando el catabolismo.',
              consejo: 'Distribución macro recomendada: 25-30% Proteínas de alto valor biológico (pollo, pescado, huevos), 50% Carbohidratos complejos regionales (plátano verde, papa, yuca, arroz) y 20-25% Grasas saludables (aguacate, aceite de oliva, frutos secos).'
            })}
            className={`rounded-2xl p-5 space-y-3 border transition-all cursor-pointer group hover:scale-[1.02] ${
              isDark 
                ? 'bg-slate-950/80 border-cyan-500/40 hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/10' 
                : 'bg-cyan-50/60 border-cyan-300 hover:border-cyan-500 hover:shadow-md'
            }`}
            title="Haz clic para consultar la meta calórica y macronutrientes"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider block text-cyan-600 dark:text-cyan-400">
                Ingesta Calórica Meta
              </span>
              <Info className="w-3.5 h-3.5 text-cyan-500 group-hover:text-cyan-400 transition-colors" />
            </div>
            <div className="text-3xl font-black text-cyan-500 dark:text-cyan-400 font-mono">
              {ingestaCaloricaMeta} <span className="text-sm font-normal text-slate-400">kcal/día</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
              Calorías diarias recomendadas cuando realizas deporte y entrenamiento físico para alcanzar tu objetivo operativo.
            </p>
            <p className="text-[11px] text-cyan-600 dark:text-cyan-300 font-semibold pt-1">
              Ver distribución de macronutrientes &rarr;
            </p>
          </div>

          {/* 4. Peso Ideal Sugerido */}
          <div 
            onClick={() => setMetabolicoModal({
              titulo: 'Peso Ideal Sugerido InBody',
              valor: `${medActual.pesoIdeal} kg`,
              subvalor: `Estatura: ${medActual.alturaCm} cm • Estructura Biométrica Táctica`,
              estado: 'Peso Operativo Objetivo',
              estadoColor: 'text-emerald-400',
              descripcion: 'Calculado a partir de tu estatura militar y tu masa magra esquelética para ubicarte en el percentil de máximo rendimiento operativo con mínimo desgaste articular.',
              significadoMilitar: 'Alineado con las tablas de aptitud física de las FF.AA., garantizando que alcances la máxima nota de evaluación física sin exceder el porcentaje reglamentario de grasa.',
              consejo: 'Prioriza siempre la composición corporal sobre la báscula tradicional: el objetivo no es solo pesar menos, sino mantener o elevar tu masa muscular mientras reduces tejido graso innecesario.'
            })}
            className={`rounded-2xl p-5 space-y-3 border transition-all cursor-pointer group hover:scale-[1.02] ${
              isDark 
                ? 'bg-slate-950/80 border-slate-800 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/5' 
                : 'bg-slate-50 border-slate-200 hover:border-blue-500 hover:shadow-md'
            }`}
            title="Haz clic para consultar el peso ideal sugerido"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Peso Ideal Sugerido
              </span>
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400 transition-colors" />
            </div>
            <div className={`text-3xl font-black font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {medActual.pesoIdeal} <span className="text-sm font-normal text-slate-400">kg</span>
            </div>
            <p className="text-xs text-slate-400 leading-snug">
              Peso óptimo calculado para tu estructura ósea y estatura militar ({medActual.alturaCm} cm).
            </p>
            <p className="text-[11px] text-blue-500 dark:text-blue-400 font-semibold pt-1">
              Ver rango recomendado militar &rarr;
            </p>
          </div>

          {/* 5. Control de Grasa */}
          <div 
            onClick={() => setMetabolicoModal({
              titulo: 'Control Cuantitativo de Tejido Graso',
              valor: medActual.controlGrasa < 0 ? `Bajar ${Math.abs(medActual.controlGrasa)} kg` : medActual.controlGrasa > 0 ? `Subir ${medActual.controlGrasa} kg` : 'Nivel Óptimo',
              subvalor: `Grasa actual: ${medActual.grasaKg.toFixed(1)} kg (${medActual.pctGrasa.toFixed(1)}%)`,
              estado: medActual.controlGrasa < 0 ? 'Meta de Reducción Adiposa' : 'Nivel Equilibrado',
              estadoColor: medActual.controlGrasa < 0 ? 'text-rose-400' : 'text-emerald-400',
              descripcion: 'Indica la cantidad precisa de tejido adiposo que se debe ajustar para alcanzar el porcentaje óptimo de aptitud física de combate (12% a 16% en varones, 18% a 22% en mujeres).',
              significadoMilitar: 'Cada kilo de grasa excedente es una carga estática que resta segundos en el test de las 2 millas, dificulta las pruebas de paso de pista y sobrecarga rodillas y columna en marchas forzadas con pertrechos.',
              consejo: 'Establece un déficit calórico controlado de 300-400 kcal/día combinando tu pauta de nutrición regional con ejercicio aeróbico continuo y entrenamiento funcional sin comprometer tu masa magra.'
            })}
            className={`rounded-2xl p-5 space-y-3 border transition-all cursor-pointer group hover:scale-[1.02] ${
              isDark 
                ? 'bg-slate-950/80 border-slate-800 hover:border-rose-500/50 hover:shadow-lg hover:shadow-rose-500/5' 
                : 'bg-slate-50 border-slate-200 hover:border-rose-500 hover:shadow-md'
            }`}
            title="Haz clic para consultar la meta de control graso"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Control de Tejido Graso
              </span>
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-400 transition-colors" />
            </div>
            <div className={`text-2xl font-black font-mono ${
              medActual.controlGrasa < 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              {medActual.controlGrasa < 0 
                ? `Debes bajar ${Math.abs(medActual.controlGrasa)} kg`
                : medActual.controlGrasa > 0 
                ? `Debes subir ${medActual.controlGrasa} kg` 
                : 'Nivel óptimo'}
            </div>
            <p className="text-xs text-slate-400 leading-snug">
              {medActual.controlGrasa < 0 
                ? `Debes bajar ${Math.abs(medActual.controlGrasa)} kg de grasa corporal para desgravar peso innecesario.` 
                : 'Tu nivel de grasa se encuentra en valores adecuados.'}
            </p>
            <p className="text-[11px] text-blue-500 dark:text-blue-400 font-semibold pt-1">
              Ver estrategia de déficit y plazos &rarr;
            </p>
          </div>

          {/* 6. Control Muscular */}
          <div 
            onClick={() => setMetabolicoModal({
              titulo: 'Control y Ganancia de Masa Muscular',
              valor: medActual.controlMuscular > 0 ? `Subir ${medActual.controlMuscular} kg` : 'Musculatura Excelente',
              subvalor: `Músculo esquelético actual: ${medActual.musculoKg.toFixed(1)} kg`,
              estado: medActual.controlMuscular > 0 ? 'Meta de Hipertrofia Funcional' : 'Fuerza Consolidada',
              estadoColor: 'text-blue-400',
              descripcion: 'Muestra los kilogramos de músculo esquelético sugeridos para alcanzar el máximo índice de fuerza y resistencia biomecánica en tareas operacionales.',
              significadoMilitar: 'El músculo esquelético es tu blindaje anatómico. Brinda potencia de tracción para flexiones en barra, estabilidad para disparo táctico y protección ante caídas o impactos.',
              consejo: 'Aplica sobrecarga progresiva en ejercicios multiarticulares (dominadas, flexiones con lastre, sentadillas, peso muerto) y consume al menos 1.8g a 2.0g de proteína por kg de peso corporal al día.'
            })}
            className={`rounded-2xl p-5 space-y-3 border transition-all cursor-pointer group hover:scale-[1.02] ${
              isDark 
                ? 'bg-slate-950/80 border-slate-800 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/5' 
                : 'bg-slate-50 border-slate-200 hover:border-blue-500 hover:shadow-md'
            }`}
            title="Haz clic para consultar la meta de control muscular"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Control Muscular
              </span>
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400 transition-colors" />
            </div>
            <div className="text-2xl font-black text-blue-400 font-mono">
              {medActual.controlMuscular > 0 
                ? `Debes subir ${medActual.controlMuscular} kg` 
                : 'Musculatura en nivel excelente'}
            </div>
            <p className="text-xs text-slate-400 leading-snug">
              {medActual.controlMuscular > 0 
                ? `Debes subir ${medActual.controlMuscular} kg en tu musculatura para ganar mayor potencia táctica.` 
                : 'Masa muscular adecuada para tu peso y composición física.'}
            </p>
            <p className="text-[11px] text-blue-500 dark:text-blue-400 font-semibold pt-1">
              Ver protocolo de hipertrofia militar &rarr;
            </p>
          </div>

        </div>
      </div>

      {/* MODAL DETALLADO DE PARÁMETROS METABÓLICOS */}
      {metabolicoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`max-w-lg w-full rounded-3xl border p-6 sm:p-7 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto ${
              isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-start justify-between gap-4 border-b pb-4 dark:border-slate-800 border-slate-200">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyan-500" />
                  <span className="text-[11px] font-black uppercase tracking-wider text-cyan-500">
                    Ficha Técnica Metabólica
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black">
                  {metabolicoModal.titulo}
                </h3>
              </div>
              <button
                onClick={() => setMetabolicoModal(null)}
                className="p-1.5 rounded-full hover:bg-slate-800/20 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Valor Principal y Estado */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Valor Registrado
                </span>
                <div className="text-2xl sm:text-3xl font-black font-mono text-cyan-400">
                  {metabolicoModal.valor}
                </div>
                {metabolicoModal.subvalor && (
                  <span className="text-xs text-slate-400 mt-0.5 block">
                    {metabolicoModal.subvalor}
                  </span>
                )}
              </div>
              <span className={`text-xs font-black px-3 py-1 rounded-lg border uppercase tracking-wider ${
                metabolicoModal.estadoColor === 'text-emerald-400'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : metabolicoModal.estadoColor === 'text-rose-400'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
              }`}>
                {metabolicoModal.estado}
              </span>
            </div>

            {/* Explicación médica/fisiológica */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                <span>Definición Médica & Fisiológica</span>
              </h4>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {metabolicoModal.descripcion}
              </p>
            </div>

            {/* Importancia táctico-militar */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Impacto en la Aptitud Militar</span>
              </h4>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {metabolicoModal.significadoMilitar}
              </p>
            </div>

            {/* Consejo práctico aplicable */}
            <div className={`p-4 rounded-2xl border ${
              isDark ? 'bg-blue-950/30 border-blue-500/30 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}>
              <h4 className="text-xs font-black uppercase tracking-wider mb-1 flex items-center gap-1.5 text-blue-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Recomendación Práctica Directa</span>
              </h4>
              <p className="text-xs leading-relaxed">
                {metabolicoModal.consejo}
              </p>
            </div>

            <button
              onClick={() => setMetabolicoModal(null)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
            >
              Entendido / Cerrar Ficha
            </button>
          </div>
        </div>
      )}

      {/* MODAL / VISTA DETALLADA DEL PLAN DE NUTRICIÓN ("SI HACE CLIC SE ABRA Y PUEDA REGRESAR") */}
      {modalNutricionAbierto && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8">
            
            {/* Cabecera con Botón de Regreso */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  Plan Nutricional Prescrito
                </span>
                <h3 className="text-2xl font-black text-white mt-1">
                  Pautas y Menús para {somatotipoActual}
                </h3>
                <p className="text-xs text-slate-400">
                  Distribución adaptada a la región geográfica y requerimientos metabólicos del evaluado.
                </p>
              </div>

              <button
                onClick={() => setModalNutricionAbierto(false)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase tracking-wider cursor-pointer self-start sm:self-auto border border-slate-700"
              >
                <ArrowLeft className="w-4 h-4 text-emerald-400" />
                <span>Regresar a mi Ficha InBody</span>
              </button>
            </div>

            {/* Selector de Región (Sierra, Costa, Oriente) */}
            <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-2xl border border-slate-800 overflow-x-auto">
              <span className="text-xs font-bold text-slate-400 px-2 shrink-0 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>Región:</span>
              </span>
              {(['Sierra', 'Costa', 'Oriente', 'Galápagos'] as RegionEcuador[]).map((reg) => (
                <button
                  key={reg}
                  onClick={() => setSelectedRegion(reg)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    selectedRegion === reg
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {reg}
                </button>
              ))}
            </div>

            {/* Lista de Planes para esta Región */}
            <div className="space-y-6">
              {planesNutricionUsuario.map((plan) => (
                <div key={plan.id} className="bg-slate-950 border border-slate-800 rounded-3xl p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  <div className="md:col-span-5 h-56 rounded-2xl overflow-hidden relative">
                    <img
                      src={plan.imagenUrl}
                      alt={plan.nombre}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/70 text-emerald-300 border border-emerald-500/30 backdrop-blur">
                      {plan.region}
                    </div>
                  </div>

                  <div className="md:col-span-7 space-y-3">
                    <h4 className="text-lg font-black text-white">
                      {plan.nombre}
                    </h4>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {plan.descripcion}
                    </p>

                    <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-center">
                      <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                        <span className="text-[9px] text-slate-400 block uppercase">Calorías</span>
                        <span className="text-xs font-bold text-white font-mono">{plan.caloriasAprox || 2100}</span>
                      </div>
                      <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                        <span className="text-[9px] text-rose-400 block uppercase">Proteína</span>
                        <span className="text-xs font-bold text-white font-mono">{plan.proteinasG || 140}g</span>
                      </div>
                      <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                        <span className="text-[9px] text-blue-400 block uppercase">Carbos</span>
                        <span className="text-xs font-bold text-white font-mono">{plan.carbosG || 210}g</span>
                      </div>
                      <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                        <span className="text-[9px] text-emerald-400 block uppercase">Grasas</span>
                        <span className="text-xs font-bold text-white font-mono">{plan.grasasG || 55}g</span>
                      </div>
                    </div>

                    {plan.alimentosRecomendados && (
                      <div className="pt-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Ingredientes sugeridos:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {plan.alimentosRecomendados.map((al, idx) => (
                            <span key={idx} className="text-[10px] bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800 text-slate-300">
                              ✓ {al}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setModalNutricionAbierto(false)}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Cerrar y Regresar a mi Ficha
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL PLANES DE ENTRENAMIENTO — layout tipo EJMPLO DE PLANES */}
      {modalEntrenamientoAbierto && (() => {
        const planActivo =
          planesEntrenamientoUsuario.find(p => p.id === planEntrenoSeleccionadoId) ||
          planesEntrenamientoUsuario[0];
        const musicaVideoId = extractYoutubeVideoId(planActivo?.musicaFondoUrl || '');
        const portadaHero =
          planActivo?.portadaUrl ||
          planActivo?.imagenUrl ||
          planesEntrenamientoUsuario[0]?.portadaUrl ||
          planesEntrenamientoUsuario[0]?.imagenUrl ||
          '/planes/PLAN1.jpeg';

        return (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-start justify-center p-3 sm:p-4 overflow-y-auto">
            {musicaVideoId && (
              <YoutubeBackgroundAudio
                videoId={musicaVideoId}
                playing={audioPlaying}
                muted={audioMuted}
              />
            )}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full shadow-2xl my-4 sm:my-6 overflow-hidden max-h-[min(94vh,960px)] flex flex-col">

              {/* Cabecera: miniatura portada + título | Regresar */}
              <div className="flex items-center justify-between gap-3 p-4 sm:p-5 border-b border-slate-800 bg-slate-950/95 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border border-slate-700 shrink-0 bg-slate-800">
                    <img src={portadaHero} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-400">
                      Plan de preparación física
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-white truncate">
                      Entrenamiento · {somatotipoActual}
                    </h3>
                    <p className="text-[11px] text-slate-400 truncate">{fichaEdadSugerida}</p>
                  </div>
                </div>
                <button
                  onClick={cerrarModalEntrenamiento}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] sm:text-xs font-bold uppercase tracking-wider cursor-pointer border border-slate-700 shrink-0"
                >
                  <ArrowLeft className="w-4 h-4 text-blue-400" />
                  <span className="hidden sm:inline">Regresar a mi Ficha</span>
                  <span className="sm:hidden">Ficha</span>
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 min-h-0">
                {planesEntrenamientoUsuario.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">
                    No hay planes cargados para tu somatotipo, edad y sexo.
                  </p>
                ) : (
                  <>
                    {/* Selector de planes (1, 2, 3…) */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400">
                          {planesEntrenamientoUsuario.length === 1
                            ? 'Tu plan asignado'
                            : `Elige un plan (${planesEntrenamientoUsuario.length} disponibles)`}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {planesEntrenamientoUsuario.map((p, idx) => {
                          const active = (planEntrenoSeleccionadoId || planesEntrenamientoUsuario[0]?.id) === p.id;
                          const thumb = p.portadaUrl || p.imagenUrl;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setPlanEntrenoSeleccionadoId(p.id)}
                              className={`text-left rounded-2xl border overflow-hidden transition-all cursor-pointer ${
                                active
                                  ? 'border-blue-500 ring-2 ring-blue-500/40 bg-blue-600/10'
                                  : 'border-slate-800 bg-slate-950 hover:border-slate-600'
                              }`}
                            >
                              <div className="h-28 bg-slate-900 overflow-hidden">
                                <img src={thumb} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </div>
                              <div className="p-3 space-y-1">
                                <span className="text-[9px] font-black uppercase text-blue-400">Opción {idx + 1}</span>
                                <h4 className="text-xs font-black text-white line-clamp-2 leading-snug">{p.nombre}</h4>
                                <p className="text-[10px] text-slate-400">{p.diasPorSemana || 4} días / sem</p>
                                {p.musicaFondoUrl && (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-cyan-400">
                                    <Music className="w-3 h-3" /> Audio
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Detalle del plan elegido */}
                    {planActivo && (
                      <div className="space-y-5 rounded-3xl border border-slate-800 bg-slate-950 p-4 sm:p-6">
                        <div>
                          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                            {planActivo.enfoque || 'Entrenamiento'} · {planActivo.fichaEdad}
                          </span>
                          <h4 className="text-xl font-black text-white mt-1">{planActivo.nombre}</h4>
                        </div>

                        {/* Descripción e instrucciones */}
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                            Descripción e instrucciones
                          </span>
                          <p className="text-sm text-slate-300 leading-relaxed">{planActivo.descripcion}</p>
                        </div>

                        {/* Imagen guía tipo PLAN1 + audio de fondo */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Imagen guía del plan
                          </span>
                          <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-black">
                            <img
                              src={planActivo.imagenUrl}
                              alt={planActivo.nombre}
                              referrerPolicy="no-referrer"
                              className="w-full max-h-[55vh] object-contain mx-auto"
                            />
                            {musicaVideoId && (
                              <div className="absolute top-3 right-3 flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSesionEntrenoIniciada(true);
                                    setAudioPlaying((prev) => !prev);
                                  }}
                                  className="w-9 h-9 rounded-full bg-slate-950/80 border border-white/20 text-white flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer backdrop-blur-md shadow-lg"
                                  title={audioPlaying ? 'Pausar música' : 'Reproducir música'}
                                >
                                  {audioPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setAudioMuted((prev) => !prev)}
                                  className="w-9 h-9 rounded-full bg-slate-950/80 border border-white/20 text-white flex items-center justify-center hover:bg-slate-700 transition-colors cursor-pointer backdrop-blur-md shadow-lg"
                                  title={audioMuted ? 'Activar sonido' : 'Silenciar'}
                                >
                                  {audioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {musicaVideoId && (
                          <button
                            type="button"
                            onClick={() => {
                              setSesionEntrenoIniciada(true);
                              setAudioPlaying(true);
                            }}
                            className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all ${
                              sesionEntrenoIniciada && audioPlaying
                                ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/30'
                                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30'
                            }`}
                          >
                            {sesionEntrenoIniciada && audioPlaying ? (
                              <>
                                <Music className="w-4 h-4" />
                                Entrenamiento en curso
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4" />
                                Iniciar entrenamiento
                              </>
                            )}
                          </button>
                        )}
                        {!musicaVideoId && (
                          <button
                            type="button"
                            onClick={() => setSesionEntrenoIniciada(true)}
                            className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-600/30"
                          >
                            <Play className="w-4 h-4" />
                            Iniciar entrenamiento
                          </button>
                        )}

                        {/* Video del plan */}
                        {planActivo.videoUrl && (
                          <div className="space-y-2">
                            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                              <Video className="w-3.5 h-3.5" />
                              Video de este plan
                            </span>
                            {isExternalVideoLink(planActivo.videoUrl) ? (
                              <a
                                href={planActivo.videoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-cyan-600/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold"
                              >
                                <ExternalLink className="w-4 h-4" />
                                Abrir video
                              </a>
                            ) : (
                              <div className="aspect-video rounded-xl overflow-hidden border border-slate-800">
                                <iframe
                                  src={generateIframeUrl(planActivo.videoUrl)}
                                  title={planActivo.nombre}
                                  className="w-full h-full"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              </div>
                            )}
                          </div>
                        )}

                        {/* Protocolos opcionales */}
                        {planActivo.ejerciciosClave && planActivo.ejerciciosClave.length > 0 && (
                          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Protocolos (opcional)
                            </span>
                            <ul className="space-y-1.5 text-xs text-slate-300">
                              {planActivo.ejerciciosClave.map((ej, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                  <span>{ej}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                <div className="flex justify-end pt-2 border-t border-slate-800">
                  <button
                    onClick={cerrarModalEntrenamiento}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
                  >
                    Cerrar · Regresar a mi Ficha
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL DETALLE DE SOMATOTIPO */}
      {modalSomatotipo && (
        <SomatotipoModal
          definicion={modalSomatotipo}
          onClose={() => setModalSomatotipo(null)}
          generoInicial={selectedGender}
        />
      )}

      <GuiaInbodyModal
        isOpen={modalGuiaAbierto}
        onClose={() => setModalGuiaAbierto(false)}
      />

    </div>
  );
};
