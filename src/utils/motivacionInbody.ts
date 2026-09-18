import { InBodyRecord } from '../types/inbody';

export type SemaforoNivel = 'mejora' | 'estable' | 'cae';
export type MetricaClave = 'score' | 'peso' | 'grasa' | 'musculo';

export interface DeltaMetrica {
  key: MetricaClave;
  label: string;
  unidad: string;
  actual: number;
  prev: number;
  delta: number;
  nivel: SemaforoNivel;
}

export interface FraseMotivacion {
  key: MetricaClave;
  label: string;
  nivel: SemaforoNivel;
  texto: string;
}

export const SEMAFORO_UI: Record<
  SemaforoNivel,
  { text: string; border: string; bg: string; dot: string; chip: string }
> = {
  mejora: {
    text: 'text-emerald-400',
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-500/10',
    dot: 'bg-emerald-400',
    chip: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30',
  },
  estable: {
    text: 'text-amber-400',
    border: 'border-amber-500/40',
    bg: 'bg-amber-500/10',
    dot: 'bg-amber-400',
    chip: 'text-amber-300 bg-amber-500/15 border-amber-500/30',
  },
  cae: {
    text: 'text-rose-400',
    border: 'border-rose-500/40',
    bg: 'bg-rose-500/10',
    dot: 'bg-rose-400',
    chip: 'text-rose-300 bg-rose-500/15 border-rose-500/30',
  },
};

const METRICA_LABEL: Record<MetricaClave, { label: string; unidad: string }> = {
  score: { label: 'Score', unidad: '' },
  peso: { label: 'Peso (kg)', unidad: ' kg' },
  grasa: { label: '% Grasa', unidad: '%' },
  musculo: { label: 'Músculo (kg)', unidad: ' kg' },
};

function round1(n: number): number {
  return Number(Number(n).toFixed(1));
}

export function formatDelta(n: number): string {
  const v = round1(n);
  const abs = Number.isInteger(v) ? String(Math.abs(v)) : Math.abs(v).toFixed(1);
  if (v > 0) return `+${abs}`;
  if (v < 0) return `-${abs}`;
  return '0';
}

function pick(seed: string, options: string[]): string {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h + seed.charCodeAt(i) * (i + 1)) % 997;
  return options[h % options.length];
}

function nivelPorDireccion(delta: number, better: 'up' | 'down', umbral = 0.15): SemaforoNivel {
  if (Math.abs(delta) < umbral) return 'estable';
  const improved = better === 'up' ? delta > 0 : delta < 0;
  return improved ? 'mejora' : 'cae';
}

function distanciaFueraRango(peso: number, min: number, max: number): number {
  if (!min || !max || max <= min) return 0;
  if (peso < min) return min - peso;
  if (peso > max) return peso - max;
  return 0;
}

function nivelPeso(actual: number, prev: number, min?: number, max?: number): SemaforoNivel {
  const delta = round1(actual - prev);
  if (min && max && max > min) {
    const dNow = distanciaFueraRango(actual, min, max);
    const dPrev = distanciaFueraRango(prev, min, max);
    if (dNow < dPrev - 0.2) return 'mejora';
    if (dNow > dPrev + 0.2) return 'cae';
    if (dNow === 0 && dPrev === 0 && Math.abs(delta) < 0.4) return 'estable';
    if (Math.abs(delta) < 0.2) return 'estable';
    return dNow <= dPrev ? 'mejora' : 'cae';
  }
  return nivelPorDireccion(delta, 'down', 0.2);
}

