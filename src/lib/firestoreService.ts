import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  query,
  limit,
  orderBy,
  startAfter,
  endBefore,
  limitToLast,
  documentId,
  where,
  QueryConstraint,
  QueryDocumentSnapshot,
  DocumentData,
  deleteField,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, STORAGE_BUCKET_CANDIDATES, getStorageForBucket } from './firebase';
import {
  UserAccount,
  UserRole,
  PlanEntrenamiento,
  PlanNutricion,
  FichaEdadCatalogo,
  Sexo,
  InBodyRecord,
  SomatotipoTipo,
  SegmentalValues,
} from '../types/inbody';
import { EVALUADOS_INBODY_REALES } from '../data/inbodyEvaluados';
import { expandUnidadesPorJerarquia, hasInbodyData } from './unidadesCatalog';
import type { FoodCategory, FoodItem, MealData } from '../data/foodDatabase';
import {
  BaremosConfig,
  normalizeBaremosConfig,
} from '../utils/composicionCorporal';

/** Campos oficiales de usuario en Firestore (escalafón limpio). */
export const FIRESTORE_USER_FIELDS = [
  'cedula',
  'nombres',
  'grado',
  'tituloC',
  'tituloD',
  'sexo',
  'fechaNacimiento',
  'fechaIngreso',
  'tipoUsuario',
  'unidad',
  'region',
  'role',
  'mediciones',
  'updatedAt',
] as const;

const COL_USUARIOS = 'usuarios';
const COL_PLANES_ENTRENO = 'planesEntrenamiento';
const COL_PLANES_NUTRI = 'planesNutricion';
const COL_FICHAS = 'fichasEdad';
const COL_ALIMENTOS = 'alimentosCalculadora';
/** Un doc por cédula: se sobrescribe cada día (no acumula historial). */
const COL_DIARIO = 'diarioCalorico';

export const ROSTER_PAGE_SIZE = 100;

export function normalizeCedula(cedula: string): string {
  return String(cedula || '').replace(/\D/g, '').padStart(10, '0').slice(-10);
}

const LOCAL_EVALUADOS_BY_CEDULA = new Map(
  EVALUADOS_INBODY_REALES.map((u) => [normalizeCedula(u.cedula), u])
);

