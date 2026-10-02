import React, { useEffect, useMemo, useState } from 'react';
import {
  BaremosConfig,
  BaremoGrasaBand,
  BaremoMusculoBand,
  DEFAULT_BAREMOS,
  DEFAULT_PENALIZACIONES,
  EdadCorporalPenalizaciones,
  calcularAnalisisCorporal,
  normalizeBaremosConfig,
  setBaremosActivos,
} from '../utils/composicionCorporal';
import { getBaremosConfig, saveBaremosConfig } from '../lib/firestoreService';
import { Activity, Plus, RotateCcw, Save, Trash2 } from 'lucide-react';

type SexoKey = 'HOMBRE' | 'MUJER';
type PenKey = keyof EdadCorporalPenalizaciones;

function clone(cfg: BaremosConfig): BaremosConfig {
  return JSON.parse(JSON.stringify(cfg)) as BaremosConfig;
}

function fmtNum(n: number): string {
  const r = Math.round(n * 100) / 100;
  return String(r);
}

function fmtAnios(n: number): string {
  const r = Math.round(n * 100) / 100;
  if (r > 0) return `+${r}`;
  return String(r);
}

const inputClass =
  'w-full px-2.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white font-mono outline-none focus:border-amber-500/60';

const miniClass =
  'w-[4.5rem] px-2 py-1.5 rounded-lg bg-slate-950 border border-amber-500/40 text-sm text-white font-mono text-center outline-none focus:border-amber-400';

function Section({
  n,
  title,
  hint,
  children,
}: {
  n: string;
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
      <div>
        <h4 className="text-xs font-black text-white uppercase tracking-wider">
          <span className="text-amber-400 mr-2">{n}</span>
          {title}
        </h4>
        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed max-w-3xl">{hint}</p>
      </div>
      {children}
    </section>
  );
}

function Rule({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-2 rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-3 text-[13px] text-slate-200 leading-relaxed">
      {children}
    </div>
  );
}

function Num({
  value,
  onChange,
  step = 0.5,
  title,
}: {
  value: number;
  onChange: (v: string) => void;
  step?: number;
  title?: string;
}) {
  return (
    <input
      type="number"
      step={step}
      title={title}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={miniClass}
    />
  );
}

