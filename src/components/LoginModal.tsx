import React, { useState } from 'react';
import { UserAccount, UserRole } from '../types/inbody';
import { FRASES_MANDO, CAPAS_BASE } from '../data/mockData';
import {
  isPrivilegedRole,
  ensureCredencial,
  verifyPassword,
  changePassword,
  getSeguridadConfig,
} from '../lib/authCredentials';
import { fetchUserByCedula } from '../lib/firestoreService';
import { BrandLogo } from './BrandLogo';
import { 
  Shield, 
  KeyRound, 
  ArrowRight, 
  AlertCircle, 
  Activity, 
  Dumbbell, 
  Salad, 
  User,
  Lock,
  Phone
} from 'lucide-react';

interface LoginModalProps {
  /** Usuarios locales (mock / ya cargados) para resolver rol rápido */
  users: UserAccount[];
  onLoginSuccess: (user: UserAccount) => void;
}

/** Tiempo mínimo de la animación/frase al ingresar (ms) */
const LOGIN_PHRASE_MIN_MS = 5000;

export const LoginModal: React.FC<LoginModalProps> = ({ users, onLoginSuccess }) => {
  const [cedulaInput, setCedulaInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [forceChange, setForceChange] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [newPass2, setNewPass2] = useState('');
  const [pendingUser, setPendingUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [fraseActual, setFraseActual] = useState(FRASES_MANDO[0]);
  const [contactoAdmin, setContactoAdmin] = useState('');

  const waitForPhrase = async (startedAt: number) => {
    const left = LOGIN_PHRASE_MIN_MS - (Date.now() - startedAt);
    if (left > 0) {
      await new Promise((r) => setTimeout(r, left));
    }
  };

  const resolveUser = async (cedula: string): Promise<UserAccount | null> => {
    const local = users.find(
      (u) => u.cedula === cedula || u.cedula.padStart(10, '0') === cedula.padStart(10, '0')
    );
    let remote: UserAccount | null = null;
    try {
      remote = await fetchUserByCedula(cedula);
    } catch {
      /* offline / reglas */
    }
    if (!local && !remote) return null;
    if (!remote) return local!;
    if (!local) {
      // Admin institucional forzado
      if (cedula === '0703887042') return { ...remote, role: 'admin' };
      return remote;
    }
    // Prioriza mediciones con datos reales (Firebase hidratado o archivo InBody local)
    const mediciones =
      remote.mediciones?.length > 0
        ? remote.mediciones
        : local.mediciones?.length
          ? local.mediciones
          : [];
    return {
      ...local,
      ...remote,
      role: cedula === '0703887042' ? 'admin' : local.role !== 'usuario' ? local.role : remote.role,
      mediciones,
    };
  };

  const handleLogin = async () => {
    setErrorMsg('');
    setInfoMsg('');
    const targetCedula = cedulaInput.trim();

    if (!targetCedula) {
      setErrorMsg('Por favor ingrese su número de cédula (10 dígitos).');
      return;
    }
    if (!/^\d+$/.test(targetCedula)) {
      setErrorMsg('La cédula solo puede contener números (sin letras ni símbolos).');
      return;
    }
    if (targetCedula.length !== 10) {
      setErrorMsg(
        targetCedula.length < 10
          ? `La cédula debe tener 10 dígitos. Ingresó ${targetCedula.length}.`
          : `La cédula debe tener exactamente 10 dígitos. Ingresó ${targetCedula.length}.`
      );
      return;
    }

    const randFrase = FRASES_MANDO[Math.floor(Math.random() * FRASES_MANDO.length)];
    setFraseActual(randFrase);
    setIsLoading(true);
    const startedAt = Date.now();

    try {
      const found = await resolveUser(targetCedula);
      if (!found) {
        setErrorMsg('Cédula no registrada. Verifique el número o solicite registro al administrador.');
        setIsLoading(false);
        return;
      }

      // Evaluado: entra solo con cédula
      if (!isPrivilegedRole(found.role)) {
        await waitForPhrase(startedAt);
        onLoginSuccess(found);
        setIsLoading(false);
        return;
      }

      // Roles privilegiados: pedir contraseña
      if (!showPasswordField) {
        setShowPasswordField(true);
        setPendingUser(found);
        try {
          const cfg = await getSeguridadConfig();
          setContactoAdmin(cfg.telefonoContactoAdmin || '');
        } catch { /* ignore */ }
        setInfoMsg('Rol privilegiado detectado. Ingrese su contraseña (primera vez = su cédula).');
        setIsLoading(false);
        return;
      }

      const user = pendingUser || found;
      let cred;
      try {
        cred = await ensureCredencial(
          user.cedula,
          user.role,
          user.nombres.trim()
        );
      } catch (e) {
        console.error('ensureCredencial', e);
        const code = (e as { code?: string })?.code || '';
        setErrorMsg(
          code === 'permission-denied'
            ? 'Firebase bloqueó credenciales (permission-denied). En Consola → Firestore → Reglas, permita read/write en `credenciales` y `config`, y pulse Publicar.'
            : 'No se pudo validar credenciales en Firebase. Revise reglas de Firestore (colección credenciales).'
        );
        setIsLoading(false);
        return;
      }

      if (!passwordInput) {
        setErrorMsg('Ingrese la contraseña.');
        setIsLoading(false);
        return;
      }

      const ok = await verifyPassword(user.cedula, passwordInput);
      if (!ok) {
        setErrorMsg(
          contactoAdmin
            ? `Contraseña incorrecta. Si la olvidó, comuníquese con el administrador: ${contactoAdmin}`
            : 'Contraseña incorrecta. Si la olvidó, comuníquese con el administrador institucional.'
        );
        setIsLoading(false);
        return;
      }

      if (cred.mustChangePassword || passwordInput === user.cedula) {
        setForceChange(true);
        setPendingUser(user);
        setInfoMsg('Debe cambiar su contraseña antes de continuar (ya no use la cédula).');
        setIsLoading(false);
        return;
      }

      await waitForPhrase(startedAt);
      onLoginSuccess(user);
    } catch (err) {
      console.error(err);
      setErrorMsg('Error de autenticación. Intente de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setErrorMsg('');
    if (!pendingUser) return;
    if (newPass.length < 6) {
      setErrorMsg('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPass !== newPass2) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }
    if (newPass === pendingUser.cedula) {
      setErrorMsg('No puede usar la cédula como contraseña definitiva.');
      return;
    }
    setIsLoading(true);
    const startedAt = Date.now();
    const randFrase = FRASES_MANDO[Math.floor(Math.random() * FRASES_MANDO.length)];
    setFraseActual(randFrase);
    try {
      await changePassword(pendingUser.cedula, newPass, {
        mustChangePassword: false,
        role: pendingUser.role,
        nombres: pendingUser.nombres.trim(),
      });
      await waitForPhrase(startedAt);
      onLoginSuccess(pendingUser);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'No se pudo guardar la contraseña.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden my-6">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-cyan-400 to-indigo-600" />

        <div className="text-center mb-6">
          <div className="mb-3 flex justify-center">
            <BrandLogo sizeClassName="h-16" variant="dark-bg" />
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <h2 className="text-3xl font-black tracking-wider flex items-center">
              <span className="text-white">IN</span>
              <span className="text-blue-400">BODY</span>
            </h2>
            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/30">
              270S
            </span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[11px] font-bold mt-2.5">
            <Shield className="w-3 h-3" />
            <span>Ejército Ecuatoriano</span>
          </div>
        </div>

        <div className="space-y-4">
          {!forceChange && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 text-center">
                  Número de Cédula de Identidad
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    value={cedulaInput}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const onlyDigits = raw.replace(/\D/g, '').slice(0, 10);
                      setCedulaInput(onlyDigits);
                      setShowPasswordField(false);
                      setPasswordInput('');
                      setPendingUser(null);
                      if (raw !== onlyDigits && raw.length > 0) {
                        setErrorMsg('Solo se permiten números. Se eliminaron caracteres no válidos.');
                      } else if (errorMsg) setErrorMsg('');
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    placeholder="10 dígitos (ej. 17394717XX)"
                    className="w-full px-4 py-3.5 bg-slate-950 border-2 border-slate-700 focus:border-blue-500 rounded-xl text-white font-mono text-center text-lg tracking-widest placeholder:text-slate-600 outline-none transition-all shadow-inner"
                  />
                  <KeyRound className="w-5 h-5 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 text-center">
                  Solo números • Exactamente 10 dígitos ({cedulaInput.length}/10)
                </p>
              </div>

              {showPasswordField && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Contraseña (Admin / Operador / Entrenador / Nutricionista)
                  </label>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    placeholder="Primera vez: su misma cédula"
                    className="w-full px-4 py-3.5 bg-slate-950 border-2 border-slate-700 focus:border-blue-500 rounded-xl text-white font-mono text-center text-lg outline-none"
                  />
                  {contactoAdmin && (
                    <p className="text-[11px] text-amber-300/90 mt-2 flex items-center justify-center gap-1">
                      <Phone className="w-3 h-3" />
                      Recuperación: comuníquese con el admin {contactoAdmin}
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {forceChange && (
            <div className="space-y-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
              <p className="text-xs font-bold text-amber-200">Cambio obligatorio de contraseña</p>
              <input
                type="password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="Nueva contraseña (mín. 6)"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm outline-none"
              />
              <input
                type="password"
                value={newPass2}
                onChange={(e) => setNewPass2(e.target.value)}
                placeholder="Confirmar nueva contraseña"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm outline-none"
              />
              <button
                type="button"
                onClick={handleChangePassword}
                disabled={isLoading}
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs uppercase rounded-xl cursor-pointer"
              >
                Guardar y entrar
              </button>
            </div>
          )}

          {infoMsg && (
            <div className="flex items-center gap-2 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-300 text-xs font-medium">
              <Lock className="w-4 h-4 shrink-0" />
              <span>{infoMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!forceChange && (
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>{showPasswordField ? 'Validar contraseña' : 'Ingresar'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-lg">
          <div className="w-full max-w-sm bg-white rounded-3xl p-8 text-center shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-center mb-4">
              <img 
                src={CAPAS_BASE.troteGif} 
                alt="Cargando" 
                className="w-24 h-24 object-contain rounded-2xl" 
              />
            </div>
            <p className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-3">
              Consultando Base de Datos InBody...
            </p>
            <p className="text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-2">
              {fraseActual.preventiva}
            </p>
            <h3 className="text-xl font-black text-slate-900 uppercase leading-tight">
              {fraseActual.ejecutiva}
            </h3>
          </div>
        </div>
      )}
    </div>
  );
};
