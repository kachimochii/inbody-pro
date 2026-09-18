import { createHash, randomBytes } from 'crypto';
import * as admin from 'firebase-admin';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';

setGlobalOptions({ region: 'us-central1', maxInstances: 20 });

function ensureAdmin() {
  if (admin.apps.length > 0) return;
  admin.initializeApp();
}

function getDb() {
  ensureAdmin();
  return admin.firestore();
}

function getAdminAuth() {
  ensureAdmin();
  return admin.auth();
}

const FieldValue = admin.firestore.FieldValue;

const COL_USERS = 'usuarios';
const COL_CREDS = 'credenciales';
const ADMIN_CEDULA = '0703887042';
const PIN_LENGTH = 5;
const PIN_MAX_INTENTOS = 5;
const LOCK_MS = 15 * 60 * 1000;
const PRIVILEGED = new Set(['admin', 'operador', 'entrenador', 'nutricionista']);

type UserRole = 'admin' | 'operador' | 'usuario' | 'entrenador' | 'nutricionista';
type PinResetStatus = 'pendiente' | 'autorizado' | 'usado' | 'rechazado';

const publicCallable = { cors: true as const, invoker: 'public' as const };

async function withHttpsErrors<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (err) {
    if (err instanceof HttpsError) throw err;
    const msg = err instanceof Error ? err.message : String(err);
    console.error('callable_crash', msg);
    throw new HttpsError('internal', msg.slice(0, 180) || 'Error interno de autenticación.');
  }
}

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function normalizeCedula(raw: unknown): string {
  return String(raw || '').replace(/\D/g, '').padStart(10, '0').slice(-10);
}

function isPrivileged(role: string): boolean {
  return PRIVILEGED.has(role);
}

function pinWeakReason(pin: string, cedula?: string): string | null {
  if (!new RegExp(`^\\d{${PIN_LENGTH}}$`).test(pin)) {
    return `El PIN debe tener exactamente ${PIN_LENGTH} números.`;
  }
  if (/^(\d)\1{4}$/.test(pin)) return 'No uses 5 dígitos iguales (ej. 11111).';
  if (pin === '12345' || pin === '54321') return 'Ese PIN es demasiado predecible.';
  const digits = String(cedula || '').replace(/\D/g, '');
  if (digits && (pin === digits.slice(-5) || pin === digits.slice(0, 5))) {
    return 'No uses dígitos de tu cédula como PIN.';
  }
  return null;
}

function hashPin(pin: string, salt: string): string {
  return sha256(`${salt}:${pin}`);
}

function randomSalt(): string {
  return randomBytes(16).toString('hex');
}

function requireAdmin(request: { auth?: { token?: Record<string, unknown>; uid?: string } }): void {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Debe iniciar sesión como administrador.');
  }
  const role = String(request.auth.token?.role || '');
  const uid = normalizeCedula(request.auth.uid);
  if (role !== 'admin' && uid !== ADMIN_CEDULA) {
    throw new HttpsError('permission-denied', 'Solo el administrador puede hacer esta acción.');
  }
}

async function contactoAdmin(): Promise<string> {
  try {
    const snap = await getDb().collection('config').doc('seguridad').get();
    return String(snap.data()?.telefonoContactoAdmin || '');
  } catch (err) {
    console.error('contactoAdmin', err);
    return '';
  }
}

function resolveRole(cedula: string, data: Record<string, unknown> | undefined): UserRole {
  if (cedula === ADMIN_CEDULA) return 'admin';
  const role = String(data?.role || 'usuario');
  if (role === 'admin' || role === 'operador' || role === 'entrenador' || role === 'nutricionista') {
    return role;
  }
  return 'usuario';
}

async function issueToken(cedula: string, role: UserRole, nombres: string): Promise<string> {
  try {
    return await getAdminAuth().createCustomToken(cedula, { role, cedula, nombres: nombres.slice(0, 80) });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('createCustomToken_failed', msg);
    throw new HttpsError(
      'failed-precondition',
      'Firebase Authentication no está activo o la Function no puede crear tokens. En Firebase Console → Authentication → Get started (puede activar Email/Password aunque no lo use).'
    );
  }
}

