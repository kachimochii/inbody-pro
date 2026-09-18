import React, { useState } from 'react';
import { signInWithCustomToken } from 'firebase/auth';
import { UserAccount } from '../types/inbody';
import { FRASES_MANDO, CAPAS_BASE } from '../data/mockData';
import { PIN_LENGTH, pinWeakReason } from '../lib/userPin';
import { loginInbody, LoginInbodyResult, solicitarResetPinRemoto } from '../lib/authApi';
import { fetchUserByCedula } from '../lib/firestoreService';
import { auth } from '../lib/firebase';
import { BrandLogo } from './BrandLogo';
import { PinInput } from './PinInput';
import { 
  KeyRound, 
  ArrowRight, 
  AlertCircle, 
  Lock,
  Phone
} from 'lucide-react';

interface LoginModalProps {
  users?: UserAccount[];
  onLoginSuccess: (user: UserAccount) => void;
  /** Marca el inicio del sign-in para que App no restaure sesión antes del video. */
  onAuthSigningIn?: () => void;
  /** Bloque bajo la tarjeta (contador, disclaimer, etc.). */
  belowCard?: React.ReactNode;
}

const LOGIN_PHRASE_MIN_MS = 5000;

export const LoginModal: React.FC<LoginModalProps> = ({
  onLoginSuccess,
  onAuthSigningIn,
  belowCard,
}) => {
  const [cedulaInput, setCedulaInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [showPinField, setShowPinField] = useState(false);
  const [forceCreatePin, setForceCreatePin] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newPin2, setNewPin2] = useState('');
  const [forceChange, setForceChange] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [newPass2, setNewPass2] = useState('');
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

  const resetSecurityFields = () => {
    setShowPasswordField(false);
    setShowPinField(false);
    setForceCreatePin(false);
    setForceChange(false);
    setPasswordInput('');
    setPinInput('');
    setNewPin('');
    setNewPin2('');
  };

  const applyStatus = (res: LoginInbodyResult) => {
    if (res.contactoAdmin) setContactoAdmin(res.contactoAdmin);
    if (res.message) setInfoMsg(res.message);
    if (res.status === 'need_password') {
      setShowPasswordField(true);
      setShowPinField(false);
      setForceCreatePin(false);
    }
    if (res.status === 'need_pin') {
      setShowPinField(true);
      setShowPasswordField(false);
      setForceCreatePin(false);
    }
    if (res.status === 'create_pin') {
      setForceCreatePin(true);
      setShowPinField(false);
      setShowPasswordField(false);
    }
    if (res.status === 'must_change_password') {
      setForceChange(true);
      setShowPasswordField(false);
      // conservar passwordInput: se reenvía al guardar la nueva contraseña
    }
    if (res.status === 'locked') {
      setShowPinField(true);
      setErrorMsg(res.message || 'PIN bloqueado.');
      setInfoMsg('');
    }
  };

  const finishWithToken = async (token: string, cedula: string, startedAt: number) => {
    onAuthSigningIn?.();
    await signInWithCustomToken(auth, token);
    await auth.currentUser?.getIdToken(true);
    const user = await fetchUserByCedula(cedula);
    if (!user) {
      throw new Error('Sesión creada, pero no se pudo leer la ficha. Publique las reglas de Firestore.');
    }
    await waitForPhrase(startedAt);
    onLoginSuccess(
      user.cedula === '0703887042' ? { ...user, role: 'admin' as const } : user
    );
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
      const res = await loginInbody({
        cedula: targetCedula,
        pin: showPinField ? pinInput : undefined,
        password: showPasswordField ? passwordInput : undefined,
      });
      if (res.status === 'ok' && res.token) {
        await finishWithToken(res.token, targetCedula, startedAt);
        return;
      }
      applyStatus(res);
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : 'Error de autenticación. Intente de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePin = async () => {
    setErrorMsg('');
    const weak = pinWeakReason(newPin, cedulaInput);
    if (weak) {
      setErrorMsg(weak);
      return;
    }
    if (newPin !== newPin2) {
      setErrorMsg('El PIN y la confirmación no coinciden.');
      return;
    }
    setIsLoading(true);
    const startedAt = Date.now();
    const randFrase = FRASES_MANDO[Math.floor(Math.random() * FRASES_MANDO.length)];
    setFraseActual(randFrase);
    try {
      const res = await loginInbody({ cedula: cedulaInput.trim(), newPin });
      if (res.status === 'ok' && res.token) {
        await finishWithToken(res.token, cedulaInput.trim(), startedAt);
        return;
      }
      applyStatus(res);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'No se pudo guardar el PIN.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPin = async () => {
    setErrorMsg('');
    const cedula = cedulaInput.trim();
    if (cedula.length !== 10) {
      setErrorMsg('Ingrese primero su cédula para solicitar el reseteo.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await solicitarResetPinRemoto(cedula);
      const phone = res.contactoAdmin || contactoAdmin;
      if (res.contactoAdmin) setContactoAdmin(res.contactoAdmin);
      setInfoMsg(
        phone
          ? `Solicitud enviada. El administrador debe autorizar el reseteo. Contacto: ${phone}`
          : 'Solicitud enviada. El administrador autorizará el reseteo en Seguridad. Luego vuelva a ingresar para crear un PIN nuevo.'
      );
      setShowPinField(true);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'No se pudo enviar la solicitud de reseteo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setErrorMsg('');
    if (newPass.length < 6) {
      setErrorMsg('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPass !== newPass2) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }
    if (newPass === cedulaInput.trim()) {
      setErrorMsg('No puede usar la cédula como contraseña definitiva.');
      return;
    }
    setIsLoading(true);
    const startedAt = Date.now();
    const randFrase = FRASES_MANDO[Math.floor(Math.random() * FRASES_MANDO.length)];
    setFraseActual(randFrase);
    try {
      const res = await loginInbody({
        cedula: cedulaInput.trim(),
        password: passwordInput,
        newPassword: newPass,
      });
      if (res.status === 'ok' && res.token) {
        await finishWithToken(res.token, cedulaInput.trim(), startedAt);
        return;
      }
      applyStatus(res);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'No se pudo guardar la contraseña.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative z-10 w-full flex-1 flex flex-col items-center px-4 pt-6 pb-10 overflow-y-auto">
      <div className="login-glow-card w-full max-w-lg bg-slate-900/92 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-sm">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-cyan-400 to-indigo-600" />
        <style>{`
          @keyframes loginBorderPulse {
            0%, 100% { box-shadow: 0 0 0 1px rgba(56,189,248,0.25), 0 0 24px rgba(37,99,235,0.12); }
            50% { box-shadow: 0 0 0 1px rgba(34,211,238,0.55), 0 0 36px rgba(59,130,246,0.28); }
          }
          .login-glow-card {
            animation: loginBorderPulse 4.5s ease-in-out infinite;
          }
        `}</style>

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
            <img src="/EE.png" alt="" className="w-4 h-4 object-contain" />
            <span>Ejército Ecuatoriano</span>
          </div>
        </div>

        <div className="space-y-4">
          {!forceChange && !forceCreatePin && (
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
                      resetSecurityFields();
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
                <div className="mt-2.5 space-y-1">
                  <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-200"
                      style={{ width: `${(cedulaInput.length / 10) * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 text-center">
                    Solo números · {cedulaInput.length < 10 ? `Faltan ${10 - cedulaInput.length}` : 'Listo'}
                  </p>
                </div>
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

              {showPinField && (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider text-center">
                    PIN de seguridad ({PIN_LENGTH} dígitos)
                  </label>
                  <PinInput value={pinInput} onChange={setPinInput} autoFocus idPrefix="login-pin" onEnter={handleLogin} />
                  <button
                    type="button"
                    onClick={handleForgotPin}
                    className="w-full text-[11px] font-bold text-amber-300/90 hover:text-amber-200 cursor-pointer"
                  >
                    ¿Olvidó su PIN? Avisar al administrador
                  </button>
                </div>
              )}
            </>
          )}

          {forceCreatePin && (
            <div className="space-y-4 p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30">
              <p className="text-xs font-bold text-orange-200 text-center">Crear PIN de 5 dígitos</p>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 text-center">
                  Nuevo PIN
                </label>
                <PinInput value={newPin} onChange={setNewPin} autoFocus idPrefix="create-pin" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 text-center">
                  Confirmar PIN
                </label>
                <PinInput value={newPin2} onChange={setNewPin2} idPrefix="create-pin2" />
              </div>
              <button
                type="button"
                onClick={handleCreatePin}
                disabled={isLoading}
                className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase rounded-xl cursor-pointer"
              >
                Guardar PIN y entrar
              </button>
            </div>
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

          {!forceChange && !forceCreatePin && (
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>
                {showPasswordField ? 'Validar contraseña' : showPinField ? 'Validar PIN' : 'Ingresar'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {belowCard && (
        <div className="w-full max-w-lg mt-5 space-y-3">{belowCard}</div>
      )}

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
