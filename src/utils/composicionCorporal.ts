import { Sexo, SomatotipoTipo } from '../types/inbody';

/** Nivel de un indicador vs baremo (grasa / músculo). */
export type NivelIndicador = 'BAJO' | 'ESTANDAR' | 'ALTO';

export interface BaremoGrasaBand {
  edadMin: number;
  edadMax: number;
  bajo: number;
  alto: number;
}

export interface BaremoMusculoBand {
  edadMin: number;
  edadMax: number;
  insuficiente: number;
  excelente: number;
}

export interface BaremosSexo {
  GRASA: BaremoGrasaBand[];
  MUSCULO_PCT: BaremoMusculoBand[];
}

export interface BaremosConfig {
  HOMBRE: BaremosSexo;
  MUJER: BaremosSexo;
  /** Penalizaciones de edad corporal (años añadidos / restados). */
  penalizaciones?: EdadCorporalPenalizaciones;
}

export interface EdadCorporalPenalizaciones {
  /** Si % músculo piernas < umbral, suma `anios`. */
  piernasUmbral: number;
  piernasAnios: number;
  brazosUmbral: number;
  brazosAnios: number;
  troncoUmbral: number;
  troncoAnios: number;
  /** Músculo global BAJO / ALTO vs baremo. */
  musculoBajoAnios: number;
  musculoAltoAnios: number;
  /** Cada cuántos puntos de % grasa sobre el Alto se aplican `grasaAltaAnios`. */
  grasaAltaCadaPct: number;
  /** Años por cada bloque de % grasa sobre el Alto. */
  grasaAltaAnios: number;
  /** Años si la grasa queda bajo el Bajo. Negativo resta. */
  grasaBajaAnios: number;
  /** Desde este nivel de grasa visceral (1–30), si todavía no llega al nivel alto. */
  visceralMedioDesde: number;
  visceralMedioAnios: number;
  visceralAltoDesde: number;
  visceralAltoAnios: number;
  /** Si el puntaje es menor que este valor, la edad corporal no baja de edad + saludBajaAnios. */
  saludBajaDesde: number;
  saludBajaAnios: number;
  /** Si el puntaje es mayor o igual, la edad corporal no sube de edad + saludAltaAnios. */
  saludAltaDesde: number;
  saludAltaAnios: number;
}

export const DEFAULT_PENALIZACIONES: EdadCorporalPenalizaciones = {
  piernasUmbral: 90,
  piernasAnios: 1.5,
  brazosUmbral: 90,
  brazosAnios: 1.0,
  troncoUmbral: 90,
  troncoAnios: 1.0,
  musculoBajoAnios: 3.0,
  musculoAltoAnios: -3.0,
  grasaAltaCadaPct: 2,
  grasaAltaAnios: 1.5,
  grasaBajaAnios: -2,
  visceralMedioDesde: 10,
  visceralMedioAnios: 3,
  visceralAltoDesde: 13,
  visceralAltoAnios: 6,
  saludBajaDesde: 70,
  saludBajaAnios: 2,
  saludAltaDesde: 85,
  saludAltaAnios: -2,
};

/** Valores institucionales por defecto (edad corporal / semáforo). */
export const DEFAULT_BAREMOS: BaremosConfig = {
  HOMBRE: {
    GRASA: [
      { edadMin: 18, edadMax: 39, bajo: 10.0, alto: 20.0 },
      { edadMin: 40, edadMax: 59, bajo: 11.0, alto: 22.0 },
      { edadMin: 60, edadMax: 99, bajo: 13.0, alto: 25.0 },
    ],
    MUSCULO_PCT: [{ edadMin: 18, edadMax: 99, insuficiente: 39.0, excelente: 48.0 }],
  },
  MUJER: {
    GRASA: [
      { edadMin: 18, edadMax: 39, bajo: 18.0, alto: 28.0 },
      { edadMin: 40, edadMax: 59, bajo: 19.0, alto: 29.0 },
      { edadMin: 60, edadMax: 99, bajo: 22.0, alto: 32.0 },
    ],
    MUSCULO_PCT: [{ edadMin: 18, edadMax: 99, insuficiente: 31.0, excelente: 39.0 }],
  },
  penalizaciones: { ...DEFAULT_PENALIZACIONES },
};