export function buildDeltasHistorial(actual: InBodyRecord, prev: InBodyRecord): DeltaMetrica[] {
  const scoreDelta = round1(actual.inbodyScore - prev.inbodyScore);
  const pesoDelta = round1(actual.peso - prev.peso);
  const grasaDelta = round1(actual.pctGrasa - prev.pctGrasa);
  const musculoDelta = round1(actual.musculoKg - prev.musculoKg);

  const items: Array<{ key: MetricaClave; actual: number; prev: number; delta: number; nivel: SemaforoNivel }> = [
    {
      key: 'score',
      actual: actual.inbodyScore,
      prev: prev.inbodyScore,
      delta: scoreDelta,
      nivel: nivelPorDireccion(scoreDelta, 'up', 0.5),
    },
    {
      key: 'peso',
      actual: actual.peso,
      prev: prev.peso,
      delta: pesoDelta,
      nivel: nivelPeso(actual.peso, prev.peso, actual.rangoPesoMin, actual.rangoPesoMax),
    },
    {
      key: 'grasa',
      actual: actual.pctGrasa,
      prev: prev.pctGrasa,
      delta: grasaDelta,
      nivel: nivelPorDireccion(grasaDelta, 'down', 0.2),
    },
    {
      key: 'musculo',
      actual: actual.musculoKg,
      prev: prev.musculoKg,
      delta: musculoDelta,
      nivel: nivelPorDireccion(musculoDelta, 'up', 0.2),
    },
  ];

  return items.map((item) => ({
    ...item,
    label: METRICA_LABEL[item.key].label,
    unidad: METRICA_LABEL[item.key].unidad,
  }));
}

function frasesScore(delta: number, nivel: SemaforoNivel, seed: string): string {
  const n = formatDelta(delta);
  if (nivel === 'mejora') {
    return pick(seed, [
      `¡Buen avance! Tu Score InBody subió ${n.replace('+', '')} puntos. La disciplina se nota.`,
      `El Score subió ${n} puntos. Sigue con entrenamiento y control nutricional.`,
      `¡Score al alza (${n})! Mantén la constancia: el siguiente salto está cerca.`,
    ]);
  }
  if (nivel === 'cae') {
    return pick(seed, [
      `El Score bajó ${n.replace('-', '')} puntos. Revisa descanso, nutrición y carga de entrenamiento.`,
      `Atención al Score: ${n} puntos. Ajusta hábitos ahora para no perder capacidad operativa.`,
      `El Score retrocedió ${n} puntos. Vuelve a la rutina con rigor esta semana.`,
    ]);
  }
  return pick(seed, [
    'El Score se mantiene. Constancia: el siguiente cambio se gana en el día a día.',
    'Score estable. No te confíes: sigue el plan para dar el siguiente salto.',
    'Sin cambio en el Score. Mantén disciplina; la próxima toma debe mover este número.',
  ]);
}

function frasesPeso(delta: number, nivel: SemaforoNivel, seed: string, min?: number, max?: number): string {
  const n = formatDelta(delta);
  const rango = min && max ? ` (rango sugerido ${min}–${max} kg)` : '';
  if (nivel === 'mejora') {
    if (delta < 0) {
      return pick(seed, [
        `Bajaste ${n.replace('-', '')} kg y te acercas a un mejor control de peso${rango}. Sigue así.`,
        `Has bajado ${n.replace('-', '')} kg. Buen trabajo: combina nutrición y entrenamiento.`,
        `El peso bajó ${n} kg hacia un mejor rango. Mantén el ritmo, sin extremos.`,
      ]);
    }
    return pick(seed, [
      `Subiste ${n} kg acercándote al rango saludable${rango}. Buen ajuste.`,
      `El peso subió ${n} kg de forma favorable. Revisa que sea músculo, no grasa.`,
      `Ganaste ${n} kg hacia el rango sugerido. Sigue el plan con tu unidad.`,
    ]);
  }
  if (nivel === 'cae') {
    if (delta > 0) {
      return pick(seed, [
        `El peso subió ${n} kg y se aleja del control${rango}. Ajusta nutrición esta semana.`,
        `Atención al peso: +${n.replace('+', '')} kg. Evita saltarte comidas planificadas y controla extras.`,
        `Subiste ${n} kg fuera de lo esperado${rango}. Prioriza el plan nutricional.`,
      ]);
    }
    return pick(seed, [
      `Bajaste ${n.replace('-', '')} kg, pero te alejas del rango sugerido${rango}. No recortes en exceso.`,
      `El peso cayó ${n} kg más de lo recomendado${rango}. Asegura proteína y recuperación.`,
      `Pérdida de ${n.replace('-', '')} kg fuera de rango. Consulta nutrición antes de seguir bajando.`,
    ]);
  }
  return pick(seed, [
    'El peso se mantiene estable. Ahora el foco es bajar grasa y/o subir músculo.',
    'Peso sin cambio relevante. La composición (grasa vs músculo) es lo que importa ahora.',
    'Peso estable. Mantén el control y apunta el cambio a % grasa y músculo.',
  ]);
}