function numField(raw: Record<string, unknown>, keys: string[], fallback = 0): number {
  for (const key of keys) {
    const n = Number(raw[key]);
    if (Number.isFinite(n) && n !== 0) return n;
  }
  for (const key of keys) {
    const n = Number(raw[key]);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function strField(raw: Record<string, unknown>, keys: string[], fallback = ''): string {
  for (const key of keys) {
    const v = raw[key];
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v);
  }
  return fallback;
}

const EMPTY_SEGMENTAL: SegmentalValues = {
  musculoBD: 0, musculoBDPct: 100,
  musculoBI: 0, musculoBIPct: 100,
  musculoTR: 0, musculoTRPct: 100,
  musculoPD: 0, musculoPDPct: 100,
  musculoPI: 0, musculoPIPct: 100,
  grasaBD: 0, grasaBDPct: 100,
  grasaBI: 0, grasaBIPct: 100,
  grasaTR: 0, grasaTRPct: 100,
  grasaPD: 0, grasaPDPct: 100,
  grasaPI: 0, grasaPIPct: 100,
};

function normalizeMedicion(raw: unknown, cedula: string, index: number): InBodyRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const peso = numField(r, ['peso', 'pesoKg', 'weight', 'Weight', 'Peso_kg']);
  const alturaCm = numField(r, ['alturaCm', 'altura', 'height', 'Height', 'Estatura_cm']);
  const inbodyScore = numField(r, ['inbodyScore', 'score', 'Score_InBody', 'puntaje']);
  if (peso <= 0 && alturaCm <= 0 && inbodyScore <= 0) return null;

  const segRaw = r.segmental && typeof r.segmental === 'object'
    ? (r.segmental as Partial<SegmentalValues>)
    : {};

  const tipoRaw = strField(r, ['tipoCuerpo', 'somatotipo', 'tipo_cuerpo'], 'Tipo estándar');

  return {
    id: strField(r, ['id'], `med-${cedula}-${index}`),
    fecha: toIsoDate(strField(r, ['fecha', 'fechaMedicion', 'Fecha_Medicion'], new Date().toISOString().slice(0, 10))),
    alturaCm,
    peso,
    aguaKg: numField(r, ['aguaKg', 'agua']),
    proteinaKg: numField(r, ['proteinaKg', 'proteina']),
    mineralesKg: numField(r, ['mineralesKg', 'minerales']),
    grasaKg: numField(r, ['grasaKg', 'grasa', 'Grasa_kg']),
    ffmKg: numField(r, ['ffmKg', 'ffm']),
    musculoKg: numField(r, ['musculoKg', 'musculo', 'smm', 'Musculo_kg']),
    imc: numField(r, ['imc', 'bmi']),
    pctGrasa: numField(r, ['pctGrasa', 'pbf', 'porcentajeGrasa']),
    inbodyScore,
    tmb: numField(r, ['tmb', 'bmr']),
    grasaVisceral: numField(r, ['grasaVisceral', 'Grasa_Visceral', 'vfl']),
    grasaSubcutaneaKg: numField(r, ['grasaSubcutaneaKg']),
    adiposidad: numField(r, ['adiposidad']),
    caloriasRecomendadas: numField(r, ['caloriasRecomendadas']),
    tipoCuerpo: tipoRaw as SomatotipoTipo,
    edadCorporal: numField(r, ['edadCorporal']),
    pesoIdeal: numField(r, ['pesoIdeal']),
    controlPeso: numField(r, ['controlPeso']),
    controlGrasa: numField(r, ['controlGrasa']),
    controlMuscular: numField(r, ['controlMuscular']),
    rangoPesoMin: numField(r, ['rangoPesoMin']),
    rangoPesoMax: numField(r, ['rangoPesoMax']),
    rangoSmmMin: numField(r, ['rangoSmmMin']),
    rangoSmmMax: numField(r, ['rangoSmmMax']),
    rangoBfmMin: numField(r, ['rangoBfmMin']),
    rangoBfmMax: numField(r, ['rangoBfmMax']),
    rangoImcMin: numField(r, ['rangoImcMin'], 18.5),
    rangoImcMax: numField(r, ['rangoImcMax'], 25),
    rangoPbfMin: numField(r, ['rangoPbfMin'], 10),
    rangoPbfMax: numField(r, ['rangoPbfMax'], 20),
    segmental: { ...EMPTY_SEGMENTAL, ...segRaw },
  };
}

function parseMedicionesRaw(data: Record<string, unknown>, cedula: string): InBodyRecord[] {
  const candidates = [data.mediciones, data.medicion, data.inbody, data.evaluaciones, data.historico];
  const out: InBodyRecord[] = [];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      candidate.forEach((item, i) => {
        const med = normalizeMedicion(item, cedula, i);
        if (med) out.push(med);
      });
      if (out.length) break;
    } else if (candidate && typeof candidate === 'object') {
      Object.values(candidate as Record<string, unknown>).forEach((item, i) => {
        const med = normalizeMedicion(item, cedula, i);
        if (med) out.push(med);
      });
      if (out.length) break;
    }
  }

  if (!out.length) {
    const hasInbodyRoot =
      Number(data.inbodyScore || data.score || data.musculoKg || data.grasaKg || 0) > 0;
    if (hasInbodyRoot) {
      const rootMed = normalizeMedicion(data, cedula, 0);
      if (rootMed) out.push(rootMed);
    }
  }

  return out.sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
}

/** Une mediciones de Firebase con el archivo de estadísticas locales (misma cédula). */
export function hydrateUserMediciones(cedula: string, remote: InBodyRecord[]): InBodyRecord[] {
  if (hasInbodyData(remote)) return remote;
  const local = LOCAL_EVALUADOS_BY_CEDULA.get(normalizeCedula(cedula));
  return local?.mediciones?.length ? local.mediciones : remote;
}

export type RosterJerarquia = 'unidad' | 'padre' | 'abuelo';
export type RosterDatosFilter = 'TODOS' | 'CON' | 'SIN';
export type RosterStatusFilter = 'TODOS' | 'ALERTA' | 'OPTIMO';

export interface RosterQueryFilters {
  jerarquia?: RosterJerarquia;
  unidadValor?: string;
  datos?: RosterDatosFilter;
  status?: RosterStatusFilter;
}

export interface RosterPageResult {
  users: UserAccount[];
  firstDocId: string | null;
  lastDocId: string | null;
  /** Cursor para la siguiente página (último doc revisado en Firestore, no solo matches) */
  scanCursorId: string | null;
  hasPrev: boolean;
  hasNext: boolean;
  pageSize: number;
}

