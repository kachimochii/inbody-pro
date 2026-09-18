import React, { useState } from 'react';
import { KeyRound, X, Shield } from 'lucide-react';
import { PinInput } from './PinInput';
import { PIN_LENGTH, pinWeakReason } from '../lib/userPin';
import { cambiarPinRemoto } from '../lib/authApi';

interface CambiarPinModalProps {
  cedula: string;
  onClose: () => void;
}

export const CambiarPinModal: React.FC<CambiarPinModalProps> = ({ cedula, onClose }) => {
  const [actual, setActual] = useState('');
  const [nuevo, setNuevo] = useState('');
  const [confirma, setConfirma] = useState('');
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setErr('');
    setOk('');
    const weak = pinWeakReason(nuevo, cedula);
    if (actual.length !== PIN_LENGTH) {
      setErr(`Ingrese el PIN actual (${PIN_LENGTH} dígitos).`);
      return;
    }
    if (weak) {
      setErr(weak);
      return;
    }
    if (nuevo !== confirma) {
      setErr('El PIN nuevo y la confirmación no coinciden.');
      return;
    }
    setLoading(true);
    try {
      await cambiarPinRemoto(actual, nuevo);
      setOk('PIN actualizado. Úselo en el próximo ingreso.');
      setTimeout(onClose, 1200);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'No se pudo cambiar el PIN.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 mb-1">
          <KeyRound className="w-5 h-5 text-orange-400" />
          <h3 className="text-lg font-black text-white">Cambiar PIN de seguridad</h3>
        </div>
        <p className="text-xs text-slate-400 mb-5">
          Solo números · {PIN_LENGTH} dígitos. Si lo olvidó, cierre sesión y use “Olvidé mi PIN” para que el administrador autorice uno nuevo.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 text-center">
              PIN actual
            </label>
            <PinInput value={actual} onChange={setActual} autoFocus idPrefix="pin-old" />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 text-center">
              PIN nuevo
            </label>
            <PinInput value={nuevo} onChange={setNuevo} idPrefix="pin-new" />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 text-center">
              Confirmar PIN nuevo
            </label>
            <PinInput value={confirma} onChange={setConfirma} idPrefix="pin-confirm" />
          </div>

          {err && <p className="text-xs text-rose-400 font-bold text-center">{err}</p>}
          {ok && <p className="text-xs text-emerald-400 font-bold text-center">{ok}</p>}

          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-black uppercase tracking-wider cursor-pointer inline-flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Shield className="w-4 h-4" />
            {loading ? 'Guardando…' : 'Guardar PIN'}
          </button>
        </div>
      </div>
    </div>
  );
};