function frasesGrasa(delta: number, nivel: SemaforoNivel, seed: string): string {
  const n = formatDelta(delta);
  if (nivel === 'mejora') {
    return pick(seed, [
      `Bajaste ${n.replace('-', '')} puntos de % grasa. El plan nutricional está funcionando.`,
      `¡Buena señal! El % de grasa bajó ${n}. Sigue con alimentación y cardio controlado.`,
      `La grasa bajó ${n}%. Mantén el déficit inteligente, sin dejar el entrenamiento de fuerza.`,
    ]);
  }
  if (nivel === 'cae') {
    return pick(seed, [
      `Subió el % de grasa (${n}). Prioriza el plan de nutrición y el control de porciones.`,
      `Atención: la grasa aumentó ${n}%. Revisa extras, bebidas y consistencia semanal.`,
      `El % de grasa empeoró ${n}. Un ajuste nutricional ahora evita que se dispare.`,
    ]);
  }
  return pick(seed, [
    'El % de grasa se mantiene. Un ajuste nutricional puede bajar este índice.',
    'Grasa estable. Si el peso no baja, el siguiente paso es el plan de comidas.',
    'Sin cambio en % grasa. Constancia en cocina y entrenamiento para moverlo.',
  ]);
}

function frasesMusculo(delta: number, nivel: SemaforoNivel, seed: string): string {
  const n = formatDelta(delta);
  if (nivel === 'mejora') {
    return pick(seed, [
      `Ganaste ${n} kg de músculo. Sigue la rutina de fuerza: el cuerpo responde.`,
      `¡Gran trabajo! El músculo subió ${n} kg. Mantén proteína y descanso.`,
      `Músculo al alza (${n} kg). Esa ganancia mejora rendimiento y Score.`,
    ]);
  }
  if (nivel === 'cae') {
    return pick(seed, [
      `Perdiste ${n.replace('-', '')} kg de músculo. Prioriza fuerza y proteína en cada comida.`,
      `Atención: el músculo bajó ${n} kg. No dejes el entrenamiento de resistencia.`,
      `Caída muscular de ${n.replace('-', '')} kg. Recupera carga, sueño y alimentación.`,
    ]);
  }
  return pick(seed, [
    'El músculo se mantiene. Constancia en fuerza para no perder lo ganado.',
    'Músculo estable. Si buscas subir, aumenta carga progresiva esta semana.',
    'Sin cambio muscular. Mantén el entrenamiento; el siguiente estímulo debe ser más exigente.',
  ]);
}

export function buildFrasesMotivacion(
  actual: InBodyRecord,
  prev: InBodyRecord,
  deltas: DeltaMetrica[]
): FraseMotivacion[] {
  const seed = `${actual.fecha}|${prev.fecha}|${actual.inbodyScore}`;
  return deltas.map((d) => {
    let texto = '';
    if (d.key === 'score') texto = frasesScore(d.delta, d.nivel, seed + d.key);
    else if (d.key === 'peso') {
      texto = frasesPeso(d.delta, d.nivel, seed + d.key, actual.rangoPesoMin, actual.rangoPesoMax);
    } else if (d.key === 'grasa') texto = frasesGrasa(d.delta, d.nivel, seed + d.key);
    else texto = frasesMusculo(d.delta, d.nivel, seed + d.key);
    return { key: d.key, label: d.label, nivel: d.nivel, texto };
  });
}

export const FRASE_LINEA_BASE =
  'Esta es tu línea base. En la próxima evaluación verás en verde lo que mejoró, en amarillo lo que se mantiene y en rojo lo que bajó.';