export function isUserEnAlerta(u: UserAccount): boolean {
  const med = u.mediciones[0];
  return !!(med && (med.grasaVisceral >= 10 || med.inbodyScore < 70 || med.pctGrasa >= 28));
}

export function isUserOptimo(u: UserAccount): boolean {
  const med = u.mediciones[0];
  return !!(med && med.inbodyScore >= 80);
}

export function getEstadoInBodyLabel(u: UserAccount): string {
  if (!hasInbodyData(u.mediciones)) return 'SIN DATOS';
  if (isUserEnAlerta(u)) return 'ALERTA';
  if (isUserOptimo(u)) return 'OPTIMO';
  return 'CON DATOS';
}

function matchesPostFilters(u: UserAccount, filters: RosterQueryFilters): boolean {
  const datos = filters.datos || 'TODOS';
  const status = filters.status || 'TODOS';
  const hasData = hasInbodyData(u.mediciones);
  if (datos === 'CON' && !hasData) return false;
  if (datos === 'SIN' && hasData) return false;
  if (status === 'ALERTA' && !isUserEnAlerta(u)) return false;
  if (status === 'OPTIMO' && !isUserOptimo(u)) return false;
  return true;
}

function needsClientScan(filters: RosterQueryFilters): boolean {
  return (filters.datos && filters.datos !== 'TODOS') || (filters.status && filters.status !== 'TODOS');
}

function unidadCodesForFilter(filters: RosterQueryFilters): string[] | null {
  const valor = filters.unidadValor || 'TODAS';
  if (!valor || valor === 'TODAS') return null;
  return expandUnidadesPorJerarquia(filters.jerarquia || 'unidad', valor);
}

/** Sube imagen a Firebase Storage y devuelve URL pública. */
export async function uploadImageToStorage(
  file: File,
  folder: 'portadas' | 'guias' | 'nutricion' | 'fondos' | 'otros' = 'otros'
): Promise<string> {
  if (!file || file.size === 0) {
    throw new Error('Archivo vacío.');
  }
  if (file.size > 8_000_000) {
    throw new Error('La imagen supera 8 MB. Comprima el archivo.');
  }

  const contentType =
    file.type && file.type.startsWith('image/') ? file.type : 'image/jpeg';
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_') || `imagen_${Date.now()}.jpg`;
  const path = `inbody/${folder}/${Date.now()}_${safeName}`;

  const withTimeout = <T>(promise: Promise<T>, ms: number, label: string): Promise<T> =>
    new Promise((resolve, reject) => {
      const t = setTimeout(
        () => reject(new Error(`Tiempo agotado (${ms / 1000}s) al ${label}. Revise Storage en Firebase.`)),
        ms
      );
      promise.then(
        (v) => {
          clearTimeout(t);
          resolve(v);
        },
        (e) => {
          clearTimeout(t);
          reject(e);
        }
      );
    });

  let lastError: unknown = null;

  for (const bucket of STORAGE_BUCKET_CANDIDATES) {
    try {
      const store = bucket === STORAGE_BUCKET_CANDIDATES[0] ? storage : getStorageForBucket(bucket);
      const storageRef = ref(store, path);
      const snap = await withTimeout(
        uploadBytes(storageRef, file, {
          contentType,
          customMetadata: { uploadedFrom: 'inbody-web' },
        }),
        45000,
        `subir a ${bucket}`
      );
      return await withTimeout(getDownloadURL(snap.ref), 20000, 'obtener URL');
    } catch (err: unknown) {
      lastError = err;
      console.warn(`Storage upload falló en bucket ${bucket}:`, err);
    }
  }

  const err = lastError as { code?: string; message?: string } | null;
  const code = err?.code || '';
  const msg = err?.message || String(lastError);
  if (code === 'storage/unauthorized' || code === 'storage/unauthenticated') {
    throw new Error(
      'Firebase Storage rechazó la subida (reglas). Consola → Storage → Reglas → publique las reglas de inbody/**.'
    );
  }
  if (/Tiempo agotado/i.test(msg)) {
    throw new Error(
      `${msg} En Firebase → Build → Storage verifique que esté creado y con reglas publicadas.`
    );
  }
  if (/bucket|not found|404/i.test(msg) || code === 'storage/bucket-not-found') {
    throw new Error(
      'Storage no habilitado o bucket incorrecto. Firebase → Build → Storage → Comenzar (Get started).'
    );
  }
  throw new Error(`No se pudo subir la imagen (${code || 'error'}): ${msg}`);
}

