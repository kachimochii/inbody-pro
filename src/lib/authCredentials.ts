import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { UserRole } from '../types/inbody';
import { PinResetSolicitud, PinResetStatus } from './userPin';

export const PRIVILEGED_ROLES: UserRole[] = ['admin', 'operador', 'entrenador', 'nutricionista'];

export function isPrivilegedRole(role: UserRole): boolean {
  return PRIVILEGED_ROLES.includes(role);
}

export interface CredencialCuenta {
  cedula: string;
  role: UserRole;
  passwordHash?: string;
  passwordActual?: string;
  mustChangePassword: boolean;
  updatedAt: string;
  nombres?: string;
  hasPassword?: boolean;
}

export interface SeguridadConfig {
  telefonoContactoAdmin: string;
  mensajeRecuperacion: string;
}

async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function getSeguridadConfig(): Promise<SeguridadConfig> {
  const snap = await getDoc(doc(db, 'config', 'seguridad'));
  if (!snap.exists()) {
    return {
      telefonoContactoAdmin: '',
      mensajeRecuperacion: 'Si olvidó su contraseña, comuníquese con el administrador institucional.',
    };
  }
  const data = snap.data() as Partial<SeguridadConfig>;
  return {
    telefonoContactoAdmin: data.telefonoContactoAdmin || '',
    mensajeRecuperacion:
      data.mensajeRecuperacion ||
      'Si olvidó su contraseña, comuníquese con el administrador institucional.',
  };
}

export async function saveSeguridadConfig(cfg: SeguridadConfig): Promise<void> {
  await setDoc(doc(db, 'config', 'seguridad'), cfg, { merge: true });
}

/** Lista cuentas privilegiadas desde Firestore (requiere sesión admin). */
export async function listarCredencialesPrivilegiadas(): Promise<CredencialCuenta[]> {
  const snap = await getDocs(collection(db, 'credenciales'));
  const list: CredencialCuenta[] = [];
  snap.forEach((docSnap) => {
    const data = docSnap.data() as Record<string, unknown>;
    const role = String(data.role || '') as UserRole;
    if (!isPrivilegedRole(role)) return;
    list.push({
      cedula: docSnap.id,
      role,
      nombres: String(data.nombres || ''),
      mustChangePassword: Boolean(data.mustChangePassword),
      updatedAt: String(data.updatedAt || ''),
      hasPassword: Boolean(data.passwordHash),
    });
  });
  list.sort((a, b) => a.cedula.localeCompare(b.cedula));
  return list;
}

/** Solicitudes de reseteo de PIN desde Firestore. */
export async function listarSolicitudesResetPin(): Promise<PinResetSolicitud[]> {
  const snap = await getDocs(collection(db, 'credenciales'));
  const list: PinResetSolicitud[] = [];
  snap.forEach((docSnap) => {
    const data = docSnap.data() as Record<string, unknown>;
    if (!data.pinResetStatus) return;
    list.push({
      cedula: docSnap.id,
      nombres: String(data.pinResetNombres || data.nombres || ''),
      requestedAt: String(data.pinResetRequestedAt || ''),
      status: data.pinResetStatus as PinResetStatus,
      authorizedAt: data.pinResetAuthorizedAt ? String(data.pinResetAuthorizedAt) : undefined,
      usedAt: data.pinResetUsedAt ? String(data.pinResetUsedAt) : undefined,
    });
  });
  const order: Record<string, number> = { pendiente: 0, autorizado: 1, usado: 2, rechazado: 3 };
  list.sort((a, b) => {
    const byStatus = (order[String(a.status)] ?? 9) - (order[String(b.status)] ?? 9);
    if (byStatus !== 0) return byStatus;
    return String(b.requestedAt).localeCompare(String(a.requestedAt));
  });
  return list;
}

export async function adminResetPasswordLocal(
  cedula: string,
  newPassword: string,
  role: UserRole
): Promise<void> {
  if (newPassword.length < 6) {
    throw new Error('La nueva contraseña debe tener al menos 6 caracteres.');
  }
  const passwordHash = await sha256Hex(newPassword);
  await setDoc(
    doc(db, 'credenciales', cedula),
    {
      cedula,
      role,
      passwordHash,
      mustChangePassword: false,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

export async function adminAutorizarPinLocal(cedula: string, nombres?: string): Promise<void> {
  const ref = doc(db, 'credenciales', cedula);
  const existing = (await getDoc(ref)).data() || {};
  const userSnap = await getDoc(doc(db, 'usuarios', cedula));
  const now = new Date().toISOString();
  const nombreFinal =
    nombres ||
    String(existing.pinResetNombres || existing.nombres || userSnap.data()?.nombres || '');
  await setDoc(
    ref,
    {
      cedula,
      role: existing.role || userSnap.data()?.role || 'usuario',
      nombres: nombreFinal,
      pinResetNombres: nombreFinal,
      pinResetRequestedAt: existing.pinResetRequestedAt || now,
      pinResetStatus: 'autorizado',
      pinResetAuthorizedAt: now,
      pinResetUsedAt: deleteField(),
    },
    { merge: true }
  );
}

export async function adminRechazarPinLocal(cedula: string): Promise<void> {
  await updateDoc(doc(db, 'credenciales', cedula), { pinResetStatus: 'rechazado' });
}
