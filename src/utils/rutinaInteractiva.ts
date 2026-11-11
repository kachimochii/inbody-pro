import type { BloqueEjercicioPlan, PlanEntrenamiento, SomatotipoTipo } from '../types/inbody';
import { cargarEjercicios, type Ejercicio } from '../lib/ejerciciosService';

/** Segundos estimados por repetición para calcular la duración de bloques por repeticiones. */
const SEG_POR_REPETICION = 3;
/** Transición entre ejercicios distintos. */
const SEG_TRANSICION = 15;

export const SERIES_MIN = 1;
export const SERIES_MAX = 10;
export const TIEMPOS_RAPIDOS = [30, 40, 45, 60];
export const REPETICIONES_RAPIDAS = [12, 15, 20, 25];
export const DESCANSOS_RAPIDOS = [15, 20, 30, 45, 60];

const SOMATOTIPOS_BAJO_IMPACTO: SomatotipoTipo[] = [
  'Tipo obeso edematoso',
  'Tipo muscular con sobrepeso',
  'Tipo de sobrepeso muscular',
  'Falta de tipo de ejercicio',
];

export function nuevoUid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `b-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function crearBloque(
  ej: Ejercicio,
  opciones: Partial<Pick<BloqueEjercicioPlan, 'modo' | 'series' | 'duracionSeg' | 'repeticiones' | 'descansoSeg'>> = {}
): BloqueEjercicioPlan {
  const bloque: BloqueEjercicioPlan = {
    uid: nuevoUid(),
    ejercicioId: ej.id,
    nombre_es: ej.nombre_es,
    grupo_muscular: ej.grupo_muscular,
    equipo: ej.equipo,
    animacion: ej.animacion,
    modo: opciones.modo ?? 'tiempo',
    series: opciones.series ?? 3,
    duracionSeg: opciones.duracionSeg ?? 45,
    repeticiones: opciones.repeticiones ?? 15,
    descansoSeg: opciones.descansoSeg ?? 20,
  };
  // Firestore rechaza campos undefined: solo se incluye si hay texto.
  if (ej.instrucciones_cortas[0]) bloque.instruccionCorta = ej.instrucciones_cortas[0];
  return bloque;
}

export function segundosTrabajo(b: BloqueEjercicioPlan): number {
  return b.modo === 'tiempo' ? b.duracionSeg : b.repeticiones * SEG_POR_REPETICION;
}

export function calcularDuracionEstimadaMin(bloques: BloqueEjercicioPlan[]): number {
  if (!bloques.length) return 0;
  const total = bloques.reduce(
    (acc, b) => acc + b.series * (segundosTrabajo(b) + b.descansoSeg),
    SEG_TRANSICION * (bloques.length - 1)
  );
  return Math.max(1, Math.ceil(total / 60));
}

/** "Flexiones de codo (Pechas) — 3x45s (20s descanso)" */
export function describirBloque(b: BloqueEjercicioPlan): string {
  const trabajo = b.modo === 'tiempo' ? `${b.duracionSeg}s` : `${b.repeticiones} reps`;
  return `${b.nombre_es} — ${b.series}x${trabajo} (${b.descansoSeg}s descanso)`;
}

export function ejerciciosClaveDesdeRutina(bloques: BloqueEjercicioPlan[]): string[] {
  return bloques.map(describirBloque);
}

export function numeroFicha(fichaEdad: string): number {
  const m = /ficha\s*(\d+)/i.exec(fichaEdad || '');
  return m ? Number(m[1]) : 1;
}

export function requiereBajoImpacto(somatotipo: SomatotipoTipo, fichaEdad: string): boolean {
  return SOMATOTIPOS_BAJO_IMPACTO.includes(somatotipo) || numeroFicha(fichaEdad) >= 3;
}

interface Ranura {
  /** Ids del catálogo base en orden de preferencia (variante estándar del movimiento). */
  preferidos: string[];
  /** Respaldo si los preferidos no existen o ya se usaron (p. ej. catálogo personalizado). */
  patron: RegExp;
  modo: BloqueEjercicioPlan['modo'];
  valor: number;
}

/** Ficha 1/2 con somatotipo estándar o muscular: batería militar clásica. */
const RANURAS_MILITAR: Ranura[] = [
  { preferidos: ['0662'], patron: /^Flexiones de codo/, modo: 'repeticiones', valor: 20 },
  { preferidos: ['0735', '0001'], patron: /^Flexiones de cadera|^Abdominal corto/, modo: 'repeticiones', valor: 25 },
  { preferidos: ['0652', '1326'], patron: /^Dominadas/, modo: 'repeticiones', valor: 8 },
  { preferidos: ['1160'], patron: /^Burpees/, modo: 'tiempo', valor: 40 },
  { preferidos: ['0514', '3119'], patron: /^Sentadilla/, modo: 'repeticiones', valor: 25 },
  { preferidos: ['3665', '0464'], patron: /^Plancha isométrica/, modo: 'tiempo', valor: 45 },
  { preferidos: ['1460', '3470'], patron: /^Zancada/, modo: 'repeticiones', valor: 20 },
  { preferidos: ['0630', '3224'], patron: /^Escaladores|^Polichinelas/, modo: 'tiempo', valor: 40 },
];

/** Sobrepeso/obesidad o Ficha 3/4: sin saltos, prioridad a core y articulaciones. */
const RANURAS_BAJO_IMPACTO: Ranura[] = [
  { preferidos: ['0493'], patron: /^Flexiones de codo.*(contra la pared|inclinad)/, modo: 'repeticiones', valor: 12 },
  { preferidos: ['3132', '3119'], patron: /^Sentadilla(?!.*salto)/, modo: 'repeticiones', valor: 15 },
  { preferidos: ['3013', '3561'], patron: /^Puente/, modo: 'repeticiones', valor: 15 },
  { preferidos: ['3665'], patron: /^Plancha isométrica/, modo: 'tiempo', valor: 30 },
  { preferidos: ['0276', '0274'], patron: /^Bicho muerto|^Abdominal corto/, modo: 'tiempo', valor: 30 },
  { preferidos: ['1373', '1387'], patron: /^Elevación de talones/, modo: 'repeticiones', valor: 15 },
  { preferidos: ['3672', '0628'], patron: /^Marcha|^Paso|^Caminata/, modo: 'tiempo', valor: 45 },
  { preferidos: ['0687', '0002'], patron: /^Flexión lateral|^Giro/, modo: 'tiempo', valor: 30 },
];

const PATRON_IMPACTO = /salto|burpee|pliométric|polichinela|escaladores|carrera|sprint/i;

function elegirEjercicio(catalogo: Ejercicio[], ranura: Ranura, usados: Set<string>, bajoImpacto: boolean) {
  for (const id of ranura.preferidos) {
    const ej = !usados.has(id) && catalogo.find((e) => e.id === id);
    if (ej) return ej;
  }
  const candidatos = catalogo.filter(
    (e) =>
      !usados.has(e.id) &&
      e.equipo === 'Peso corporal' &&
      ranura.patron.test(e.nombre_es) &&
      !(bajoImpacto && PATRON_IMPACTO.test(e.nombre_es))
  );
  // El nombre más corto suele ser la variante base (sin modificadores ni variantes).
  candidatos.sort((a, b) => Number(b.es_militar) - Number(a.es_militar) || a.nombre_es.length - b.nombre_es.length);
  return candidatos[0];
}

/** Arma 6 a 8 bloques coherentes del catálogo según somatotipo y ficha de edad del plan. */
export function autogenerarCircuitoMilitar(
  catalogo: Ejercicio[],
  somatotipo: SomatotipoTipo,
  fichaEdad: string
): BloqueEjercicioPlan[] {
  const ficha = numeroFicha(fichaEdad);
  const bajoImpacto = requiereBajoImpacto(somatotipo, fichaEdad);
  const ranuras = bajoImpacto ? RANURAS_BAJO_IMPACTO : RANURAS_MILITAR;
  const series = bajoImpacto ? (ficha >= 4 ? 2 : 3) : ficha === 1 ? 4 : 3;
  const descansoSeg = bajoImpacto ? 30 : 20;

  const usados = new Set<string>();
  const bloques: BloqueEjercicioPlan[] = [];
  for (const ranura of ranuras) {
    if (bloques.length >= 8) break;
    const ej = elegirEjercicio(catalogo, ranura, usados, bajoImpacto);
    if (!ej) continue;
    usados.add(ej.id);
    bloques.push(
      crearBloque(ej, {
        modo: ranura.modo,
        series,
        descansoSeg,
        duracionSeg: ranura.modo === 'tiempo' ? ranura.valor : 45,
        repeticiones: ranura.modo === 'repeticiones' ? ranura.valor : 15,
      })
    );
  }

  // Completa hasta 6 con ejercicios militares sin equipo de grupos aún no cubiertos.
  if (bloques.length < 6) {
    const grupos = new Set(bloques.map((b) => b.grupo_muscular));
    const extras = catalogo
      .filter((e) => e.es_militar && !usados.has(e.id) && !(bajoImpacto && PATRON_IMPACTO.test(e.nombre_es)))
      .sort((a, b) => Number(grupos.has(a.grupo_muscular)) - Number(grupos.has(b.grupo_muscular)) || a.nombre_es.length - b.nombre_es.length);
    for (const ej of extras) {
      if (bloques.length >= 6) break;
      usados.add(ej.id);
      grupos.add(ej.grupo_muscular);
      bloques.push(crearBloque(ej, { modo: 'tiempo', series, descansoSeg, duracionSeg: bajoImpacto ? 30 : 40 }));
    }
  }
  return bloques;
}

const PATRON_MET_ALTO =
  /flexiones de codo|dominadas|burpee|polichinela|escaladores|plancha|carrera|caminata|trote|nataci[oó]n|salto|cardio/i;

/** MET ≈ 8 para militar/cardio; 5.5 para fuerza. */
export function metEstimadoBloque(b: BloqueEjercicioPlan, esMilitarCatalogo?: boolean): number {
  if (esMilitarCatalogo) return 8;
  if (b.grupo_muscular === 'Cardio / Militar') return 8;
  if (PATRON_MET_ALTO.test(b.nombre_es)) return 8;
  return 5.5;
}

/**
 * kcal = Math.round((met * 3.5 * peso) / 200 * (segTrabajo / 60))
 * Suma por bloque según MET individual y tiempo efectivo de trabajo (sin descansos).
 */
export function calcularCaloriasQuemadas(
  bloques: BloqueEjercicioPlan[],
  pesoUsuarioKg: number,
  militarPorId?: Map<string, boolean>
): number {
  const peso = pesoUsuarioKg > 0 ? pesoUsuarioKg : 72;
  let kcal = 0;
  for (const b of bloques) {
    const seg = b.series * segundosTrabajo(b);
    const met = metEstimadoBloque(b, militarPorId?.get(b.ejercicioId));
    kcal += (met * 3.5 * peso) / 200 * (seg / 60);
  }
  return Math.max(0, Math.round(kcal));
}

export function segundosTrabajoTotales(bloques: BloqueEjercicioPlan[]): number {
  return bloques.reduce((acc, b) => acc + b.series * segundosTrabajo(b), 0);
}

/** Si el plan no tiene rutinaInteractiva, genera 6–8 bloques del catálogo al vuelo. */
export async function asegurarRutinaInteractiva(plan: PlanEntrenamiento): Promise<BloqueEjercicioPlan[]> {
  if (plan.rutinaInteractiva && plan.rutinaInteractiva.length > 0) {
    return plan.rutinaInteractiva.map((b) => ({ ...b }));
  }
  const catalogo = await cargarEjercicios();
  return autogenerarCircuitoMilitar(catalogo, plan.somatotipo, plan.fichaEdad);
}

export interface EnfoqueDiaRutina {
  id: 1 | 2 | 3 | 4 | 5;
  etiquetaCorta: string;
  enfoqueDia: string;
  grupos: string[];
}

export const ENFOQUES_DIA: Record<number, EnfoqueDiaRutina> = {
  1: {
    id: 1,
    etiquetaCorta: 'Lunes',
    enfoqueDia: 'Día 1 · Tren Superior y Empuje/Tracción',
    grupos: ['Pecho', 'Espalda', 'Hombros', 'Brazos'],
  },
  2: {
    id: 2,
    etiquetaCorta: 'Martes',
    enfoqueDia: 'Día 2 · Tren Inferior y Potencia en Piernas',
    grupos: ['Piernas'],
  },
  3: {
    id: 3,
    etiquetaCorta: 'Miércoles',
    enfoqueDia: 'Día 3 · Abdomen, Core y Cardio Táctico',
    grupos: ['Abdomen / Core', 'Cardio / Militar'],
  },
  4: {
    id: 4,
    etiquetaCorta: 'Jueves',
    enfoqueDia: 'Día 4 · Acondicionamiento de Cuerpo Completo',
    grupos: ['Pecho', 'Espalda', 'Piernas', 'Abdomen / Core', 'Hombros', 'Brazos'],
  },
  5: {
    id: 5,
    etiquetaCorta: 'Viernes',
    enfoqueDia: 'Día 5 · Resistencia Metabólica y Quema Calórica',
    grupos: ['Cardio / Militar', 'Abdomen / Core', 'Piernas'],
  },
};

const NOMBRE_DIA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export function enfoqueDelDia(fechaIso: string): EnfoqueDiaRutina & { nombreDia: string } {
  const [y, m, d] = String(fechaIso).split('-').map(Number);
  const date = Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)
    ? new Date(y, m - 1, d)
    : new Date();
  const dow = date.getDay();
  const id = dow === 1 ? 1 : dow === 2 ? 2 : dow === 3 ? 3 : dow === 4 ? 4 : 5;
  const base = ENFOQUES_DIA[id];
  const nombreDia = dow === 0 || dow === 6 ? NOMBRE_DIA[dow] : base.etiquetaCorta;
  return { ...base, nombreDia };
}

function hashSeed(texto: string): number {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function barajar<T>(lista: T[], rnd: () => number): T[] {
  const out = [...lista];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function varianteEquivalente(bloque: BloqueEjercicioPlan, catalogo: Ejercicio[], rnd: () => number, usados: Set<string>): Ejercicio | undefined {
  const mismoGrupo = catalogo.filter(
    (e) => e.grupo_muscular === bloque.grupo_muscular && !usados.has(e.id)
  );
  if (!mismoGrupo.length) return catalogo.find((e) => e.id === bloque.ejercicioId);
  const palabra = bloque.nombre_es.split(/[\s(]/)[0] || '';
  const cercanos = mismoGrupo.filter((e) => e.nombre_es.startsWith(palabra) || e.id === bloque.ejercicioId);
  const pool = cercanos.length >= 2 ? cercanos : mismoGrupo;
  return barajar(pool, rnd)[0];
}

function elegirPorGrupos(
  catalogo: Ejercicio[],
  grupos: string[],
  bajoImpacto: boolean,
  rnd: () => number,
  cantidad: number
): Ejercicio[] {
  const pool = catalogo.filter(
    (e) =>
      grupos.includes(e.grupo_muscular) &&
      e.equipo === 'Peso corporal' &&
      !(bajoImpacto && PATRON_IMPACTO.test(e.nombre_es))
  );
  const militares = pool.filter((e) => e.es_militar);
  const base = militares.length >= cantidad ? militares : pool;
  const mezclados = barajar(base, rnd);
  const elegidos: Ejercicio[] = [];
  const gruposUsados = new Set<string>();
  for (const ej of mezclados) {
    if (elegidos.length >= cantidad) break;
    if (gruposUsados.has(ej.grupo_muscular) && gruposUsados.size < grupos.length && elegidos.length < grupos.length) {
      continue;
    }
    gruposUsados.add(ej.grupo_muscular);
    elegidos.push(ej);
  }
  if (elegidos.length < cantidad) {
    for (const ej of mezclados) {
      if (elegidos.length >= cantidad) break;
      if (elegidos.some((x) => x.id === ej.id)) continue;
      elegidos.push(ej);
    }
  }
  return elegidos;
}

/**
 * Rutina distinta cada día del mes: enfoque por día de la semana + semilla
 * `fechaIso + plan.id + varianteOffset` (y cédula si se indica).
 */
export function obtenerRutinaDelDia(
  plan: PlanEntrenamiento,
  fechaIso: string,
  cedulaUsuario?: string,
  catalogo: Ejercicio[] = [],
  varianteOffset = 0
): { bloques: BloqueEjercicioPlan[]; enfoqueDia: string } {
  const meta = enfoqueDelDia(fechaIso);
  const enfoqueDia = `Rutina de Hoy: ${meta.nombreDia} · ${meta.enfoqueDia.replace(/^Día \d+ · /, '')}`;
  const seed = hashSeed(`${fechaIso}|${plan.id}|${varianteOffset || 0}|${cedulaUsuario || ''}`);
  const rnd = mulberry32(seed);
  const bajoImpacto = requiereBajoImpacto(plan.somatotipo, plan.fichaEdad);
  const ficha = numeroFicha(plan.fichaEdad);
  const series = bajoImpacto ? (ficha >= 4 ? 2 : 3) : ficha === 1 ? 4 : 3;
  const descansoSeg = bajoImpacto ? 30 : 20;
  const usados = new Set<string>();

  const fijos = plan.rutinaInteractiva && plan.rutinaInteractiva.length > 0 ? plan.rutinaInteractiva : null;
  if (fijos && catalogo.length) {
    const bloques = fijos.map((b) => {
      const ej = varianteEquivalente(b, catalogo, rnd, usados);
      if (!ej) return { ...b, uid: nuevoUid() };
      usados.add(ej.id);
      return {
        ...crearBloque(ej, {
          modo: b.modo,
          series: b.series,
          duracionSeg: b.duracionSeg,
          repeticiones: b.repeticiones,
          descansoSeg: b.descansoSeg,
        }),
      };
    });
    return { bloques, enfoqueDia };
  }

  if (catalogo.length) {
    const n = 6 + Math.floor(rnd() * 3);
    const ejercicios = elegirPorGrupos(catalogo, meta.grupos, bajoImpacto, rnd, n);
    const bloques = ejercicios.map((ej) => {
      const modo: BloqueEjercicioPlan['modo'] =
        ej.grupo_muscular === 'Cardio / Militar' || /plancha|escalador|polichinela|carrera|caminata/i.test(ej.nombre_es)
          ? 'tiempo'
          : rnd() > 0.45
            ? 'tiempo'
            : 'repeticiones';
      return crearBloque(ej, {
        modo,
        series,
        descansoSeg,
        duracionSeg: bajoImpacto ? 30 : modo === 'tiempo' ? 40 : 45,
        repeticiones: bajoImpacto ? 12 : 20,
      });
    });
    if (bloques.length) return { bloques, enfoqueDia };
  }

  const fallback = fijos
    ? fijos.map((b) => ({ ...b, uid: nuevoUid() }))
    : autogenerarCircuitoMilitar(catalogo, plan.somatotipo, plan.fichaEdad);
  return { bloques: fallback, enfoqueDia };
}

export async function cargarRutinaDelDia(
  plan: PlanEntrenamiento,
  fechaIso: string,
  cedulaUsuario?: string,
  varianteOffset = 0
): Promise<{ bloques: BloqueEjercicioPlan[]; enfoqueDia: string }> {
  const catalogo = await cargarEjercicios();
  return obtenerRutinaDelDia(plan, fechaIso, cedulaUsuario, catalogo, varianteOffset);
}
