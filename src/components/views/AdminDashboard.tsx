import React, { useMemo, useState } from 'react';
import {
  UserAccount,
  UserRole,
  PlanNutricion,
  PlanEntrenamiento,
  InBodyRecord,
  SomatotipoTipo,
  FichaEdadCatalogo
} from '../../types/inbody';
import { MOCK_USUARIOS } from '../../data/mockData';
import { NutricionistaDashboard } from './NutricionistaDashboard';
import { EntrenadorDashboard } from './EntrenadorDashboard';
import { OperadorDashboard } from './OperadorDashboard';
import { AdminSecurityPanel } from './AdminSecurityPanel';
import { AparienciaManager } from '../AparienciaManager';
import { downloadInbodyTemplate } from '../../utils/templateCsv';
import { calculateAge } from '../../utils/inbodyCalculations';
import {
  listUnidadCodes,
  listUnidadPadres,
  listUnidadAbuelos,
  hasInbodyData,
  getNombreCompletoUnidad,
  getRegionUnidad,
} from '../../lib/unidadesCatalog';
import { RosterQueryFilters } from '../../lib/firestoreService';
import { FoodItem } from '../../data/foodDatabase';
import { 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  Activity, 
  Search, 
  Download, 
  Filter, 
  Salad,
  Dumbbell,
  UploadCloud,
  Trash2,
  UserRound,
  IdCard,
  Shield,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
} from 'lucide-react';

const SCORE_RANGES = [
  { id: 'TODOS', label: 'Todos los scores', min: 0, max: 100 },
  { id: '0-20', label: '0 – 20', min: 0, max: 20 },
  { id: '21-40', label: '21 – 40', min: 21, max: 40 },
  { id: '41-60', label: '41 – 60', min: 41, max: 60 },
  { id: '61-80', label: '61 – 80', min: 61, max: 80 },
  { id: '81-100', label: '81 – 100', min: 81, max: 100 },
] as const;

const SOMATOTIPOS: SomatotipoTipo[] = [
  'Tipo obeso edematoso',
  'Tipo muscular con sobrepeso',
  'Tipo de sobrepeso muscular',
  'Falta de tipo de ejercicio',
  'Tipo estándar',
  'Tipo muscular estándar',
  'Tipo delgado',
  'Tipo musculoso magro',
  'Tipo musculoso desarrollado',
];

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Administrador' },
  { value: 'operador', label: 'Operador' },
  { value: 'entrenador', label: 'Entrenador' },
  { value: 'nutricionista', label: 'Nutricionista' },
  { value: 'usuario', label: 'Evaluado' },
];

function getNivelFromScore(score: number): 1 | 2 | 3 {
  if (score >= 85) return 3;
  if (score >= 70) return 2;
  return 1;
}

function isDemoCedula(cedula: string): boolean {
  return /^170000000[1-4]$/.test(cedula);
}