export async function uploadDataUrlToStorage(
  dataUrl: string,
  folder: 'portadas' | 'guias' | 'nutricion' | 'fondos' | 'otros' = 'otros',
  filename = 'imagen.jpg'
): Promise<string> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
  return uploadImageToStorage(file, folder);
}

function splitNombres(full: string): { nombres: string; apellidos: string } {
  const parts = (full || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { nombres: full || 'Sin nombre', apellidos: '' };
  if (parts.length === 2) return { nombres: parts[1], apellidos: parts[0] };
  return {
    apellidos: parts.slice(0, 2).join(' '),
    nombres: parts.slice(2).join(' '),
  };
}

function toIsoDate(raw: string): string {
  if (!raw) return '1990-01-01';
  const dmy = raw.trim().match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  return '1990-01-01';
}

export function mapFirestoreUser(cedula: string, data: Record<string, unknown>): UserAccount {
  const id = normalizeCedula(cedula);
  // Plantilla: columna única "nombres". Si hay apellidos legado, se unen y no se conserva aparte.
  const nombresRaw = String(data.nombres || data.nombre || '').trim();
  const apellidosRaw = String(data.apellidos || '').trim();
  const nombreCompleto =
    nombresRaw && apellidosRaw
      ? `${nombresRaw} ${apellidosRaw}`.replace(/\s+/g, ' ').trim()
      : nombresRaw || apellidosRaw || '';
  const nombres = nombreCompleto || 'Sin nombre';
  void splitNombres;

  const sexoRaw = String(data.sexo || 'M').toUpperCase();
  const roleRaw = String(data.role || data.rol || 'usuario').toLowerCase();
  const validRoles: UserRole[] = ['admin', 'operador', 'usuario', 'entrenador', 'nutricionista'];
  const role = (validRoles.includes(roleRaw as UserRole) ? roleRaw : 'usuario') as UserRole;

  const remoteMeds = parseMedicionesRaw(data, id);
  const mediciones = hydrateUserMediciones(id, remoteMeds);
  const local = LOCAL_EVALUADOS_BY_CEDULA.get(id);

  const tituloC = String(data.tituloC ?? local?.tituloC ?? '').trim();
  const tituloD = String(data.tituloD ?? local?.tituloD ?? '').trim();
  // Legado: especialidad/cargo solo si no hay títulos del escalafón
  const especialidadLegado = String(
    data.especialidad || data.cargo || local?.especialidad || ''
  ).trim();

  return {
    cedula: id,
    nombres: nombres || local?.nombres || 'Sin nombre',
    grado: String(data.grado || local?.grado || ''),
    tituloC: tituloC || undefined,
    tituloD: tituloD || undefined,
    especialidad: especialidadLegado || undefined,
    sexo: (sexoRaw.startsWith('F') ? 'F' : 'M') as Sexo,
    fechaNacimiento: toIsoDate(String(data.fechaNascimento || data.fechaNacimiento || local?.fechaNacimiento || '')),
    fechaIngreso: toIsoDate(String(data.fechaIngreso || local?.fechaIngreso || '')),
    tipoUsuario: String(data.tipoUsuario || data.promocion || local?.tipoUsuario || 'Militar en Servicio Activo'),
    unidadActual: String(data.unidad || data.unidadActual || local?.unidadActual || ''),
    region: String(data.region || data.REGIONES || local?.region || 'Sierra'),
    role,
    mediciones,
  };
}

function sanitizeMedicionForCloud(m: InBodyRecord) {
  const { tipoCuerpo: _omit, ...rest } = m;
  return rest;
}

/** Persiste usuario limpio (solo campos oficiales) en Firestore. */
export async function saveUserAccountToFirestore(user: UserAccount): Promise<void> {
  const id = normalizeCedula(user.cedula);
  await setDoc(
    doc(db, COL_USUARIOS, id),
    {
      cedula: id,
      nombres: user.nombres,
      apellidos: deleteField(),
      grado: user.grado,
      tituloC: (user.tituloC || '').trim(),
      tituloD: (user.tituloD || '').trim(),
      sexo: user.sexo,
      fechaNacimiento: user.fechaNacimiento,
      fechaIngreso: user.fechaIngreso,
      tipoUsuario: user.tipoUsuario,
      unidad: user.unidadActual,
      region: user.region,
      role: user.role,
      mediciones: user.mediciones.map(sanitizeMedicionForCloud),
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

/** Agrega una medición al historial (concatena; no borra tomas anteriores). */
export async function appendMedicionToFirestore(cedula: string, record: InBodyRecord): Promise<void> {
  const id = normalizeCedula(cedula);
  const snap = await getDoc(doc(db, COL_USUARIOS, id));
  const existing = snap.exists()
    ? parseMedicionesRaw(snap.data() as Record<string, unknown>, id)
    : [];
  const withoutSameId = existing.filter((m) => m.id !== record.id);
  const withoutExactDup = withoutSameId.filter(
    (m) =>
      !(
        m.fecha === record.fecha &&
        Math.abs(m.peso - record.peso) < 0.05 &&
        m.inbodyScore === record.inbodyScore
      )
  );
  const merged = [record, ...withoutExactDup].sort((a, b) =>
    String(b.fecha).localeCompare(String(a.fecha))
  );
  await setDoc(
    doc(db, COL_USUARIOS, id),
    {
      mediciones: merged.map(sanitizeMedicionForCloud),
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

/** Busca UN usuario por cédula (rápido; no descarga 25k). */
export async function fetchUserByCedula(cedula: string): Promise<UserAccount | null> {
  const id = normalizeCedula(cedula);
  const snap = await getDoc(doc(db, COL_USUARIOS, id));
  if (!snap.exists()) {
    const snap2 = await getDoc(doc(db, COL_USUARIOS, cedula));
    if (!snap2.exists()) {
      const local = LOCAL_EVALUADOS_BY_CEDULA.get(id);
      return local ? { ...local, cedula: id } : null;
    }
    return mapFirestoreUser(snap2.id, snap2.data() as Record<string, unknown>);
  }
  return mapFirestoreUser(snap.id, snap.data() as Record<string, unknown>);
}

/** Carga personal limitada — legado. */
export async function fetchUsuariosFromFirestore(maxDocs = 500): Promise<UserAccount[]> {
  const q = query(collection(db, COL_USUARIOS), orderBy(documentId()), limit(maxDocs));
  const snap = await getDocs(q);
  const list: UserAccount[] = [];
  snap.forEach((d) => {
    list.push(mapFirestoreUser(d.id, d.data() as Record<string, unknown>));
  });
  return list;
}

async function getQueryDocById(id: string): Promise<QueryDocumentSnapshot<DocumentData> | null> {
  const q = query(
    collection(db, COL_USUARIOS),
    orderBy(documentId()),
    where(documentId(), '==', id),
    limit(1)
  );
  const qs = await getDocs(q);
  return qs.docs[0] || null;
}

function buildBaseConstraints(unidadCodes: string[] | null): QueryConstraint[] {
  const constraints: QueryConstraint[] = [];
  if (unidadCodes && unidadCodes.length === 1) {
    constraints.push(where('unidad', '==', unidadCodes[0]));
  } else if (unidadCodes && unidadCodes.length > 1) {
    constraints.push(where('unidad', 'in', unidadCodes.slice(0, 30)));
  }
  constraints.push(orderBy(documentId()));
  return constraints;
}

async function runRawPage(opts: {
  unidadCodes: string[] | null;
  pageSize: number;
  direction: 'first' | 'next' | 'prev';
  cursorId: string | null;
}): Promise<{ docs: QueryDocumentSnapshot<DocumentData>[]; users: UserAccount[] }> {
  const { unidadCodes, pageSize, direction, cursorId } = opts;
  const base = buildBaseConstraints(unidadCodes);
  let q;

  if (direction === 'next' && cursorId) {
    const cursor = await getQueryDocById(cursorId);
    if (!cursor) throw new Error('Cursor de paginación inválido.');
    q = query(collection(db, COL_USUARIOS), ...base, startAfter(cursor), limit(pageSize));
  } else if (direction === 'prev' && cursorId) {
    const cursor = await getQueryDocById(cursorId);
    if (!cursor) throw new Error('Cursor de paginación inválido.');
    q = query(collection(db, COL_USUARIOS), ...base, endBefore(cursor), limitToLast(pageSize));
  } else {
    q = query(collection(db, COL_USUARIOS), ...base, limit(pageSize));
  }

  const snap = await getDocs(q);
  return {
    docs: snap.docs,
    users: snap.docs.map((d) => mapFirestoreUser(d.id, d.data() as Record<string, unknown>)),
  };
}

/**
 * Página de personal (default 100).
 * Unidad → where() en Firestore.
 * Con/Sin datos y Alertas → rellenan la página escaneando lotes (nested mediciones no admite where directo).
 */
export async function fetchUsuariosPage(opts: {
  filters?: RosterQueryFilters;
  direction?: 'first' | 'next' | 'prev';
  /** Para next: lastDocId; para prev: firstDocId; para scan-next: scanCursorId */
  cursorId?: string | null;
  /** Al usar filtros CON/SIN/ALERTA, cursor de escaneo Firestore de la página anterior */
  scanCursorId?: string | null;
  pageSize?: number;
}): Promise<RosterPageResult> {
  const pageSize = opts.pageSize ?? ROSTER_PAGE_SIZE;
  const direction = opts.direction ?? 'first';
  const filters = opts.filters || {};
  const unidadCodes = unidadCodesForFilter(filters);
  const cursorId = opts.cursorId ?? null;

  if (!needsClientScan(filters)) {
    const { docs, users } = await runRawPage({
      unidadCodes,
      pageSize,
      direction,
      cursorId,
    });

    let hasNext = false;
    if (docs.length > 0) {
      const peek = await runRawPage({
        unidadCodes,
        pageSize: 1,
        direction: 'next',
        cursorId: docs[docs.length - 1].id,
      });
      hasNext = peek.docs.length > 0;
    }

    const hasPrev =
      direction === 'prev' ||
      (direction === 'next' && Boolean(cursorId)) ||
      (direction === 'first' && Boolean(cursorId));

    return {
      users,
      firstDocId: docs[0]?.id ?? null,
      lastDocId: docs[docs.length - 1]?.id ?? null,
      scanCursorId: docs[docs.length - 1]?.id ?? null,
      hasPrev: direction === 'first' && !cursorId ? false : hasPrev || docs.length > 0 && direction !== 'first',
      hasNext,
      pageSize,
    };
  }

  // Escaneo hacia adelante para filtros de mediciones
  if (direction === 'prev') {
    throw new Error('PREV_USE_CURSOR_STACK');
  }

  const matched: UserAccount[] = [];
  const matchedDocs: QueryDocumentSnapshot<DocumentData>[] = [];
  let scanCursor: string | null =
    direction === 'next' ? opts.scanCursorId || cursorId : null;
  let scans = 0;
  const maxScans = 40;

  while (matched.length < pageSize && scans < maxScans) {
    const { docs, users } = await runRawPage({
      unidadCodes,
      pageSize,
      direction: scanCursor ? 'next' : 'first',
      cursorId: scanCursor,
    });
    if (docs.length === 0) break;

    for (let i = 0; i < users.length; i++) {
      if (matchesPostFilters(users[i], filters)) {
        matched.push(users[i]);
        matchedDocs.push(docs[i]);
        if (matched.length >= pageSize) break;
      }
    }

    scanCursor = docs[docs.length - 1].id;
    scans += 1;
    if (docs.length < pageSize) break;
  }

  let hasNext = false;
  if (scanCursor) {
    let peekCursor = scanCursor;
    for (let s = 0; s < 10 && !hasNext; s++) {
      const peek = await runRawPage({
        unidadCodes,
        pageSize,
        direction: 'next',
        cursorId: peekCursor,
      });
      if (peek.docs.length === 0) break;
      if (peek.users.some((u) => matchesPostFilters(u, filters))) {
        hasNext = true;
        break;
      }
      peekCursor = peek.docs[peek.docs.length - 1].id;
      if (peek.docs.length < pageSize) break;
    }
  }

  return {
    users: matched,
    firstDocId: matchedDocs[0]?.id ?? null,
    lastDocId: matchedDocs[matchedDocs.length - 1]?.id ?? null,
    scanCursorId: scanCursor,
    hasPrev: Boolean(opts.scanCursorId || cursorId),
    hasNext,
    pageSize,
  };
}

/** Exporta registros del filtro activo (paginado en servidor, no carga todo en UI). */
export async function exportUsuariosFiltrados(
  filters: RosterQueryFilters,
  onProgress?: (loaded: number) => void
): Promise<UserAccount[]> {
  const unidadCodes = unidadCodesForFilter(filters);
  const out: UserAccount[] = [];
  let cursor: string | null = null;
  let guard = 0;

  while (guard < 500) {
    const { docs, users } = await runRawPage({
      unidadCodes,
      pageSize: ROSTER_PAGE_SIZE,
      direction: cursor ? 'next' : 'first',
      cursorId: cursor,
    });
    if (docs.length === 0) break;
    for (const u of users) {
      if (matchesPostFilters(u, filters)) out.push(u);
    }
    onProgress?.(out.length);
    cursor = docs[docs.length - 1].id;
    guard += 1;
    if (docs.length < ROSTER_PAGE_SIZE) break;
  }

  return out;
}

export async function saveUserRoleToFirestore(cedula: string, role: UserRole): Promise<void> {
  await setDoc(doc(db, COL_USUARIOS, normalizeCedula(cedula)), { role }, { merge: true });
}

export async function fetchPlanesEntrenamiento(): Promise<PlanEntrenamiento[]> {
  const snap = await getDocs(collection(db, COL_PLANES_ENTRENO));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PlanEntrenamiento, 'id'>) }));
}

export async function upsertPlanEntrenamiento(plan: PlanEntrenamiento): Promise<void> {
  const { id, ...rest } = plan;
  await setDoc(doc(db, COL_PLANES_ENTRENO, id), rest, { merge: true });
}

export async function deletePlanEntrenamiento(id: string): Promise<void> {
  await deleteDoc(doc(db, COL_PLANES_ENTRENO, id));
}

export async function fetchPlanesNutricion(): Promise<PlanNutricion[]> {
  const snap = await getDocs(collection(db, COL_PLANES_NUTRI));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PlanNutricion, 'id'>) }));
}

