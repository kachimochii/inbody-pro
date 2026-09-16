import { Sexo, SomatotipoTipo } from '../types/inbody';

/** Nivel de un indicador vs baremo (grasa / músculo). */
export type NivelIndicador = 'BAJO' | 'ESTANDAR' | 'ALTO';

export const BAREMOS = {
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
} as const;

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
  /** Edad cronológica (años). */
  edad: number;
  sexo: Sexo;
  /** % grasa corporal (PBF). */
  pctGrasa: number;
  /**
   * % músculo esquelético respecto al peso (SMM/WT).
   * Si no viene, usar musculoKg/peso*100.
   */
  pctSMM: number;
  /** Nivel de grasa visceral 1–30. */
  grasaVisceral: number;
  /**
   * % músculo segmental de piernas (promedio FFM% pierna D/I).
   * Si falta, se asume 100 (sin penalización).
   */
  pctMusculoPiernas?: number;
  /** % músculo segmental brazos (promedio BD/BI). */
  pctMusculoBrazos?: number;
  /** % músculo segmental tronco. */
  pctMusculoTronco?: number;
  /** InBody Score / puntuación de salud 0–100. */
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

function pickGrasaBaremo(sexo: Sexo, edad: number) {
  const bands = BAREMOS[sexoKey(sexo)].GRASA;
  const e = clampAge(edad);
  return bands.find((b) => e >= b.edadMin && e <= b.edadMax) || bands[bands.length - 1];
}

function pickMusculoBaremo(sexo: Sexo, edad: number) {
  const bands = BAREMOS[sexoKey(sexo)].MUSCULO_PCT;
  const e = clampAge(edad);
  return bands.find((b) => e >= b.edadMin && e <= b.edadMax) || bands[0];
}

/** Nivel institucional por puntuación de salud / InBody Score. */
export function getNivelSalud(puntaje: number): 1 | 2 | 3 {
  const s = safeNum(puntaje, 0);
  if (s >= 85) return 3;
  if (s >= 70) return 2;
  return 1;
}

/**
 * Evalúa % grasa vs baremo por sexo y edad.
 * BAJO = por debajo del piso; ALTO = por encima del techo; ESTANDAR = dentro del rango.
 */
export function evaluarNivelGrasa(pctGrasa: number, sexo: Sexo, edad: number): NivelIndicador {
  const baremo = pickGrasaBaremo(sexo, edad);
  const g = safeNum(pctGrasa, baremo.bajo + 1);
  if (g < baremo.bajo) return 'BAJO';
  if (g > baremo.alto) return 'ALTO';
  return 'ESTANDAR';
}

/**
 * Evalúa % SMM (músculo/peso) vs baremo.
 * BAJO &lt; insuficiente; ALTO &gt; excelente; resto ESTANDAR.
 */
export function evaluarNivelMusculo(pctSMM: number, sexo: Sexo, edad: number): NivelIndicador {
  const baremo = pickMusculoBaremo(sexo, edad);
  const m = safeNum(pctSMM, baremo.insuficiente + 1);
  if (m < baremo.insuficiente) return 'BAJO';
  if (m > baremo.excelente) return 'ALTO';
  return 'ESTANDAR';
}

/** Matriz 3×3: cruzamiento [Músculo]_[Grasa] → somatotipo. */
export function resolverTipoCuerpo(
  nivelMusculo: NivelIndicador,
  nivelGrasa: NivelIndicador
): SomatotipoTipo {
  const key = `${nivelMusculo}_${nivelGrasa}`;
  return MATRIZ_3X3[key] || 'Tipo estándar';
}

function deltaGrasa(pctGrasa: number, nivel: NivelIndicador, limiteAlto: number): number {
  if (nivel === 'ALTO') {
    return 1.5 * ((safeNum(pctGrasa, limiteAlto) - limiteAlto) / 2);
  }
  if (nivel === 'BAJO') return -2.0;
  return 0.0;
}

function deltaVisceral(nivel: number): number {
  const v = Math.round(safeNum(nivel, 5));
  if (v >= 13) return 6.0;
  if (v >= 10) return 3.0;
  return 0.0;
}

function deltaMusculo(nivel: NivelIndicador): number {
  // En la fórmula: Edad = … - DeltaMusculo → ALTO resta (bonifica), BAJO suma (penaliza vía valor positivo restado negativo)
  // Spec: BAJO +3 penalización, ALTO -3 bonificación, aplicados como "- DeltaMusculo"
  // Interpretamos DeltaMusculo: BAJO = -3 (porque -(-3)=+3), ALTO = +3 (porque -(+3)=-3), ESTANDAR = 0
  // Más claro: aplicar directamente en la suma:
  return 0; // se aplica aparte
}

