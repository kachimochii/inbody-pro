import { httpsCallable } from 'firebase/functions';
import { auth, functions } from './firebase';
import { UserRole } from '../types/inbody';
import { PinResetSolicitud } from './userPin';

export type LoginStatus =
  | 'ok'
  | 'need_pin'
  | 'create_pin'
  | 'need_password'
  | 'must_change_password'
  | 'locked';

export interface LoginInbodyResult {
  status: LoginStatus;
  token?: string;
  role?: UserRole;
  nombres?: string;
  cedula?: string;
  message?: string;
  reason?: 'first' | 'reset';
  minutesLeft?: number;
  contactoAdmin?: string;
}

export interface LoginInbodyInput {
  cedula: string;
  pin?: string;
  password?: string;
  newPin?: string;
  newPassword?: string;
}

function callable<Req, Res>(name: string) {
  return httpsCallable<Req, Res>(functions, name);
}

async function ensureIdToken(): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Debe iniciar sesión nuevamente para esta acción.');
  }
  await user.getIdToken(true);
}

function callableErrorMessage(err: unknown, fallback: string): string {
  const anyErr = err as { code?: string; message?: string };
  const raw = String(anyErr?.message || '').replace(/^Firebase:\s*/i, '').trim();
  const cleaned = raw.replace(/\s*\(functions\/[^)]+\)\s*$/i, '').trim();

  if (cleaned && !['internal', 'not-found', 'not found', 'error', 'ok'].includes(cleaned.toLowerCase())) {
    return cleaned;
  }

  const code = String(anyErr?.code || '').toLowerCase();
  if (code.includes('unauthenticated') || code.includes('permission-denied')) {
    return cleaned || 'No tiene permiso. Cierre sesión e ingrese de nuevo como administrador.';
  }
  if (code.includes('unavailable') || code.includes('deadline')) {
    return 'No hubo respuesta del servidor. Recargue e intente de nuevo.';
  }
  return fallback;
}

export async function loginInbody(input: LoginInbodyInput): Promise<LoginInbodyResult> {
  try {
    const fn = callable<LoginInbodyInput, LoginInbodyResult>('loginInbody');
    const res = await fn(input);
    return res.data;
  } catch (err) {
    throw new Error(callableErrorMessage(err, 'Error de autenticación. Intente de nuevo.'));
  }
}

export async function solicitarResetPinRemoto(cedula: string, nombres?: string): Promise<{ contactoAdmin?: string }> {
  try {
    const fn = callable<{ cedula: string; nombres?: string }, { contactoAdmin?: string }>('solicitarResetPin');
    const res = await fn({ cedula, nombres });
    return res.data || {};
  } catch (err) {
    throw new Error(callableErrorMessage(err, 'No se pudo enviar la solicitud de reseteo.'));
  }
}

export async function cambiarPinRemoto(currentPin: string, nextPin: string): Promise<void> {
  try {
    await ensureIdToken();
    const fn = callable<{ currentPin: string; nextPin: string }, { ok: boolean }>('cambiarPin');
    await fn({ currentPin, nextPin });
  } catch (err) {
    throw new Error(callableErrorMessage(err, 'No se pudo cambiar el PIN.'));
  }
}

export async function adminListarCredenciales(): Promise<
  Array<{
    cedula: string;
    role: UserRole;
    nombres: string;
    mustChangePassword: boolean;
    updatedAt: string;
    hasPassword: boolean;
  }>
> {
  try {
    await ensureIdToken();
    const fn = callable<unknown, {
      list: Array<{
        cedula: string;
        role: UserRole;
        nombres: string;
        mustChangePassword: boolean;
        updatedAt: string;
        hasPassword: boolean;
      }>;
    }>('adminListarCredenciales');
    const res = await fn({});
    return res.data.list || [];
  } catch (err) {
    throw new Error(callableErrorMessage(err, 'No se pudieron cargar las credenciales.'));
  }
}

export async function adminListarResetPin(): Promise<PinResetSolicitud[]> {
  try {
    await ensureIdToken();
    const fn = callable<unknown, { list: PinResetSolicitud[] }>('adminListarResetPin');
    const res = await fn({});
    return res.data.list || [];
  } catch (err) {
    throw new Error(callableErrorMessage(err, 'No se pudieron cargar las solicitudes de PIN.'));
  }
}

export async function adminResetPasswordRemoto(
  cedula: string,
  newPassword: string,
  role: UserRole
): Promise<void> {
  try {
    await ensureIdToken();
    const fn = callable<{ cedula: string; newPassword: string; role: UserRole }, { ok: boolean }>(
      'adminResetPassword'
    );
    await fn({ cedula, newPassword, role });
  } catch (err) {
    throw new Error(callableErrorMessage(err, 'No se pudo actualizar la contraseña.'));
  }
}

export async function adminAutorizarPinRemoto(cedula: string, nombres?: string): Promise<void> {
  try {
    await ensureIdToken();
    const fn = callable<{ cedula: string; nombres?: string }, { ok: boolean }>('adminAutorizarPin');
    await fn({ cedula, nombres });
  } catch (err) {
    throw new Error(callableErrorMessage(err, 'No se pudo autorizar el PIN.'));
  }
}

export async function adminRechazarPinRemoto(cedula: string): Promise<void> {
  try {
    await ensureIdToken();
    const fn = callable<{ cedula: string }, { ok: boolean }>('adminRechazarPin');
    await fn({ cedula });
  } catch (err) {
    throw new Error(callableErrorMessage(err, 'No se pudo rechazar la solicitud.'));
  }
}