export async function upsertPlanNutricion(plan: PlanNutricion): Promise<void> {
  const { id, ...rest } = plan;
  await setDoc(doc(db, COL_PLANES_NUTRI, id), rest, { merge: true });
}

export async function deletePlanNutricion(id: string): Promise<void> {
  await deleteDoc(doc(db, COL_PLANES_NUTRI, id));
}

export async function fetchFichasEdad(): Promise<FichaEdadCatalogo[]> {
  const snap = await getDocs(collection(db, COL_FICHAS));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<FichaEdadCatalogo, 'id'>) }));
}

export async function upsertFichaEdad(ficha: FichaEdadCatalogo): Promise<void> {
  const { id, ...rest } = ficha;
  await setDoc(doc(db, COL_FICHAS, id), rest, { merge: true });
}

export async function deleteFichaEdad(id: string): Promise<void> {
  await deleteDoc(doc(db, COL_FICHAS, id));
}

export async function seedPlanesIfEmpty(
  seedPlanes: PlanEntrenamiento[],
  seedFichas: FichaEdadCatalogo[],
  seedNutri: PlanNutricion[]
): Promise<{ planes: PlanEntrenamiento[]; fichas: FichaEdadCatalogo[]; nutri: PlanNutricion[] }> {
  let planes = await fetchPlanesEntrenamiento();
  let fichas = await fetchFichasEdad();
  let nutri = await fetchPlanesNutricion();

  // Solo agrega planes base que FALTEN. Nunca pisa ediciones (imágenes/videos) del usuario.
  if (seedPlanes.length > 0) {
    const existingIds = new Set(planes.map((p) => p.id));
    const missing = seedPlanes.filter((p) => !existingIds.has(p.id));
    if (missing.length > 0) {
      const chunk = 400;
      for (let i = 0; i < missing.length; i += chunk) {
        const batch = writeBatch(db);
        missing.slice(i, i + chunk).forEach((p) => {
          const { id, ...rest } = p;
          batch.set(doc(db, COL_PLANES_ENTRENO, id), rest);
        });
        await batch.commit();
      }
      planes = await fetchPlanesEntrenamiento();
    }
  }

  if (fichas.length === 0 && seedFichas.length > 0) {
    const batch = writeBatch(db);
    seedFichas.forEach((f) => {
      const { id, ...rest } = f;
      batch.set(doc(db, COL_FICHAS, id), rest);
    });
    await batch.commit();
    fichas = seedFichas;
  } else if (seedFichas.length > 0) {
    const existing = new Set(fichas.map((f) => f.id));
    const missingF = seedFichas.filter((f) => !existing.has(f.id));
    if (missingF.length > 0) {
      const batch = writeBatch(db);
      missingF.forEach((f) => {
        const { id, ...rest } = f;
        batch.set(doc(db, COL_FICHAS, id), rest, { merge: true });
      });
      await batch.commit();
      fichas = [...fichas, ...missingF];
    }
  }

  if (nutri.length === 0 && seedNutri.length > 0) {
    const batch = writeBatch(db);
    seedNutri.forEach((p) => {
      const { id, ...rest } = p;
      batch.set(doc(db, COL_PLANES_NUTRI, id), rest);
    });
    await batch.commit();
    nutri = seedNutri;
  } else if (seedNutri.length > 0) {
    const existing = new Set(nutri.map((p) => p.id));
    const missingN = seedNutri.filter((p) => !existing.has(p.id));
    if (missingN.length > 0) {
      const batch = writeBatch(db);
      missingN.forEach((p) => {
        const { id, ...rest } = p;
        batch.set(doc(db, COL_PLANES_NUTRI, id), rest, { merge: true });
      });
      await batch.commit();
      nutri = [...nutri, ...missingN];
    }
  }

  return { planes, fichas, nutri };
}

