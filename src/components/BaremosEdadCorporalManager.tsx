import React, { useEffect, useState } from 'react';
import {
  BaremosConfig,
  DEFAULT_BAREMOS,
  DEFAULT_PENALIZACIONES,
  EdadCorporalPenalizaciones,
  normalizeBaremosConfig,
  setBaremosActivos,
} from '../utils/composicionCorporal';
import { getBaremosConfig, saveBaremosConfig } from '../lib/firestoreService';
import { Activity, Plus, RotateCcw, Save, Trash2 } from 'lucide-react';

type SexoKey = 'HOMBRE' | 'MUJER';

function clone(cfg: BaremosConfig): BaremosConfig {
  return JSON.parse(JSON.stringify(cfg)) as BaremosConfig;
}

export const BaremosEdadCorporalManager: React.FC = () => {
  const [draft, setDraft] = useState<BaremosConfig>(clone(DEFAULT_BAREMOS));
  const [sexoTab, setSexoTab] = useState<SexoKey>('HOMBRE');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const load = async () => {
    setLoading(true);
    setErr('');
    try {
      const cfg = await getBaremosConfig();
      setDraft(clone(cfg));
      setBaremosActivos(cfg);
    } catch (e) {
      console.error(e);
      setErr('No se pudieron cargar los baremos desde Firebase. Se muestran los valores por defecto.');
      setDraft(clone(DEFAULT_BAREMOS));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateGrasa = (
    index: number,
    field: 'edadMin' | 'edadMax' | 'bajo' | 'alto',
    value: string
  ) => {
    const n = Number(value);
    setDraft((prev) => {
      const next = clone(prev);
      const band = next[sexoTab].GRASA[index];
      if (!band) return prev;
      band[field] = Number.isFinite(n) ? n : 0;
      return next;
    });
  };

  const updateMusculo = (
    index: number,
    field: 'edadMin' | 'edadMax' | 'insuficiente' | 'excelente',
    value: string
  ) => {
    const n = Number(value);
    setDraft((prev) => {
      const next = clone(prev);
      const band = next[sexoTab].MUSCULO_PCT[index];
      if (!band) return prev;
      band[field] = Number.isFinite(n) ? n : 0;
      return next;
    });
  };

  const addGrasaBand = () => {
    setDraft((prev) => {
      const next = clone(prev);
      const last = next[sexoTab].GRASA[next[sexoTab].GRASA.length - 1];
      next[sexoTab].GRASA.push({
        edadMin: last ? last.edadMax + 1 : 18,
        edadMax: 99,
        bajo: last?.bajo ?? 10,
        alto: last?.alto ?? 20,
      });
      return next;
    });
  };

  const removeGrasaBand = (index: number) => {
    setDraft((prev) => {
      const next = clone(prev);
      if (next[sexoTab].GRASA.length <= 1) return prev;
      next[sexoTab].GRASA.splice(index, 1);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg('');
    setErr('');
    try {
      const normalized = normalizeBaremosConfig(draft);
      await saveBaremosConfig(normalized);
      setDraft(clone(normalized));
      setBaremosActivos(normalized);
      setMsg('Baremos guardados. Ya aplican a la edad corporal y al semáforo muscular/grasa.');
    } catch (e) {
      console.error(e);
      setErr('No se pudo guardar en Firebase. Revise las reglas de la colección config.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('¿Restaurar baremos institucionales por defecto?')) return;
    setSaving(true);
    setMsg('');
    setErr('');
    try {
      const defaults = clone(DEFAULT_BAREMOS);
      await saveBaremosConfig(defaults);
      setDraft(defaults);
      setBaremosActivos(defaults);
      setMsg('Baremos restaurados a los valores por defecto.');
    } catch (e) {
      console.error(e);
      setErr('No se pudo restaurar en Firebase.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full px-2.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white font-mono outline-none focus:border-amber-500/60';

  return (
    <div className="space-y-5">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Baremos de edad corporal
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Regula umbrales de % grasa y % músculo por sexo/edad, y las <strong className="text-amber-300/90">penalizaciones en años</strong> de la edad corporal (piernas, brazos, tronco/dorso y músculo global = sarcopenia segmental).
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleReset}
              disabled={saving || loading}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-700 text-slate-300 hover:text-white text-xs font-bold cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restaurar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold cursor-pointer disabled:opacity-50 shadow-md shadow-amber-600/20"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Guardando…' : 'Guardar baremos'}
            </button>
          </div>
        </div>

        {msg && (
          <p className="mt-4 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
            {msg}
          </p>
        )}
        {err && (
          <p className="mt-4 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
            {err}
          </p>
        )}

        <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-[11px] text-slate-300 leading-relaxed space-y-1.5">
          <p className="font-black uppercase tracking-wider text-amber-300 text-[10px]">
            Cómo se calcula la edad corporal
          </p>
          <p>
            <span className="text-white font-bold">Edad corporal ≈ edad cronológica</span> + ajustes:
            grasa alta suma años · grasa baja resta · visceral alto suma · músculo global bajo suma /
            alto resta · si piernas/brazos/tronco están bajo el umbral % segmental, suman los años
            configurados abajo (alerta de sarcopenia).
          </p>
          <p className="text-slate-400">
            Ejemplo: umbral piernas 90% y +1.5 años → si piernas están al 85%, la edad corporal sube
            1.5 años por ese factor.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-slate-500 text-sm py-10">Cargando baremos…</div>
      ) : (
        <>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">
              Penalizaciones segmental / sarcopenia (años)
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(
                [
                  ['piernasUmbral', 'Umbral % piernas'],
                  ['piernasAnios', 'Años si piernas bajas'],
                  ['brazosUmbral', 'Umbral % brazos'],
                  ['brazosAnios', 'Años si brazos bajos'],
                  ['troncoUmbral', 'Umbral % tronco/dorso'],
                  ['troncoAnios', 'Años si tronco bajo'],
                  ['musculoBajoAnios', 'Años si músculo global bajo'],
                  ['musculoAltoAnios', 'Años si músculo global alto'],
                ] as Array<[keyof EdadCorporalPenalizaciones, string]>
              ).map(([key, label]) => (
                <div key={key}>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    {label}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={(draft.penalizaciones || DEFAULT_PENALIZACIONES)[key]}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      setDraft((prev) => {
                        const next = clone(prev);
                        next.penalizaciones = {
                          ...DEFAULT_PENALIZACIONES,
                          ...(next.penalizaciones || {}),
                          [key]: Number.isFinite(n) ? n : 0,
                        };
                        return next;
                      });
                    }}
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-slate-950 border border-slate-800 w-fit">
            {(['HOMBRE', 'MUJER'] as SexoKey[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSexoTab(s)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all ${
                  sexoTab === s
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {s === 'HOMBRE' ? 'Hombre' : 'Mujer'}
              </button>
            ))}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 overflow-x-auto">
            <div className="flex items-center justify-between gap-3 mb-2">
              <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider">
                % Grasa corporal (PBF)
              </h4>
              <button
                type="button"
                onClick={addGrasaBand}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-400 hover:text-amber-300 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar rango
              </button>
            </div>
            <p className="text-[10px] text-amber-200/80 mb-4 leading-relaxed rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2">
              <span className="font-black uppercase tracking-wider text-amber-300">Años de penalización (PBF): </span>
              grasa alta ≈ +1.5 años por cada 2 puntos sobre el umbral Alto · grasa baja = −2 años.
              Los umbrales de esta tabla definen BAJO / ESTÁNDAR / ALTO (mismo espíritu que
              “Penalizaciones segmental / sarcopenia”).
            </p>
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                  <th className="py-2 pr-2 font-bold">Edad min</th>
                  <th className="py-2 pr-2 font-bold">Edad max</th>
                  <th className="py-2 pr-2 font-bold">Bajo (&lt;)</th>
                  <th className="py-2 pr-2 font-bold">Alto (&gt;)</th>
                  <th className="py-2 font-bold w-12" />
                </tr>
              </thead>
              <tbody>
                {draft[sexoTab].GRASA.map((band, i) => (
                  <tr key={`g-${i}`} className="border-b border-slate-800/70">
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        className={inputClass}
                        value={band.edadMin}
                        onChange={(e) => updateGrasa(i, 'edadMin', e.target.value)}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        className={inputClass}
                        value={band.edadMax}
                        onChange={(e) => updateGrasa(i, 'edadMax', e.target.value)}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        step="0.1"
                        className={inputClass}
                        value={band.bajo}
                        onChange={(e) => updateGrasa(i, 'bajo', e.target.value)}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        step="0.1"
                        className={inputClass}
                        value={band.alto}
                        onChange={(e) => updateGrasa(i, 'alto', e.target.value)}
                      />
                    </td>
                    <td className="py-2">
                      <button
                        type="button"
                        onClick={() => removeGrasaBand(i)}
                        disabled={draft[sexoTab].GRASA.length <= 1}
                        className="p-2 rounded-lg text-slate-500 hover:text-rose-400 disabled:opacity-30 cursor-pointer"
                        title="Eliminar rango"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[10px] text-slate-500 mt-3">
              Dentro de Bajo–Alto = estándar. Por debajo de Bajo o por encima de Alto afecta la edad
              corporal.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 overflow-x-auto">
            <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider mb-2">
              % Músculo esquelético (SMM / peso)
            </h4>
            <p className="text-[10px] text-amber-200/80 mb-4 leading-relaxed rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2">
              <span className="font-black uppercase tracking-wider text-amber-300">Años de penalización (SMM): </span>
              músculo global bajo = +{(draft.penalizaciones || DEFAULT_PENALIZACIONES).musculoBajoAnios} años ·
              músculo global alto = {(draft.penalizaciones || DEFAULT_PENALIZACIONES).musculoAltoAnios} años
              (editables en “Penalizaciones segmental / sarcopenia” arriba). Umbrales de esta tabla definen
              INSUFICIENTE / ESTÁNDAR / EXCELENTE.
            </p>
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                  <th className="py-2 pr-2 font-bold">Edad min</th>
                  <th className="py-2 pr-2 font-bold">Edad max</th>
                  <th className="py-2 pr-2 font-bold">Insuficiente (&lt;)</th>
                  <th className="py-2 pr-2 font-bold">Excelente (&gt;)</th>
                </tr>
              </thead>
              <tbody>
                {draft[sexoTab].MUSCULO_PCT.map((band, i) => (
                  <tr key={`m-${i}`} className="border-b border-slate-800/70">
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        className={inputClass}
                        value={band.edadMin}
                        onChange={(e) => updateMusculo(i, 'edadMin', e.target.value)}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        className={inputClass}
                        value={band.edadMax}
                        onChange={(e) => updateMusculo(i, 'edadMax', e.target.value)}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        step="0.1"
                        className={inputClass}
                        value={band.insuficiente}
                        onChange={(e) => updateMusculo(i, 'insuficiente', e.target.value)}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        step="0.1"
                        className={inputClass}
                        value={band.excelente}
                        onChange={(e) => updateMusculo(i, 'excelente', e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[10px] text-slate-500 mt-3">
              Por debajo de insuficiente = músculo bajo (semáforo ámbar). Por encima de excelente =
              nivel alto / excelente.
            </p>
          </div>
        </>
      )}
    </div>
  );
};
