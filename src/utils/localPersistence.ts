import { PlanEntrenamiento, FichaEdadCatalogo, PlanNutricion } from '../types/inbody';

const KEY_PLANES_ENTRENO = 'inbody_planes_entrenamiento_v3';
const KEY_FICHAS_EDAD = 'inbody_fichas_edad_v2';
const KEY_PLANES_NUTRI = 'inbody_planes_nutricion_v1';

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
