import React, { useEffect, useState } from 'react';
import {
  CreditoPersona,
  CreditosConfig,
  DEFAULT_CREDITOS,
  getCreditosConfig,
  saveCreditosConfig,
} from '../lib/institucionalConfig';
import { Award, Pencil, Plus, Save, Trash2 } from 'lucide-react';

interface CreditosInstitucionalesProps {
  isDark?: boolean;
  /** Si true, muestra editor (solo admin). */
  canEdit?: boolean;
}

export const CreditosInstitucionales: React.FC<CreditosInstitucionalesProps> = ({
  isDark = true,
  canEdit = false,
}) => {
  const [cfg, setCfg] = useState<CreditosConfig>({
    ...DEFAULT_CREDITOS,
    equipo: [...DEFAULT_CREDITOS.equipo],
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    getCreditosConfig()
      .then(setCfg)
      .catch(() => setCfg({ ...DEFAULT_CREDITOS, equipo: [...DEFAULT_CREDITOS.equipo] }));
  }, []);

  const cardBg = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  const muted = isDark ? 'text-slate-400' : 'text-slate-600';
  const title = isDark ? 'text-white' : 'text-slate-900';
  const gold = 'text-amber-400';
  const cellBg = isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50';

  const updatePersona = (id: string, field: keyof CreditoPersona, value: string) => {
    setCfg((prev) => ({
      ...prev,
      equipo: prev.equipo.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    }));
  };

  const addPersona = () => {
    setCfg((prev) => ({
      ...prev,
      equipo: [
        ...prev.equipo,
        { id: `c${Date.now()}`, rol: 'Nuevo rol', nombre: 'Nombre completo' },
      ],
    }));
  };

  const removePersona = (id: string) => {
    setCfg((prev) => ({ ...prev, equipo: prev.equipo.filter((p) => p.id !== id) }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg('');
    setErr('');
    try {
      await saveCreditosConfig(cfg);
      setMsg('Créditos guardados. Ya se reflejan para el administrador.');
      setTimeout(() => setMsg(''), 3500);
    } catch {
      setErr('No se pudo guardar en Firebase. Revise permisos de config.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="w-full" aria-label="Créditos institucionales">
      <div className={`relative w-full rounded-3xl border px-4 py-5 sm:px-6 sm:py-6 shadow-xl overflow-hidden ${cardBg}`}>
        <img
          src="/EE.png"
          alt=""
          aria-hidden
          className="pointer-events-none select-none absolute -right-6 -bottom-8 w-40 sm:w-52 opacity-[0.12] object-contain"
        />

        <div className="relative flex items-center gap-2">
          <Award className={`w-5 h-5 ${gold}`} />
          <div>
            <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${gold}`}>
              Créditos institucionales
            </p>
            <h3 className={`text-sm md:text-base font-black uppercase tracking-wide ${title}`}>
              Equipo responsable del proyecto
            </h3>
          </div>
        </div>

        <p className={`relative mt-3 text-[11px] leading-relaxed ${muted}`}>
          La autoría, planificación y desarrollo de esta iniciativa corresponden al siguiente equipo
          técnico:
        </p>

        <div className="relative mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {cfg.equipo.map((c) => (
            <div key={c.id} className={`relative pl-3 py-3 pr-3 rounded-2xl border ${cellBg}`}>
              <span className="absolute left-0 top-2.5 bottom-2.5 w-0.5 rounded-full bg-amber-500/80" />
              {canEdit ? (
                <div className="space-y-2">
                  <input
                    value={c.rol}
                    onChange={(e) => updatePersona(c.id, 'rol', e.target.value)}
                    className="w-full px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-[10px] font-bold uppercase tracking-wider text-amber-400 outline-none"
                  />
                  <div className="flex gap-2">
                    <input
                      value={c.nombre}
                      onChange={(e) => updatePersona(c.id, 'nombre', e.target.value)}
                      className="flex-1 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-sm font-black text-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removePersona(c.id)}
                      className="p-2 rounded-lg border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 cursor-pointer"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${gold}`}>{c.rol}</p>
                  <p className={`mt-0.5 text-sm font-black tracking-wide ${title}`}>{c.nombre}</p>
                </>
              )}
            </div>
          ))}
        </div>

        {canEdit && (
          <div className="relative mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={addPersona}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Agregar persona
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Guardando…' : 'Guardar créditos'}
            </button>
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
              <Pencil className="w-3 h-3" /> Solo el administrador puede editar (Apariencia). Visible
              para todos al final de la app.
            </span>
          </div>
        )}

        {msg && <p className="relative mt-3 text-xs text-emerald-400 font-bold">{msg}</p>}
        {err && <p className="relative mt-3 text-xs text-rose-400 font-bold">{err}</p>}

        <div
          className={`relative mt-5 pt-3 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[10px] font-semibold uppercase tracking-wider ${
            isDark ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-500'
          }`}
        >
          <span>Centro de Investigación, Desarrollo e Innovación Militar</span>
          <span className="inline-flex items-center gap-2 text-rose-500 font-black tracking-wide">
            <img src="/EE.png" alt="" className="w-5 h-5 object-contain opacity-90" />
            Ejército Ecuatoriano
          </span>
        </div>
      </div>
    </section>
  );
};
