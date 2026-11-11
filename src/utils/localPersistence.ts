import { PlanEntrenamiento, FichaEdadCatalogo, PlanNutricion } from '../types/inbody';
import { fechaHoyEcuador } from './inbodyCalculations';

const KEY_PLANES_ENTRENO = 'inbody_planes_entrenamiento_v3';
const KEY_FICHAS_EDAD = 'inbody_fichas_edad_v2';
const KEY_PLANES_NUTRI = 'inbody_planes_nutricion_v3';
const KEY_WORKOUT_PREFIX = 'inbody_workout_done_';

export interface WorkoutCompletadoHoy {
  planId: string;
  planNombre: string;
  caloriasQuemadas: number;
  duracionTotalSeg: number;
  ejerciciosCompletados: number;
  fecha: string;
}

function workoutKey(cedula: string, fecha = fechaHoyEcuador()): string {
  return `${KEY_WORKOUT_PREFIX}${cedula}_${fecha}`;
}

export function loadWorkoutCompletadoHoy(cedula: string): WorkoutCompletadoHoy | null {
  return safeParse<WorkoutCompletadoHoy | null>(localStorage.getItem(workoutKey(cedula)), null);
}

export function saveWorkoutCompletadoHoy(cedula: string, data: Omit<WorkoutCompletadoHoy, 'fecha'>): void {
  const fecha = fechaHoyEcuador();
  try {
    localStorage.setItem(workoutKey(cedula, fecha), JSON.stringify({ ...data, fecha }));
  } catch (err) {
    console.warn('No se pudo guardar el entrenamiento del día.', err);
  }
}

function videosMotivacionKey(cedula: string): string {
  return `inbody_videos_motivacion_vistos_${cedula}`;
}

export function loadVideosMotivacionVistos(cedula: string): string[] {
  const raw = safeParse<string[] | null>(localStorage.getItem(videosMotivacionKey(cedula)), null);
  return Array.isArray(raw) ? raw.filter((u) => typeof u === 'string' && u.trim()) : [];
}

export function markVideoMotivacionVisto(cedula: string, url: string): void {
  const limpio = String(url || '').trim();
  if (!limpio) return;
  const prev = loadVideosMotivacionVistos(cedula);
  if (prev.includes(limpio)) return;
  try {
    localStorage.setItem(videosMotivacionKey(cedula), JSON.stringify([...prev, limpio]));
  } catch (err) {
    console.warn('No se pudo guardar el historial de videos motivacionales.', err);
  }
}

export function siguienteVideoMotivacional(cedula: string, urls: string[]): string | null {
  const vistos = loadVideosMotivacionVistos(cedula);
  return urls.map((u) => String(u || '').trim()).filter(Boolean).find((u) => !vistos.includes(u)) || null;
}

export const DEFAULT_FICHAS_EDAD: FichaEdadCatalogo[] = [
  { id: 'ficha-1', nombre: 'Ficha 1 (20 a 30 años)', edadMin: 20, edadMax: 30 },
  { id: 'ficha-2', nombre: 'Ficha 2 (31 a 40 años)', edadMin: 31, edadMax: 40 },
  { id: 'ficha-3', nombre: 'Ficha 3 (41 a 50 años)', edadMin: 41, edadMax: 50 },
  { id: 'ficha-4', nombre: 'Ficha 4 (Mayor a 50 años)', edadMin: 51, edadMax: 80 },
];

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadPlanesEntrenamiento(seed: PlanEntrenamiento[]): PlanEntrenamiento[] {
  const stored = safeParse<PlanEntrenamiento[] | null>(localStorage.getItem(KEY_PLANES_ENTRENO), null);
  if (!stored || !Array.isArray(stored) || stored.length === 0) return seed;
  // Migrar planes viejos sin sexoDestino
  return stored.map(p => ({
    ...p,
    sexoDestino: p.sexoDestino || 'TODOS',
    portadaUrl: p.portadaUrl || p.imagenUrl,
  }));
}

export function savePlanesEntrenamiento(planes: PlanEntrenamiento[]): void {
  try {
    localStorage.setItem(KEY_PLANES_ENTRENO, JSON.stringify(planes));
  } catch (err) {
    console.warn('No se pudo guardar planes (¿imágenes muy pesadas?).', err);
  }
}

export function loadFichasEdad(seed: FichaEdadCatalogo[] = DEFAULT_FICHAS_EDAD): FichaEdadCatalogo[] {
  const stored = safeParse<FichaEdadCatalogo[] | null>(localStorage.getItem(KEY_FICHAS_EDAD), null);
  if (!stored || !Array.isArray(stored) || stored.length === 0) return seed;
  return stored;
}

export function saveFichasEdad(fichas: FichaEdadCatalogo[]): void {
  try {
    localStorage.setItem(KEY_FICHAS_EDAD, JSON.stringify(fichas));
  } catch (err) {
    console.warn('No se pudieron guardar las fichas de edad.', err);
  }
}

export function loadPlanesNutricion(seed: PlanNutricion[]): PlanNutricion[] {
  const stored = safeParse<PlanNutricion[] | null>(localStorage.getItem(KEY_PLANES_NUTRI), null);
  if (!stored || !Array.isArray(stored) || stored.length === 0) return seed;
  return stored;
}

export function savePlanesNutricion(planes: PlanNutricion[]): void {
  try {
    localStorage.setItem(KEY_PLANES_NUTRI, JSON.stringify(planes));
  } catch (err) {
    console.warn('No se pudieron guardar planes de nutrición.', err);
  }
}

/** Lee un archivo de imagen y lo convierte a data URL (para demo sin Firebase). */
export function readImageAsDataUrl(file: File, maxBytes = 2_500_000): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('El archivo debe ser una imagen (JPG, PNG, WEBP).'));
      return;
    }
    if (file.size > maxBytes) {
      reject(new Error(`La imagen supera ${(maxBytes / 1_000_000).toFixed(1)} MB. Comprima el archivo o use Firebase Storage.`));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    reader.readAsDataURL(file);
  });
}