/** Alias histórico; preferir getBaremosActivos(). */
export const BAREMOS = DEFAULT_BAREMOS;

function cloneBaremos(src: BaremosConfig): BaremosConfig {
  return JSON.parse(JSON.stringify(src)) as BaremosConfig;
}

let activeBaremos: BaremosConfig = cloneBaremos(DEFAULT_BAREMOS);

export function getBaremosActivos(): BaremosConfig {
  return activeBaremos;
}

/** Aplica baremos en runtime (Firestore o panel admin/nutri). */
export function setBaremosActivos(cfg: BaremosConfig): void {
  activeBaremos = cloneBaremos(normalizeBaremosConfig(cfg));
}

export function resetBaremosActivos(): void {
  activeBaremos = cloneBaremos(DEFAULT_BAREMOS);
}

function sanitizeBandGrasa(b: Partial<BaremoGrasaBand>, fallback: BaremoGrasaBand): BaremoGrasaBand {
  const edadMin = Number.isFinite(Number(b.edadMin)) ? Number(b.edadMin) : fallback.edadMin;
  const edadMax = Number.isFinite(Number(b.edadMax)) ? Number(b.edadMax) : fallback.edadMax;
  let bajo = Number.isFinite(Number(b.bajo)) ? Number(b.bajo) : fallback.bajo;
  let alto = Number.isFinite(Number(b.alto)) ? Number(b.alto) : fallback.alto;
  if (alto < bajo) [bajo, alto] = [alto, bajo];
  return { edadMin, edadMax, bajo, alto };
}

function sanitizeBandMusculo(
  b: Partial<BaremoMusculoBand>,
  fallback: BaremoMusculoBand
): BaremoMusculoBand {
  const edadMin = Number.isFinite(Number(b.edadMin)) ? Number(b.edadMin) : fallback.edadMin;
  const edadMax = Number.isFinite(Number(b.edadMax)) ? Number(b.edadMax) : fallback.edadMax;
  let insuficiente = Number.isFinite(Number(b.insuficiente))
    ? Number(b.insuficiente)
    : fallback.insuficiente;
  let excelente = Number.isFinite(Number(b.excelente)) ? Number(b.excelente) : fallback.excelente;
  if (excelente < insuficiente) [insuficiente, excelente] = [excelente, insuficiente];
  return { edadMin, edadMax, insuficiente, excelente };
}

/** Normaliza un config parcial (Firestore) con defaults. */
export function normalizeBaremosConfig(raw?: Partial<BaremosConfig> | null): BaremosConfig {
  const base = cloneBaremos(DEFAULT_BAREMOS);
  if (!raw) return base;

  (['HOMBRE', 'MUJER'] as const).forEach((sexo) => {
    const src = raw[sexo];
    if (!src) return;
    if (Array.isArray(src.GRASA) && src.GRASA.length) {
      base[sexo].GRASA = src.GRASA.map((b, i) =>
        sanitizeBandGrasa(b || {}, base[sexo].GRASA[i] || base[sexo].GRASA[0])
      );
    }
    if (Array.isArray(src.MUSCULO_PCT) && src.MUSCULO_PCT.length) {
      base[sexo].MUSCULO_PCT = src.MUSCULO_PCT.map((b, i) =>
        sanitizeBandMusculo(b || {}, base[sexo].MUSCULO_PCT[i] || base[sexo].MUSCULO_PCT[0])
      );
    }
  });

  const p: Partial<EdadCorporalPenalizaciones> = raw.penalizaciones || {};
  const nextPen: EdadCorporalPenalizaciones = { ...DEFAULT_PENALIZACIONES };
  (Object.keys(DEFAULT_PENALIZACIONES) as Array<keyof EdadCorporalPenalizaciones>).forEach((key) => {
    const v = Number(p[key]);
    if (Number.isFinite(v)) nextPen[key] = v;
  });
  base.penalizaciones = nextPen;

  return base;
}

