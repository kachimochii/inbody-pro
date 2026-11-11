import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, STORAGE_BUCKET_CANDIDATES, getStorageForBucket } from './firebase';

export const GRUPOS_MUSCULARES = [
  'Pecho',
  'Espalda',
  'Piernas',
  'Abdomen / Core',
  'Hombros',
  'Brazos',
  'Cardio / Militar',
] as const;
export type GrupoMuscular = (typeof GRUPOS_MUSCULARES)[number];

export const EQUIPOS = ['Peso corporal', 'Mancuernas', 'Barra', 'Máquina', 'Banda', 'Otro'] as const;
export type EquipoEjercicio = (typeof EQUIPOS)[number];

export interface Ejercicio {
  id: string;
  nombre_es: string;
  grupo_muscular: GrupoMuscular;
  equipo: EquipoEjercicio;
  musculo_objetivo: string;
  es_militar: boolean;
  /** Máximo 2 pasos. */
  instrucciones_cortas: string[];
  /** Ruta pública (/ejercicios-webp/{id}.webp) o URL de Firebase Storage. */
  animacion: string;
  origen?: 'catalogo' | 'custom';
}

export type EjercicioMeta = Omit<Ejercicio, 'id' | 'animacion' | 'origen'> & {
  /** Si se omite se genera a partir de nombre_es (ej. "natacion-estilo-libre"). */
  id?: string;
  /** Solo si no se sube archivo: ruta ya colocada en public/ejercicios-webp/. */
  animacion?: string;
};

export interface FiltrosEjercicios {
  texto?: string;
  grupo_muscular?: GrupoMuscular | 'TODOS';
  equipo?: EquipoEjercicio | 'TODOS';
  es_militar?: boolean;
}

/** Prefijo con el que el catálogo JSON referencia las animaciones locales. */
const RUTA_ANIMACIONES_LOCAL = '/ejercicios-webp/';
/** Base efectiva: local (Vite/public) o CDN. Admite el marcador {archivo} para URLs de Firebase Storage. */
export const EJERCICIOS_CDN_BASE = (import.meta.env.VITE_EXERCISES_CDN_URL || '/ejercicios-webp').replace(/\/+$/, '');

export function resolverAnimacion(ruta: string): string {
  if (!ruta.startsWith(RUTA_ANIMACIONES_LOCAL)) return ruta;
  const archivo = ruta.slice(RUTA_ANIMACIONES_LOCAL.length);
  return EJERCICIOS_CDN_BASE.includes('{archivo}')
    ? EJERCICIOS_CDN_BASE.replace('{archivo}', encodeURIComponent(archivo))
    : `${EJERCICIOS_CDN_BASE}/${archivo}`;
}

const COL_EJERCICIOS_CUSTOM = 'ejerciciosCustom';
const STORAGE_DIR_CUSTOM = 'inbody/ejercicios_custom';
/** Límite impuesto por storage.rules para inbody/**. */
const MAX_BYTES_ANIMACION = 8 * 1024 * 1024;

let catalogoBasePromise: Promise<Ejercicio[]> | null = null;
let ejerciciosCache: Ejercicio[] | null = null;
let ejerciciosPromise: Promise<Ejercicio[]> | null = null;

