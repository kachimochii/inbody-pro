import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Copy,
  Footprints,
  Loader2,
  Plus,
  Repeat,
  Save,
  Search,
  Sparkles,
  Timer,
  Trash2,
  Upload,
  Waves,
  X,
} from 'lucide-react';
import type { BloqueEjercicioPlan, SomatotipoTipo } from '../types/inbody';
import {
  EQUIPOS,
  GRUPOS_MUSCULARES,
  buscarEjercicios,
  cargarEjercicios,
  guardarEjercicioPersonalizado,
  resolverAnimacion,
  type Ejercicio,
  type EquipoEjercicio,
  type GrupoMuscular,
} from '../lib/ejerciciosService';
import {
  DESCANSOS_RAPIDOS,
  REPETICIONES_RAPIDAS,
  SERIES_MAX,
  SERIES_MIN,
  TIEMPOS_RAPIDOS,
  autogenerarCircuitoMilitar,
  calcularDuracionEstimadaMin,
  crearBloque,
  ejerciciosClaveDesdeRutina,
  nuevoUid,
  requiereBajoImpacto,
} from '../utils/rutinaInteractiva';

export interface ResultadoConstructorRutina {
  rutinaInteractiva: BloqueEjercicioPlan[];
  duracionEstimadaMin: number;
  ejerciciosClave: string[];
}

interface ConstructorRutinaModalProps {
  abierto: boolean;
  onCerrar: () => void;
  onGuardar: (resultado: ResultadoConstructorRutina) => void;
  bloquesIniciales?: BloqueEjercicioPlan[];
  somatotipo: SomatotipoTipo;
  fichaEdad: string;
  nombrePlan?: string;
}

type Vista = 'circuito' | 'subir';
type FiltroChip = 'militar' | 'peso' | GrupoMuscular;

const POR_PAGINA = 24;

const CHIPS: { id: FiltroChip; label: string }[] = [
  { id: 'militar', label: 'Militar / Sin Equipo' },
  { id: 'peso', label: 'Peso corporal' },
  { id: 'Pecho', label: 'Pecho' },
  { id: 'Abdomen / Core', label: 'Abdomen / Core' },
  { id: 'Piernas', label: 'Piernas' },
  { id: 'Espalda', label: 'Espalda' },
  { id: 'Brazos', label: 'Brazos' },
  { id: 'Hombros', label: 'Hombros' },
  { id: 'Cardio / Militar', label: 'Cardio / Militar' },
];

interface PlantillaPropia {
  etiqueta: string;
  icono: React.ReactNode;
  nombre: string;
  musculo: string;
  pasos: [string, string];
}

const PLANTILLAS_PROPIAS: PlantillaPropia[] = [
  {
    etiqueta: 'Natación',
    icono: <Waves className="w-3.5 h-3.5" />,
    nombre: 'Natación estilo libre',
    musculo: 'Sistema cardiovascular',
    pasos: [
      'Colócate en posición horizontal con el cuerpo alineado y la cara en el agua.',
      'Alterna las brazadas con patada continua y respira de forma lateral cada dos o tres brazadas.',
    ],
  },
  {
    etiqueta: 'Trote',
    icono: <Footprints className="w-3.5 h-3.5" />,
    nombre: 'Trote continuo',
    musculo: 'Sistema cardiovascular',
    pasos: [
      'Colócate de pie con el torso erguido, la mirada al frente y los brazos flexionados a 90 grados.',
      'Trota a ritmo constante con zancada corta, apoyando el mediopié y respirando de forma rítmica.',
    ],
  },
  {
    etiqueta: 'Caminata',
    icono: <Footprints className="w-3.5 h-3.5" />,
    nombre: 'Caminata enérgica',
    musculo: 'Sistema cardiovascular',
    pasos: [
      'Colócate de pie con el torso erguido, los hombros relajados y el abdomen activado.',
      'Camina a paso firme y constante, balanceando los brazos y apoyando del talón a la punta.',
    ],
  },
];

const limitar = (n: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(n || 0)));

const chipClase = (activo: boolean) =>
  `px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors cursor-pointer whitespace-nowrap ${
    activo
      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
      : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
  }`;

const rapidoClase = (activo: boolean) =>
  `px-2 py-1 rounded-lg text-[10px] font-black border cursor-pointer ${
    activo ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
  }`;

