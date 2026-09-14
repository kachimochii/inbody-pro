import { InBodyRecord, SegmentalValues, Sexo, SomatotipoTipo } from '../types/inbody';

export const TICKS = {
  peso: [21, 43, 64, 85, 93, 100, 107, 115, 136, 157, 179],
  musculo: [83, 85, 88, 90, 95, 100, 105, 110, 113, 115, 117],
  grasa: [42, 50, 58, 67, 83, 100, 117, 133, 142, 150, 158]
};

export const TICKS_OBESIDAD = {
  imc: [12, 14, 16, 18, 20, 21, 23, 25, 31, 37, 43],
  pctGrasa: [6, 7, 8, 10, 12, 15, 17, 20, 33, 47, 61],
  adiposidad: [82, 85, 87, 90, 95, 100, 105, 110, 112, 115, 117]
};

export function determineSomatotipo(imc: number, pctGrasa: number, sexo: Sexo): SomatotipoTipo {
  const pbfBajo = sexo === 'F' ? 18.0 : 10.0;
  const pbfAlto = sexo === 'F' ? 28.0 : 20.0;

  if (imc < 18.5) {
    if (pctGrasa < pbfBajo) return "Tipo delgado";
    if (pctGrasa <= pbfAlto) return "Tipo musculoso magro";
    return "Falta de tipo de ejercicio";
  } else if (imc <= 24.9) {
    if (pctGrasa < pbfBajo) return "Tipo musculoso desarrollado";
    if (pctGrasa <= pbfAlto) return "Tipo estándar";
    return "Tipo de sobrepeso muscular";
  } else {
    if (pctGrasa < pbfBajo) return "Tipo muscular estándar";
    if (pctGrasa <= pbfAlto) return "Tipo muscular con sobrepeso";
    return "Tipo obeso edematoso";
  }
}

export function calculateBiologicalAge(edadCronologica: number, score: number): number {
  if (score < 80) {
    const penalizacion = Math.round((80 - score) * 0.3);
    return edadCronologica + Math.min(penalizacion, 15);
  } else if (score > 80) {
    const premio = Math.round((score - 80) * 0.25);
    return Math.max(18, edadCronologica - Math.min(premio, 7));
  }
  return edadCronologica;
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

export function calculateAge(fechaNacimiento: string): number {
  if (!fechaNacimiento) return 30;
  const hoy = new Date();
  const nac = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) {
    edad--;
  }
  return isNaN(edad) ? 30 : Math.max(16, edad);
}

export function calculateTimeInService(fechaIngreso: string): string {
  if (!fechaIngreso) return "Sin datos";
  const hoy = new Date();
  const ing = new Date(fechaIngreso);
  if (isNaN(ing.getTime())) return "Sin datos";

  let anios = hoy.getFullYear() - ing.getFullYear();
  let meses = hoy.getMonth() - ing.getMonth();
  let dias = hoy.getDate() - ing.getDate();

  if (dias < 0) {
    meses--;
    const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
    dias += mesAnterior.getDate();
  }
  if (meses < 0) {
    anios--;
    meses += 12;
  }
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
    if (videoId) return `https://www.youtube.com/embed/${videoId}?rel=0`;
  }
  // TikTok: intenta embed; si el navegador bloquea, el UI ofrece abrir enlace
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
  const score = raw.inbodyScore || Math.min(99, Math.max(50, Math.round(80 + (musculoKg - 32) * 1.5 - (pctGrasa - 18) * 1.2)));
  const tmb = Math.round(370 + 21.6 * ffmKg);
  const grasaVisceral = raw.grasaVisceral || Math.round(pctGrasa / 3);
  const tipoCuerpo = determineSomatotipo(imc, pctGrasa, sexo);

  const pesoIdeal = parseFloat((alturaM * alturaM * 22).toFixed(1));
  const controlPeso = parseFloat((pesoIdeal - peso).toFixed(1));
  const grasaIdeal = parseFloat((pesoIdeal * (sexo === 'M' ? 0.15 : 0.23)).toFixed(1));
  const controlGrasa = parseFloat((grasaIdeal - grasaKg).toFixed(1));
  const controlMuscular = parseFloat((Math.max(0, 32 - musculoKg)).toFixed(1));

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
    grasaPIPct: 110
  };

  return {
    id: `med-${Date.now()}`,
    fecha: new Date().toISOString().split('T')[0],
    alturaCm: altura,
    peso: peso,
    aguaKg: aguaKg,
    proteinaKg: proteinaKg,
    mineralesKg: mineralesKg,
    grasaKg: grasaKg,
    ffmKg: ffmKg,
    musculoKg: musculoKg,
    imc: imc,
    pctGrasa: pctGrasa,
    inbodyScore: score,
    tmb: tmb,
    grasaVisceral: grasaVisceral,
    grasaSubcutaneaKg: parseFloat((grasaKg * 0.88).toFixed(1)),
    adiposidad: Math.round((grasaKg / (pesoIdeal * 0.15)) * 100),
    caloriasRecomendadas: Math.round(tmb * 1.35),
    tipoCuerpo: tipoCuerpo,
    edadCorporal: calculateBiologicalAge(30, score),
    pesoIdeal: pesoIdeal,
    controlPeso: controlPeso,
    controlGrasa: controlGrasa,
    controlMuscular: controlMuscular,
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
    segmental: segmental
  };
}