async function savePinFields(
  cedula: string,
  pin: string,
  existing: Record<string, unknown> | undefined,
  nombres?: string
): Promise<void> {
  const weak = pinWeakReason(pin, cedula);
  if (weak) throw new HttpsError('invalid-argument', weak);
  const salt = randomSalt();
  const now = new Date().toISOString();
  const hadReset = Boolean(existing?.pinResetStatus);
  await getDb().collection(COL_CREDS).doc(cedula).set(
    {
      cedula,
      role: existing?.role || 'usuario',
      nombres: nombres || existing?.nombres || existing?.pinResetNombres || '',
      pinHash: hashPin(pin, salt),
      pinSalt: salt,
      pinUpdatedAt: now,
      pinFailedAttempts: 0,
      pinLockUntil: FieldValue.delete(),
      pinResetStatus: hadReset ? 'usado' : FieldValue.delete(),
      pinResetUsedAt: hadReset ? now : FieldValue.delete(),
    },
    { merge: true }
  );
}

export const loginInbody = onCall(publicCallable, async (request) => withHttpsErrors(async () => {
  const cedula = normalizeCedula(request.data?.cedula);
  const pin = String(request.data?.pin || '');
  const password = String(request.data?.password || '');
  const newPin = String(request.data?.newPin || '');
  const newPassword = String(request.data?.newPassword || '');
  const phone = await contactoAdmin();

  if (!/^\d{10}$/.test(cedula)) {
    throw new HttpsError('invalid-argument', 'La cédula debe tener exactamente 10 dígitos.');
  }

  const userSnap = await getDb().collection(COL_USERS).doc(cedula).get();
  if (!userSnap.exists) {
    throw new HttpsError('not-found', 'Cédula no registrada. Verifique el número o solicite registro al administrador.');
  }

  const userData = (userSnap.data() || {}) as Record<string, unknown>;
  const role = resolveRole(cedula, userData);
  const nombres = String(userData.nombres || '').trim();
  const credRef = getDb().collection(COL_CREDS).doc(cedula);
  const credSnap = await credRef.get();
  const cred = (credSnap.data() || {}) as Record<string, unknown>;

  if (isPrivileged(role)) {
    try {
      if (!cred.passwordHash) {
        await credRef.set(
          {
            cedula,
            role,
            nombres,
            passwordHash: sha256(cedula),
            mustChangePassword: true,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
        cred.passwordHash = sha256(cedula);
        cred.mustChangePassword = true;
      } else if (cred.role !== role) {
        await credRef.set({ role, nombres }, { merge: true });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('credenciales_write_failed', msg);
      throw new HttpsError(
        'failed-precondition',
        'No se pudo escribir en credenciales. Revise permisos IAM de la cuenta de servicio de Functions.'
      );
    }

    if (!password && !newPassword) {
      return {
        status: 'need_password',
        nombres,
        contactoAdmin: phone,
        message: 'Rol privilegiado detectado. Ingrese su contraseña (primera vez = su cédula).',
      };
    }

    if (!password || sha256(password) !== String(cred.passwordHash)) {
      throw new HttpsError(
        'permission-denied',
        'Contraseña incorrecta. Primera vez = su cédula (10 dígitos). Si ya la cambió, use la nueva.'
      );
    }

    const mustChange = Boolean(cred.mustChangePassword) || password === cedula;
    if (mustChange && !newPassword) {
      return {
        status: 'must_change_password',
        nombres,
        contactoAdmin: phone,
        message: 'Debe cambiar su contraseña antes de continuar (ya no use la cédula).',
      };
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        throw new HttpsError('invalid-argument', 'La nueva contraseña debe tener al menos 6 caracteres.');
      }
      if (newPassword === cedula) {
        throw new HttpsError('invalid-argument', 'No puede usar la cédula como contraseña definitiva.');
      }
      await credRef.set(
        {
          passwordHash: sha256(newPassword),
          mustChangePassword: false,
          updatedAt: new Date().toISOString(),
          role,
          nombres,
        },
        { merge: true }
      );
    }

    const token = await issueToken(cedula, role, nombres);
    return { status: 'ok', token, role, nombres, cedula, contactoAdmin: phone };
  }

  // Evaluado: PIN
  const resetStatus = cred.pinResetStatus as PinResetStatus | undefined;
  const needsCreate = resetStatus === 'autorizado' || !cred.pinHash || !cred.pinSalt;

  if (cred.pinLockUntil) {
    const until = Date.parse(String(cred.pinLockUntil));
    if (!Number.isNaN(until) && until > Date.now()) {
      const minutesLeft = Math.max(1, Math.ceil((until - Date.now()) / 60000));
      return {
        status: 'locked',
        minutesLeft,
        nombres,
        contactoAdmin: phone,
        message: `PIN bloqueado por intentos fallidos. Intente en ${minutesLeft} min o solicite reseteo al administrador.`,
      };
    }
  }

  if (needsCreate) {
    if (!newPin) {
      return {
        status: 'create_pin',
        reason: resetStatus === 'autorizado' ? 'reset' : 'first',
        nombres,
        contactoAdmin: phone,
        message:
          resetStatus === 'autorizado'
            ? 'El administrador autorizó un PIN nuevo. Créelo ahora (5 dígitos numéricos).'
            : 'Primera vez: cree su PIN de 5 dígitos. Lo necesitará en cada ingreso, además de la cédula.',
      };
    }
    await savePinFields(cedula, newPin, { ...cred, role: 'usuario' }, nombres);
    const token = await issueToken(cedula, 'usuario', nombres);
    return { status: 'ok', token, role: 'usuario', nombres, cedula, contactoAdmin: phone };
  }

  if (!pin) {
    return {
      status: 'need_pin',
      nombres,
      contactoAdmin: phone,
      message: 'Ingrese su PIN de 5 dígitos para abrir su ficha InBody.',
    };
  }

  if (!/^\d{5}$/.test(pin)) {
    throw new HttpsError('invalid-argument', `El PIN debe tener exactamente ${PIN_LENGTH} números.`);
  }

  const expected = hashPin(pin, String(cred.pinSalt));
  if (expected === cred.pinHash) {
    if (cred.pinFailedAttempts || cred.pinLockUntil) {
      await credRef.set({ pinFailedAttempts: 0, pinLockUntil: FieldValue.delete() }, { merge: true });
    }
    const token = await issueToken(cedula, 'usuario', nombres);
    return { status: 'ok', token, role: 'usuario', nombres, cedula, contactoAdmin: phone };
  }

  const failedAttempts = Number(cred.pinFailedAttempts || 0) + 1;
  const locked = failedAttempts >= PIN_MAX_INTENTOS;
  await credRef.set(
    {
      pinFailedAttempts: failedAttempts,
      pinLockUntil: locked ? new Date(Date.now() + LOCK_MS).toISOString() : FieldValue.delete(),
    },
    { merge: true }
  );

  if (locked) {
    throw new HttpsError(
      'resource-exhausted',
      `PIN incorrecto. Se bloqueó por ${PIN_MAX_INTENTOS} intentos. Espere 15 min o solicite reseteo al administrador.`
    );
  }
  const restantes = PIN_MAX_INTENTOS - failedAttempts;
  throw new HttpsError(
    'permission-denied',
    `PIN incorrecto. Le quedan ${restantes} intento${restantes === 1 ? '' : 's'}.`
  );
}));

export const solicitarResetPin = onCall(publicCallable, async (request) => {
  const cedula = normalizeCedula(request.data?.cedula);
  if (!/^\d{10}$/.test(cedula)) {
    throw new HttpsError('invalid-argument', 'Ingrese primero su cédula para solicitar el reseteo.');
  }
  const userSnap = await getDb().collection(COL_USERS).doc(cedula).get();
  if (!userSnap.exists) {
    throw new HttpsError('not-found', 'Cédula no registrada.');
  }
  const nombres = String(userSnap.data()?.nombres || request.data?.nombres || '').trim();
  const credRef = getDb().collection(COL_CREDS).doc(cedula);
  const existing = (await credRef.get()).data();
  if (existing?.pinResetStatus === 'autorizado') {
    return { ok: true, alreadyAuthorized: true };
  }
  const now = new Date().toISOString();
  await credRef.set(
    {
      cedula,
      role: existing?.role || 'usuario',
      nombres: nombres || existing?.nombres || '',
      pinResetNombres: nombres || existing?.nombres || '',
      pinResetRequestedAt: now,
      pinResetStatus: 'pendiente',
      pinResetAuthorizedAt: FieldValue.delete(),
      pinResetUsedAt: FieldValue.delete(),
    },
    { merge: true }
  );
  const phone = await contactoAdmin();
  return { ok: true, contactoAdmin: phone };
});

export const cambiarPin = onCall(publicCallable, async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Debe iniciar sesión para cambiar el PIN.');
  }
  const cedula = normalizeCedula(request.auth.uid);
  const currentPin = String(request.data?.currentPin || '');
  const nextPin = String(request.data?.nextPin || '');
  if (currentPin === nextPin) {
    throw new HttpsError('invalid-argument', 'El PIN nuevo debe ser distinto al actual.');
  }
  const credSnap = await getDb().collection(COL_CREDS).doc(cedula).get();
  const cred = credSnap.data();
  if (!cred?.pinHash || !cred.pinSalt) {
    throw new HttpsError('failed-precondition', 'Aún no tiene PIN. Créelo al ingresar.');
  }
  if (hashPin(currentPin, String(cred.pinSalt)) !== cred.pinHash) {
    throw new HttpsError('permission-denied', 'PIN actual incorrecto.');
  }
  await savePinFields(cedula, nextPin, cred);
  return { ok: true };
});