export const BaremosEdadCorporalManager: React.FC = () => {
  const [draft, setDraft] = useState<BaremosConfig>(clone(DEFAULT_BAREMOS));
  const [sexoTab, setSexoTab] = useState<SexoKey>('HOMBRE');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const [ejEdad, setEjEdad] = useState(33);
  const [ejSexo, setEjSexo] = useState<'M' | 'F'>('M');
  const [ejGrasa, setEjGrasa] = useState(29.4);
  const [ejMusculo, setEjMusculo] = useState(39.3);
  const [ejVisceral, setEjVisceral] = useState(7);
  const [ejPuntaje, setEjPuntaje] = useState(67);
  const [ejPiernas, setEjPiernas] = useState(100);
  const [ejBrazos, setEjBrazos] = useState(100);
  const [ejTronco, setEjTronco] = useState(100);

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

  const pen: EdadCorporalPenalizaciones = {
    ...DEFAULT_PENALIZACIONES,
    ...(draft.penalizaciones || {}),
  };

  const setPen = (key: PenKey, value: string) => {
    const n = Number(value);
    setDraft((prev) => {
      const next = clone(prev);
      next.penalizaciones = {
        ...DEFAULT_PENALIZACIONES,
        ...(next.penalizaciones || {}),
        [key]: Number.isFinite(n) ? n : 0,
      };
      return next;
    });
  };

  const updateGrasa = (index: number, field: keyof BaremoGrasaBand, value: string) => {
    const n = Number(value);
    setDraft((prev) => {
      const next = clone(prev);
      const band = next[sexoTab].GRASA[index];
      if (!band) return prev;
      band[field] = Number.isFinite(n) ? n : 0;
      return next;
    });
  };

  const updateMusculo = (index: number, field: keyof BaremoMusculoBand, value: string) => {
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

  const addMusculoBand = () => {
    setDraft((prev) => {
      const next = clone(prev);
      const last = next[sexoTab].MUSCULO_PCT[next[sexoTab].MUSCULO_PCT.length - 1];
      next[sexoTab].MUSCULO_PCT.push({
        edadMin: last ? last.edadMax + 1 : 18,
        edadMax: 99,
        insuficiente: last?.insuficiente ?? 39,
        excelente: last?.excelente ?? 48,
      });
      return next;
    });
  };

  const removeMusculoBand = (index: number) => {
    setDraft((prev) => {
      const next = clone(prev);
      if (next[sexoTab].MUSCULO_PCT.length <= 1) return prev;
      next[sexoTab].MUSCULO_PCT.splice(index, 1);
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
      setMsg('Baremos guardados. Ya aplican a la edad corporal de todas las personas.');
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

  const ejemplo = useMemo(
    () =>
      calcularAnalisisCorporal(
        {
          edad: ejEdad,
          sexo: ejSexo,
          pctGrasa: ejGrasa,
          pctSMM: ejMusculo,
          grasaVisceral: ejVisceral,
          puntajeSalud: ejPuntaje,
          pctMusculoPiernas: ejPiernas,
          pctMusculoBrazos: ejBrazos,
          pctMusculoTronco: ejTronco,
        },
        draft
      ),
    [draft, ejEdad, ejSexo, ejGrasa, ejMusculo, ejVisceral, ejPuntaje, ejPiernas, ejBrazos, ejTronco]
  );

  const diff = ejemplo.edadCorporal - Math.round(Number(ejEdad) || 0);
  const terminos = [
    Number.isFinite(ejEdad) ? ejEdad : 0,
    ejemplo.deltas.grasa,
    ejemplo.deltas.visceral,
    ejemplo.deltas.seglarPiernas,
    ejemplo.deltas.seglarBrazos,
    ejemplo.deltas.seglarTronco,
    ejemplo.deltas.musculo,
    ejemplo.deltas.salud,
  ];
  const suma = terminos.reduce((acc, n) => acc + n, 0);
  const ecuacion = terminos
    .map((n, i) => {
      const v = fmtNum(Math.abs(n));
      if (i === 0) return fmtNum(n);
      return n < 0 ? ` − ${v}` : ` + ${v}`;
    })
    .join('');

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
                Edad corporal = edad real + grasa + visceral + piernas + brazos + tronco + músculo.
                El puntaje de salud se aplica al final. Un año positivo envejece; un año negativo
                rejuvenece. Grasa, músculo y zonas se miden en <strong className="text-slate-200">%</strong>.
                La visceral es un nivel del informe (1 a 30), no un %.
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
      </div>

      {loading ? (
        <div className="text-center text-slate-500 text-sm py-10">Cargando baremos…</div>
      ) : (
        <>
          <section className="bg-slate-900 border border-amber-500/30 rounded-3xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider">
                  Comprueba con un ejemplo
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed max-w-2xl">
                  Trae el caso de 33 años y 29.4% de grasa. Cambia las reglas de abajo y este
                  resultado se mueve al instante, antes de guardar.
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black font-mono text-white">{ejemplo.edadCorporal}</div>
                <div className="text-[11px] font-bold text-amber-300">
                  {diff > 0 ? `${fmtAnios(diff)} años` : diff < 0 ? `${diff} años` : 'igual a la edad real'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(
                [
                  ['Edad real', ejEdad, setEjEdad, 1],
                  ['% grasa', ejGrasa, setEjGrasa, 0.1],
                  ['% músculo', ejMusculo, setEjMusculo, 0.1],
                  ['Visceral (nivel)', ejVisceral, setEjVisceral, 1],
                  ['Puntaje', ejPuntaje, setEjPuntaje, 1],
                  ['% piernas', ejPiernas, setEjPiernas, 1],
                  ['% brazos', ejBrazos, setEjBrazos, 1],
                  ['% tronco', ejTronco, setEjTronco, 1],
                ] as Array<[string, number, (n: number) => void, number]>
              ).map(([label, value, set, step]) => (
                <label key={label} className="block">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">{label}</span>
                  <input
                    type="number"
                    step={step}
                    value={value}
                    onChange={(e) => set(Number(e.target.value))}
                    className={inputClass}
                  />
                </label>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {(['M', 'F'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setEjSexo(s)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase cursor-pointer ${
                    ejSexo === s ? 'bg-amber-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'
                  }`}
                >
                  {s === 'M' ? 'Hombre' : 'Mujer'}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
              {(
                [
                  ['Grasa', ejemplo.deltas.grasa],
                  ['Visceral', ejemplo.deltas.visceral],
                  ['Piernas', ejemplo.deltas.seglarPiernas],
                  ['Brazos', ejemplo.deltas.seglarBrazos],
                  ['Tronco', ejemplo.deltas.seglarTronco],
                  ['Músculo', ejemplo.deltas.musculo],
                  ['Puntaje', ejemplo.deltas.salud],
                ] as Array<[string, number]>
              ).map(([label, value]) => (
                <div key={label} className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2">
                  <div className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">{label}</div>
                  <div className={`font-mono font-black whitespace-nowrap ${value > 0 ? 'text-rose-300' : value < 0 ? 'text-emerald-300' : 'text-slate-300'}`}>
                    {fmtAnios(value)} años
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[12px] text-slate-300 font-mono leading-relaxed">
              {ecuacion} = {fmtNum(suma)}, se redondea a {ejemplo.edadCorporal}.
            </p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Grasa de este ejemplo: entre {ejemplo.baremoGrasa.bajo}% y{' '}
              {ejemplo.baremoGrasa.alto}% es normal. Músculo: bajo {ejemplo.baremoMusculo.insuficiente}% es
              insuficiente y sobre {ejemplo.baremoMusculo.excelente}% es excelente.
              {ejemplo.deltas.salud === 0 && ejPuntaje < pen.saludBajaDesde
                ? ' El puntaje es bajo, pero la suma ya pasaba el mínimo, así que no agregó años.'
                : ''}
              {(ejSexo === 'M' && sexoTab === 'MUJER') || (ejSexo === 'F' && sexoTab === 'HOMBRE')
                ? ` El ejemplo es ${ejSexo === 'M' ? 'hombre' : 'mujer'} y las tablas abiertas son de ${
                    sexoTab === 'HOMBRE' ? 'hombre' : 'mujer'
                  }.`
                : ''}
            </p>
          </section>

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
                Tablas de {s === 'HOMBRE' ? 'hombre' : 'mujer'}
              </button>
            ))}
          </div>

          <Section
            n="1"
            title="Grasa corporal (%)"
            hint="Es el porcentaje de grasa del informe. La fila que se usa depende de la edad real y del sexo. Entre Bajo y Alto no suma ni resta."
          >
            <Rule>
              <span>Si el % pasa el Alto, cada</span>
              <Num value={pen.grasaAltaCadaPct} step={0.5} onChange={(v) => setPen('grasaAltaCadaPct', v)} title="Cada cuántos puntos de %" />
              <span>% de más suma</span>
              <Num value={pen.grasaAltaAnios} step={0.5} onChange={(v) => setPen('grasaAltaAnios', v)} title="Años por ese bloque" />
              <span>años.</span>
            </Rule>
            <Rule>
              <span>Si el % queda por debajo del Bajo, suma</span>
              <Num value={pen.grasaBajaAnios} step={0.5} onChange={(v) => setPen('grasaBajaAnios', v)} title="Años si la grasa está baja. Negativo resta." />
              <span>años de una sola vez. Con −2 resta dos años.</span>
            </Rule>

            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Límites por edad · {sexoTab === 'HOMBRE' ? 'hombre' : 'mujer'}
              </p>
              <button
                type="button"
                onClick={addGrasaBand}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-400 hover:text-amber-300 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar rango de edad
              </button>
            </div>
            <div className="md:hidden space-y-3">
              {draft[sexoTab].GRASA.map((band, i) => (
                <div key={`g-m-${i}`} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        ['edadMin', 'Edad desde', 1],
                        ['edadMax', 'Edad hasta', 1],
                        ['bajo', 'Bajo: % menor que', 0.1],
                        ['alto', 'Alto: % mayor que', 0.1],
                      ] as Array<[keyof BaremoGrasaBand, string, number]>
                    ).map(([field, label, step]) => (
                      <label key={field} className="block">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">{label}</span>
                        <input
                          type="number"
                          step={step}
                          className={inputClass}
                          value={band[field]}
                          onChange={(e) => updateGrasa(i, field, e.target.value)}
                        />
                      </label>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeGrasaBand(i)}
                    disabled={draft[sexoTab].GRASA.length <= 1}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-rose-400 disabled:opacity-30 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Quitar este rango
                  </button>
                </div>
              ))}
            </div>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[640px] text-left">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                    <th className="py-2 pr-2 font-bold">Edad desde</th>
                    <th className="py-2 pr-2 font-bold">Edad hasta</th>
                    <th className="py-2 pr-2 font-bold">Bajo: % menor que</th>
                    <th className="py-2 pr-2 font-bold">Alto: % mayor que</th>
                    <th className="py-2 font-bold w-12" />
                  </tr>
                </thead>
                <tbody>
                  {draft[sexoTab].GRASA.map((band, i) => (
                    <tr key={`g-${i}`} className="border-b border-slate-800/70">
                      {(['edadMin', 'edadMax', 'bajo', 'alto'] as Array<keyof BaremoGrasaBand>).map((field) => (
                        <td key={field} className="py-2 pr-2">
                          <input
                            type="number"
                            step={field === 'bajo' || field === 'alto' ? 0.1 : 1}
                            className={inputClass}
                            value={band[field]}
                            onChange={(e) => updateGrasa(i, field, e.target.value)}
                          />
                        </td>
                      ))}
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
            </div>
          </Section>

          <Section
            n="2"
            title="Músculo de todo el cuerpo (%)"
            hint="Kilos de músculo ÷ kilos de peso × 100. Ejemplo: 29.1 kg ÷ 74 kg = 39.3%. Entre Insuficiente y Excelente no suma ni resta."
          >
            <Rule>
              <span>Si el % queda bajo Insuficiente, suma</span>
              <Num value={pen.musculoBajoAnios} onChange={(v) => setPen('musculoBajoAnios', v)} />
              <span>años.</span>
            </Rule>
            <Rule>
              <span>Si el % pasa Excelente, suma</span>
              <Num value={pen.musculoAltoAnios} onChange={(v) => setPen('musculoAltoAnios', v)} />
              <span>años. Con −3 resta tres años.</span>
            </Rule>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Límites por edad · {sexoTab === 'HOMBRE' ? 'hombre' : 'mujer'}
              </p>
              <button
                type="button"
                onClick={addMusculoBand}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-400 hover:text-amber-300 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar rango de edad
              </button>
            </div>
            <div className="md:hidden space-y-3">
              {draft[sexoTab].MUSCULO_PCT.map((band, i) => (
                <div key={`m-m-${i}`} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        ['edadMin', 'Edad desde', 1],
                        ['edadMax', 'Edad hasta', 1],
                        ['insuficiente', 'Insuficiente: % menor que', 0.1],
                        ['excelente', 'Excelente: % mayor que', 0.1],
                      ] as Array<[keyof BaremoMusculoBand, string, number]>
                    ).map(([field, label, step]) => (
                      <label key={field} className="block">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">{label}</span>
                        <input
                          type="number"
                          step={step}
                          className={inputClass}
                          value={band[field]}
                          onChange={(e) => updateMusculo(i, field, e.target.value)}
                        />
                      </label>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMusculoBand(i)}
                    disabled={draft[sexoTab].MUSCULO_PCT.length <= 1}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-rose-400 disabled:opacity-30 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Quitar este rango
                  </button>
                </div>
              ))}
            </div>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[640px] text-left">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                    <th className="py-2 pr-2 font-bold">Edad desde</th>
                    <th className="py-2 pr-2 font-bold">Edad hasta</th>
                    <th className="py-2 pr-2 font-bold">Insuficiente: % menor que</th>
                    <th className="py-2 pr-2 font-bold">Excelente: % mayor que</th>
                    <th className="py-2 font-bold w-12" />
                  </tr>
                </thead>
                <tbody>
                  {draft[sexoTab].MUSCULO_PCT.map((band, i) => (
                    <tr key={`m-${i}`} className="border-b border-slate-800/70">
                      {(['edadMin', 'edadMax', 'insuficiente', 'excelente'] as Array<keyof BaremoMusculoBand>).map(
                        (field) => (
                          <td key={field} className="py-2 pr-2">
                            <input
                              type="number"
                              step={field === 'insuficiente' || field === 'excelente' ? 0.1 : 1}
                              className={inputClass}
                              value={band[field]}
                              onChange={(e) => updateMusculo(i, field, e.target.value)}
                            />
                          </td>
                        )
                      )}
                      <td className="py-2">
                        <button
                          type="button"
                          onClick={() => removeMusculoBand(i)}
                          disabled={draft[sexoTab].MUSCULO_PCT.length <= 1}
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
            </div>
          </Section>

          <Section
            n="3"
            title="Músculo por zona"
            hint="Porcentaje muscular de piernas, brazos y tronco. Si la zona está por debajo del límite, suma esos años completos una sola vez. No es por cada punto."
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(
                [
                  ['Piernas', 'piernasUmbral', 'piernasAnios'],
                  ['Brazos', 'brazosUmbral', 'brazosAnios'],
                  ['Tronco / dorso', 'troncoUmbral', 'troncoAnios'],
                ] as Array<[string, PenKey, PenKey]>
              ).map(([label, umbral, anios]) => (
                <div key={label} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 space-y-2">
                  <div className="text-[11px] font-black uppercase tracking-wider text-white">{label}</div>
                  <Rule>
                    <span>Si está bajo</span>
                    <Num value={pen[umbral]} step={1} onChange={(v) => setPen(umbral, v)} />
                    <span>% suma</span>
                    <Num value={pen[anios]} onChange={(v) => setPen(anios, v)} />
                    <span>años.</span>
                  </Rule>
                </div>
              ))}
            </div>
          </Section>

          <Section
            n="4"
            title="Grasa visceral (nivel, no %)"
            hint="Es el nivel que sale en el informe, de 1 a 30. No es un porcentaje. Manda el nivel más alto que la persona alcance."
          >
            <Rule>
              <span>Desde el nivel</span>
              <Num value={pen.visceralMedioDesde} step={1} onChange={(v) => setPen('visceralMedioDesde', v)} />
              <span>suma</span>
              <Num value={pen.visceralMedioAnios} onChange={(v) => setPen('visceralMedioAnios', v)} />
              <span>años.</span>
            </Rule>
            <Rule>
              <span>Desde el nivel</span>
              <Num value={pen.visceralAltoDesde} step={1} onChange={(v) => setPen('visceralAltoDesde', v)} />
              <span>suma</span>
              <Num value={pen.visceralAltoAnios} onChange={(v) => setPen('visceralAltoAnios', v)} />
              <span>años.</span>
            </Rule>
          </Section>

          <Section
            n="5"
            title="Puntaje de salud"
            hint="Se mira al final, después de sumar grasa, visceral y músculo. Si el puntaje cae en las dos reglas, manda la del puntaje bajo."
          >
            <Rule>
              <span>Si el puntaje es menor de</span>
              <Num value={pen.saludBajaDesde} step={1} onChange={(v) => setPen('saludBajaDesde', v)} />
              <span>, la edad corporal queda como mínimo en la edad real más</span>
              <Num value={pen.saludBajaAnios} onChange={(v) => setPen('saludBajaAnios', v)} />
              <span>años.</span>
            </Rule>
            <Rule>
              <span>Si el puntaje es de</span>
              <Num value={pen.saludAltaDesde} step={1} onChange={(v) => setPen('saludAltaDesde', v)} />
              <span>o más, queda como máximo en la edad real más</span>
              <Num value={pen.saludAltaAnios} onChange={(v) => setPen('saludAltaAnios', v)} />
              <span>años. Con −2 no puede quedar más vieja que edad real − 2.</span>
            </Rule>
          </Section>
        </>
      )}
    </div>
  );
};