export type DiarioActivityMode = 'sin_deporte' | 'con_deporte';

export async function fetchAlimentosCalculadora(): Promise<FoodItem[]> {
  const snap = await getDocs(collection(db, COL_ALIMENTOS));
  return snap.docs.map((d) => {
    const data = d.data() as Omit<FoodItem, 'id'>;
    return {
      id: d.id,
      name: data.name || d.id,
      cal: Number(data.cal) || 0,
      sub: data.sub || '1 porción',
      category: (data.category as FoodCategory) || 'otro',
    };
  });
}

export async function upsertAlimentoCalculadora(item: FoodItem): Promise<void> {
  const { id, ...rest } = item;
  await setDoc(doc(db, COL_ALIMENTOS, id), rest, { merge: true });
}

export async function deleteAlimentoCalculadora(id: string): Promise<void> {
  await deleteDoc(doc(db, COL_ALIMENTOS, id));
}

/** Si la colección está vacía, siembra el catálogo base. */
export async function seedAlimentosIfEmpty(seed: FoodItem[]): Promise<FoodItem[]> {
  const existing = await fetchAlimentosCalculadora();
  if (existing.length > 0) return existing;
  if (seed.length === 0) return [];

  const chunk = 400;
  for (let i = 0; i < seed.length; i += chunk) {
    const batch = writeBatch(db);
    seed.slice(i, i + chunk).forEach((item) => {
      const { id, ...rest } = item;
      batch.set(doc(db, COL_ALIMENTOS, id), rest);
    });
    await batch.commit();
  }
  return seed;
}

