import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { UserRole } from '../types/inbody';

export const PRIVILEGED_ROLES: UserRole[] = ['admin', 'operador', 'entrenador', 'nutricionista'];

export function isPrivilegedRole(role: UserRole): boolean {
  return PRIVILEGED_ROLES.includes(role);
}

export interface CredencialCuenta {
  cedula: string;
  role: UserRole;
  /** Hash SHA-256 de la contraseña */
  passwordHash: string;
  /** Solo para panel admin / recuperación institucional (texto que el admin conoce o resetea) */
  passwordActual: string;
  mustChangePassword: boolean;
  updatedAt: string;
  nombres?: string;
}

export interface SeguridadConfig {
  telefonoContactoAdmin: string;
  mensajeRecuperacion: string;
}

const COL_CREDENCIALES = 'credenciales';

export async function hashPassword(plain: string): Promise<string> {
  const data = new TextEncoder().encode(plain);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function getCredencial(cedula: string): Promise<CredencialCuenta | null> {
  const snap = await getDoc(doc(db, COL_CREDENCIALES, cedula));
  if (!snap.exists()) return null;
  return { cedula, ...(snap.data() as Omit<CredencialCuenta, 'cedula'>) };
}

/** Primera vez: crea credencial con contraseña = cédula y obliga a cambiar. */
export async function ensureCredencial(
  cedula: string,
  role: UserRole,
  nombres?: string
): Promise<CredencialCuenta> {
  const existing = await getCredencial(cedula);
  if (existing) {
    if (existing.role !== role) {
      await setDoc(doc(db, COL_CREDENCIALES, cedula), { role }, { merge: true });
      return { ...existing, role };
    }
    return existing;
  }
  const passwordActual = cedula;
  const passwordHash = await hashPassword(passwordActual);
  const created: CredencialCuenta = {
    cedula,
    role,
    passwordHash,
    passwordActual,
    mustChangePassword: true,
    updatedAt: new Date().toISOString(),
    nombres: nombres || '',
  };
  await setDoc(doc(db, COL_CREDENCIALES, cedula), created);
  return created;
}

export async function verifyPassword(cedula: string, plain: string): Promise<boolean> {
  const cred = await getCredencial(cedula);
  if (!cred) return false;
  const h = await hashPassword(plain);
  return h === cred.passwordHash;
}

export async function changePassword(
  cedula: string,
  newPassword: string,
  opts?: { mustChangePassword?: boolean; role?: UserRole; nombres?: string }
): Promise<void> {
  if (newPassword.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres.');
  }
  const passwordHash = await hashPassword(newPassword);
  await setDoc(
    doc(db, COL_CREDENCIALES, cedula),
    {
      passwordHash,
      passwordActual: newPassword,
      mustChangePassword: opts?.mustChangePassword ?? false,
      updatedAt: new Date().toISOString(),
      ...(opts?.role ? { role: opts.role } : {}),
      ...(opts?.nombres !== undefined ? { nombres: opts.nombres } : {}),
    },
    { merge: true }
  );
}

export async function listCredencialesPrivilegiadas(): Promise<CredencialCuenta[]> {
  const snap = await getDocs(collection(db, COL_CREDENCIALES));
  const list: CredencialCuenta[] = [];
  snap.forEach((d) => {
    const data = d.data() as Omit<CredencialCuenta, 'cedula'>;
    if (isPrivilegedRole(data.role)) {
      list.push({ cedula: d.id, ...data });
    }
  });
  return list.sort((a, b) => a.cedula.localeCompare(b.cedula));
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
