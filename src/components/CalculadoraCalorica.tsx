import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  EMPTY_MEAL_DATA,
  FOOD_CATEGORY_META,
  FOOD_DATABASE,
  FoodCategory,
  FoodItem,
  MEAL_SECTIONS,
  MealData,
  MealId,
} from '../data/foodDatabase';
import {
  ActivityMode,
  getTodayLabel,
  loadDailyMeals,
  saveDailyMeals,
} from '../utils/dailyMealStorage';
import { useTheme } from '../context/ThemeContext';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Coffee,
  Flame,
  Minus,
  Plus,
  RotateCcw,
  Save,
  Search,
  Sparkles,
  Star,
  UtensilsCrossed,
  Apple,
  Salad,
} from 'lucide-react';

interface CalculadoraCaloricaProps {
  cedula: string;
  tmb: number;
  ingestaMeta: number;
  onClose: () => void;
  alimentos?: FoodItem[];
  /** Si true, oculta el botón regresar (cuando está embebido). */
  embedded?: boolean;
}

const MEAL_UI: Record<
  MealId,
  {
    icon: React.ReactNode;
    accent: string;
    border: string;
    headerBg: string;
    glow: string;
  }
> = {
  desayuno: {
    icon: <Coffee className="w-4 h-4" />,
    accent: 'text-amber-400',
    border: 'border-amber-500/50',
    headerBg: 'from-amber-500/20 to-transparent',
    glow: 'shadow-amber-500/10',
  },
  almuerzo: {
    icon: <Salad className="w-4 h-4" />,
    accent: 'text-emerald-400',
    border: 'border-emerald-500/50',
    headerBg: 'from-emerald-500/20 to-transparent',
    glow: 'shadow-emerald-500/10',
  },
  merienda: {
    icon: <UtensilsCrossed className="w-4 h-4" />,
    accent: 'text-violet-400',
    border: 'border-violet-500/50',
    headerBg: 'from-violet-500/20 to-transparent',
    glow: 'shadow-violet-500/10',
  },
  snack: {
    icon: <Apple className="w-4 h-4" />,
    accent: 'text-slate-400',
    border: 'border-slate-500/40',
    headerBg: 'from-slate-500/15 to-transparent',
    glow: 'shadow-slate-500/5',
  },
};

function mealTotal(meals: MealData, id: MealId): number {
  return Object.values(meals[id]).reduce((sum, item) => sum + item.qty * item.cal, 0);
}

function globalTotal(meals: MealData): number {
  return MEAL_SECTIONS.reduce((sum, s) => sum + mealTotal(meals, s.id), 0);
}

function mealMacroShares(meals: MealData, id: MealId): Record<FoodCategory, number> {
  const shares: Record<FoodCategory, number> = {
    verdura: 0,
    proteina: 0,
    carbo: 0,
    grasa: 0,
    otro: 0,
  };
  Object.values(meals[id]).forEach((item) => {
    const cat = item.category || 'otro';
    shares[cat] += item.qty * item.cal;
  });
  return shares;
}

function hasGoodBalance(shares: Record<FoodCategory, number>, total: number): boolean {
  if (total < 80) return false;
  return shares.proteina / total >= 0.15 || shares.verdura / total >= 0.08;
}

function reflectionMessage(
  total: number,
  meta: number,
  mode: ActivityMode
): { tone: 'ok' | 'warn' | 'over' | 'low'; title: string; text: string } | null {
  if (total <= 0) return null;
  const ratio = total / meta;

  if (ratio > 1.08) {
    return {
      tone: 'over',
      title: 'Te estás excediendo hoy',
      text:
        mode === 'con_deporte'
          ? `Llevas ${total} kcal y tu meta con deporte es ${meta} kcal. Si el entrenamiento fue intenso, está bien; si no, reduce porciones o elige opciones más ligeras.`
          : `Llevas ${total} kcal y tu TMB es ${meta} kcal. Sin deporte activo, el exceso se acumula. Ajusta la siguiente comida.`,
    };
  }
  if (ratio > 0.95) {
    return {
      tone: 'warn',
      title: 'Estás cerca del límite',
      text: `Has consumido ~${Math.round(ratio * 100)}% de tu meta (${meta} kcal). Cuida las porciones del resto del día.`,
    };
  }
  if (ratio < 0.55 && total > 400) {
    return {
      tone: 'low',
      title: 'Vas por debajo de tu meta',
      text:
        mode === 'sin_deporte'
          ? `Tu TMB (${meta} kcal) es el mínimo vital. No te quedes muy por debajo al cerrar el día.`
          : `Con deporte necesitas cerca de ${meta} kcal. Si aún faltan comidas, está bien.`,
    };
  }
  return {
    tone: 'ok',
    title: 'Buen ritmo calórico',
    text: `Vas con ${total} de ${meta} kcal. Sigue registrando cada comida.`,
  };
}

