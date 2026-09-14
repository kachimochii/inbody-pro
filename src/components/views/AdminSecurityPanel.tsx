import React, { useEffect, useState } from 'react';
import {
  CredencialCuenta,
  SeguridadConfig,
  listCredencialesPrivilegiadas,
  changePassword,
  getSeguridadConfig,
  saveSeguridadConfig,
  ensureCredencial,
} from '../../lib/authCredentials';
import { UserAccount, UserRole } from '../../types/inbody';
import { Shield, Phone, KeyRound, RefreshCw, Save, Eye, EyeOff } from 'lucide-react';

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
  const [cfg, setCfg] = useState<SeguridadConfig>({
    telefonoContactoAdmin: '',
    mensajeRecuperacion: 'Si olvidó su contraseña, comuníquese con el administrador institucional.',
  });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [showPass, setShowPass] = useState<Record<string, boolean>>({});
  const [editPass, setEditPass] = useState<Record<string, string>>({});

  const reload = async () => {
    setLoading(true);
    setErr('');
    try {
      const uniqueStaff = Array.from(
        new Map(
          staffUsers
            .filter((x) => x && x.role && x.role !== 'usuario' && x.cedula)
            .map((u) => [u.cedula, u])
        ).values()
      );

      for (const u of uniqueStaff) {
        await ensureCredencial(u.cedula, u.role as UserRole, `${u.nombres} ${u.apellidos}`.trim());
      }

      // Asegura admin institucional
      await ensureCredencial('0703887042', 'admin', 'Admin Institucional');

      const [list, seguridad] = await Promise.all([
        listCredencialesPrivilegiadas(),
        getSeguridadConfig(),
      ]);
      setCreds(list);
      setCfg(seguridad);
    } catch (e) {
      console.error(e);
      setErr(
        'No se pudieron cargar credenciales. En Firebase → Firestore → Reglas, permita lectura/escritura en las colecciones `credenciales` y `config`.'
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
      await changePassword(cedula, pass, { mustChangePassword: false, role });
      setMsg(`Contraseña actualizada para ${cedula}`);
      setEditPass((p) => ({ ...p, [cedula]: '' }));
      await reload();
      setTimeout(() => setMsg(''), 3000);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error al actualizar contraseña');
    }
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
          Aquí puede ver/resetear claves y publicar un contacto de recuperación.
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
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono">
                          {showPass[c.cedula] ? c.passwordActual : '••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowPass((s) => ({ ...s, [c.cedula]: !s[c.cedula] }))}
                          className="text-slate-400 hover:text-white cursor-pointer"
                        >
                          {showPass[c.cedula] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
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
