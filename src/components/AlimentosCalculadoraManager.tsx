import React, { useMemo, useState } from 'react';
import {
  FOOD_CATEGORY_META,
  FoodCategory,
  FoodItem,
} from '../data/foodDatabase';
import { useTheme } from '../context/ThemeContext';
import { Edit3, Plus, Search, Trash2, X, CheckCircle } from 'lucide-react';

interface AlimentosCalculadoraManagerProps {
  alimentos: FoodItem[];
  onAdd: (item: FoodItem) => void;
  onUpdate: (item: FoodItem) => void;
  onDelete: (id: string) => void;
}

const CATEGORIES: FoodCategory[] = ['verdura', 'proteina', 'carbo', 'grasa', 'otro'];

export const AlimentosCalculadoraManager: React.FC<AlimentosCalculadoraManagerProps> = ({
  alimentos,
  onAdd,
  onUpdate,
  onDelete,
}) => {
  const { isDark } = useTheme();
  const [query, setQuery] = useState('');
  const [filterCat, setFilterCat] = useState<FoodCategory | 'TODAS'>('TODAS');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formCal, setFormCal] = useState(100);
  const [formSub, setFormSub] = useState('1 porción');
  const [formCat, setFormCat] = useState<FoodCategory>('otro');
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2800);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return alimentos
      .filter((a) => (filterCat === 'TODAS' ? true : a.category === filterCat))
      .filter((a) => (!q ? true : a.name.toLowerCase().includes(q) || a.sub.toLowerCase().includes(q)))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }, [alimentos, query, filterCat]);

  const openAdd = () => {
    setEditingId(null);
    setFormName('');
    setFormCal(100);
    setFormSub('1 porción');
    setFormCat('otro');
    setModalOpen(true);
  };

  const openEdit = (item: FoodItem) => {
    setEditingId(item.id);
    setFormName(item.name);
    setFormCal(item.cal);
    setFormSub(item.sub);
    setFormCat(item.category);
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    const payload: FoodItem = {
      id: editingId || `food-${Date.now()}`,
      name: formName.trim(),
      cal: Math.max(0, Math.round(Number(formCal) || 0)),
      sub: formSub.trim() || '1 porción',
      category: formCat,
    };
    if (editingId) {
      onUpdate(payload);
      notify(`“${payload.name}” actualizado.`);
    } else {
      onAdd(payload);
      notify(`“${payload.name}” agregado al catálogo.`);
    }
    setModalOpen(false);
  };

  const handleDelete = (item: FoodItem) => {
    if (!confirm(`¿Eliminar “${item.name}” del catálogo?`)) return;
    onDelete(item.id);
    notify(`“${item.name}” eliminado.`);
  };

  const card = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const muted = isDark ? 'text-slate-400' : 'text-slate-500';
  const input = isDark
    ? 'bg-slate-950 border-slate-700 text-white'
    : 'bg-white border-slate-300 text-slate-900';

  return (
    <div className="space-y-4">
      <div className={`rounded-3xl border p-5 sm:p-6 ${card}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Catálogo de la calculadora
            </h3>
            <p className={`text-xs mt-0.5 ${muted}`}>
              Nombre, porción (1 taza, 1 cucharada…) y kcal. Los evaluados usan este listado en vivo.
            </p>
          </div>
          <button
            type="button"
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Agregar alimento
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${input}`}>
            <Search className={`w-3.5 h-3.5 ${muted}`} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o porción…"
              className="w-full bg-transparent text-xs outline-none"
            />
          </div>
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value as FoodCategory | 'TODAS')}
            className={`rounded-xl border px-3 py-2 text-xs font-semibold cursor-pointer ${input}`}
          >
            <option value="TODAS">Todas las categorías</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {FOOD_CATEGORY_META[c].label}
              </option>
            ))}
          </select>
        </div>

        <p className={`text-[11px] mt-3 ${muted}`}>
          {filtered.length} de {alimentos.length} alimentos
        </p>
      </div>

      {toast && (
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-2">
          <CheckCircle className="w-4 h-4" />
          {toast}
        </div>
      )}

      <div className={`rounded-3xl border overflow-hidden ${card}`}>
        <div className="overflow-x-auto max-h-[min(60vh,560px)] overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className={`sticky top-0 z-[1] ${isDark ? 'bg-slate-950 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
              <tr className="uppercase tracking-wider text-[10px]">
                <th className="px-4 py-3 font-black">Alimento</th>
                <th className="px-4 py-3 font-black">Porción</th>
                <th className="px-4 py-3 font-black">kcal</th>
                <th className="px-4 py-3 font-black">Tipo</th>
                <th className="px-4 py-3 font-black text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const meta = FOOD_CATEGORY_META[item.category];
                return (
                  <tr
                    key={item.id}
                    className={`border-t ${isDark ? 'border-slate-800 hover:bg-slate-950/80' : 'border-slate-100 hover:bg-slate-50'}`}
                  >
                    <td className={`px-4 py-2.5 font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {item.name}
                    </td>
                    <td className={`px-4 py-2.5 ${muted}`}>{item.sub}</td>
                    <td className="px-4 py-2.5 font-mono font-bold text-emerald-500">{item.cal}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${meta.chip}`}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className={`p-2 rounded-lg cursor-pointer ${isDark ? 'hover:bg-slate-800 text-blue-400' : 'hover:bg-slate-200 text-blue-600'}`}
                          title="Editar"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          className={`p-2 rounded-lg cursor-pointer ${isDark ? 'hover:bg-slate-800 text-rose-400' : 'hover:bg-rose-50 text-rose-600'}`}
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className={`px-4 py-8 text-center ${muted}`}>
                    No hay alimentos con ese filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSave}
            className={`w-full max-w-md rounded-3xl border p-6 space-y-4 shadow-2xl ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <h4 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {editingId ? 'Editar alimento' : 'Nuevo alimento'}
              </h4>
              <button type="button" onClick={() => setModalOpen(false)} className="p-2 rounded-lg cursor-pointer hover:opacity-70">
                <X className="w-4 h-4" />
              </button>
            </div>

            <label className="block space-y-1">
              <span className={`text-[10px] font-black uppercase tracking-wider ${muted}`}>Nombre</span>
              <input
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${input}`}
                placeholder="Ej. Arroz blanco"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className={`text-[10px] font-black uppercase tracking-wider ${muted}`}>kcal</span>
                <input
                  type="number"
                  min={0}
                  required
                  value={formCal}
                  onChange={(e) => setFormCal(Number(e.target.value))}
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none font-mono ${input}`}
                />
              </label>
              <label className="block space-y-1">
                <span className={`text-[10px] font-black uppercase tracking-wider ${muted}`}>Categoría</span>
                <select
                  value={formCat}
                  onChange={(e) => setFormCat(e.target.value as FoodCategory)}
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none cursor-pointer ${input}`}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {FOOD_CATEGORY_META[c].label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block space-y-1">
              <span className={`text-[10px] font-black uppercase tracking-wider ${muted}`}>
                Porción / medida
              </span>
              <input
                value={formSub}
                onChange={(e) => setFormSub(e.target.value)}
                className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${input}`}
                placeholder="1 taza, 1 cucharada, porción 180g…"
              />
            </label>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
            >
              {editingId ? 'Guardar cambios' : 'Agregar al catálogo'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
