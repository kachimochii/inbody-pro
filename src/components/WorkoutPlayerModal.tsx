import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Award,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mic,
  MicOff,
  Music,
  Pause,
  Play,
  SkipForward,
  Trophy,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import type { PlanEntrenamiento, SomatotipoTipo } from '../types/inbody';
import type { BloqueEjercicioPlan } from '../types/inbody';
import { FRASES_MANDO } from '../data/mockData';
import {
  asegurarRutinaInteractiva,
  calcularCaloriasQuemadas,
  metEstimadoBloque,
} from '../utils/rutinaInteractiva';

export interface ResumenWorkout {
  duracionTotalSeg: number;
  caloriasQuemadas: number;
  ejerciciosCompletados: number;
}

interface WorkoutPlayerModalProps {
  plan: PlanEntrenamiento;
  pesoUsuarioKg: number;
  somatotipoUsuario: SomatotipoTipo;
  nombreUsuario: string;
  isDark: boolean;
  onClose: () => void;
  audioPlaying?: boolean;
  onToggleAudio?: () => void;
  audioMuted?: boolean;
  onToggleMute?: () => void;
  onWorkoutCompleted?: (resumen: ResumenWorkout) => void;
}

type Fase = 'preparacion' | 'trabajo' | 'descanso' | 'completado';

interface PasoTrabajo {
  tipo: 'trabajo';
  bloqueIndex: number;
  serie: number; // 1-based
}

interface PasoDescanso {
  tipo: 'descanso';
  bloqueIndex: number;
  serie: number;
  /** Índice del bloque/serie que sigue (después del descanso). */
  nextBloqueIndex: number;
  nextSerie: number;
}

type Paso = PasoTrabajo | PasoDescanso;

const PREP_SEG = 10;
const CADENCIA_REP_SEG = 2;

function construirPasos(bloques: BloqueEjercicioPlan[]): Paso[] {
  const pasos: Paso[] = [];
  for (let bi = 0; bi < bloques.length; bi++) {
    const series = Math.max(1, bloques[bi].series);
    for (let s = 1; s <= series; s++) {
      pasos.push({ tipo: 'trabajo', bloqueIndex: bi, serie: s });
      const esUltimo = bi === bloques.length - 1 && s === series;
      if (esUltimo) continue;
      let nextBi = bi;
      let nextSerie = s + 1;
      if (nextSerie > series) {
        nextBi = bi + 1;
        nextSerie = 1;
      }
      pasos.push({
        tipo: 'descanso',
        bloqueIndex: bi,
        serie: s,
        nextBloqueIndex: nextBi,
        nextSerie,
      });
    }
  }
  return pasos;
}