export const CalculadoraCalorica: React.FC<CalculadoraCaloricaProps> = ({
  cedula,
  tmb,
  ingestaMeta,
  onClose,
  alimentos,
  embedded = false,
}) => {
  const { isDark } = useTheme();
  const catalog = alimentos && alimentos.length > 0 ? alimentos : FOOD_DATABASE;

  const [mode, setMode] = useState<ActivityMode | null>(null);
  const [meals, setMeals] = useState<MealData>(EMPTY_MEAL_DATA);
  const [loading, setLoading] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState<MealId | null>(null);
  const [queries, setQueries] = useState<Record<MealId, string>>({
    desayuno: '',
    almuerzo: '',
    merienda: '',
    snack: '',
  });
  const [savedFlash, setSavedFlash] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const subShell = isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200';
  const muted = isDark ? 'text-slate-400' : 'text-slate-500';
  const inputCls = isDark
    ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500'
    : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const stored = await loadDailyMeals(cedula);
      if (cancelled) return;
      setMode(stored.mode);
      setMeals(stored.meals);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [cedula]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setActiveDropdown(null);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const meta = mode === 'con_deporte' ? ingestaMeta : tmb;
  const total = useMemo(() => globalTotal(meals), [meals]);
  const remaining = meta - total;
  const progress = Math.min(100, Math.round((total / Math.max(meta, 1)) * 100));
  const reflection = mode ? reflectionMessage(total, meta, mode) : null;

  const persist = async (nextMeals: MealData, nextMode: ActivityMode | null) => {
    setSyncing(true);
    try {
      await saveDailyMeals(cedula, { date: '', mode: nextMode, meals: nextMeals });
    } finally {
      setSyncing(false);
    }
  };

  const selectMode = (next: ActivityMode) => {
    setMode(next);
    void persist(meals, next);
  };

  const addFood = (mealId: MealId, item: FoodItem) => {
    setMeals((prev) => {
      const next = { ...prev, [mealId]: { ...prev[mealId] } };
      if (next[mealId][item.name]) {
        next[mealId][item.name] = {
          ...next[mealId][item.name],
          qty: next[mealId][item.name].qty + 1,
        };
      } else {
        next[mealId][item.name] = {
          qty: 1,
          cal: item.cal,
          sub: item.sub,
          category: item.category,
        };
      }
      void persist(next, mode);
      return next;
    });
    setActiveDropdown(null);
    setQueries((q) => ({ ...q, [mealId]: '' }));
  };

  const updateQty = (mealId: MealId, name: string, change: number) => {
    setMeals((prev) => {
      const next = { ...prev, [mealId]: { ...prev[mealId] } };
      const cur = next[mealId][name];
      if (!cur) return prev;
      const qty = cur.qty + change;
      if (qty <= 0) delete next[mealId][name];
      else next[mealId][name] = { ...cur, qty };
      void persist(next, mode);
      return next;
    });
  };

  const handleSave = async () => {
    await persist(meals, mode);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1800);
  };

  const handleReset = async () => {
    const empty = EMPTY_MEAL_DATA();
    setMeals(empty);
    await persist(empty, mode);
  };

  const filtered = (mealId: MealId) => {
    const q = (queries[mealId] || '').trim().toLowerCase();
    if (!q) return catalog.slice(0, 45);
    return catalog.filter((f) => f.name.toLowerCase().includes(q)).slice(0, 45);
  };

  const ModeBadges = ({ compact = false }: { compact?: boolean }) => (
    <div className={`flex items-center gap-2 ${compact ? '' : 'justify-center'}`}>
      {(['sin_deporte', 'con_deporte'] as ActivityMode[]).map((m) => {
        const active = mode === m;
        const src = m === 'sin_deporte' ? '/medallas/SINDEPORTE.png' : '/medallas/CONDEPORTE.png';
        const label = m === 'sin_deporte' ? 'Sin deporte' : 'Con deporte';
        const ring = m === 'sin_deporte' ? 'ring-amber-400 shadow-amber-500/40' : 'ring-emerald-400 shadow-emerald-500/40';
        return (
          <button
            key={m}
            type="button"
            title={label}
            onClick={() => selectMode(m)}
            className={`relative rounded-full overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
              compact ? 'w-11 h-11 sm:w-12 sm:h-12' : 'w-28 h-28 sm:w-36 sm:h-36'
            } ${
              active
                ? `border-transparent ring-2 ${ring} shadow-lg scale-105`
                : isDark
                ? 'border-slate-700 opacity-80 hover:opacity-100'
                : 'border-slate-300 opacity-85 hover:opacity-100'
            }`}
          >
            <img src={src} alt={label} className="w-full h-full object-cover" />
          </button>
        );
      })}
    </div>
  );

  if (loading) {
    return (
      <div className={`p-8 text-center text-sm ${muted}`} ref={rootRef}>
        Cargando tu diario calórico…
      </div>
    );
  }

  // —— Selección inicial ——
  if (!mode) {
    return (
      <div className="space-y-6" ref={rootRef}>
        <div className={`flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              Guía calórica del día
            </span>
            <h3 className={`text-xl sm:text-2xl font-black mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Elige tu modo metabólico
            </h3>
            <p className={`text-xs mt-1 max-w-xl ${muted}`}>
              Hoy: {getTodayLabel()}. Toca un botón para empezar.
            </p>
          </div>
          {!embedded && (
            <button
              type="button"
              onClick={onClose}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer self-start border ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
              }`}
            >
              <ArrowLeft className="w-4 h-4 text-emerald-500" />
              Regresar
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 py-4">
          <button
            type="button"
            onClick={() => selectMode('sin_deporte')}
            title={`Sin deporte · TMB ${tmb} kcal`}
            aria-label={`Sin deporte, meta TMB ${tmb} kilocalorías`}
            className="group cursor-pointer bg-transparent border-0 p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-full"
          >
            <img
              src="/medallas/SINDEPORTE.png"
              alt="Sin deporte"
              className="w-40 h-40 sm:w-52 sm:h-52 object-contain drop-shadow-lg group-hover:scale-105 transition-transform duration-300"
            />
          </button>

          <button
            type="button"
            onClick={() => selectMode('con_deporte')}
            title={`Con deporte · Ingesta ${ingestaMeta} kcal`}
            aria-label={`Con deporte, meta ingesta ${ingestaMeta} kilocalorías`}
            className="group cursor-pointer bg-transparent border-0 p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-full"
          >
            <img
              src="/medallas/CONDEPORTE.png"
              alt="Con deporte"
              className="w-40 h-40 sm:w-52 sm:h-52 object-contain drop-shadow-lg group-hover:scale-105 transition-transform duration-300"
            />
          </button>
        </div>
      </div>
    );
  }

  // —— Calculadora ——
  return (
    <div className="space-y-4" ref={rootRef}>
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b sticky top-0 z-10 -mx-1 px-1 py-2 backdrop-blur-md ${
        isDark ? 'border-slate-800 bg-slate-900/95' : 'border-slate-200 bg-white/95'
      }`}>
        <div className="min-w-0">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
            {getTodayLabel()} {syncing ? '· sync…' : ''}
          </span>
          <h3 className={`text-lg sm:text-xl font-black mt-1 truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {mode === 'sin_deporte' ? 'Día sin deporte (TMB)' : 'Día con deporte (Ingesta)'}
          </h3>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <ModeBadges compact />
          {!embedded && (
            <button
              type="button"
              onClick={onClose}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider cursor-pointer border ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5 text-emerald-500" />
              Regresar
            </button>
          )}
        </div>
      </div>

      {/* Meta */}
      <div className={`rounded-2xl border p-4 space-y-3 ${subShell}`}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${muted}`}>
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              Meta del día
            </p>
            <p className={`text-3xl font-black font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {meta} <span className={`text-sm font-bold ${muted}`}>kcal</span>
            </p>
          </div>
          <div className="text-right">
            <p className={`text-[10px] font-black uppercase tracking-wider ${muted}`}>Consumido</p>
            <p
              className={`text-2xl font-black font-mono ${
                total > meta * 1.08 ? 'text-rose-500' : total > meta * 0.95 ? 'text-amber-500' : 'text-emerald-500'
              }`}
            >
              {total} kcal
            </p>
            <p className={`text-[11px] font-semibold ${remaining >= 0 ? muted : 'text-rose-500'}`}>
              {remaining >= 0 ? `Te quedan ${remaining} kcal` : `Exceso de ${Math.abs(remaining)} kcal`}
            </p>
          </div>
        </div>
        <div className={`h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              progress > 108 ? 'bg-rose-500' : progress > 95 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      {reflection && (
        <div
          className={`rounded-2xl border p-4 flex gap-3 ${
            reflection.tone === 'over'
              ? 'bg-rose-500/10 border-rose-500/40 text-rose-700 dark:text-rose-100'
              : reflection.tone === 'warn'
              ? 'bg-amber-500/10 border-amber-500/40 text-amber-800 dark:text-amber-100'
              : reflection.tone === 'low'
              ? 'bg-blue-500/10 border-blue-500/40 text-blue-800 dark:text-blue-100'
              : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-800 dark:text-emerald-100'
          }`}
        >
          {reflection.tone === 'over' || reflection.tone === 'warn' ? (
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          ) : (
            <Sparkles className="w-5 h-5 shrink-0 mt-0.5" />
          )}
          <div>
            <p className="text-xs font-black uppercase tracking-wider">{reflection.title}</p>
            <p className="text-xs leading-relaxed mt-1 opacity-90">{reflection.text}</p>
          </div>
        </div>
      )}

      {/* Comidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MEAL_SECTIONS.map((section) => {
          const ui = MEAL_UI[section.id];
          const mTotal = mealTotal(meals, section.id);
          const items = meals[section.id];
          const names = Object.keys(items);
          const empty = names.length === 0;
          const pct = total > 0 ? Math.round((mTotal / total) * 100) : 0;
          const shares = mealMacroShares(meals, section.id);
          const shareSum = Object.values(shares).reduce((a, b) => a + b, 0) || 1;
          const balanced = hasGoodBalance(shares, mTotal);
          const isOpen = activeDropdown === section.id;

          return (
            <div
              key={section.id}
              className={`rounded-2xl border-2 p-4 space-y-3 transition-opacity shadow-lg ${ui.border} ${ui.glow} ${
                empty ? 'opacity-55 border-dashed' : 'opacity-100'
              } ${isDark ? 'bg-slate-950' : 'bg-white'}`}
            >
              <div className={`rounded-xl bg-gradient-to-r ${ui.headerBg} -mx-1 px-1 py-1`}>
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm font-black flex items-center gap-1.5 ${ui.accent}`}>
                    {ui.icon}
                    {section.name}
                  </span>
                  <span className={`text-xs font-mono font-bold flex items-center gap-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    {balanced && <Star className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />}
                    {mTotal} kcal
                    {mTotal > 0 && <span className={muted}> · {pct}%</span>}
                  </span>
                </div>
                {mTotal > 0 && (
                  <div className={`mt-2 h-1.5 rounded-full overflow-hidden flex ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                    {(Object.keys(shares) as FoodCategory[]).map((cat) => {
                      const w = (shares[cat] / shareSum) * 100;
                      if (w < 0.5) return null;
                      return (
                        <div
                          key={cat}
                          className={FOOD_CATEGORY_META[cat].bar}
                          style={{ width: `${w}%` }}
                          title={`${FOOD_CATEGORY_META[cat].label} ${Math.round(w)}%`}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="relative">
                <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${inputCls}`}>
                  <Search className={`w-3.5 h-3.5 shrink-0 ${muted}`} />
                  <input
                    type="text"
                    value={queries[section.id]}
                    placeholder="Buscar alimento..."
                    className="w-full bg-transparent text-xs outline-none"
                    onFocus={() => setActiveDropdown(section.id)}
                    onChange={(e) => {
                      setQueries((q) => ({ ...q, [section.id]: e.target.value }));
                      setActiveDropdown(section.id);
                    }}
                  />
                </div>
                {isOpen && (
                  <div
                    className={`absolute z-30 left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-xl border shadow-2xl ${
                      isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
                    }`}
                  >
                    {filtered(section.id).length === 0 ? (
                      <div className={`px-3 py-2 text-xs ${muted}`}>Sin resultados</div>
                    ) : (
                      filtered(section.id).map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left cursor-pointer border-b last:border-0 ${
                            isDark ? 'hover:bg-slate-800 border-slate-800/80' : 'hover:bg-slate-50 border-slate-100'
                          }`}
                          onClick={() => addFood(section.id, item)}
                        >
                          <span className="text-xs min-w-0">
                            <span
                              className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle ${FOOD_CATEGORY_META[item.category].bar}`}
                            />
                            <strong>{item.name}</strong>
                            <span className={`ml-1 ${muted}`}>({item.sub})</span>
                          </span>
                          <span className="text-[11px] font-bold text-emerald-500 shrink-0">{item.cal} kcal</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-0 min-h-[2rem]">
                {empty ? (
                  <p className={`text-[11px] italic ${muted}`}>Disponible — agrega alimentos cuando quieras.</p>
                ) : (
                  names.map((name, idx) => {
                    const item = items[name];
                    const cat = item.category || 'otro';
                    const metaCat = FOOD_CATEGORY_META[cat];
                    return (
                      <div
                        key={name}
                        className={`flex items-center justify-between gap-2 py-2.5 ${
                          idx > 0 ? (isDark ? 'border-t border-slate-800/80' : 'border-t border-slate-100') : ''
                        }`}
                      >
                        <div className="min-w-0 flex items-start gap-2">
                          <span className={`mt-1 w-1 self-stretch min-h-[1.5rem] rounded-full ${metaCat.bar}`} />
                          <div className="min-w-0">
                            <p className={`text-xs font-bold truncate flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {name}
                              <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${metaCat.chip}`}>
                                {metaCat.label}
                              </span>
                            </p>
                            <p className={`text-[10px] ${muted}`}>
                              {item.sub} · {item.cal * item.qty} kcal
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => updateQty(section.id, name, -1)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer ${
                              isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                            }`}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-5 text-center text-xs font-black font-mono">{item.qty}</span>
                          <button
                            type="button"
                            onClick={() => updateQty(section.id, name, 1)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer ${
                              isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                            }`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className={`flex flex-col sm:flex-row gap-2 pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <button
          type="button"
          onClick={() => void handleSave()}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider cursor-pointer shadow-lg shadow-emerald-600/25"
        >
          {savedFlash ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {savedFlash ? 'Guardado (nube + local)' : 'Guardar día'}
        </button>
        <button
          type="button"
          onClick={() => void handleReset()}
          className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer border ${
            isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          Limpiar
        </button>
      </div>

      {/* Guía breve */}
      <div
        className={`rounded-2xl border px-4 py-3 space-y-2.5 ${
          isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className={`text-[10px] font-black uppercase tracking-wider ${muted}`}>Colores</span>
          {(Object.keys(FOOD_CATEGORY_META) as FoodCategory[]).map((cat) => {
            const m = FOOD_CATEGORY_META[cat];
            return (
              <span key={cat} className="inline-flex items-center gap-1.5 text-[10px]">
                <span className={`w-2 h-2 rounded-full ${m.bar}`} />
                <span className={muted}>{m.label}</span>
              </span>
            );
          })}
        </div>
        <ul className={`text-[11px] leading-relaxed space-y-1.5 list-disc pl-4 ${muted}`}>
          <li>
            Con los <strong className={isDark ? 'text-slate-300' : 'text-slate-700'}>botones de arriba</strong> cambia entre{' '}
            <strong className={isDark ? 'text-slate-300' : 'text-slate-700'}>sin deporte (TMB)</strong> y{' '}
            <strong className={isDark ? 'text-slate-300' : 'text-slate-700'}>con deporte (ingesta meta)</strong>.
          </li>
          <li>
            En cada comida intenta sumar <strong className={isDark ? 'text-slate-300' : 'text-slate-700'}>proteína</strong> y{' '}
            <strong className={isDark ? 'text-slate-300' : 'text-slate-700'}>verdura</strong>.
          </li>
          <li>
            Si te pasas de la meta, reduce la porción de la siguiente comida.
          </li>
        </ul>
      </div>
    </div>
  );
};