export function getPenalizacionesActivas(): EdadCorporalPenalizaciones {
  return { ...DEFAULT_PENALIZACIONES, ...(activeBaremos.penalizaciones || {}) };
}

const MATRIZ_3X3: Record<string, SomatotipoTipo> = {
  ALTO_BAJO: 'Tipo musculoso desarrollado',
  ALTO_ESTANDAR: 'Tipo muscular estándar',
  ALTO_ALTO: 'Tipo de sobrepeso muscular',
  ESTANDAR_BAJO: 'Tipo musculoso magro',
  ESTANDAR_ESTANDAR: 'Tipo estándar',
  ESTANDAR_ALTO: 'Tipo muscular con sobrepeso',
  BAJO_BAJO: 'Tipo delgado',
  BAJO_ESTANDAR: 'Falta de tipo de ejercicio',
  BAJO_ALTO: 'Tipo obeso edematoso',
};

export interface AnalisisCorporalInput {
  edad: number;
  sexo: Sexo;
  pctGrasa: number;
  pctSMM: number;
  grasaVisceral: number;
  pctMusculoPiernas?: number;
  pctMusculoBrazos?: number;
  pctMusculoTronco?: number;
  puntajeSalud: number;
}

export interface AnalisisCorporalResult {
  nivelGrasa: NivelIndicador;
  nivelMusculo: NivelIndicador;
  tipoCuerpo: SomatotipoTipo;
  edadCorporal: number;
  nivelSalud: 1 | 2 | 3;
  deltas: {
    grasa: number;
    visceral: number;
    seglarPiernas: number;
    seglarBrazos: number;
    seglarTronco: number;
    musculo: number;
    /** Años que agregó o quitó el puntaje al final. 0 si no movió el resultado. */
    salud: number;
  };
  alertasSarcopenia: string[];
  baremoGrasa: { bajo: number; alto: number };
  baremoMusculo: { insuficiente: number; excelente: number };
}