function deltaMusculoEfectivo(nivel: NivelIndicador): number {
  if (nivel === 'BAJO') return +3.0; // penalización
  if (nivel === 'ALTO') return -3.0; // bonificación
  return 0.0;
}

function deltaSeglar(pct: number | undefined, umbral = 90, penalizacion = 1.5): number {
  const p = safeNum(pct, 100);
  return p < umbral ? penalizacion : 0.0;
}

/**
 * Motor principal: somatotipo + edad corporal + coherencia por nivel de salud.
 * Incluye alerta de sarcopenia / desbalance segmental (brazos, tronco, piernas).
 * No usa valores de edad corporal / InBody Type del equipo: siempre recalcula.
 */
export function calcularAnalisisCorporal(input: AnalisisCorporalInput): AnalisisCorporalResult {
  const edad = clampAge(input.edad);
  const sexo: Sexo = String(input.sexo).toUpperCase().startsWith('F') ? 'F' : 'M';
  const pctGrasa = safeNum(input.pctGrasa, sexo === 'F' ? 25 : 18);
  const pctSMM = safeNum(input.pctSMM, sexo === 'F' ? 35 : 42);
  const visceral = Math.max(1, Math.min(30, Math.round(safeNum(input.grasaVisceral, 5))));
  const puntaje = Math.max(0, Math.min(100, Math.round(safeNum(input.puntajeSalud, 70))));

  const baremoG = pickGrasaBaremo(sexo, edad);
  const baremoM = pickMusculoBaremo(sexo, edad);

  const nivelGrasa = evaluarNivelGrasa(pctGrasa, sexo, edad);
  const nivelMusculo = evaluarNivelMusculo(pctSMM, sexo, edad);
  const tipoCuerpo = resolverTipoCuerpo(nivelMusculo, nivelGrasa);
  const nivelSalud = getNivelSalud(puntaje);

  const dG = deltaGrasa(pctGrasa, nivelGrasa, baremoG.alto);
  const dV = deltaVisceral(visceral);
  const dP = deltaSeglar(input.pctMusculoPiernas, 90, 1.5);
  const dB = deltaSeglar(input.pctMusculoBrazos, 90, 1.0);
  const dT = deltaSeglar(input.pctMusculoTronco, 90, 1.0);
  const dM = deltaMusculoEfectivo(nivelMusculo);
  void deltaMusculo;

  // Edad Corporal = Edad Real + ΔGrasa + ΔVisceral + ΔSeglar (piernas/brazos/tronco) + ΔMusculo
  let edadCorp = edad + dG + dV + dP + dB + dT + dM;

  if (nivelSalud === 1) {
    edadCorp = Math.max(edad + 2, edadCorp);
  } else if (nivelSalud === 3) {
    edadCorp = Math.min(edad - 2, edadCorp);
  }

  edadCorp = Math.max(18, Math.round(edadCorp));

  const alertasSarcopenia: string[] = [];
  if (dP > 0) alertasSarcopenia.push('Piernas con músculo segmental bajo (<90%): riesgo de debilidad / sarcopenia en tren inferior.');
  if (dB > 0) alertasSarcopenia.push('Brazos con músculo segmental bajo (<90%): menor potencia de tracción y soporte de carga.');
  if (dT > 0) alertasSarcopenia.push('Tronco/dorso con músculo segmental bajo (<90%): menor estabilidad del core y espalda.');
  if (nivelMusculo === 'BAJO' && edad >= 50) {
    alertasSarcopenia.push('Adulto mayor con músculo global bajo: priorizar fuerza progresiva para frenar sarcopenia.');
  }
  if (nivelMusculo === 'BAJO' && edad < 35 && pctGrasa > baremoG.alto) {
    alertasSarcopenia.push('Joven con alto peso graso y bajo músculo: recomposición (fuerza + déficit controlado).');
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
    },
    alertasSarcopenia,
    baremoGrasa: { bajo: baremoG.bajo, alto: baremoG.alto },
    baremoMusculo: { insuficiente: baremoM.insuficiente, excelente: baremoM.excelente },
  };
}

/** % SMM a partir de kg músculo y peso. */
export function pctSmmFromKg(musculoKg: number, pesoKg: number): number {
  const p = safeNum(pesoKg, 0);
  if (p <= 0) return 0;
  return (safeNum(musculoKg, 0) / p) * 100;
}

/** Promedio % músculo piernas (segmental). */
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

/** Promedio % músculo brazos (segmental). */
export function pctMusculoBrazosFromSegmental(
  pctBrazoD?: number,
  pctBrazoI?: number
): number {
  return pctMusculoPiernasFromSegmental(pctBrazoD, pctBrazoI);
}

/** % músculo tronco (segmental). */
export function pctMusculoTroncoFromSegmental(pctTronco?: number): number {
  const t = safeNum(pctTronco, NaN);
  return Number.isFinite(t) ? t : 100;
}
