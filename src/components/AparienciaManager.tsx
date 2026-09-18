import React, { useEffect, useState } from 'react';
import {
  AparienciaConfig,
  CreditosConfig,
  DEFAULT_APARIENCIA,
  DEFAULT_CREDITOS,
  getAparienciaConfig,
  getCreditosConfig,
  saveAparienciaConfig,
  saveCreditosConfig,
  uploadFondoInstitucional,
} from '../lib/institucionalConfig';
import { Image as ImageIcon, Monitor, Save, Smartphone, Trash2, Upload } from 'lucide-react';
import { CreditosInstitucionales } from './CreditosInstitucionales';

interface AparienciaManagerProps {
  onAparienciaSaved?: (cfg: AparienciaConfig) => void;
}

export const AparienciaManager: React.FC<AparienciaManagerProps> = ({ onAparienciaSaved }) => {
  const [apariencia, setApariencia] = useState<AparienciaConfig>({ ...DEFAULT_APARIENCIA });
  const [creditos, setCreditos] = useState<CreditosConfig>({
    ...DEFAULT_CREDITOS,
    equipo: [...DEFAULT_CREDITOS.equipo],
  });
  const [urlDraft, setUrlDraft] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewBroken, setPreviewBroken] = useState(false);

  useEffect(() => {
    Promise.all([getAparienciaConfig(), getCreditosConfig()])
      .then(([a, c]) => {
        setApariencia(a);
        setUrlDraft(a.fondoUrl);
        setCreditos(c);
      })
      .catch(console.error);
  }, []);

  const previewUrl = urlDraft.trim() || apariencia.fondoUrl;

  useEffect(() => {
    setPreviewBroken(false);
  }, [previewUrl]);

  const persistApariencia = async (fondoUrl: string, opacidad: number) => {
    const next: AparienciaConfig = {
      fondoUrl,
      opacidad,
      updatedAt: new Date().toISOString(),
    };
    await saveAparienciaConfig(next);
    await saveCreditosConfig(creditos);
    setApariencia(next);
    setUrlDraft(fondoUrl);
    onAparienciaSaved?.(next);
    window.dispatchEvent(new CustomEvent('inbody-apariencia', { detail: next }));
    return next;
  };

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setErr('');
    setMsg('');
    setUploading(true);
    try {
      const url = await uploadFondoInstitucional(file);
      const opacidad = Math.max(apariencia.opacidad, 0.34);
      setUrlDraft(url);
      setApariencia((p) => ({ ...p, opacidad }));
      await persistApariencia(url, opacidad);
      setMsg('Fondo subido y guardado. Carpeta Storage: inbody/fondos/. Ya lo ven todos los usuarios.');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'No se pudo subir la imagen.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setErr('');
    setMsg('');
    try {
      await persistApariencia(urlDraft.trim(), apariencia.opacidad);
      setMsg('Apariencia e impacto guardados en Firebase para todos los usuarios.');
    } catch {
      setErr('No se pudo guardar. Revise reglas de config y Storage.');
    } finally {
      setSaving(false);
    }
  };

  const clearFondo = async () => {
    setUrlDraft('');
    setErr('');
    setMsg('');
    try {
      await persistApariencia('', apariencia.opacidad);
      setMsg('Fondo quitado para todos los usuarios.');
    } catch {
      setErr('No se pudo quitar el fondo en Firebase.');
    }
  };

  const overlayOpacity = 1 - apariencia.opacidad;

  const PreviewShell: React.FC<{ className: string; children?: React.ReactNode }> = ({
    className,
    children,
  }) => (
    <div className={`relative overflow-hidden border border-slate-700 bg-slate-950 ${className}`}>
      {previewUrl && !previewBroken ? (
        <>
          <img
            src={previewUrl}
            alt="Preview fondo"
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={() => setPreviewBroken(true)}
          />
          <div className="absolute inset-0 bg-slate-950" style={{ opacity: overlayOpacity }} />
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center px-3">
          <p className="text-[10px] text-slate-500 text-center leading-snug">
            {previewBroken
              ? 'La URL no carga. Suba de nuevo o pegue otra URL.'
              : uploading
                ? 'Subiendo…'
                : 'Sin fondo aún'}
          </p>
        </div>
      )}
      {children}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center shrink-0">
            <ImageIcon className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Apariencia institucional
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Fondo para login y paneles. Máx. 2 MB. Al cargar desde galería se guarda solo en{' '}
              <strong className="text-cyan-300">inbody/fondos/</strong>. Opacidad recomendada 30–45 %.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="block text-[10px] font-bold text-slate-400 uppercase">
              Subir desde galería (máx. 2 MB)
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={uploading || saving}
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                void handleFile(f);
                e.target.value = '';
              }}
              className="block w-full text-xs text-slate-300 file:mr-3 file:px-3 file:py-2 file:rounded-xl file:border-0 file:bg-blue-600 file:text-white file:font-bold file:cursor-pointer disabled:opacity-50"
            />
            <label className="block text-[10px] font-bold text-slate-400 uppercase">O pegar URL</label>
            <input
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              placeholder="https://…"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none"
            />
            <label className="block text-[10px] font-bold text-slate-400 uppercase">
              Opacidad del fondo: {Math.round(apariencia.opacidad * 100)}%
            </label>
            <input
              type="range"
              min={0}
              max={55}
              value={Math.round(apariencia.opacidad * 100)}
              onChange={(e) =>
                setApariencia((p) => ({ ...p, opacidad: Number(e.target.value) / 100 }))
              }
              className="w-full accent-blue-500"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void clearFondo()}
                disabled={uploading || saving}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Quitar fondo
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving || uploading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {saving || uploading ? 'Guardando…' : 'Guardar apariencia'}
              </button>
            </div>
            {previewUrl && (
              <p className="text-[10px] text-slate-500 break-all leading-relaxed">
                URL activa: {previewUrl.slice(0, 120)}
                {previewUrl.length > 120 ? '…' : ''}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
              <Monitor className="w-3 h-3" /> Vista computador
            </p>
            <PreviewShell className="h-36 rounded-2xl">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-40 h-20 rounded-xl bg-slate-900/90 border border-slate-700" />
              </div>
            </PreviewShell>
            <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
              <Smartphone className="w-3 h-3" /> Vista celular
            </p>
            <PreviewShell className="mx-auto w-28 h-48 rounded-[1.4rem]">
              <div className="absolute inset-x-2 top-8 h-16 rounded-lg bg-slate-900/90 border border-slate-700 pointer-events-none" />
            </PreviewShell>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">Número de impacto</label>
            <input
              type="number"
              value={creditos.impactoValor}
              onChange={(e) =>
                setCreditos((p) => ({ ...p, impactoValor: Number(e.target.value) || 0 }))
              }
              className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white font-mono outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Texto bajo el número</label>
            <input
              value={creditos.impactoTexto}
              onChange={(e) => setCreditos((p) => ({ ...p, impactoTexto: e.target.value }))}
              className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none"
            />
            <p className="mt-1.5 text-[10px] text-slate-500 leading-relaxed">
              Instrucción: use una <strong className="text-cyan-300">coma (,)</strong> para bajar de
              línea. Ejemplo:{' '}
              <span className="text-slate-400">
                …alcance institucional InBody, · Oficiales y Tropa Profesional
              </span>
            </p>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">Frase 1</label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                value={creditos.frase1Color}
                onChange={(e) => setCreditos((p) => ({ ...p, frase1Color: e.target.value }))}
                className="h-9 w-10 rounded-lg border border-slate-700 bg-slate-950 cursor-pointer shrink-0"
                title="Color frase 1"
              />
              <input
                value={creditos.frase1}
                onChange={(e) => setCreditos((p) => ({ ...p, frase1: e.target.value }))}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">Frase 2</label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                value={creditos.frase2Color}
                onChange={(e) => setCreditos((p) => ({ ...p, frase2Color: e.target.value }))}
                className="h-9 w-10 rounded-lg border border-slate-700 bg-slate-950 cursor-pointer shrink-0"
                title="Color frase 2"
              />
              <input
                value={creditos.frase2}
                onChange={(e) => setCreditos((p) => ({ ...p, frase2: e.target.value }))}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none"
              />
            </div>
          </div>
          <p className="sm:col-span-2 text-[10px] text-slate-500 flex items-center gap-1">
            <Upload className="w-3 h-3" /> Número, texto, frases y colores se guardan para todos los
            usuarios (ficha del evaluado). Pulse Guardar apariencia.
          </p>
        </div>

        {msg && <p className="text-xs text-emerald-400 font-bold">{msg}</p>}
        {err && <p className="text-xs text-rose-400 font-bold">{err}</p>}
      </div>

      <CreditosInstitucionales isDark canEdit />
    </div>
  );
};
