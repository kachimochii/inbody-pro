import { EMPTY_MEAL_DATA, MealData } from '../data/foodDatabase';
import {
  fetchDiarioCalorico,
  saveDiarioCalorico,
} from '../lib/firestoreService';

export type ActivityMode = 'sin_deporte' | 'con_deporte';

export interface DailyMealRecord {
  date: string; // YYYY-MM-DD (local)
  mode: ActivityMode | null;
  meals: MealData;
}

const KEY_PREFIX = 'inbody_diario_calorico_v1_';

export function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function storageKey(cedula: string): string {
  return `${KEY_PREFIX}${cedula || 'anon'}`;
}

function normalizeMeals(raw?: Partial<MealData> | null): MealData {
  return {
    desayuno: raw?.desayuno || {},
    almuerzo: raw?.almuerzo || {},
    merienda: raw?.merienda || {},
    snack: raw?.snack || {},
  };
}

function safeParse(raw: string | null): DailyMealRecord | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DailyMealRecord;
  } catch {
    return null;
  }
}

function freshRecord(): DailyMealRecord {
  return { date: todayKey(), mode: null, meals: EMPTY_MEAL_DATA() };
}

function fromStored(stored: DailyMealRecord | null): DailyMealRecord {
  const today = todayKey();
  if (stored && stored.date === today) {
    return {
      date: today,
      mode: stored.mode ?? null,
      meals: normalizeMeals(stored.meals),
    };
  }
  return freshRecord();
}

/** Carga local (rápido). Si es otro día → cero. */
export function loadDailyMealsLocal(cedula: string): DailyMealRecord {
  const stored = safeParse(localStorage.getItem(storageKey(cedula)));
  const record = fromStored(stored);
  try {
    localStorage.setItem(storageKey(cedula), JSON.stringify(record));
  } catch {
    /* ignore */
  }
  return record;
}

export function saveDailyMealsLocal(cedula: string, record: DailyMealRecord): void {
  const payload: DailyMealRecord = { ...record, date: todayKey() };
  try {
    localStorage.setItem(storageKey(cedula), JSON.stringify(payload));
  } catch (err) {
    console.warn('No se pudo guardar el diario calórico local.', err);
  }
}

/** Local + Firebase: un solo documento/campo por usuario (se sobrescribe al cambiar de día). */
export async function loadDailyMeals(cedula: string): Promise<DailyMealRecord> {
  const local = loadDailyMealsLocal(cedula);
  try {
    const cloud = await fetchDiarioCalorico(cedula);
    if (!cloud) return local;

    const cloudNorm = fromStored({
      date: cloud.date,
      mode: cloud.mode ?? null,
      meals: normalizeMeals(cloud.meals),
    });

    // Si la nube es de hoy, gana la nube (multi-dispositivo)
    if (cloud.date === todayKey()) {
      saveDailyMealsLocal(cedula, cloudNorm);
      return cloudNorm;
    }

    // Nube de otro día: resetear en nube también
    await saveDiarioCalorico(cedula, local);
    return local;
  } catch (err) {
    console.warn('Diario calórico: usando solo local.', err);
    return local;
  }
}

export async function saveDailyMeals(cedula: string, record: DailyMealRecord): Promise<void> {
  const payload: DailyMealRecord = { ...record, date: todayKey() };
  saveDailyMealsLocal(cedula, payload);
  try {
    await saveDiarioCalorico(cedula, payload);
  } catch (err) {
    console.warn('No se pudo sincronizar diario calórico a Firebase.', err);
  }
}

export function getTodayLabel(): string {
  return new Date().toLocaleDateString('es-EC', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}