export const adminListarCredenciales = onCall(publicCallable, async (request) => withHttpsErrors(async () => {
  requireAdmin(request);
  const snap = await getDb().collection(COL_CREDS).get();
  const list: Array<Record<string, unknown>> = [];
  snap.forEach((docSnap) => {
    const data = docSnap.data();
    if (!isPrivileged(String(data.role || ''))) return;
    list.push({
      cedula: docSnap.id,
      role: data.role,
      nombres: data.nombres || '',
      mustChangePassword: Boolean(data.mustChangePassword),
      updatedAt: data.updatedAt || '',
      hasPassword: Boolean(data.passwordHash),
    });
  });
  list.sort((a, b) => String(a.cedula).localeCompare(String(b.cedula)));
  return { list };
}));

export const adminListarResetPin = onCall(publicCallable, async (request) => withHttpsErrors(async () => {
  requireAdmin(request);
  const snap = await getDb().collection(COL_CREDS).get();
  const list: Array<Record<string, unknown>> = [];
  snap.forEach((docSnap) => {
    const data = docSnap.data();
    if (!data.pinResetStatus) return;
    list.push({
      cedula: docSnap.id,
      nombres: data.pinResetNombres || data.nombres || '',
      requestedAt: data.pinResetRequestedAt || '',
      status: data.pinResetStatus,
      authorizedAt: data.pinResetAuthorizedAt || null,
      usedAt: data.pinResetUsedAt || null,
    });
  });
  const order: Record<string, number> = { pendiente: 0, autorizado: 1, usado: 2, rechazado: 3 };
  list.sort((a, b) => {
    const byStatus = (order[String(a.status)] ?? 9) - (order[String(b.status)] ?? 9);
    if (byStatus !== 0) return byStatus;
    return String(b.requestedAt).localeCompare(String(a.requestedAt));
  });
  return { list };
}));

