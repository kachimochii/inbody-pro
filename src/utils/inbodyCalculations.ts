import { InBodyRecord, SegmentalValues, Sexo, SomatotipoTipo } from '../types/inbody';
import {
  calcularAnalisisCorporal,
  getNivelSalud,
  pctMusculoPiernasFromSegmental,
  pctMusculoBrazosFromSegmental,
  pctMusculoTroncoFromSegmental,
  pctSmmFromKg,
} from './composicionCorporal';

export const TICKS = {
  peso: [21, 43, 64, 85, 93, 100, 107, 115, 136, 157, 179],
  musculo: [83, 85, 88, 90, 95, 100, 105, 110, 113, 115, 117],
  grasa: [42, 50, 58, 67, 83, 100, 117, 133, 142, 150, 158],
};

export const TICKS_OBESIDAD = {
  imc: [12, 14, 16, 18, 20, 21, 23, 25, 31, 37, 43],
  pctGrasa: [6, 7, 8, 10, 12, 15, 17, 20, 33, 47, 61],
  adiposidad: [82, 85, 87, 90, 95, 100, 105, 110, 112, 115, 117],
};

/**
 * @deprecated Preferir resolveTipoCuerpo / calcularAnalisisCorporal.
 * Firma antigua por IMC — aproxima SMM para no romper callers.
 */
export function determineSomatotipo(imc: number, pctGrasa: number, sexo: Sexo): SomatotipoTipo {
  const pctSMMApprox = sexo === 'F' ? 34 : 42;
  return calcularAnalisisCorporal({
    edad: 30,
    sexo,
    pctGrasa,
    pctSMM: pctSMMApprox,
    grasaVisceral: pctGrasa > 28 ? 12 : 6,
    puntajeSalud: imc > 25 ? 65 : 78,
  }).tipoCuerpo;
}

export function getNivelFromScore(score: number): 1 | 2 | 3 {
  return getNivelSalud(score);
}

export interface BiologicalAgeParams {
  edadCronologica: number;
  score: number;
  pctGrasa?: number;
  grasaVisceral?: number;
  tipoCuerpo?: string;
  sexo?: Sexo;
  adiposidad?: number;
  pctSMM?: number;
  pctMusculoPiernas?: number;
  pctMusculoBrazos?: number;
  pctMusculoTronco?: number;
  musculoKg?: number;
  pesoKg?: number;
}

/** Edad corporal automática (nunca toma valor del equipo/CSV). */
export function calculateBiologicalAge(params: BiologicalAgeParams): number;
export function calculateBiologicalAge(edadCronologica: number, score: number): number;
export function calculateBiologicalAge(
  edadOrParams: number | BiologicalAgeParams,
  scoreMaybe?: number
): number {
  const p: BiologicalAgeParams =
    typeof edadOrParams === 'number'
      ? { edadCronologica: edadOrParams, score: scoreMaybe ?? 70 }
      : edadOrParams;

  const sexo: Sexo = p.sexo === 'F' ? 'F' : 'M';
  const pctSMM =
    p.pctSMM ??
    (p.musculoKg != null && p.pesoKg != null
      ? pctSmmFromKg(p.musculoKg, p.pesoKg)
      : sexo === 'F'
        ? 34
        : 42);

  return calcularAnalisisCorporal({
    edad: p.edadCronologica,
    sexo,
    pctGrasa: p.pctGrasa ?? (sexo === 'F' ? 25 : 18),
    pctSMM,
    grasaVisceral: p.grasaVisceral ?? 5,
    pctMusculoPiernas: p.pctMusculoPiernas,
    pctMusculoBrazos: p.pctMusculoBrazos,
    pctMusculoTronco: p.pctMusculoTronco,
    puntajeSalud: p.score,
  }).edadCorporal;
}

/** Siempre recalcula (ignora edadCorporal guardada del equipo). */
export function resolveEdadCorporal(
  medicion: Pick<
    InBodyRecord,
    'inbodyScore' | 'pctGrasa' | 'grasaVisceral' | 'musculoKg' | 'peso' | 'segmental'
  >,
  edadCronologica: number,
  sexo: Sexo = 'M',
  _preferStoredIfSensible = false
): number {
  return calcularAnalisisCorporal({
    edad: edadCronologica,
    sexo,
    pctGrasa: medicion.pctGrasa,
    pctSMM: pctSmmFromKg(medicion.musculoKg, medicion.peso),
    grasaVisceral: medicion.grasaVisceral,
    pctMusculoPiernas: pctMusculoPiernasFromSegmental(
      medicion.segmental?.musculoPDPct,
      medicion.segmental?.musculoPIPct
    ),
    pctMusculoBrazos: pctMusculoBrazosFromSegmental(
      medicion.segmental?.musculoBDPct,
      medicion.segmental?.musculoBIPct
    ),
    pctMusculoTronco: pctMusculoTroncoFromSegmental(medicion.segmental?.musculoTRPct),
    puntajeSalud: medicion.inbodyScore,
  }).edadCorporal;
}

