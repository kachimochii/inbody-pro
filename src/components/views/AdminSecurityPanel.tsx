import React, { useEffect, useState } from 'react';
import {
  CredencialCuenta,
  SeguridadConfig,
  getSeguridadConfig,
  saveSeguridadConfig,
  listarCredencialesPrivilegiadas,
  listarSolicitudesResetPin,
  adminResetPasswordLocal,
  adminAutorizarPinLocal,
  adminRechazarPinLocal,
} from '../../lib/authCredentials';
import { PinResetSolicitud } from '../../lib/userPin';
import { UserAccount, UserRole } from '../../types/inbody';
import { auth } from '../../lib/firebase';
import { Shield, Phone, KeyRound, RefreshCw, Save, Check, X, Unlock } from 'lucide-react';

interface AdminSecurityPanelProps {
  staffUsers: UserAccount[];
}

const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrador',
  operador: 'Operador',
  entrenador: 'Entrenador',
  nutricionista: 'Nutricionista',
};

export const AdminSecurityPanel: React.FC<AdminSecurityPanelProps> = ({ staffUsers }) => {
  const [creds, setCreds] = useState<CredencialCuenta[]>([]);
  const [pinSolicitudes, setPinSolicitudes] = useState<PinResetSolicitud[]>([]);
  const [pinManualCedula, setPinManualCedula] = useState('');
  const [cfg, setCfg] = useState<SeguridadConfig>({
    telefonoContactoAdmin: '',
    mensajeRecuperacion: 'Si olvidó su contraseña, comuníquese con el administrador institucional.',
  });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [editPass, setEditPass] = useState<Record<string, string>>({});

  const reload = async () => {
    setLoading(true);
    setErr('');
    try {
      if (!auth.currentUser) {
        throw new Error('Sesión no activa. Cierre sesión e ingrese de nuevo como administrador.');
      }
      await auth.currentUser.getIdToken(true);

      const list = await listarCredencialesPrivilegiadas();
      const seguridad = await getSeguridadConfig();
      const pines = await listarSolicitudesResetPin();
      setCreds(list);
      setCfg(seguridad);
      setPinSolicitudes(pines);
    } catch (e) {
      console.error(e);
      const raw = e instanceof Error ? e.message : String(e);
      setErr(
        /permission|insufficient|Missing or insufficient/i.test(raw)
          ? 'Sin permiso para leer credenciales. Publique las reglas de Firestore (npm.cmd run firebase:deploy:rules) e inicie sesión otra vez.'
          : raw || 'No se pudieron cargar las credenciales.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveContact = async () => {
    try {
      await saveSeguridadConfig(cfg);
      setMsg('Teléfono / mensaje de recuperación guardados.');
      setTimeout(() => setMsg(''), 3000);
    } catch {
      setErr('No se pudo guardar la configuración de seguridad.');
    }
  };

  const handleResetPass = async (cedula: string, role: UserRole) => {
    const pass = (editPass[cedula] || '').trim();
    if (pass.length < 6) {
      setErr('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    try {
      await adminResetPasswordLocal(cedula, pass, role);
      setMsg(`Contraseña actualizada para ${cedula}`);
      setEditPass((p) => ({ ...p, [cedula]: '' }));
      await reload();
      setTimeout(() => setMsg(''), 3000);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error al actualizar contraseña');
    }
  };

  const handleAuthorizePin = async (cedula: string, nombres?: string) => {
    setErr('');
    try {
      await adminAutorizarPinLocal(cedula, nombres);
      setMsg(`PIN autorizado para ${cedula}. En el próximo ingreso deberá crear uno nuevo.`);
      await reload();
      setTimeout(() => setMsg(''), 4000);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'No se pudo autorizar el PIN.');
    }
  };

  const handleRejectPin = async (cedula: string) => {
    setErr('');
    try {
      await adminRechazarPinLocal(cedula);
      setMsg(`Solicitud de PIN rechazada para ${cedula}.`);
      await reload();
      setTimeout(() => setMsg(''), 3000);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'No se pudo rechazar la solicitud.');
    }
  };

  const handleAuthorizePinManual = async () => {
    const cedula = pinManualCedula.replace(/\D/g, '').padStart(10, '0').slice(-10);
    if (cedula.length !== 10) {
      setErr('Ingrese una cédula de 10 dígitos para autorizar el PIN.');
      return;
    }
    const staff = staffUsers.find((u) => u.cedula === cedula);
    await handleAuthorizePin(cedula, staff?.nombres);
    setPinManualCedula('');
  };

  const pinStatusLabel: Record<string, { text: string; cls: string }> = {
    pendiente: { text: 'Pendiente', cls: 'text-amber-400' },
    autorizado: { text: 'Autorizado · espera PIN nuevo', cls: 'text-cyan-400' },
    usado: { text: 'Ya creó PIN nuevo', cls: 'text-emerald-400' },
    rechazado: { text: 'Rechazado', cls: 'text-slate-500' },
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-rose-400" />
          <h2 className="text-xl font-black text-white">Seguridad & Contraseñas</h2>
        </div>
        <p className="text-xs text-slate-400">
          Roles privilegiados (admin, operador, entrenador, nutricionista). Primera vez la clave es la cédula y el sistema obliga a cambiarla.
          Las contraseñas ya no se muestran: solo hash. Aquí puede resetear claves y autorizar PIN.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1">
              <Phone className="w-3 h-3" /> Teléfono contacto administrador
            </label>
            <input
              type="text"
              value={cfg.telefonoContactoAdmin}
              onChange={(e) => setCfg({ ...cfg, telefonoContactoAdmin: e.target.value })}
              placeholder="Ej. 0999999999"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Mensaje de recuperación</label>
            <input
              type="text"
              value={cfg.mensajeRecuperacion}
              onChange={(e) => setCfg({ ...cfg, mensajeRecuperacion: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none"
            />
          </div>
          <button
            type="button"
            onClick={handleSaveContact}
            className="sm:col-span-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Guardar contacto de recuperación
          </button>
        </div>

        {msg && <p className="text-xs text-emerald-400 font-bold">{msg}</p>}
        {err && <p className="text-xs text-rose-400 font-bold">{err}</p>}

        <div className="p-4 rounded-2xl bg-slate-950 border border-orange-500/20 space-y-3">
          <div className="flex items-center gap-2">
            <Unlock className="w-4 h-4 text-orange-400" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Reseteo de PIN (evaluados)</h3>
          </div>
          <p className="text-[11px] text-slate-400">
            El evaluado pide ayuda desde el login. Usted autoriza y, en el siguiente ingreso, esa persona crea un PIN nuevo de 5 dígitos.
            También puede autorizar por cédula si le avisaron en persona.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              maxLength={10}
              value={pinManualCedula}
              onChange={(e) => setPinManualCedula(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="Cédula 10 dígitos"
              className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono outline-none w-44"
            />
            <button
              type="button"
              onClick={handleAuthorizePinManual}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-[11px] font-bold cursor-pointer"
            >
              <Unlock className="w-3.5 h-3.5" />
              Autorizar PIN nuevo
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Cédula</th>
                  <th className="p-3">Nombre</th>
                  <th className="p-3">Solicitado</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {pinSolicitudes.map((s) => {
                  const st = pinStatusLabel[s.status] || pinStatusLabel.pendiente;
                  return (
                    <tr key={s.cedula}>
                      <td className="p-3 font-mono">{s.cedula}</td>
                      <td className="p-3">{s.nombres || '—'}</td>
                      <td className="p-3 text-slate-400">
                        {s.requestedAt ? new Date(s.requestedAt).toLocaleString('es-EC') : '—'}
                      </td>
                      <td className={`p-3 font-bold ${st.cls}`}>{st.text}</td>
                      <td className="p-3 text-right">
                        {(s.status === 'pendiente' || s.status === 'rechazado') && (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleAuthorizePin(s.cedula, s.nombres)}
                              className="px-2 py-1 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold cursor-pointer inline-flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              Autorizar
                            </button>
                            {s.status === 'pendiente' && (
                              <button
                                type="button"
                                onClick={() => handleRejectPin(s.cedula)}
                                className="px-2 py-1 rounded-lg bg-rose-600/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold cursor-pointer inline-flex items-center gap-1"
                              >
                                <X className="w-3 h-3" />
                                Rechazar
                              </button>
                            )}
                          </div>
                        )}
                        {s.status === 'autorizado' && (
                          <span className="text-[10px] text-cyan-400">Esperando que cree el PIN</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {pinSolicitudes.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-500">
                      No hay solicitudes de reseteo de PIN.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-white uppercase tracking-wider">Cuentas privilegiadas</h3>
          <button
            type="button"
            onClick={reload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Actualizar
          </button>
        </div>

        {loading ? (
          <p className="text-xs text-slate-500">Cargando…</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Cédula</th>
                  <th className="p-3">Nombre</th>
                  <th className="p-3">Rol</th>
                  <th className="p-3">Contraseña</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 text-right">Resetear</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {creds.map((c) => (
                  <tr key={c.cedula}>
                    <td className="p-3 font-mono">{c.cedula}</td>
                    <td className="p-3">{c.nombres || '—'}</td>
                    <td className="p-3">{ROLE_LABEL[c.role] || c.role}</td>
                    <td className="p-3 text-slate-400 font-mono text-[11px]">
                      {c.hasPassword === false ? 'Sin clave' : 'Hash almacenado'}
                    </td>
                    <td className="p-3">
                      {c.mustChangePassword ? (
                        <span className="text-amber-400 font-bold">Debe cambiar</span>
                      ) : (
                        <span className="text-emerald-400">Activa</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <input
                          type="text"
                          value={editPass[c.cedula] || ''}
                          onChange={(e) => setEditPass((p) => ({ ...p, [c.cedula]: e.target.value }))}
                          placeholder="Nueva clave"
                          className="w-28 px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-[11px] text-white outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleResetPass(c.cedula, c.role)}
                          className="px-2 py-1 rounded-lg bg-blue-600/30 text-blue-300 border border-blue-500/30 text-[10px] font-bold cursor-pointer inline-flex items-center gap-1"
                        >
                          <KeyRound className="w-3 h-3" />
                          OK
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {creds.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500">
                      Aún no hay credenciales. Inicie sesión una vez con cada rol o pulse Actualizar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