export const adminResetPassword = onCall(publicCallable, async (request) => withHttpsErrors(async () => {
  requireAdmin(request);
  const cedula = normalizeCedula(request.data?.cedula);
  const newPassword = String(request.data?.newPassword || '');
  const role = String(request.data?.role || 'admin') as UserRole;
  if (newPassword.length < 6) {
    throw new HttpsError('invalid-argument', 'La nueva contraseña debe tener al menos 6 caracteres.');
  }
  await getDb().collection(COL_CREDS).doc(cedula).set(
    {
      cedula,
      role,
      passwordHash: sha256(newPassword),
      mustChangePassword: false,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
  return { ok: true };
}));

export const adminAutorizarPin = onCall(publicCallable, async (request) => withHttpsErrors(async () => {
  requireAdmin(request);
  const cedula = normalizeCedula(request.data?.cedula);
  const nombres = String(request.data?.nombres || '');
  const existing = (await getDb().collection(COL_CREDS).doc(cedula).get()).data();
  const userSnap = await getDb().collection(COL_USERS).doc(cedula).get();
  const now = new Date().toISOString();
  await getDb().collection(COL_CREDS).doc(cedula).set(
    {
      cedula,
      role: existing?.role || userSnap.data()?.role || 'usuario',
      nombres: nombres || existing?.pinResetNombres || existing?.nombres || userSnap.data()?.nombres || '',
      pinResetNombres: nombres || existing?.pinResetNombres || existing?.nombres || userSnap.data()?.nombres || '',
      pinResetRequestedAt: existing?.pinResetRequestedAt || now,
      pinResetStatus: 'autorizado',
      pinResetAuthorizedAt: now,
      pinResetUsedAt: FieldValue.delete(),
    },
    { merge: true }
  );
  return { ok: true };
}));

export const adminRechazarPin = onCall(publicCallable, async (request) => withHttpsErrors(async () => {
  requireAdmin(request);
  const cedula = normalizeCedula(request.data?.cedula);
  await getDb().collection(COL_CREDS).doc(cedula).set({ pinResetStatus: 'rechazado' }, { merge: true });
  return { ok: true };
}));