export function normalizarTexto(valor: string): string {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function slugEjercicio(nombre: string): string {
  return normalizarTexto(nombre)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function enLista<T extends string>(lista: readonly T[], valor: unknown, fallback: T): T {
  return lista.includes(valor as T) ? (valor as T) : fallback;
}

function conAnimacionResuelta(e: Ejercicio): Ejercicio {
  return { ...e, animacion: resolverAnimacion(e.animacion) };
}

function normalizarEjercicio(raw: Record<string, unknown>, id: string, origen: Ejercicio['origen']): Ejercicio | null {
  const animacion = String(raw.animacion || '').trim();
  const nombre = String(raw.nombre_es || '').trim();
  if (!animacion || !nombre) return null;
  const pasos = Array.isArray(raw.instrucciones_cortas) ? raw.instrucciones_cortas : [];
  return {
    id,
    nombre_es: nombre,
    grupo_muscular: enLista(GRUPOS_MUSCULARES, raw.grupo_muscular, 'Cardio / Militar'),
    equipo: enLista(EQUIPOS, raw.equipo, 'Otro'),
    musculo_objetivo: String(raw.musculo_objetivo || '').trim(),
    es_militar: Boolean(raw.es_militar),
    instrucciones_cortas: pasos.map((p) => String(p).trim()).filter(Boolean).slice(0, 2),
    animacion,
    origen,
  };
}

/** Catálogo local (1323 ejercicios) cargado de forma diferida en un chunk aparte. */
export function cargarCatalogoBase(): Promise<Ejercicio[]> {
  if (!catalogoBasePromise) {
    catalogoBasePromise = import('../data/catalogoEjercicios.json')
      .then((mod) =>
        (mod.default as unknown as Record<string, unknown>[])
          .map((raw) => normalizarEjercicio(raw, String(raw.id), 'catalogo'))
          .filter((e): e is Ejercicio => e !== null)
          .map(conAnimacionResuelta)
      )
      .catch((err) => {
        catalogoBasePromise = null;
        throw err;
      });
  }
  return catalogoBasePromise;
}

/** Ejercicios propios guardados por Entrenador/Admin. Sin sesión o sin permisos devuelve []. */
export async function cargarEjerciciosCustom(): Promise<Ejercicio[]> {
  try {
    const snap = await getDocs(collection(db, COL_EJERCICIOS_CUSTOM));
    return snap.docs
      .map((d) => normalizarEjercicio(d.data(), d.id, 'custom'))
      .filter((e): e is Ejercicio => e !== null)
      .map(conAnimacionResuelta);
  } catch (err) {
    console.warn('No se pudieron cargar ejerciciosCustom:', err);
    return [];
  }
}

/** Catálogo base + ejerciciosCustom. Un custom con el mismo id reemplaza al del catálogo. */
export function cargarEjercicios(opciones: { forzar?: boolean } = {}): Promise<Ejercicio[]> {
  if (opciones.forzar) {
    ejerciciosCache = null;
    ejerciciosPromise = null;
  }
  if (ejerciciosCache) return Promise.resolve(ejerciciosCache);
  if (!ejerciciosPromise) {
    ejerciciosPromise = Promise.all([cargarCatalogoBase(), cargarEjerciciosCustom()])
      .then(([base, custom]) => {
        const porId = new Map<string, Ejercicio>();
        base.forEach((e) => porId.set(e.id, e));
        custom.forEach((e) => porId.set(e.id, e));
        ejerciciosCache = Array.from(porId.values()).sort((a, b) =>
          a.nombre_es.localeCompare(b.nombre_es, 'es')
        );
        return ejerciciosCache;
      })
      .finally(() => {
        ejerciciosPromise = null;
      });
  }
  return ejerciciosPromise;
}

export function filtrarPorGrupo(lista: Ejercicio[], grupo: GrupoMuscular): Ejercicio[] {
  return lista.filter((e) => e.grupo_muscular === grupo);
}

export function filtrarPorEquipo(lista: Ejercicio[], equipo: EquipoEjercicio): Ejercicio[] {
  return lista.filter((e) => e.equipo === equipo);
}

export function filtrarMilitares(lista: Ejercicio[], esMilitar = true): Ejercicio[] {
  return lista.filter((e) => e.es_militar === esMilitar);
}

/** Búsqueda en español sin tildes: todas las palabras deben aparecer en nombre, músculo, grupo o equipo. */
export function buscarEjercicios(lista: Ejercicio[], filtros: FiltrosEjercicios = {}): Ejercicio[] {
  const palabras = normalizarTexto(filtros.texto || '').split(/\s+/).filter(Boolean);
  const grupo = filtros.grupo_muscular && filtros.grupo_muscular !== 'TODOS' ? filtros.grupo_muscular : null;
  const equipo = filtros.equipo && filtros.equipo !== 'TODOS' ? filtros.equipo : null;

  return lista.filter((e) => {
    if (grupo && e.grupo_muscular !== grupo) return false;
    if (equipo && e.equipo !== equipo) return false;
    if (filtros.es_militar !== undefined && e.es_militar !== filtros.es_militar) return false;
    if (!palabras.length) return true;
    const texto = normalizarTexto(`${e.nombre_es} ${e.musculo_objetivo} ${e.grupo_muscular} ${e.equipo}`);
    return palabras.every((p) => texto.includes(p));
  });
}

export async function obtenerEjercicioPorId(id: string): Promise<Ejercicio | undefined> {
  return (await cargarEjercicios()).find((e) => e.id === id);
}

async function subirAnimacion(id: string, archivo: Blob, contentType: string, extension: string): Promise<{ url: string; path: string }> {
  const path = `${STORAGE_DIR_CUSTOM}/${id}.${extension}`;
  let lastError: unknown = null;
  for (const bucket of STORAGE_BUCKET_CANDIDATES) {
    try {
      const store = bucket === STORAGE_BUCKET_CANDIDATES[0] ? storage : getStorageForBucket(bucket);
      const snap = await uploadBytes(ref(store, path), archivo, {
        contentType,
        cacheControl: 'public,max-age=31536000',
        customMetadata: { uploadedFrom: 'inbody-web', tipo: 'ejercicio_custom' },
      });
      return { url: await getDownloadURL(snap.ref), path };
    } catch (err) {
      lastError = err;
      console.warn(`Subida de animación falló en bucket ${bucket}:`, err);
    }
  }
  const code = (lastError as { code?: string } | null)?.code || '';
  if (code === 'storage/unauthorized' || code === 'storage/unauthenticated') {
    throw new Error('Storage rechazó la subida: requiere sesión de Admin o Entrenador.');
  }
  throw new Error(`No se pudo subir la animación: ${(lastError as Error)?.message || String(lastError)}`);
}

/**
 * Guarda un ejercicio propio (Natación, Trote, Caminata...) con la misma estructura del catálogo.
 * Con archivo: lo sube a inbody/ejercicios_custom/{id}.webp (o .gif). Sin archivo: usa meta.animacion
 * (p. ej. un WebP ya colocado en public/ejercicios-webp/).
 */
export async function guardarEjercicioPersonalizado(
  meta: EjercicioMeta,
  archivoWebpOGif?: File | Blob | null
): Promise<Ejercicio> {
  const nombre = String(meta.nombre_es || '').trim();
  if (!nombre) throw new Error('El ejercicio necesita nombre_es.');
  const id = (meta.id && slugEjercicio(meta.id)) || slugEjercicio(nombre);
  if (!id) throw new Error('No se pudo generar un id válido para el ejercicio.');

  let animacion = String(meta.animacion || '').trim();
  let storagePath: string | null = null;

  if (archivoWebpOGif) {
    const tipo = archivoWebpOGif.type;
    const nombreArchivo = archivoWebpOGif instanceof File ? archivoWebpOGif.name.toLowerCase() : '';
    const esGif = tipo === 'image/gif' || nombreArchivo.endsWith('.gif');
    const esWebp = tipo === 'image/webp' || nombreArchivo.endsWith('.webp');
    if (!esGif && !esWebp) throw new Error('La animación debe ser .webp o .gif.');
    if (archivoWebpOGif.size === 0) throw new Error('Archivo de animación vacío.');
    if (archivoWebpOGif.size > MAX_BYTES_ANIMACION) throw new Error('La animación supera 8 MB.');
    const subida = await subirAnimacion(id, archivoWebpOGif, esWebp ? 'image/webp' : 'image/gif', esWebp ? 'webp' : 'gif');
    animacion = subida.url;
    storagePath = subida.path;
  }
  if (!animacion) throw new Error('Adjunte un archivo .webp/.gif o indique la ruta en public/ejercicios-webp/.');

  const ejercicio = normalizarEjercicio({ ...meta, nombre_es: nombre, animacion }, id, 'custom')!;
  const { origen: _origen, ...documento } = ejercicio;
  await setDoc(doc(db, COL_EJERCICIOS_CUSTOM, id), {
    ...documento,
    storagePath,
    actualizadoEn: new Date().toISOString(),
  });

  const resuelto = conAnimacionResuelta(ejercicio);
  if (ejerciciosCache) {
    ejerciciosCache = [...ejerciciosCache.filter((e) => e.id !== id), resuelto].sort((a, b) =>
      a.nombre_es.localeCompare(b.nombre_es, 'es')
    );
  }
  return resuelto;
}