/** Análisis completo (edad + sarcopenia segmental + somatotipo). */
export function resolveAnalisisCorporal(
  medicion: Pick<
    InBodyRecord,
    'inbodyScore' | 'pctGrasa' | 'grasaVisceral' | 'musculoKg' | 'peso' | 'segmental'
  >,
  edadCronologica: number,
  sexo: Sexo = 'M'
) {
  return calcularAnalisisCorporal({
    edad: edadCronologica,
    sexo,
    pctGrasa: medicion.pctGrasa,
    pctSMM: pctSmmFromKg(medicion.musculoKg, medicion.peso),
    grasaVisceral: medicion.grasaVisceral,
    pctMusculoPiernas: pctMusculoPiernasFromSegmental(
      medicion.segmental?.musculoPDPct,
      medicion.segmental?.musculoPIPct
    ),
    pctMusculoBrazos: pctMusculoBrazosFromSegmental(
      medicion.segmental?.musculoBDPct,
      medicion.segmental?.musculoBIPct
    ),
    pctMusculoTronco: pctMusculoTroncoFromSegmental(medicion.segmental?.musculoTRPct),
    puntajeSalud: medicion.inbodyScore,
  });
}

/** Somatotipo automático (ignora InBody Type del CSV). */
export function resolveTipoCuerpo(
  medicion: Pick<InBodyRecord, 'pctGrasa' | 'grasaVisceral' | 'musculoKg' | 'peso' | 'inbodyScore' | 'segmental'>,
  edadCronologica: number,
  sexo: Sexo = 'M'
): SomatotipoTipo {
  return resolveAnalisisCorporal(medicion, edadCronologica, sexo).tipoCuerpo;
}

export function calculateTickPosition(
  valorReal: number,
  ticks: number[],
  minRango?: number,
  maxRango?: number
): number {
  if (minRango !== undefined && maxRango !== undefined) {
    const valor100 = (minRango + maxRango) / 2;
    const pctCalculado = valor100 > 0 ? (valorReal / valor100) * 100 : 100;
    return getPositionInTicks(pctCalculado, ticks);
  }
  return getPositionInTicks(valorReal, ticks);
}

function getPositionInTicks(val: number, ticks: number[]): number {
  const totalTramos = ticks.length - 1;
  if (val <= ticks[0]) return 0;
  if (val >= ticks[totalTramos]) return 100;

  for (let i = 0; i < totalTramos; i++) {
    if (val >= ticks[i] && val <= ticks[i + 1]) {
      const factor = (val - ticks[i]) / (ticks[i + 1] - ticks[i]);
      return ((i + factor) / totalTramos) * 100;
    }
  }
  return 50;
}

/** Calendario de Ecuador (America/Guayaquil, UTC−5, sin horario de verano). */
const ZONA_ECUADOR = 'America/Guayaquil';

export interface FechaCalendario {
  y: number;
  m: number;
  d: number;
}

/** Día civil en Ecuador, sin corrimiento por la medianoche UTC. */
export function fechaCalendarioEcuador(instante: Date = new Date()): FechaCalendario {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: ZONA_ECUADOR,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instante);
  const leer = (tipo: string) => Number(partes.find((p) => p.type === tipo)?.value);
  return { y: leer('year'), m: leer('month'), d: leer('day') };
}

/** YYYY-MM-DD del día en Ecuador. */
export function fechaHoyEcuador(instante: Date = new Date()): string {
  const { y, m, d } = fechaCalendarioEcuador(instante);
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** Lee DD/MM/YYYY o YYYY-MM-DD como fecha de calendario, no como instante UTC. */
export function parseFechaCalendario(raw: string): FechaCalendario | null {
  const s = String(raw || '').trim();
  if (!s) return null;
  const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmy) return { y: Number(dmy[3]), m: Number(dmy[2]), d: Number(dmy[1]) };
  const ymd = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (ymd) return { y: Number(ymd[1]), m: Number(ymd[2]), d: Number(ymd[3]) };
  return null;
}