function safeNum(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clampAge(edad: number): number {
  return Math.max(16, Math.min(99, Math.round(safeNum(edad, 30))));
}

function sexoKey(sexo: Sexo | string): 'HOMBRE' | 'MUJER' {
  return String(sexo).toUpperCase().startsWith('F') ? 'MUJER' : 'HOMBRE';
}

function pickGrasaBaremo(sexo: Sexo, edad: number, cfg?: BaremosConfig) {
  const bands = (cfg || getBaremosActivos())[sexoKey(sexo)].GRASA;
  const e = clampAge(edad);
  return bands.find((b) => e >= b.edadMin && e <= b.edadMax) || bands[bands.length - 1];
}

function pickMusculoBaremo(sexo: Sexo, edad: number, cfg?: BaremosConfig) {
  const bands = (cfg || getBaremosActivos())[sexoKey(sexo)].MUSCULO_PCT;
  const e = clampAge(edad);
  return bands.find((b) => e >= b.edadMin && e <= b.edadMax) || bands[0];
}

function nivelSaludDesdePuntaje(puntaje: number, pen: EdadCorporalPenalizaciones): 1 | 2 | 3 {
  const s = safeNum(puntaje, 0);
  if (s >= pen.saludAltaDesde) return 3;
  if (s >= pen.saludBajaDesde) return 2;
  return 1;
}

export function getNivelSalud(puntaje: number): 1 | 2 | 3 {
  return nivelSaludDesdePuntaje(puntaje, getPenalizacionesActivas());
}

export function evaluarNivelGrasa(
  pctGrasa: number,
  sexo: Sexo,
  edad: number,
  cfg?: BaremosConfig
): NivelIndicador {
  const baremo = pickGrasaBaremo(sexo, edad, cfg);
  const g = safeNum(pctGrasa, baremo.bajo + 1);
  if (g < baremo.bajo) return 'BAJO';
  if (g > baremo.alto) return 'ALTO';
  return 'ESTANDAR';
}

export function evaluarNivelMusculo(
  pctSMM: number,
  sexo: Sexo,
  edad: number,
  cfg?: BaremosConfig
): NivelIndicador {
  const baremo = pickMusculoBaremo(sexo, edad, cfg);
  const m = safeNum(pctSMM, baremo.insuficiente + 1);
  if (m < baremo.insuficiente) return 'BAJO';
  if (m > baremo.excelente) return 'ALTO';
  return 'ESTANDAR';
}

export function resolverTipoCuerpo(
  nivelMusculo: NivelIndicador,
  nivelGrasa: NivelIndicador
): SomatotipoTipo {
  const key = `${nivelMusculo}_${nivelGrasa}`;
  return MATRIZ_3X3[key] || 'Tipo estándar';
}

function deltaGrasa(
  pctGrasa: number,
  nivel: NivelIndicador,
  limiteAlto: number,
  pen: EdadCorporalPenalizaciones
): number {
  if (nivel === 'ALTO') {
    const cada =
      pen.grasaAltaCadaPct > 0 ? pen.grasaAltaCadaPct : DEFAULT_PENALIZACIONES.grasaAltaCadaPct;
    return pen.grasaAltaAnios * ((safeNum(pctGrasa, limiteAlto) - limiteAlto) / cada);
  }
  if (nivel === 'BAJO') return pen.grasaBajaAnios;
  return 0.0;
}

function deltaVisceral(nivel: number, pen: EdadCorporalPenalizaciones): number {
  const v = Math.round(safeNum(nivel, 5));
  const rules = [
    { desde: pen.visceralAltoDesde, anios: pen.visceralAltoAnios },
    { desde: pen.visceralMedioDesde, anios: pen.visceralMedioAnios },
  ].sort((a, b) => b.desde - a.desde);
  for (const rule of rules) {
    if (v >= rule.desde) return rule.anios;
  }
  return 0.0;
}

function deltaMusculo(_nivel: NivelIndicador): number {
  return 0;
}

function deltaMusculoEfectivo(nivel: NivelIndicador, pen: EdadCorporalPenalizaciones): number {
  if (nivel === 'BAJO') return pen.musculoBajoAnios;
  if (nivel === 'ALTO') return pen.musculoAltoAnios;
  return 0.0;
}

function deltaSeglar(pct: number | undefined, umbral: number, anios: number): number {
  const p = safeNum(pct, 100);
  return p < umbral ? anios : 0.0;
}

export function calcularAnalisisCorporal(
  input: AnalisisCorporalInput,
  cfgOverride?: BaremosConfig | null
): AnalisisCorporalResult {
  const cfg = cfgOverride ? normalizeBaremosConfig(cfgOverride) : getBaremosActivos();
  const edad = clampAge(input.edad);
  const sexo: Sexo = String(input.sexo).toUpperCase().startsWith('F') ? 'F' : 'M';
  const pctGrasa = safeNum(input.pctGrasa, sexo === 'F' ? 25 : 18);
  const pctSMM = safeNum(input.pctSMM, sexo === 'F' ? 35 : 42);
  const visceral = Math.max(1, Math.min(30, Math.round(safeNum(input.grasaVisceral, 5))));
  const puntaje = Math.max(0, Math.min(100, Math.round(safeNum(input.puntajeSalud, 70))));
  const pen = { ...DEFAULT_PENALIZACIONES, ...(cfg.penalizaciones || {}) };

  const baremoG = pickGrasaBaremo(sexo, edad, cfg);
  const baremoM = pickMusculoBaremo(sexo, edad, cfg);

  const nivelGrasa = evaluarNivelGrasa(pctGrasa, sexo, edad, cfg);
  const nivelMusculo = evaluarNivelMusculo(pctSMM, sexo, edad, cfg);
  const tipoCuerpo = resolverTipoCuerpo(nivelMusculo, nivelGrasa);
  const nivelSalud = nivelSaludDesdePuntaje(puntaje, pen);

  const dG = deltaGrasa(pctGrasa, nivelGrasa, baremoG.alto, pen);
  const dV = deltaVisceral(visceral, pen);
  const dP = deltaSeglar(input.pctMusculoPiernas, pen.piernasUmbral, pen.piernasAnios);
  const dB = deltaSeglar(input.pctMusculoBrazos, pen.brazosUmbral, pen.brazosAnios);
  const dT = deltaSeglar(input.pctMusculoTronco, pen.troncoUmbral, pen.troncoAnios);
  const dM = deltaMusculoEfectivo(nivelMusculo, pen);
  void deltaMusculo;

  let edadCorp = edad + dG + dV + dP + dB + dT + dM;
  let dS = 0;

  if (puntaje < pen.saludBajaDesde) {
    const piso = edad + pen.saludBajaAnios;
    if (edadCorp < piso) {
      dS = piso - edadCorp;
      edadCorp = piso;
    }
  } else if (puntaje >= pen.saludAltaDesde) {
    const techo = edad + pen.saludAltaAnios;
    if (edadCorp > techo) {
      dS = techo - edadCorp;
      edadCorp = techo;
    }
  }

  edadCorp = Math.max(18, Math.round(edadCorp));

  const alertasSarcopenia: string[] = [];
  if (dP > 0) {
    alertasSarcopenia.push(
      `Piernas con músculo segmental bajo (<${pen.piernasUmbral}%): +${pen.piernasAnios} años · riesgo sarcopenia tren inferior.`
    );
  }
  if (dB > 0) {
    alertasSarcopenia.push(
      `Brazos con músculo segmental bajo (<${pen.brazosUmbral}%): +${pen.brazosAnios} años · menor potencia de carga.`
    );
  }
  if (dT > 0) {
    alertasSarcopenia.push(
      `Tronco/dorso con músculo segmental bajo (<${pen.troncoUmbral}%): +${pen.troncoAnios} años · menor estabilidad del core.`
    );
  }
  if (nivelMusculo === 'BAJO' && edad >= 50) {
    alertasSarcopenia.push(
      'Adulto mayor con músculo global bajo: priorizar fuerza progresiva para frenar sarcopenia.'
    );
  }
  if (nivelMusculo === 'BAJO' && edad < 35 && pctGrasa > baremoG.alto) {
    alertasSarcopenia.push(
      'Joven con alto peso graso y bajo músculo: recomposición (fuerza + déficit controlado).'
    );
  }

  return {
    nivelGrasa,
    nivelMusculo,
    tipoCuerpo,
    edadCorporal: edadCorp,
    nivelSalud,
    deltas: {
      grasa: dG,
      visceral: dV,
      seglarPiernas: dP,
      seglarBrazos: dB,
      seglarTronco: dT,
      musculo: dM,
      salud: dS,
    },
    alertasSarcopenia,
    baremoGrasa: { bajo: baremoG.bajo, alto: baremoG.alto },
    baremoMusculo: { insuficiente: baremoM.insuficiente, excelente: baremoM.excelente },
  };
}

export function pctSmmFromKg(musculoKg: number, pesoKg: number): number {
  const p = safeNum(pesoKg, 0);
  if (p <= 0) return 0;
  return (safeNum(musculoKg, 0) / p) * 100;
}

export function pctMusculoPiernasFromSegmental(
  pctPiernaD?: number,
  pctPiernaI?: number
): number {
  const a = safeNum(pctPiernaD, NaN);
  const b = safeNum(pctPiernaI, NaN);
  if (Number.isFinite(a) && Number.isFinite(b)) return (a + b) / 2;
  if (Number.isFinite(a)) return a;
  if (Number.isFinite(b)) return b;
  return 100;
}

export function pctMusculoBrazosFromSegmental(
  pctBrazoD?: number,
  pctBrazoI?: number
): number {
  return pctMusculoPiernasFromSegmental(pctBrazoD, pctBrazoI);
}

export function pctMusculoTroncoFromSegmental(pctTronco?: number): number {
  const t = safeNum(pctTronco, NaN);
  return Number.isFinite(t) ? t : 100;
}
