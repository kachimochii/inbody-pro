import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { uploadImageToStorage } from './firestoreService';

export interface CreditoPersona {
  id: string;
  rol: string;
  nombre: string;
}

export interface CreditosConfig {
  equipo: CreditoPersona[];
  impactoValor: number;
  impactoTexto: string;
  frase1: string;
  frase1Color: string;
  frase2: string;
  frase2Color: string;
}

export interface AparienciaConfig {
  fondoUrl: string;
  opacidad: number; // 0–0.55 recomendado
  updatedAt: string;
}

export const DEFAULT_CREDITOS: CreditosConfig = {
  equipo: [
    { id: 'c1', rol: 'Jefe del proyecto', nombre: 'TCRN JÁCOME JOSÉ' },
    { id: 'c2', rol: 'Asesor técnico', nombre: 'TCRN PORTERO LENIN' },
    { id: 'c3', rol: 'Desarrollador de la plataforma', nombre: 'TNTE REQUENA JOSÉ' },
    { id: 'c4', rol: 'Colaborador técnico / preparación física', nombre: 'CBOP E ARRIETA HENRY' },
  ],
  impactoValor: 26000,
  impactoTexto:
    'Efectivos de las Fuerzas Armadas en el alcance institucional InBody, · Oficiales y Tropa Profesional',
  frase1: 'Conoce tu cuerpo',
  frase1Color: '#67e8f9',
  frase2: 'Transforma tu vida',
  frase2Color: '#fb7185',
};

export const DEFAULT_APARIENCIA: AparienciaConfig = {
  fondoUrl: '',
  opacidad: 0.32,
  updatedAt: '',
};

export async function getCreditosConfig(): Promise<CreditosConfig> {
  const snap = await getDoc(doc(db, 'config', 'creditos'));
  if (!snap.exists()) return { ...DEFAULT_CREDITOS, equipo: [...DEFAULT_CREDITOS.equipo] };
  const data = snap.data() as Partial<CreditosConfig>;
  const equipo = Array.isArray(data.equipo) && data.equipo.length > 0
    ? data.equipo.map((p, i) => ({
        id: String(p.id || `c${i}`),
        rol: String(p.rol || ''),
        nombre: String(p.nombre || ''),
      }))
    : [...DEFAULT_CREDITOS.equipo];
  return {
    equipo,
    impactoValor: Number.isFinite(Number(data.impactoValor))
      ? Number(data.impactoValor)
      : DEFAULT_CREDITOS.impactoValor,
    impactoTexto: String(data.impactoTexto || DEFAULT_CREDITOS.impactoTexto),
    frase1: String(data.frase1 || DEFAULT_CREDITOS.frase1),
    frase1Color: String(data.frase1Color || DEFAULT_CREDITOS.frase1Color),
    frase2: String(data.frase2 || DEFAULT_CREDITOS.frase2),
    frase2Color: String(data.frase2Color || DEFAULT_CREDITOS.frase2Color),
  };
}

export async function saveCreditosConfig(cfg: CreditosConfig): Promise<void> {
  await setDoc(
    doc(db, 'config', 'creditos'),
    {
      equipo: cfg.equipo,
      impactoValor: cfg.impactoValor,
      impactoTexto: cfg.impactoTexto,
      frase1: cfg.frase1,
      frase1Color: cfg.frase1Color,
      frase2: cfg.frase2,
      frase2Color: cfg.frase2Color,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

export async function getAparienciaConfig(): Promise<AparienciaConfig> {
  const snap = await getDoc(doc(db, 'config', 'apariencia'));
  if (!snap.exists()) return { ...DEFAULT_APARIENCIA };
  const data = snap.data() as Partial<AparienciaConfig>;
  const op = Number(data.opacidad);
  return {
    fondoUrl: String(data.fondoUrl || ''),
    opacidad: Number.isFinite(op) ? Math.min(0.55, Math.max(0, op)) : DEFAULT_APARIENCIA.opacidad,
    updatedAt: String(data.updatedAt || ''),
  };
}

export async function saveAparienciaConfig(cfg: AparienciaConfig): Promise<void> {
  await setDoc(
    doc(db, 'config', 'apariencia'),
    {
      fondoUrl: cfg.fondoUrl,
      opacidad: cfg.opacidad,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

const MAX_FONDO_BYTES = 2_000_000;

export async function uploadFondoInstitucional(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Solo se permiten imágenes (JPG, PNG, WebP).');
  }
  if (file.size > MAX_FONDO_BYTES) {
    throw new Error('La imagen supera 2 MB. Comprima el archivo antes de subir.');
  }
  return uploadImageToStorage(file, 'fondos');
}