function diasDelMes(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function calculateAge(fechaNacimiento: string, instante: Date = new Date()): number {
  const nac = parseFechaCalendario(fechaNacimiento);
  if (!nac || nac.m < 1 || nac.m > 12 || nac.d < 1 || nac.d > 31) return 30;
  const hoy = fechaCalendarioEcuador(instante);
  let edad = hoy.y - nac.y;
  if (hoy.m < nac.m || (hoy.m === nac.m && hoy.d < nac.d)) edad--;
  return Number.isFinite(edad) ? Math.max(16, edad) : 30;
}

/** Cumpleaños según el día civil de Ecuador. */
export function esCumpleanos(fechaNacimiento: string, instante: Date = new Date()): boolean {
  const nac = parseFechaCalendario(fechaNacimiento);
  if (!nac) return false;
  const hoy = fechaCalendarioEcuador(instante);
  return hoy.m === nac.m && hoy.d === nac.d;
}

export function calculateTimeInService(fechaIngreso: string, instante: Date = new Date()): string {
  const ing = parseFechaCalendario(fechaIngreso);
  if (!ing) return 'Sin datos';
  const hoy = fechaCalendarioEcuador(instante);

  let anios = hoy.y - ing.y;
  let meses = hoy.m - ing.m;
  let dias = hoy.d - ing.d;

  if (dias < 0) {
    meses--;
    const prevM = hoy.m === 1 ? 12 : hoy.m - 1;
    const prevY = hoy.m === 1 ? hoy.y - 1 : hoy.y;
    dias += diasDelMes(prevY, prevM);
  }
  if (meses < 0) {
    anios--;
    meses += 12;
  }
  if (anios < 0) return 'Sin datos';
  return `${anios} años, ${meses} meses`;
}

export function extractYoutubeVideoId(url: string): string | null {
  if (!url) return null;
  if (url.includes('/shorts/')) {
    const id = url.split('/shorts/')[1]?.split(/[?&]/)[0] || '';
    return id || null;
  }
  if (url.includes('v=')) {
    const id = url.split('v=')[1]?.split('&')[0] || '';
    return id || null;
  }
  if (url.includes('youtu.be/')) {
    const id = url.split('youtu.be/')[1]?.split(/[?&]/)[0] || '';
    return id || null;
  }
  if (url.includes('/embed/')) {
    const id = url.split('/embed/')[1]?.split(/[?&]/)[0] || '';
    return id || null;
  }
  return null;
}

export function generateIframeUrl(url: string): string {
  if (!url) return '';
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const videoId = extractYoutubeVideoId(url);
    if (videoId) {
      // controls=1: play/pausa + barra de progreso nativos de YouTube
      return `https://www.youtube.com/embed/${videoId}?rel=0&controls=1&modestbranding=1&playsinline=1&fs=1`;
    }
  }
  if (url.includes('tiktok.com')) {
    const match = url.match(/video\/(\d+)/);
    if (match?.[1]) return `https://www.tiktok.com/embed/v2/${match[1]}`;
  }
  return url;
}

export function isExternalVideoLink(url: string): boolean {
  if (!url) return false;
  return url.includes('tiktok.com') || url.includes('instagram.com') || url.includes('facebook.com');
}