export const ConstructorRutinaModal: React.FC<ConstructorRutinaModalProps> = ({
  abierto,
  onCerrar,
  onGuardar,
  bloquesIniciales,
  somatotipo,
  fichaEdad,
  nombrePlan,
}) => {
  const [vista, setVista] = useState<Vista>('circuito');
  const [catalogo, setCatalogo] = useState<Ejercicio[] | null>(null);
  const [errorCatalogo, setErrorCatalogo] = useState('');
  const [bloques, setBloques] = useState<BloqueEjercicioPlan[]>([]);
  const [aviso, setAviso] = useState('');

  const [texto, setTexto] = useState('');
  const textoDiferido = useDeferredValue(texto);
  const [soloMilitar, setSoloMilitar] = useState(false);
  const [soloPesoCorporal, setSoloPesoCorporal] = useState(false);
  const [grupo, setGrupo] = useState<GrupoMuscular | null>(null);
  const [pagina, setPagina] = useState(0);

  useEffect(() => {
    if (!abierto) return;
    setBloques(bloquesIniciales ? bloquesIniciales.map((b) => ({ ...b })) : []);
    setVista('circuito');
    setAviso('');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo se reinicia al abrir
  }, [abierto]);

  useEffect(() => {
    if (!abierto || catalogo) return;
    let activo = true;
    cargarEjercicios()
      .then((lista) => activo && setCatalogo(lista))
      .catch((err) => activo && setErrorCatalogo(err instanceof Error ? err.message : String(err)));
    return () => {
      activo = false;
    };
  }, [abierto, catalogo]);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(''), 3500);
    return () => clearTimeout(t);
  }, [aviso]);

  useEffect(() => setPagina(0), [textoDiferido, soloMilitar, soloPesoCorporal, grupo]);

  const resultados = useMemo(
    () =>
      catalogo
        ? buscarEjercicios(catalogo, {
            texto: textoDiferido,
            grupo_muscular: grupo ?? 'TODOS',
            equipo: soloPesoCorporal ? 'Peso corporal' : 'TODOS',
            es_militar: soloMilitar ? true : undefined,
          })
        : [],
    [catalogo, textoDiferido, grupo, soloMilitar, soloPesoCorporal]
  );
  const totalPaginas = Math.max(1, Math.ceil(resultados.length / POR_PAGINA));
  const paginaVisible = resultados.slice(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA);
  const duracionMin = calcularDuracionEstimadaMin(bloques);
  const bajoImpacto = requiereBajoImpacto(somatotipo, fichaEdad);

  if (!abierto) return null;

  const alternarChip = (id: FiltroChip) => {
    if (id === 'militar') setSoloMilitar((v) => !v);
    else if (id === 'peso') setSoloPesoCorporal((v) => !v);
    else setGrupo((g) => (g === id ? null : id));
  };
  const chipActivo = (id: FiltroChip) =>
    id === 'militar' ? soloMilitar : id === 'peso' ? soloPesoCorporal : grupo === id;

  const agregar = (ej: Ejercicio) => {
    setBloques((prev) => [...prev, crearBloque(ej)]);
    setAviso(`Agregado: ${ej.nombre_es}`);
  };

  const actualizar = (uid: string, cambios: Partial<BloqueEjercicioPlan>) =>
    setBloques((prev) => prev.map((b) => (b.uid === uid ? { ...b, ...cambios } : b)));

  const mover = (indice: number, delta: number) =>
    setBloques((prev) => {
      const destino = indice + delta;
      if (destino < 0 || destino >= prev.length) return prev;
      const copia = [...prev];
      [copia[indice], copia[destino]] = [copia[destino], copia[indice]];
      return copia;
    });

  const duplicar = (indice: number) =>
    setBloques((prev) => [...prev.slice(0, indice + 1), { ...prev[indice], uid: nuevoUid() }, ...prev.slice(indice + 1)]);

  const eliminar = (uid: string) => setBloques((prev) => prev.filter((b) => b.uid !== uid));

  const autogenerar = () => {
    if (!catalogo) return;
    if (bloques.length && !confirm('¿Reemplazar el circuito actual por uno autogenerado?')) return;
    const generado = autogenerarCircuitoMilitar(catalogo, somatotipo, fichaEdad);
    setBloques(generado);
    setAviso(
      `${generado.length} bloques generados (${bajoImpacto ? 'bajo impacto + core' : 'batería militar'}) para ${somatotipo} · ${fichaEdad}.`
    );
  };

  const guardar = () => {
    onGuardar({
      rutinaInteractiva: bloques,
      duracionEstimadaMin: duracionMin,
      ejerciciosClave: ejerciciosClaveDesdeRutina(bloques),
    });
  };

  const alGuardarPropio = async (ej: Ejercicio, agregarAlCircuito: boolean) => {
    setCatalogo(await cargarEjercicios());
    if (agregarAlCircuito) setBloques((prev) => [...prev, crearBloque(ej)]);
    setTexto(ej.nombre_es);
    setGrupo(null);
    setSoloMilitar(false);
    setSoloPesoCorporal(false);
    setVista('circuito');
    setAviso(`"${ej.nombre_es}" ya está disponible en el catálogo.`);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm flex items-start justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-7xl shadow-2xl my-2 sm:my-4 flex flex-col max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)] overflow-hidden">
        {/* Encabezado */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-800 bg-slate-950/90 shrink-0">
          <div className="min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              Constructor de circuito interactivo
            </span>
            <h3 className="text-base sm:text-lg font-black text-white mt-1 truncate">
              {nombrePlan?.trim() || 'Plan sin nombre'}
            </h3>
            <p className="text-[11px] text-slate-500">
              {somatotipo} · {fichaEdad}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1">
              <button
                type="button"
                onClick={() => setVista('circuito')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${vista === 'circuito' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Armador de circuito
              </button>
              <button
                type="button"
                onClick={() => setVista('subir')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${vista === 'subir' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                + Subir Ejercicio Propio: Natación / Trote / Caminata
              </button>
            </div>
            <button type="button" onClick={onCerrar} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer" title="Cerrar sin guardar">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {aviso && (
          <div className="px-4 py-2 text-[11px] font-bold text-emerald-300 bg-emerald-500/10 border-b border-emerald-500/20 shrink-0">{aviso}</div>
        )}

        {vista === 'circuito' ? (
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
            {/* Catálogo */}
            <section className="min-h-0 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800">
              <div className="p-3 space-y-2 shrink-0">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    placeholder="Buscar: flexiones, sentadilla, abdominal, dominadas…"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {CHIPS.map((c) => (
                    <button key={c.id} type="button" onClick={() => alternarChip(c.id)} className={chipClase(chipActivo(c.id))}>
                      {c.label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500">
                  {catalogo ? `${resultados.length} ejercicios` : 'Cargando catálogo…'}
                </p>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-3">
                {errorCatalogo && <p className="text-xs text-rose-400">No se pudo cargar el catálogo: {errorCatalogo}</p>}
                {!catalogo && !errorCatalogo && (
                  <div className="flex items-center justify-center py-16 text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                )}
                {catalogo && !resultados.length && (
                  <p className="text-xs text-slate-500 text-center py-12">Sin resultados con esos filtros.</p>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
                  {paginaVisible.map((ej) => (
                    <article key={ej.id} className="group relative rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/60 overflow-hidden flex flex-col">
                      <div className="aspect-square bg-white">
                        <img src={resolverAnimacion(ej.animacion)} alt={ej.nombre_es} loading="lazy" decoding="async" className="w-full h-full object-contain" />
                      </div>
                      <div className="p-2 flex-1 flex flex-col gap-1">
                        <p className="text-[11px] font-bold text-white leading-tight line-clamp-2" title={ej.nombre_es}>
                          {ej.nombre_es}
                        </p>
                        <p className="text-[9px] text-slate-500 uppercase tracking-wide truncate">
                          {ej.grupo_muscular} · {ej.equipo}
                          {ej.origen === 'custom' ? ' · Propio' : ''}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => agregar(ej)}
                        className="absolute top-1.5 right-1.5 w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg cursor-pointer"
                        title="Agregar al circuito"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      {ej.es_militar && (
                        <span className="absolute top-1.5 left-1.5 text-[8px] font-black uppercase bg-amber-500 text-black px-1.5 py-0.5 rounded">Militar</span>
                      )}
                    </article>
                  ))}
                </div>
              </div>

              {resultados.length > POR_PAGINA && (
                <div className="flex items-center justify-center gap-3 p-2 border-t border-slate-800 shrink-0">
                  <button type="button" disabled={pagina === 0} onClick={() => setPagina((p) => p - 1)} className="p-1.5 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-30 cursor-pointer">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-[11px] font-bold text-slate-400">
                    Página {pagina + 1} de {totalPaginas}
                  </span>
                  <button type="button" disabled={pagina >= totalPaginas - 1} onClick={() => setPagina((p) => p + 1)} className="p-1.5 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-30 cursor-pointer">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </section>

            {/* Secuencia del circuito */}
            <section className="min-h-0 flex flex-col">
              <div className="p-3 space-y-2 border-b border-slate-800 shrink-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-black text-white">Secuencia del circuito</h4>
                  <span className="text-[11px] font-bold text-cyan-300">
                    {bloques.length} bloques · ~{duracionMin} min
                  </span>
                </div>
                <button
                  type="button"
                  onClick={autogenerar}
                  disabled={!catalogo}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black text-xs font-black uppercase tracking-wide cursor-pointer disabled:opacity-40"
                >
                  <Sparkles className="w-4 h-4" />
                  Autogenerar Circuito Militar Inteligente
                </button>
                <p className="text-[10px] text-slate-500">
                  Perfil detectado: {bajoImpacto ? 'bajo impacto y core (sobrepeso o Ficha 3/4)' : 'batería militar estándar (Ficha 1/2)'}.
                </p>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
                {!bloques.length && (
                  <p className="text-xs text-slate-500 text-center py-12">
                    Agregue ejercicios con el botón + o use el autogenerador.
                  </p>
                )}
                {bloques.map((b, i) => (
                  <BloqueEditor
                    key={b.uid}
                    bloque={b}
                    indice={i}
                    total={bloques.length}
                    onCambiar={(c) => actualizar(b.uid, c)}
                    onMover={(d) => mover(i, d)}
                    onDuplicar={() => duplicar(i)}
                    onEliminar={() => eliminar(b.uid)}
                  />
                ))}
              </div>
            </section>
          </div>
        ) : (
          <FormularioEjercicioPropio onGuardado={alGuardarPropio} />
        )}

        {/* Pie */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4 border-t border-slate-800 bg-slate-950/90 shrink-0">
          <p className="text-[11px] text-slate-400">
            Se guardará en <span className="font-bold text-slate-200">rutinaInteractiva</span> y se rellenarán los ejercicios clave del plan.
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={onCerrar} className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer">
              Cancelar
            </button>
            <button
              type="button"
              onClick={guardar}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-600/30 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Guardar circuito ({bloques.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface BloqueEditorProps {
  bloque: BloqueEjercicioPlan;
  indice: number;
  total: number;
  onCambiar: (cambios: Partial<BloqueEjercicioPlan>) => void;
  onMover: (delta: number) => void;
  onDuplicar: () => void;
  onEliminar: () => void;
}

const BloqueEditor: React.FC<BloqueEditorProps> = ({ bloque: b, indice, total, onCambiar, onMover, onDuplicar, onEliminar }) => {
  const esTiempo = b.modo === 'tiempo';
  const iconoBoton = 'p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer';

  return (
    <div className="rounded-2xl bg-slate-950 border border-slate-800 p-2.5 space-y-2">
      <div className="flex items-start gap-2">
        <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-[11px] font-black flex items-center justify-center shrink-0">{indice + 1}</span>
        <img src={resolverAnimacion(b.animacion)} alt="" loading="lazy" className="w-14 h-14 rounded-xl object-contain bg-white shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-white leading-tight line-clamp-2">{b.nombre_es}</p>
          <p className="text-[9px] text-slate-500 uppercase tracking-wide truncate">
            {b.grupo_muscular} · {b.equipo}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-1 shrink-0">
          <button type="button" className={iconoBoton} disabled={indice === 0} onClick={() => onMover(-1)} title="Subir">
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button type="button" className={iconoBoton} disabled={indice === total - 1} onClick={() => onMover(1)} title="Bajar">
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          <button type="button" className={iconoBoton} onClick={onDuplicar} title="Duplicar">
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button type="button" className={`${iconoBoton} hover:!text-rose-400`} onClick={onEliminar} title="Eliminar">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-1.5 text-[10px]">
        <span className="font-bold text-slate-500 uppercase">Modo</span>
        <div className="flex gap-1">
          <button type="button" className={rapidoClase(esTiempo)} onClick={() => onCambiar({ modo: 'tiempo' })}>
            <Timer className="w-3 h-3 inline mr-1" />
            Tiempo
          </button>
          <button type="button" className={rapidoClase(!esTiempo)} onClick={() => onCambiar({ modo: 'repeticiones' })}>
            <Repeat className="w-3 h-3 inline mr-1" />
            Repeticiones
          </button>
        </div>

        <span className="font-bold text-slate-500 uppercase">Series</span>
        <div className="flex items-center gap-1">
          <button type="button" className={rapidoClase(false)} disabled={b.series <= SERIES_MIN} onClick={() => onCambiar({ series: b.series - 1 })}>
            −
          </button>
          <span className="w-6 text-center text-xs font-black text-white">{b.series}</span>
          <button type="button" className={rapidoClase(false)} disabled={b.series >= SERIES_MAX} onClick={() => onCambiar({ series: b.series + 1 })}>
            +
          </button>
        </div>

        <span className="font-bold text-slate-500 uppercase">Trabajo</span>
        <div className="flex flex-wrap items-center gap-1">
          {(esTiempo ? TIEMPOS_RAPIDOS : REPETICIONES_RAPIDAS).map((v) => (
            <button
              key={v}
              type="button"
              className={rapidoClase(esTiempo ? b.duracionSeg === v : b.repeticiones === v)}
              onClick={() => onCambiar(esTiempo ? { duracionSeg: v } : { repeticiones: v })}
            >
              {esTiempo ? `${v}s` : v}
            </button>
          ))}
          <input
            type="number"
            min={1}
            max={esTiempo ? 600 : 200}
            value={esTiempo ? b.duracionSeg : b.repeticiones}
            onChange={(e) =>
              onCambiar(
                esTiempo
                  ? { duracionSeg: limitar(Number(e.target.value), 1, 600) }
                  : { repeticiones: limitar(Number(e.target.value), 1, 200) }
              )
            }
            className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-[11px] font-bold text-white outline-none focus:border-blue-500"
          />
          <span className="text-slate-500">{esTiempo ? 'seg' : 'reps'}</span>
        </div>

        <span className="font-bold text-slate-500 uppercase">Descanso</span>
        <div className="flex flex-wrap items-center gap-1">
          {DESCANSOS_RAPIDOS.map((v) => (
            <button key={v} type="button" className={rapidoClase(b.descansoSeg === v)} onClick={() => onCambiar({ descansoSeg: v })}>
              {v}s
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

interface FormularioEjercicioPropioProps {
  onGuardado: (ej: Ejercicio, agregarAlCircuito: boolean) => Promise<void>;
}

const FormularioEjercicioPropio: React.FC<FormularioEjercicioPropioProps> = ({ onGuardado }) => {
  const [nombre, setNombre] = useState('');
  const [grupo, setGrupo] = useState<GrupoMuscular>('Cardio / Militar');
  const [equipo, setEquipo] = useState<EquipoEjercicio>('Peso corporal');
  const [musculo, setMusculo] = useState('Sistema cardiovascular');
  const [esMilitar, setEsMilitar] = useState(true);
  const [paso1, setPaso1] = useState('');
  const [paso2, setPaso2] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [vistaPrevia, setVistaPrevia] = useState('');
  const [agregarAlCircuito, setAgregarAlCircuito] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!archivo) {
      setVistaPrevia('');
      return;
    }
    const url = URL.createObjectURL(archivo);
    setVistaPrevia(url);
    return () => URL.revokeObjectURL(url);
  }, [archivo]);

  const aplicarPlantilla = (p: PlantillaPropia) => {
    setNombre(p.nombre);
    setGrupo('Cardio / Militar');
    setEquipo('Peso corporal');
    setMusculo(p.musculo);
    setEsMilitar(true);
    setPaso1(p.pasos[0]);
    setPaso2(p.pasos[1]);
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!archivo) {
      setError('Seleccione la animación .webp o .gif del ejercicio.');
      return;
    }
    setGuardando(true);
    try {
      const ej = await guardarEjercicioPersonalizado(
        {
          nombre_es: nombre.trim(),
          grupo_muscular: grupo,
          equipo,
          musculo_objetivo: musculo.trim(),
          es_militar: esMilitar,
          instrucciones_cortas: [paso1, paso2].map((p) => p.trim()).filter(Boolean),
        },
        archivo
      );
      await onGuardado(ej, agregarAlCircuito);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setGuardando(false);
    }
  };

  const campo = 'w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none focus:border-blue-500';
  const etiqueta = 'block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1';

  return (
    <form onSubmit={enviar} className="flex-1 min-h-0 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_260px] gap-4">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {PLANTILLAS_PROPIAS.map((p) => (
            <button key={p.etiqueta} type="button" onClick={() => aplicarPlantilla(p)} className={chipClase(nombre === p.nombre)}>
              <span className="inline-flex items-center gap-1">
                {p.icono}
                {p.etiqueta}
              </span>
            </button>
          ))}
        </div>
        <div>
          <label className={etiqueta}>Nombre en español *</label>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} required placeholder="Ej: Natación estilo libre" className={campo} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={etiqueta}>Grupo muscular</label>
            <select value={grupo} onChange={(e) => setGrupo(e.target.value as GrupoMuscular)} className={campo}>
              {GRUPOS_MUSCULARES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={etiqueta}>Equipo</label>
            <select value={equipo} onChange={(e) => setEquipo(e.target.value as EquipoEjercicio)} className={campo}>
              {EQUIPOS.map((q) => (
                <option key={q} value={q}>{q}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={etiqueta}>Músculo objetivo</label>
            <input value={musculo} onChange={(e) => setMusculo(e.target.value)} className={campo} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
          <input type="checkbox" checked={esMilitar} onChange={(e) => setEsMilitar(e.target.checked)} className="accent-amber-500" />
          Ejercicio militar / sin equipo
        </label>
        <div>
          <label className={etiqueta}>Instrucción 1</label>
          <input value={paso1} onChange={(e) => setPaso1(e.target.value)} className={campo} placeholder="Posición inicial" />
        </div>
        <div>
          <label className={etiqueta}>Instrucción 2</label>
          <input value={paso2} onChange={(e) => setPaso2(e.target.value)} className={campo} placeholder="Ejecución del movimiento" />
        </div>
        <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
          <input type="checkbox" checked={agregarAlCircuito} onChange={(e) => setAgregarAlCircuito(e.target.checked)} className="accent-blue-500" />
          Agregarlo al circuito al guardar
        </label>
        {error && <p className="text-[11px] text-rose-400">{error}</p>}
        <button
          type="submit"
          disabled={guardando}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider cursor-pointer disabled:opacity-50"
        >
          {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {guardando ? 'Subiendo…' : 'Guardar ejercicio en el catálogo'}
        </button>
        <p className="text-[10px] text-slate-500">
          La animación se sube a Firebase Storage (inbody/ejercicios_custom) y la ficha a Firestore (ejerciciosCustom). Requiere sesión de Admin o Entrenador. Máximo 8 MB.
        </p>
      </div>

      <div className="space-y-2">
        <label className={etiqueta}>Animación (.webp o .gif) *</label>
        <label className="block aspect-square rounded-2xl border-2 border-dashed border-slate-700 hover:border-emerald-500 bg-white overflow-hidden cursor-pointer">
          {vistaPrevia ? (
            <img src={vistaPrevia} alt="Vista previa" className="w-full h-full object-contain" />
          ) : (
            <span className="w-full h-full flex flex-col items-center justify-center gap-2 bg-slate-950 text-slate-500 text-xs font-bold">
              <Upload className="w-6 h-6" />
              Seleccionar archivo
            </span>
          )}
          <input
            type="file"
            accept="image/webp,image/gif,.webp,.gif"
            className="hidden"
            onChange={(e) => setArchivo(e.target.files?.[0] || null)}
          />
        </label>
        {archivo && (
          <p className="text-[10px] text-slate-400 truncate">
            {archivo.name} · {(archivo.size / 1024 / 1024).toFixed(2)} MB
          </p>
        )}
      </div>
    </form>
  );
};