export interface DiarioCaloricoCloud {
  date: string;
  mode: DiarioActivityMode | null;
  meals: MealData;
  updatedAt?: string;
}

export async function fetchDiarioCalorico(cedula: string): Promise<DiarioCaloricoCloud | null> {
  const id = normalizeCedula(cedula);
  const snap = await getDoc(doc(db, COL_DIARIO, id));
  if (!snap.exists()) return null;
  const data = snap.data() as DiarioCaloricoCloud;
  return {
    date: data.date || '',
    mode: data.mode ?? null,
    meals: data.meals || ({} as MealData),
    updatedAt: data.updatedAt,
  };
}

/** Sobrescribe el mismo documento del usuario (sin historial por día). */
export async function saveDiarioCalorico(
  cedula: string,
  record: { date: string; mode: DiarioActivityMode | null; meals: MealData }
): Promise<void> {
  const id = normalizeCedula(cedula);
  await setDoc(
    doc(db, COL_DIARIO, id),
    {
      date: record.date,
      mode: record.mode,
      meals: record.meals,
      updatedAt: new Date().toISOString(),
    },
    { merge: false }
  );
}

const DOC_BAREMOS = doc(db, 'config', 'baremosEdadCorporal');

/** Baremos de edad corporal / semáforo (grasa + músculo). */
export async function getBaremosConfig(): Promise<BaremosConfig> {
  const snap = await getDoc(DOC_BAREMOS);
  if (!snap.exists()) return normalizeBaremosConfig(null);
  return normalizeBaremosConfig(snap.data() as Partial<BaremosConfig>);
}

export async function saveBaremosConfig(cfg: BaremosConfig): Promise<void> {
  const normalized = normalizeBaremosConfig(cfg);
  await setDoc(
    DOC_BAREMOS,
    {
      ...normalized,
      updatedAt: new Date().toISOString(),
    },
    { merge: false }
  );
}