interface AdminDashboardProps {
  users: UserAccount[];
  currentUser: UserAccount;
  onSelectUser: (user: UserAccount) => void;
  onViewOwnFicha: () => void;
  onUpdateUserRole: (cedula: string, role: UserRole) => void;
  onDeleteUser: (cedula: string) => void;
  onPurgeDemoUsers: () => void;
  onAddMeasurementToUser: (cedula: string, record: InBodyRecord) => void;
  onCreateNewUser: (newUser: UserAccount) => void;
  planesNutricion: PlanNutricion[];
  onAddPlanNutricion: (plan: PlanNutricion) => void;
  onUpdatePlanNutricion: (plan: PlanNutricion) => void;
  onDeletePlanNutricion: (id: string) => void;
  alimentosCalculadora: FoodItem[];
  onAddAlimento: (item: FoodItem) => void;
  onUpdateAlimento: (item: FoodItem) => void;
  onDeleteAlimento: (id: string) => void;
  planesEntrenamiento: PlanEntrenamiento[];
  onAddPlanEntrenamiento: (plan: PlanEntrenamiento) => void;
  onUpdatePlanEntrenamiento: (plan: PlanEntrenamiento) => void;
  onDeletePlanEntrenamiento: (id: string) => void;
  fichasEdad: FichaEdadCatalogo[];
  onAddFicha: (ficha: FichaEdadCatalogo) => void;
  onUpdateFicha: (ficha: FichaEdadCatalogo) => void;
  onDeleteFicha: (id: string) => void;
  /** Lista en blanco hasta que el admin cargue / busque */
  rosterLoaded: boolean;
  rosterLoading: boolean;
  rosterProgress: number;
  rosterPage: number;
  rosterPageSize: number;
  rosterHasNext: boolean;
  rosterHasPrev: boolean;
  onFetchRosterPage: (direction: 'first' | 'next' | 'prev', filters: RosterQueryFilters) => void;
  onExportRosterCsv: (filters: RosterQueryFilters) => void;
  onSearchCedula: (cedula: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  users,
  currentUser,
  onSelectUser,
  onViewOwnFicha,
  onUpdateUserRole,
  onDeleteUser,
  onPurgeDemoUsers,
  onAddMeasurementToUser,
  onCreateNewUser,
  planesNutricion,
  onAddPlanNutricion,
  onUpdatePlanNutricion,
  onDeletePlanNutricion,
  alimentosCalculadora,
  onAddAlimento,
  onUpdateAlimento,
  onDeleteAlimento,
  planesEntrenamiento,
  onAddPlanEntrenamiento,
  onUpdatePlanEntrenamiento,
  onDeletePlanEntrenamiento,
  fichasEdad,
  onAddFicha,
  onUpdateFicha,
  onDeleteFicha,
  rosterLoaded,
  rosterLoading,
  rosterProgress,
  rosterPage,
  rosterPageSize,
  rosterHasNext,
  rosterHasPrev,
  onFetchRosterPage,
  onExportRosterCsv,
  onSearchCedula
}) => {
  const [adminTab, setAdminTab] = useState<
    'PERSONAL' | 'IMPORTAR' | 'NUTRICION' | 'ENTRENAMIENTO' | 'SEGURIDAD' | 'APARIENCIA'
  >('PERSONAL');
  const [searchTerm, setSearchTerm] = useState('');
  const [cedulaQuick, setCedulaQuick] = useState('');
  const [filterJerarquia, setFilterJerarquia] = useState<'unidad' | 'padre' | 'abuelo'>('unidad');
  const [filterUnit, setFilterUnit] = useState<string>('TODAS');
  const [filterDatos, setFilterDatos] = useState<'TODOS' | 'CON' | 'SIN'>('TODOS');
  const [filterStatus, setFilterStatus] = useState<'TODOS' | 'ALERTA' | 'OPTIMO'>('TODOS');
  const [filterScoreRange, setFilterScoreRange] = useState<string>('TODOS');
  const [filterSomatotipo, setFilterSomatotipo] = useState<string>('TODOS');
  const [filterGrado, setFilterGrado] = useState<string>('TODAS');
  const [filterNivel, setFilterNivel] = useState<'TODOS' | '1' | '2' | '3'>('TODOS');
  const [ageMin, setAgeMin] = useState<string>('');
  const [ageMax, setAgeMax] = useState<string>('');

  const catalogUnidades = useMemo(() => listUnidadCodes(), []);
  const catalogPadres = useMemo(() => listUnidadPadres(), []);
  const catalogAbuelos = useMemo(() => listUnidadAbuelos(), []);

  const jerarquiaOptions =
    filterJerarquia === 'padre'
      ? catalogPadres
      : filterJerarquia === 'abuelo'
        ? catalogAbuelos
        : catalogUnidades;

  const serverFilters: RosterQueryFilters = useMemo(
    () => ({
      jerarquia: filterJerarquia,
      unidadValor: filterUnit,
      datos: filterDatos,
      status: filterStatus,
    }),
    [filterJerarquia, filterUnit, filterDatos, filterStatus]
  );

  const conDatosCount = useMemo(
    () => users.filter((u) => hasInbodyData(u.mediciones)).length,
    [users]
  );
  const sinDatosCount = users.length - conDatosCount;
  const totalEvaluados = users.length;

  const personalEnAlerta = users.filter(u => {
    const med = u.mediciones[0];
    return med && (med.grasaVisceral >= 10 || med.inbodyScore < 70 || med.pctGrasa >= 28);
  });

  const conScore = users.filter((u) => hasInbodyData(u.mediciones));
  const promedioScore = Math.round(
    conScore.reduce((acc, u) => acc + (u.mediciones[0]?.inbodyScore || 0), 0) / (conScore.length || 1)
  );

  const personalApto = users.filter(u => (u.mediciones[0]?.inbodyScore || 0) >= 80);

  const filteredUsers = useMemo(() => {
    const scoreBand = SCORE_RANGES.find(r => r.id === filterScoreRange) || SCORE_RANGES[0];
    const minAge = ageMin === '' ? null : Number(ageMin);
    const maxAge = ageMax === '' ? null : Number(ageMax);

    return users.filter(u => {
      const matchesSearch =
        u.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.cedula.includes(searchTerm) ||
        u.grado.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesGrado =
        filterGrado === 'TODAS' || filterGrado === 'TODOS' || u.grado === filterGrado;

      const med = u.mediciones[0];
      const score = med?.inbodyScore ?? -1;

      const matchesScore =
        filterScoreRange === 'TODOS' ||
        (score >= 0 && score >= scoreBand.min && score <= scoreBand.max);

      const matchesSomatotipo =
        filterSomatotipo === 'TODOS' ||
        (med?.tipoCuerpo || 'Tipo estándar') === filterSomatotipo;

      const nivel = score >= 0 ? getNivelFromScore(score) : null;
      const matchesNivel =
        filterNivel === 'TODOS' ||
        (nivel !== null && String(nivel) === filterNivel);

      const edad = calculateAge(u.fechaNacimiento);
      const matchesAge =
        (minAge === null || Number.isNaN(minAge) || edad >= minAge) &&
        (maxAge === null || Number.isNaN(maxAge) || edad <= maxAge);

      return (
        matchesSearch &&
        matchesGrado &&
        matchesScore &&
        matchesSomatotipo &&
        matchesNivel &&
        matchesAge
      );
    });
  }, [
    users, searchTerm, filterStatus, filterScoreRange,
    filterSomatotipo, filterGrado, filterNivel, ageMin, ageMax
  ]);

  const grados = useMemo(
    () => Array.from(new Set(users.map(u => u.grado).filter(Boolean))).sort(),
    [users]
  );

  const demoCount = users.filter(u => isDemoCedula(u.cedula)).length;

  const refetchServer = (direction: 'first' | 'next' | 'prev' = 'first') => {
    onFetchRosterPage(direction, serverFilters);
  };

  const downloadStatsCsv = () => {
    onExportRosterCsv(serverFilters);
  };

  const handlePurgeDemos = () => {
    if (demoCount === 0) {
      alert('No hay cuentas demo (1700000001–1700000004) para depurar.');
      return;
    }
    if (confirm(`¿Eliminar ${demoCount} cuenta(s) de prueba (cédulas 1700000001–1700000004)? Esta acción no se puede deshacer en esta sesión.`)) {
      onPurgeDemoUsers();
    }
  };

  const handleDeleteOne = (u: UserAccount) => {
    if (u.cedula === currentUser.cedula) {
      alert('No puede eliminar su propia cuenta de administrador mientras está conectado.');
      return;
    }
    if (confirm(`¿Eliminar a ${u.grado} ${u.nombres} (${u.cedula})?`)) {
      onDeleteUser(u.cedula);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Barra de Módulos del Administrador */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
              Control Maestro Institucional
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5 flex flex-wrap items-center gap-2">
              <span>Administración Global & Diagnóstico</span>
              <span className="inline-flex items-center gap-0.5 bg-slate-950 px-2.5 py-0.5 rounded-lg border border-slate-800">
                <span className="text-white font-black">IN</span>
                <span className="text-blue-400 font-black">BODY</span>
                <span className="text-xs font-mono font-bold text-cyan-400 ml-1">270S</span>
              </span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-1">
              Sesión: {currentUser.grado} {currentUser.nombres} • CI {currentUser.cedula}
            </p>
          </div>

          <button
            type="button"
            onClick={onViewOwnFicha}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 cursor-pointer transition-all self-start lg:self-center"
          >
            <IdCard className="w-4 h-4" />
            <span>Ver mi ficha</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setAdminTab('PERSONAL')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              adminTab === 'PERSONAL'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Personal & Fichas ({users.length})</span>
          </button>

          <button
            onClick={() => setAdminTab('IMPORTAR')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              adminTab === 'IMPORTAR'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Importar LookinBody</span>
          </button>

          <button
            onClick={() => setAdminTab('NUTRICION')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              adminTab === 'NUTRICION'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Salad className="w-4 h-4" />
            <span>Planes Nutrición ({planesNutricion.length})</span>
          </button>

          <button
            onClick={() => setAdminTab('ENTRENAMIENTO')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              adminTab === 'ENTRENAMIENTO'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Dumbbell className="w-4 h-4" />
            <span>Planes Entrenamiento ({planesEntrenamiento.length})</span>
          </button>

          <button
            onClick={() => setAdminTab('SEGURIDAD')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              adminTab === 'SEGURIDAD'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Seguridad</span>
          </button>

          <button
            onClick={() => setAdminTab('APARIENCIA')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              adminTab === 'APARIENCIA'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Apariencia</span>
          </button>
        </div>
      </div>

      {/* VISTA 1: PERSONAL EVALUADO */}
      {adminTab === 'PERSONAL' && (
        <div className="space-y-6">
          {/* Carga paginada Firestore */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1">
                <p className="text-xs font-black text-white uppercase tracking-wider">Personal en Firebase</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Lista vacía al inicio. Carga paginada de {rosterPageSize} usuarios. Filtros de unidad / datos / alertas consultan Firestore.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  value={cedulaQuick}
                  onChange={(e) => setCedulaQuick(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="Buscar cédula…"
                  className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono outline-none w-36"
                />
                <button
                  type="button"
                  onClick={() => onSearchCedula(cedulaQuick)}
                  className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
                >
                  Buscar
                </button>
                <button
                  type="button"
                  onClick={() => refetchServer('first')}
                  disabled={rosterLoading}
                  className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
                >
                  {rosterLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Users className="w-3.5 h-3.5" />}
                  {rosterLoaded ? 'Recargar página 1' : 'Ver todos los usuarios'}
                </button>
              </div>
            </div>
            {rosterLoading && (
              <div className="space-y-2 pt-2">
                <p className="text-[11px] text-cyan-400 font-mono">
                  Consultando Firestore… {rosterProgress > 0 ? `${rosterProgress.toLocaleString()} exportados` : 'espere'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-16 rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden relative"
                    >
                      <div
                        className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-slate-700/30 to-transparent"
                        style={{ animationDelay: `${i * 0.1}s` }}
                      />
                    </div>
                  ))}
                </div>
                <style>{`
                  @keyframes shimmer {
                    100% { transform: translateX(100%); }
                  }
                `}</style>
              </div>
            )}
            {rosterLoaded && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800">
                <p className="text-[11px] text-slate-400">
                  Página <span className="text-white font-bold">{rosterPage}</span>
                  {' · '}
                  {users.length} de hasta {rosterPageSize} en esta página
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!rosterHasPrev || rosterLoading}
                    onClick={() => refetchServer('prev')}
                    className="px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-bold text-slate-200 disabled:opacity-40 hover:bg-slate-800 cursor-pointer inline-flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Anterior
                  </button>
                  <button
                    type="button"
                    disabled={!rosterHasNext || rosterLoading}
                    onClick={() => refetchServer('next')}
                    className="px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-bold text-slate-200 disabled:opacity-40 hover:bg-slate-800 cursor-pointer inline-flex items-center gap-1"
                  >
                    Siguiente
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {!rosterLoaded && users.length === 0 && (
            <div className="p-10 text-center bg-slate-900 border border-dashed border-slate-700 rounded-3xl text-slate-400 text-sm">
              Lista en blanco. Pulse <strong className="text-slate-200">Ver todos los usuarios</strong> (100 por página)
              o busque por cédula. Los filtros de unidad/datos/alertas recargan desde Firebase.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">En esta página</span>
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-3xl font-black text-white mt-2 font-mono">{totalEvaluados}</div>
              <div className="text-[11px] text-slate-500 mt-1">Registros del lote actual (máx. {rosterPageSize})</div>
            </div>

            <div className="bg-slate-900 border border-emerald-900/40 rounded-3xl p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Con datos InBody</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-3xl font-black text-emerald-400 mt-2 font-mono">
                {conDatosCount}
                <span className="text-sm font-normal text-slate-400 ml-1.5">
                  ({Math.round((conDatosCount / (totalEvaluados || 1)) * 100)}%)
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">En la página actual</div>
            </div>

            <div className="bg-slate-900 border border-amber-900/40 rounded-3xl p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sin datos InBody</span>
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div className="text-3xl font-black text-amber-400 mt-2 font-mono">
                {sinDatosCount}
                <span className="text-sm font-normal text-slate-400 ml-1.5">
                  ({Math.round((sinDatosCount / (totalEvaluados || 1)) * 100)}%)
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Pendientes en esta página</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Promedio InBody</span>
                <Activity className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="text-3xl font-black text-cyan-400 mt-2 font-mono">{promedioScore} / 100</div>
              <div className="text-[11px] text-slate-500 mt-1">
                Solo con datos · Aptos ≥80: {personalApto.length} · Alertas: {personalEnAlerta.length}
              </div>
            </div>
          </div>

          {/* Filtros y Búsqueda */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="relative w-full lg:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar en esta página (nombre, cédula o grado)..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={downloadStatsCsv}
                  disabled={rosterLoading}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-800/40 rounded-xl text-xs font-bold text-emerald-300 transition-all cursor-pointer disabled:opacity-50"
                  title="Exportar CSV del filtro activo (consulta paginada en Firebase)"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar estadísticas (CSV)</span>
                </button>
                <button
                  onClick={() => downloadInbodyTemplate(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 hover:text-cyan-400 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Plantilla Guía</span>
                </button>
                <button
                  onClick={handlePurgeDemos}
                  className="flex items-center gap-1.5 px-3 py-2 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/40 rounded-xl text-xs font-bold text-rose-300 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Depurar demos ({demoCount})</span>
                </button>
              </div>
            </div>

            {/* Jerarquía de unidades — consulta Firestore */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center gap-2 sm:col-span-2 xl:col-span-1">
                <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={filterJerarquia}
                  onChange={(e) => {
                    setFilterJerarquia(e.target.value as 'unidad' | 'padre' | 'abuelo');
                    setFilterUnit('TODAS');
                  }}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="unidad">Por Unidad</option>
                  <option value="padre">Por Unidad Padre</option>
                  <option value="abuelo">Por Unidad Abuelo</option>
                </select>
              </div>
              <div className="sm:col-span-2 xl:col-span-2">
                <select
                  value={filterUnit}
                  onChange={(e) => {
                    const v = e.target.value;
                    setFilterUnit(v);
                    onFetchRosterPage('first', {
                      jerarquia: filterJerarquia,
                      unidadValor: v,
                      datos: filterDatos,
                      status: filterStatus,
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="TODAS">
                    {filterJerarquia === 'padre'
                      ? 'Todas las unidades padre'
                      : filterJerarquia === 'abuelo'
                        ? 'Todas las unidades abuelo'
                        : 'Todas las unidades'}
                  </option>
                  {jerarquiaOptions.map((u) => (
                    <option key={u} value={u}>
                      {u}
                      {filterJerarquia === 'unidad' && getNombreCompletoUnidad(u)
                        ? ` — ${getNombreCompletoUnidad(u)}`
                        : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setFilterDatos('TODOS');
                    onFetchRosterPage('first', {
                      jerarquia: filterJerarquia,
                      unidadValor: filterUnit,
                      datos: 'TODOS',
                      status: filterStatus,
                    });
                  }}
                  className={`flex-1 px-2 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                    filterDatos === 'TODOS' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFilterDatos('CON');
                    onFetchRosterPage('first', {
                      jerarquia: filterJerarquia,
                      unidadValor: filterUnit,
                      datos: 'CON',
                      status: filterStatus,
                    });
                  }}
                  className={`flex-1 px-2 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                    filterDatos === 'CON' ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/40' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Con datos
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFilterDatos('SIN');
                    onFetchRosterPage('first', {
                      jerarquia: filterJerarquia,
                      unidadValor: filterUnit,
                      datos: 'SIN',
                      status: filterStatus,
                    });
                  }}
                  className={`flex-1 px-2 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                    filterDatos === 'SIN' ? 'bg-amber-950/70 text-amber-400 border border-amber-800/40' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sin datos
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              <select
                value={filterScoreRange}
                onChange={(e) => setFilterScoreRange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              >
                {SCORE_RANGES.map(r => (
                  <option key={r.id} value={r.id}>Score: {r.label}</option>
                ))}
              </select>

              <select
                value={filterSomatotipo}
                onChange={(e) => setFilterSomatotipo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="TODOS">Todos los somatotipos</option>
                {SOMATOTIPOS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <select
                value={filterGrado}
                onChange={(e) => setFilterGrado(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="TODAS">Todos los grados</option>
                {grados.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>

              <select
                value={filterNivel}
                onChange={(e) => setFilterNivel(e.target.value as 'TODOS' | '1' | '2' | '3')}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="TODOS">Todos los niveles</option>
                <option value="1">Nivel 1 | Bajo (&lt; 70)</option>
                <option value="2">Nivel 2 | Medio (70–84)</option>
                <option value="3">Nivel 3 | Alto (≥ 85)</option>
              </select>

              <div className="flex items-center gap-2 sm:col-span-2 xl:col-span-2">
                <UserRound className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Edad</span>
                <input
                  type="number"
                  min={16}
                  max={80}
                  value={ageMin}
                  onChange={(e) => setAgeMin(e.target.value.replace(/\D/g, '').slice(0, 2))}
                  placeholder="Desde"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <span className="text-slate-500 text-xs">a</span>
                <input
                  type="number"
                  min={16}
                  max={80}
                  value={ageMax}
                  onChange={(e) => setAgeMax(e.target.value.replace(/\D/g, '').slice(0, 2))}
                  placeholder="Hasta"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs sm:col-span-2 xl:col-span-2">
                <button
                  onClick={() => {
                    setFilterStatus('TODOS');
                    onFetchRosterPage('first', {
                      jerarquia: filterJerarquia,
                      unidadValor: filterUnit,
                      datos: filterDatos,
                      status: 'TODOS',
                    });
                  }}
                  className={`flex-1 px-2 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                    filterStatus === 'TODOS' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => {
                    setFilterStatus('ALERTA');
                    onFetchRosterPage('first', {
                      jerarquia: filterJerarquia,
                      unidadValor: filterUnit,
                      datos: filterDatos,
                      status: 'ALERTA',
                    });
                  }}
                  className={`flex-1 px-2 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                    filterStatus === 'ALERTA' ? 'bg-rose-950/70 text-rose-400 border border-rose-800/40' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Alertas
                </button>
                <button
                  onClick={() => {
                    setFilterStatus('OPTIMO');
                    onFetchRosterPage('first', {
                      jerarquia: filterJerarquia,
                      unidadValor: filterUnit,
                      datos: filterDatos,
                      status: 'OPTIMO',
                    });
                  }}
                  className={`flex-1 px-2 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                    filterStatus === 'OPTIMO' ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/40' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Óptimos
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              Mostrando <span className="text-slate-300 font-bold">{filteredUsers.length}</span> en página {rosterPage}
              {getRegionUnidad(filterUnit) ? ` · Región catálogo: ${getRegionUnidad(filterUnit)}` : ''}
            </p>

            {/* Tabla de Personal */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-800 text-[10px]">
                  <tr>
                    <th className="p-3.5">Efectivo / Grado</th>
                    <th className="p-3.5">Cédula</th>
                    <th className="p-3.5 text-center">Fichas InBody</th>
                    <th className="p-3.5">Edad</th>
                    <th className="p-3.5">Unidad</th>
                    <th className="p-3.5">Somatotipo</th>
                    <th className="p-3.5 text-center">Score</th>
                    <th className="p-3.5 text-center">Nivel</th>
                    <th className="p-3.5">Rol</th>
                    <th className="p-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredUsers.map((u) => {
                    const med = u.mediciones[0];
                    const score = med?.inbodyScore || 0;
                    const nivelNum = getNivelFromScore(score);
                    const nivelTexto = nivelNum === 3 ? 'Nivel 3 | Alto' : nivelNum === 2 ? 'Nivel 2 | Medio' : 'Nivel 1 | Bajo';
                    const nivelColor = nivelNum === 3 ? 'text-emerald-400 bg-emerald-500/10' : nivelNum === 2 ? 'text-amber-400 bg-amber-500/10' : 'text-rose-400 bg-rose-500/10';
                    const edad = calculateAge(u.fechaNacimiento);

                    return (
                      <tr key={u.cedula} className="hover:bg-slate-850 transition-colors">
                        <td className="p-3.5">
                          <div className="font-bold text-white">{u.nombres}</div>
                          <div className="text-[10px] text-blue-400 font-semibold">{u.grado}</div>
                          {isDemoCedula(u.cedula) && (
                            <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              DEMO
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 font-mono text-slate-400">{u.cedula}</td>
                        <td className="p-3.5 text-center">
                          <span className={`inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-lg text-[11px] font-black font-mono border ${
                            !hasInbodyData(u.mediciones)
                              ? 'bg-amber-950/40 text-amber-400 border-amber-800/40'
                              : u.mediciones.length === 1
                                ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                                : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                          }`} title={hasInbodyData(u.mediciones) ? 'Cantidad de mediciones InBody' : 'Sin datos InBody'}>
                            {hasInbodyData(u.mediciones) ? u.mediciones.length : 'SIN'}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono">{edad}</td>
                        <td className="p-3.5">
                          <div className="font-bold text-slate-200">{u.unidadActual || '—'}</div>
                          {getNombreCompletoUnidad(u.unidadActual) ? (
                            <div className="text-[10px] text-slate-500 max-w-[220px] truncate" title={getNombreCompletoUnidad(u.unidadActual)}>
                              {getNombreCompletoUnidad(u.unidadActual)}
                            </div>
                          ) : null}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] text-slate-300">
                            {med?.tipoCuerpo || 'Sin medición'}
                          </span>
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold">
                          {med ? (
                            <span className={score >= 80 ? 'text-emerald-400' : score >= 70 ? 'text-amber-400' : 'text-rose-400'}>
                              {score} / 100
                            </span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center">
                          {med ? (
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${nivelColor}`}>
                              {nivelTexto}
                            </span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <select
                            value={u.role}
                            onChange={(e) => onUpdateUserRole(u.cedula, e.target.value as UserRole)}
                            className="px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-[10px] text-white focus:outline-none focus:border-blue-500 max-w-[130px]"
                          >
                            {ROLE_OPTIONS.map(r => (
                              <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => onSelectUser(u)}
                              className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white font-bold text-xs transition-all cursor-pointer border border-blue-500/30 hover:border-transparent"
                            >
                              Ficha
                            </button>
                            <button
                              onClick={() => handleDeleteOne(u)}
                              className="p-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-800/40 transition-all cursor-pointer"
                              title="Eliminar personal"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-500">
                        No hay efectivos que coincidan con los filtros seleccionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {adminTab === 'IMPORTAR' && (
        <OperadorDashboard
          users={users}
          onAddMeasurementToUser={onAddMeasurementToUser}
          onCreateNewUser={onCreateNewUser}
        />
      )}

      {adminTab === 'NUTRICION' && (
        <NutricionistaDashboard
          planes={planesNutricion}
          onAddPlan={onAddPlanNutricion}
          onUpdatePlan={onUpdatePlanNutricion}
          onDeletePlan={onDeletePlanNutricion}
          isAdminMode={true}
          alimentos={alimentosCalculadora}
          onAddAlimento={onAddAlimento}
          onUpdateAlimento={onUpdateAlimento}
          onDeleteAlimento={onDeleteAlimento}
        />
      )}

      {adminTab === 'ENTRENAMIENTO' && (
        <EntrenadorDashboard
          planes={planesEntrenamiento}
          onAddPlan={onAddPlanEntrenamiento}
          onUpdatePlan={onUpdatePlanEntrenamiento}
          onDeletePlan={onDeletePlanEntrenamiento}
          fichasEdad={fichasEdad}
          onAddFicha={onAddFicha}
          onUpdateFicha={onUpdateFicha}
          onDeleteFicha={onDeleteFicha}
          isAdminMode={true}
        />
      )}

      {adminTab === 'SEGURIDAD' && (
        <AdminSecurityPanel
          staffUsers={MOCK_USUARIOS.filter((u) => u.role !== 'usuario').concat(
            users.filter((u) => u.role !== 'usuario')
          )}
        />
      )}

      {adminTab === 'APARIENCIA' && <AparienciaManager />}

    </div>
  );
};