export function createRecordFromRaw(
  cedula: string,
  raw: {
    peso: number;
    alturaCm: number;
    musculoKg: number;
    grasaKg: number;
    aguaKg?: number;
    proteinaKg?: number;
    mineralesKg?: number;
    grasaVisceral?: number;
    inbodyScore?: number;
    sexo?: Sexo;
    edadCronologica?: number;
  }
): InBodyRecord {
  const altura = raw.alturaCm || 170;
  const peso = raw.peso || 70;
  const alturaM = altura / 100;
  const imc = parseFloat((peso / (alturaM * alturaM)).toFixed(1));
  const grasaKg = raw.grasaKg || 15;
  const pctGrasa = parseFloat(((grasaKg / peso) * 100).toFixed(1));
  const musculoKg = raw.musculoKg || 30;
  const aguaKg = raw.aguaKg || parseFloat((peso * 0.58).toFixed(1));
  const proteinaKg = raw.proteinaKg || parseFloat((peso * 0.16).toFixed(1));
  const mineralesKg = raw.mineralesKg || parseFloat((peso * 0.05).toFixed(1));
  const ffmKg = parseFloat((aguaKg + proteinaKg + mineralesKg).toFixed(1));
  const sexo = raw.sexo || 'M';
  const score =
    raw.inbodyScore ||
    Math.min(99, Math.max(50, Math.round(80 + (musculoKg - 32) * 1.5 - (pctGrasa - 18) * 1.2)));
  const tmb = Math.round(370 + 21.6 * ffmKg);
  const grasaVisceral = raw.grasaVisceral || Math.round(pctGrasa / 3);
  const edadCron = raw.edadCronologica ?? 30;

  const segmental: SegmentalValues = {
    musculoBD: parseFloat((musculoKg * 0.105).toFixed(2)),
    musculoBDPct: 105,
    musculoBI: parseFloat((musculoKg * 0.103).toFixed(2)),
    musculoBIPct: 103,
    musculoTR: parseFloat((musculoKg * 0.45).toFixed(1)),
    musculoTRPct: 102,
    musculoPD: parseFloat((musculoKg * 0.171).toFixed(2)),
    musculoPDPct: 104,
    musculoPI: parseFloat((musculoKg * 0.170).toFixed(2)),
    musculoPIPct: 103,
    grasaBD: parseFloat((grasaKg * 0.08).toFixed(2)),
    grasaBDPct: 110,
    grasaBI: parseFloat((grasaKg * 0.08).toFixed(2)),
    grasaBIPct: 108,
    grasaTR: parseFloat((grasaKg * 0.52).toFixed(1)),
    grasaTRPct: 125,
    grasaPD: parseFloat((grasaKg * 0.16).toFixed(2)),
    grasaPDPct: 112,
    grasaPI: parseFloat((grasaKg * 0.16).toFixed(2)),
    grasaPIPct: 110,
  };

  const analisis = calcularAnalisisCorporal({
    edad: edadCron,
    sexo,
    pctGrasa,
    pctSMM: pctSmmFromKg(musculoKg, peso),
    grasaVisceral,
    pctMusculoPiernas: pctMusculoPiernasFromSegmental(segmental.musculoPDPct, segmental.musculoPIPct),
    puntajeSalud: score,
  });

  const pesoIdeal = parseFloat((alturaM * alturaM * 22).toFixed(1));
  const controlPeso = parseFloat((pesoIdeal - peso).toFixed(1));
  const grasaIdeal = parseFloat((pesoIdeal * (sexo === 'M' ? 0.15 : 0.23)).toFixed(1));
  const controlGrasa = parseFloat((grasaIdeal - grasaKg).toFixed(1));
  const controlMuscular = parseFloat((Math.max(0, 32 - musculoKg)).toFixed(1));

  return {
    id: `med-${cedula || 'x'}-${Date.now()}`,
    fecha: fechaHoyEcuador(),
    alturaCm: altura,
    peso,
    aguaKg,
    proteinaKg,
    mineralesKg,
    grasaKg,
    ffmKg,
    musculoKg,
    imc,
    pctGrasa,
    inbodyScore: score,
    tmb,
    grasaVisceral,
    grasaSubcutaneaKg: parseFloat((grasaKg * 0.88).toFixed(1)),
    adiposidad: Math.round((grasaKg / (pesoIdeal * 0.15)) * 100),
    caloriasRecomendadas: Math.round(tmb * 1.35),
    tipoCuerpo: analisis.tipoCuerpo,
    edadCorporal: analisis.edadCorporal,
    pesoIdeal,
    controlPeso,
    controlGrasa,
    controlMuscular,
    rangoPesoMin: parseFloat((pesoIdeal * 0.85).toFixed(1)),
    rangoPesoMax: parseFloat((pesoIdeal * 1.15).toFixed(1)),
    rangoSmmMin: parseFloat((musculoKg * 0.88).toFixed(1)),
    rangoSmmMax: parseFloat((musculoKg * 1.12).toFixed(1)),
    rangoBfmMin: parseFloat((grasaKg * 0.75).toFixed(1)),
    rangoBfmMax: parseFloat((grasaKg * 1.25).toFixed(1)),
    rangoImcMin: 18.5,
    rangoImcMax: 25.0,
    rangoPbfMin: sexo === 'M' ? 10.0 : 18.0,
    rangoPbfMax: sexo === 'M' ? 20.0 : 28.0,
    segmental,
  };
}