function formatMmSs(seg: number): string {
  const s = Math.max(0, Math.floor(seg));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

/** Pitidos tácticos vía Web Audio API (sin archivos externos). */
function useBeeps() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = () => {
    if (!ctxRef.current) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctxRef.current = new AC();
    }
    return ctxRef.current;
  };

  const beep = useCallback((freq: number, dur = 0.12, gain = 0.18) => {
    try {
      const ctx = getCtx();
      if (ctx.state === 'suspended') void ctx.resume();
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(gain, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch {
      /* navegador sin AudioContext */
    }
  }, []);

  const beepCountdown = useCallback(() => beep(880, 0.1, 0.14), [beep]);
  const beepGo = useCallback(() => beep(1320, 0.18, 0.22), [beep]);

  useEffect(
    () => () => {
      void ctxRef.current?.close().catch(() => undefined);
      ctxRef.current = null;
    },
    []
  );

  return { beepCountdown, beepGo };
}

function hablar(texto: string, activo: boolean) {
  if (!activo || typeof window === 'undefined' || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = 'es-EC';
    u.rate = 1.05;
    u.pitch = 1;
    const voces = window.speechSynthesis.getVoices();
    const es = voces.find((v) => /^es/i.test(v.lang));
    if (es) u.voice = es;
    window.speechSynthesis.speak(u);
  } catch {
    /* sin TTS */
  }
}

export const WorkoutPlayerModal: React.FC<WorkoutPlayerModalProps> = ({
  plan,
  pesoUsuarioKg,
  somatotipoUsuario,
  nombreUsuario,
  isDark,
  onClose,
  audioPlaying = false,
  onToggleAudio,
  audioMuted = false,
  onToggleMute,
  onWorkoutCompleted,
}) => {
  const [bloques, setBloques] = useState<BloqueEjercicioPlan[] | null>(null);
  const [errorCarga, setErrorCarga] = useState('');
  const [fase, setFase] = useState<Fase>('preparacion');
  const [pasoIndex, setPasoIndex] = useState(0);
  const [segRestantes, setSegRestantes] = useState(PREP_SEG);
  const [pausado, setPausado] = useState(false);
  const [vozActiva, setVozActiva] = useState(true);
  const [segSesion, setSegSesion] = useState(0);
  const [frase] = useState(() => FRASES_MANDO[Math.floor(Math.random() * FRASES_MANDO.length)]);

  const mitadAnunciadaRef = useRef(false);
  const ultimoPitidoRef = useRef<number | null>(null);
  const wakeLockRef = useRef<{ release: () => Promise<void> } | null>(null);
  const inicioEpochRef = useRef(Date.now());
  const { beepCountdown, beepGo } = useBeeps();

  const pasos = useMemo(() => (bloques ? construirPasos(bloques) : []), [bloques]);
  const pasoActual = pasos[pasoIndex];
  const totalTrabajos = useMemo(() => pasos.filter((p) => p.tipo === 'trabajo').length, [pasos]);
  const trabajosHechos = useMemo(() => {
    let n = 0;
    for (let i = 0; i < pasoIndex; i++) if (pasos[i]?.tipo === 'trabajo') n++;
    if (fase === 'completado') return totalTrabajos;
    return n;
  }, [pasoIndex, pasos, fase, totalTrabajos]);

  // Carga / autogenera circuito
  useEffect(() => {
    let vivo = true;
    asegurarRutinaInteractiva(plan)
      .then((r) => {
        if (!vivo) return;
        if (!r.length) {
          setErrorCarga('No se pudo armar un circuito para este plan.');
          return;
        }
        setBloques(r);
        setSegRestantes(PREP_SEG);
        setFase('preparacion');
        setPasoIndex(0);
        inicioEpochRef.current = Date.now();
      })
      .catch((err) => {
        if (vivo) setErrorCarga(err instanceof Error ? err.message : String(err));
      });
    return () => {
      vivo = false;
    };
  }, [plan]);

  // Wake Lock
  useEffect(() => {
    let cancelled = false;
    const pedir = async () => {
      try {
        const nav = navigator as Navigator & {
          wakeLock?: { request: (type: 'screen') => Promise<{ release: () => Promise<void> }> };
        };
        if (!nav.wakeLock?.request) return;
        const lock = await nav.wakeLock.request('screen');
        if (cancelled) {
          await lock.release();
          return;
        }
        wakeLockRef.current = lock;
      } catch {
        /* no soportado / denegado */
      }
    };
    void pedir();
    const onVisible = () => {
      if (document.visibilityState === 'visible') void pedir();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      void wakeLockRef.current?.release().catch(() => undefined);
      wakeLockRef.current = null;
      try {
        window.speechSynthesis?.cancel();
      } catch {
        /* ignore */
      }
    };
  }, []);

  const bloqueActual =
    bloques && pasoActual ? bloques[pasoActual.bloqueIndex] : bloques?.[0] ?? null;

  const siguientePreview = useMemo(() => {
    if (!bloques || !pasoActual || pasoActual.tipo !== 'descanso') return null;
    const nb = bloques[pasoActual.nextBloqueIndex];
    if (!nb) return null;
    const mismo = pasoActual.nextBloqueIndex === pasoActual.bloqueIndex;
    return {
      bloque: nb,
      serie: pasoActual.nextSerie,
      mismo,
      label: mismo
        ? `A CONTINUACIÓN: Serie ${pasoActual.nextSerie} de ${nb.nombre_es}`
        : `SIGUIENTE EJERCICIO: ${nb.nombre_es}`,
    };
  }, [bloques, pasoActual]);

  const anunciar = useCallback(
    (texto: string) => {
      hablar(texto, vozActiva);
    },
    [vozActiva]
  );

  const iniciarTrabajoEn = useCallback(
    (index: number, lista: BloqueEjercicioPlan[], secuencia: Paso[]) => {
      const paso = secuencia[index];
      if (!paso || paso.tipo !== 'trabajo') {
        setFase('completado');
        return;
      }
      const b = lista[paso.bloqueIndex];
      mitadAnunciadaRef.current = false;
      ultimoPitidoRef.current = null;
      setPasoIndex(index);
      setFase('trabajo');
      setSegRestantes(b.modo === 'tiempo' ? b.duracionSeg : b.repeticiones * CADENCIA_REP_SEG);
      setPausado(false);
      beepGo();
      anunciar(`${b.nombre_es}, serie ${paso.serie}`);
    },
    [anunciar, beepGo]
  );

  const iniciarDescansoEn = useCallback(
    (index: number, lista: BloqueEjercicioPlan[], secuencia: Paso[]) => {
      const paso = secuencia[index];
      if (!paso || paso.tipo !== 'descanso') {
        setFase('completado');
        return;
      }
      const b = lista[paso.bloqueIndex];
      const next = lista[paso.nextBloqueIndex];
      ultimoPitidoRef.current = null;
      setPasoIndex(index);
      setFase('descanso');
      setSegRestantes(Math.max(5, b.descansoSeg));
      setPausado(false);
      anunciar(
        `Descansa ${b.descansoSeg} segundos. A continuación: ${next?.nombre_es || 'siguiente ejercicio'}`
      );
    },
    [anunciar]
  );

  const avanzarTrasTrabajo = useCallback(() => {
    if (!bloques) return;
    const next = pasoIndex + 1;
    if (next >= pasos.length) {
      setFase('completado');
      beepGo();
      return;
    }
    const p = pasos[next];
    if (p.tipo === 'descanso') iniciarDescansoEn(next, bloques, pasos);
    else iniciarTrabajoEn(next, bloques, pasos);
  }, [bloques, pasoIndex, pasos, iniciarDescansoEn, iniciarTrabajoEn, beepGo]);

  const avanzarTrasDescanso = useCallback(() => {
    if (!bloques) return;
    const next = pasoIndex + 1;
    if (next >= pasos.length) {
      setFase('completado');
      return;
    }
    iniciarTrabajoEn(next, bloques, pasos);
  }, [bloques, pasoIndex, pasos, iniciarTrabajoEn]);

  const empezarYa = useCallback(() => {
    if (!bloques || !pasos.length) return;
    iniciarTrabajoEn(0, bloques, pasos);
  }, [bloques, pasos, iniciarTrabajoEn]);

  // Tick principal (transiciones diferidas fuera del updater)
  useEffect(() => {
    if (!bloques || pausado || fase === 'completado') return;

    const id = window.setInterval(() => {
      setSegSesion((s) => s + 1);

      if (fase === 'trabajo' && bloqueActual?.modo === 'repeticiones') {
        setSegRestantes((prev) => Math.max(0, prev - 1));
        return;
      }

      setSegRestantes((prev) => {
        const next = prev - 1;
        if (next <= 3 && next >= 1 && ultimoPitidoRef.current !== next) {
          ultimoPitidoRef.current = next;
          beepCountdown();
        }
        if (fase === 'trabajo' && bloqueActual?.modo === 'tiempo') {
          const total = bloqueActual.duracionSeg;
          if (!mitadAnunciadaRef.current && total >= 30 && next === Math.floor(total / 2)) {
            mitadAnunciadaRef.current = true;
            anunciar('¡Mitad del tiempo, mantén el ritmo!');
          }
        }
        if (next <= 0) {
          void Promise.resolve().then(() => {
            if (fase === 'preparacion') iniciarTrabajoEn(0, bloques, pasos);
            else if (fase === 'trabajo') avanzarTrasTrabajo();
            else if (fase === 'descanso') avanzarTrasDescanso();
          });
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [
    bloques,
    pausado,
    fase,
    bloqueActual,
    pasos,
    iniciarTrabajoEn,
    avanzarTrasTrabajo,
    avanzarTrasDescanso,
    beepCountdown,
    anunciar,
  ]);

  const resumen = useMemo(() => {
    if (!bloques) {
      return { duracionTotalSeg: 0, caloriasQuemadas: 0, ejerciciosCompletados: 0 };
    }
    const duracionTotalSeg = Math.max(segSesion, Math.round((Date.now() - inicioEpochRef.current) / 1000));
    return {
      duracionTotalSeg,
      caloriasQuemadas: calcularCaloriasQuemadas(bloques, pesoUsuarioKg),
      ejerciciosCompletados: bloques.length,
    };
  }, [bloques, pesoUsuarioKg, segSesion]);

  const progresoPct = totalTrabajos ? Math.min(100, (trabajosHechos / totalTrabajos) * 100) : 0;

  const saltarSerie = () => {
    if (fase === 'preparacion') {
      empezarYa();
      return;
    }
    if (fase === 'trabajo') avanzarTrasTrabajo();
    else if (fase === 'descanso') avanzarTrasDescanso();
  };

  const ejercicioAnterior = () => {
    if (!bloques || !pasos.length) return;
    // Retrocede al trabajo anterior
    let i = pasoIndex - 1;
    while (i >= 0 && pasos[i].tipo !== 'trabajo') i--;
    if (i < 0) {
      setFase('preparacion');
      setSegRestantes(PREP_SEG);
      setPasoIndex(0);
      setPausado(false);
      return;
    }
    iniciarTrabajoEn(i, bloques, pasos);
  };

  const finalizar = () => {
    onWorkoutCompleted?.({
      duracionTotalSeg: resumen.duracionTotalSeg,
      caloriasQuemadas: resumen.caloriasQuemadas,
      ejerciciosCompletados: resumen.ejerciciosCompletados,
    });
    onClose();
  };

  // —— UI helpers ——
  const anilloPct = useMemo(() => {
    if (fase === 'preparacion') return ((PREP_SEG - segRestantes) / PREP_SEG) * 100;
    if (fase === 'trabajo' && bloqueActual?.modo === 'tiempo') {
      return ((bloqueActual.duracionSeg - segRestantes) / Math.max(1, bloqueActual.duracionSeg)) * 100;
    }
    if (fase === 'descanso' && bloqueActual) {
      const total = Math.max(5, bloqueActual.descansoSeg);
      return ((total - segRestantes) / total) * 100;
    }
    return 0;
  }, [fase, segRestantes, bloqueActual]);

  const previewBloque =
    fase === 'preparacion'
      ? bloques?.[0]
      : fase === 'descanso'
        ? siguientePreview?.bloque
        : bloqueActual;

  const bgBase = isDark ? 'bg-slate-950' : 'bg-slate-900';

  if (errorCarga) {
    return (
      <div className="fixed inset-0 z-[70] bg-black/95 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-3xl bg-slate-900 border border-rose-500/40 p-6 text-center space-y-4">
          <p className="text-sm text-rose-300">{errorCarga}</p>
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl bg-slate-800 text-white text-xs font-bold cursor-pointer">
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  if (!bloques || !bloqueActual) {
    return (
      <div className={`fixed inset-0 z-[70] ${bgBase} flex items-center justify-center`}>
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          <p className="text-xs font-bold uppercase tracking-wider">Preparando circuito táctico…</p>
        </div>
      </div>
    );
  }

  if (fase === 'completado') {
    const seriesTotales = bloques.reduce((a, b) => a + b.series, 0);
    return (
      <div className="fixed inset-0 z-[70] bg-gradient-to-b from-slate-950 via-emerald-950/40 to-slate-950 flex items-center justify-center p-4 overflow-y-auto">
        <div className="max-w-lg w-full my-6 rounded-3xl border border-emerald-500/30 bg-slate-900/95 shadow-2xl p-6 sm:p-8 space-y-6 text-center">
          <div className="mx-auto w-20 h-20 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center">
            <Trophy className="w-10 h-10 text-amber-400" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Misión cumplida</p>
            <h2 className="text-2xl font-black text-white mt-1">¡Bien hecho, {nombreUsuario.split(' ')[0]}!</h2>
            <p className="text-xs text-slate-400 mt-1">{plan.nombre}</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-slate-950 border border-slate-800 p-3">
              <p className="text-[9px] font-bold uppercase text-slate-500">Tiempo</p>
              <p className="text-lg font-black text-cyan-300 font-mono">{formatMmSs(resumen.duracionTotalSeg)}</p>
            </div>
            <div className="rounded-2xl bg-slate-950 border border-slate-800 p-3">
              <p className="text-[9px] font-bold uppercase text-slate-500">Series</p>
              <p className="text-lg font-black text-white font-mono">{seriesTotales}</p>
            </div>
            <div className="rounded-2xl bg-slate-950 border border-slate-800 p-3">
              <p className="text-[9px] font-bold uppercase text-slate-500">kcal</p>
              <p className="text-lg font-black text-amber-300 font-mono">{resumen.caloriasQuemadas}</p>
            </div>
          </div>

          <p className="text-[10px] text-slate-500">
            Estimación metabólica · {pesoUsuarioKg || 72} kg · {somatotipoUsuario} · MET mixto (
            {bloques.map((b) => metEstimadoBloque(b)).includes(8) ? '8 cardio/militar + ' : ''}
            5.5 fuerza)
          </p>

          <blockquote className="rounded-2xl bg-blue-500/10 border border-blue-500/30 p-4 space-y-1">
            <p className="text-xs font-bold text-blue-200">{frase.preventiva}</p>
            <p className="text-sm font-black text-white">{frase.ejecutiva}</p>
          </blockquote>

          <button
            type="button"
            onClick={finalizar}
            className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/30"
          >
            <Award className="w-4 h-4" />
            Finalizar y Registrar Entrenamiento
          </button>
        </div>
      </div>
    );
  }

  const esDescanso = fase === 'descanso';
  const esPrep = fase === 'preparacion';
  const esReps = fase === 'trabajo' && bloqueActual.modo === 'repeticiones';
  const serieLabel =
    fase === 'preparacion'
      ? `Serie 1 de ${bloques[0].series}`
      : pasoActual
        ? `SERIE ${pasoActual.serie} DE ${bloques[pasoActual.bloqueIndex].series}`
        : '';

  return (
    <div
      className={`fixed inset-0 z-[70] flex flex-col ${
        esDescanso
          ? 'bg-gradient-to-b from-cyan-950 via-slate-950 to-blue-950'
          : 'bg-gradient-to-b from-slate-950 via-slate-900 to-black'
      }`}
    >
      {/* Top bar */}
      <header className="shrink-0 px-3 sm:px-5 pt-3 sm:pt-4 pb-2 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-cyan-400 truncate">
              Modo Entrenamiento Táctico
            </p>
            <h2 className="text-sm sm:text-base font-black text-white truncate">{plan.nombre}</h2>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setVozActiva((v) => {
                  if (v) window.speechSynthesis?.cancel();
                  return !v;
                });
              }}
              className="w-9 h-9 rounded-full bg-slate-800/80 border border-slate-700 text-slate-200 flex items-center justify-center cursor-pointer"
              title={vozActiva ? 'Silenciar instructor' : 'Activar voz del instructor'}
            >
              {vozActiva ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4 text-slate-500" />}
            </button>
            {onToggleAudio && (
              <button
                type="button"
                onClick={onToggleAudio}
                className="w-9 h-9 rounded-full bg-slate-800/80 border border-slate-700 text-slate-200 flex items-center justify-center cursor-pointer"
                title={audioPlaying ? 'Pausar música' : 'Reproducir música'}
              >
                {audioPlaying ? <Music className="w-4 h-4 text-cyan-400" /> : <Play className="w-4 h-4" />}
              </button>
            )}
            {onToggleMute && (
              <button
                type="button"
                onClick={onToggleMute}
                className="w-9 h-9 rounded-full bg-slate-800/80 border border-slate-700 text-slate-200 flex items-center justify-center cursor-pointer"
                title={audioMuted ? 'Activar sonido' : 'Silenciar'}
              >
                {audioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            )}
            <button
              type="button"
              onClick={() => setPausado((p) => !p)}
              className="w-9 h-9 rounded-full bg-slate-800/80 border border-slate-700 text-slate-200 flex items-center justify-center cursor-pointer"
              title={pausado ? 'Reanudar' : 'Pausar'}
            >
              {pausado ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-800/80 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              title="Salir"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500"
            style={{ width: `${progresoPct}%` }}
          />
        </div>
        <p className="text-[10px] text-slate-500 font-bold">
          {trabajosHechos}/{totalTrabajos} series · {formatMmSs(segSesion)}
          {pausado ? ' · PAUSADO' : ''}
        </p>
      </header>

      {/* Centro */}
      <main className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-6 pb-4 flex flex-col items-center justify-center gap-4">
        {esPrep && (
          <div className="text-center space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">Preparación</p>
            <p className="text-7xl sm:text-8xl font-black text-white font-mono tabular-nums leading-none">{segRestantes}</p>
            <p className="text-xs text-slate-400">Prepárate · {serieLabel}</p>
          </div>
        )}

        {esDescanso && (
          <div className="text-center space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-cyan-300">Recuperación táctica</p>
            <p className="text-6xl sm:text-7xl font-black text-cyan-200 font-mono tabular-nums">{segRestantes}</p>
            <p className="text-xs text-cyan-400/80">segundos de aire</p>
          </div>
        )}

        {/* Animación */}
        <div
          className={`relative w-full max-w-md aspect-square rounded-3xl overflow-hidden border shadow-2xl ${
            esDescanso ? 'border-cyan-500/40 bg-white' : 'border-slate-700 bg-white'
          }`}
        >
          {previewBloque && (
            <img
              src={previewBloque.animacion}
              alt={previewBloque.nombre_es}
              className="w-full h-full object-contain"
              decoding="async"
            />
          )}
          {(fase === 'trabajo' && bloqueActual.modo === 'tiempo') || esPrep ? (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <AnilloProgreso pct={anilloPct} seg={segRestantes} tono={esPrep ? 'amber' : 'emerald'} />
            </div>
          ) : null}
        </div>

        {esDescanso && siguientePreview && (
          <div className="w-full max-w-md rounded-2xl bg-cyan-500/10 border border-cyan-500/30 px-4 py-3 text-center">
            <p className="text-[10px] font-black uppercase tracking-wider text-cyan-300">
              {siguientePreview.mismo ? 'A continuación' : 'Siguiente ejercicio'}
            </p>
            <p className="text-sm font-black text-white mt-0.5">{siguientePreview.label.replace(/^[^:]+:\s*/, '')}</p>
            {siguientePreview.mismo && (
              <p className="text-[11px] text-cyan-200/80 mt-1">
                Serie {siguientePreview.serie} de {siguientePreview.bloque.series}
              </p>
            )}
          </div>
        )}

        {!esDescanso && (
          <div className="text-center space-y-2 max-w-md">
            <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {previewBloque?.grupo_muscular}
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
              {previewBloque?.nombre_es}
            </h3>
            <p className="text-[11px] font-black uppercase tracking-wider text-amber-300">{serieLabel}</p>
            {previewBloque?.instruccionCorta && (
              <p className="text-xs text-slate-400 leading-relaxed">{previewBloque.instruccionCorta}</p>
            )}
          </div>
        )}

        {esReps && (
          <div className="w-full max-w-md space-y-3 text-center">
            <p className="text-4xl sm:text-5xl font-black text-white tracking-tight">
              {bloqueActual.repeticiones}{' '}
              <span className="text-lg text-slate-400 font-bold uppercase">repeticiones</span>
            </p>
            <div className="flex justify-center">
              <div
                className="w-16 h-16 rounded-full border-4 border-emerald-400/80 bg-emerald-500/20 animate-pulse"
                style={{ animationDuration: `${CADENCIA_REP_SEG}s` }}
                title="Cadencia ~2 s por repetición"
              />
            </div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              Cadencia guía · 2 s / rep
            </p>
            <button
              type="button"
              onClick={avanzarTrasTrabajo}
              className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm uppercase tracking-wider cursor-pointer shadow-lg shadow-emerald-600/40 flex items-center justify-center gap-2"
            >
              <Zap className="w-5 h-5" />
              ¡Serie Completada! → Descansar
            </button>
          </div>
        )}

        {esPrep && (
          <button
            type="button"
            onClick={empezarYa}
            className="px-8 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider cursor-pointer"
          >
            Empezar ahora
          </button>
        )}

        {esDescanso && (
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              type="button"
              onClick={() => setSegRestantes((s) => s + 15)}
              className="px-4 py-2.5 rounded-xl bg-cyan-600/30 border border-cyan-500/40 text-cyan-100 text-xs font-black uppercase tracking-wider cursor-pointer"
            >
              +15 seg de aire
            </button>
            <button
              type="button"
              onClick={avanzarTrasDescanso}
              className="px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-black uppercase tracking-wider cursor-pointer"
            >
              Saltar descanso
            </button>
          </div>
        )}
      </main>

      {/* Controles inferiores */}
      {!esPrep && fase !== 'completado' && (
        <footer className="shrink-0 p-3 sm:p-4 border-t border-slate-800/80 bg-black/40 backdrop-blur-md">
          <div className="max-w-lg mx-auto grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={ejercicioAnterior}
              className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] sm:text-xs font-bold uppercase tracking-wider flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setPausado((p) => !p)}
              className="py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] sm:text-xs font-black uppercase tracking-wider flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer"
            >
              {pausado ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              {pausado ? 'Reanudar' : 'Pausar'}
            </button>
            <button
              type="button"
              onClick={saltarSerie}
              className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] sm:text-xs font-bold uppercase tracking-wider flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer"
            >
              <SkipForward className="w-4 h-4" />
              Siguiente
              <ChevronRight className="w-3 h-3 hidden sm:inline" />
            </button>
          </div>
        </footer>
      )}
    </div>
  );
};

const AnilloProgreso: React.FC<{ pct: number; seg: number; tono: 'amber' | 'emerald' }> = ({
  pct,
  seg,
  tono,
}) => {
  const size = 200;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, pct)) / 100) * c;
  const color = tono === 'amber' ? '#f59e0b' : '#34d399';

  return (
    <svg width={size} height={size} className="drop-shadow-lg opacity-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="transition-[stroke-dashoffset] duration-1000 linear"
      />
      {tono === 'emerald' && (
        <text
          x="50%"
          y="52%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-slate-900 font-black"
          style={{ fontSize: 42 }}
        >
          {seg}
        </text>
      )}
    </svg>
  );
};
