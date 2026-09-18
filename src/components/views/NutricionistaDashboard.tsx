import React, { useState } from 'react';
import { SomatotipoTipo, RegionEcuador, PlanNutricion } from '../../types/inbody';
import { DEFINICIONES_SOMATOTIPOS, GALERIA_PLATOS_ECUADOR } from '../../data/mockData';
import { FoodItem } from '../../data/foodDatabase';
import { AlimentosCalculadoraManager } from '../AlimentosCalculadoraManager';
import { BaremosEdadCorporalManager } from '../BaremosEdadCorporalManager';
import { 
  Salad, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  MapPin, 
  Flame, 
  Image as ImageIcon,
  X,
  Filter,
  Sparkles,
  Copy,
  Calculator,
  Activity
} from 'lucide-react';

interface NutricionistaDashboardProps {
  planes: PlanNutricion[];
  onAddPlan: (plan: PlanNutricion) => void;
  onUpdatePlan: (plan: PlanNutricion) => void;
  onDeletePlan: (id: string) => void;
  isAdminMode?: boolean;
  alimentos?: FoodItem[];
  onAddAlimento?: (item: FoodItem) => void;
  onUpdateAlimento?: (item: FoodItem) => void;
  onDeleteAlimento?: (id: string) => void;
}

export const NutricionistaDashboard: React.FC<NutricionistaDashboardProps> = ({
  planes,
  onAddPlan,
  onUpdatePlan,
  onDeletePlan,
  isAdminMode = false,
  alimentos = [],
  onAddAlimento,
  onUpdateAlimento,
  onDeleteAlimento,
}) => {
  const [nutriTab, setNutriTab] = useState<'platos' | 'calculadora' | 'baremos'>('platos');
  const [selectedSomatotipo, setSelectedSomatotipo] = useState<SomatotipoTipo | 'TODOS'>('TODOS');
  const [selectedRegion, setSelectedRegion] = useState<RegionEcuador | 'TODAS'>('TODAS');
  
  // Modal de Agregar / Editar Plan
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  // Form State
  const [formNombre, setFormNombre] = useState('');
  const [formSomatotipo, setFormSomatotipo] = useState<SomatotipoTipo>('Tipo estándar');
  const [formRegion, setFormRegion] = useState<RegionEcuador>('Sierra');
  const [formImagenUrl, setFormImagenUrl] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formCalorias, setFormCalorias] = useState(2100);
  const [formProteinas, setFormProteinas] = useState(140);
  const [formCarbos, setFormCarbos] = useState(210);
  const [formGrasas, setFormGrasas] = useState(55);
  const [formAlimentos, setFormAlimentos] = useState('');

  const [notification, setNotification] = useState<string | null>(null);

  const showNotify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleOpenAdd = () => {
    setEditingPlanId(null);
    setFormNombre('');
    setFormSomatotipo(selectedSomatotipo === 'TODOS' ? 'Tipo estándar' : selectedSomatotipo);
    setFormRegion(selectedRegion === 'TODAS' ? 'Sierra' : selectedRegion);
    setFormImagenUrl(GALERIA_PLATOS_ECUADOR[0].url);
    setFormDescripcion('');
    setFormCalorias(2100);
    setFormProteinas(140);
    setFormCarbos(210);
    setFormGrasas(55);
    setFormAlimentos('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plan: PlanNutricion) => {
    setEditingPlanId(plan.id);
    setFormNombre(plan.nombre);
    setFormSomatotipo(plan.somatotipo);
    setFormRegion(plan.region);
    setFormImagenUrl(plan.imagenUrl);
    setFormDescripcion(plan.descripcion);
    setFormCalorias(plan.caloriasAprox || 2100);
    setFormProteinas(plan.proteinasG || 140);
    setFormCarbos(plan.carbosG || 210);
    setFormGrasas(plan.grasasG || 55);
    setFormAlimentos(plan.alimentosRecomendados ? plan.alimentosRecomendados.join(', ') : '');
    setIsModalOpen(true);
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim()) return;

    const alimentosArray = formAlimentos
      ? formAlimentos.split(',').map(s => s.trim()).filter(Boolean)
      : ['Alimentos frescos de la región'];

    if (editingPlanId) {
      // Actualizar
      const updated: PlanNutricion = {
        id: editingPlanId,
        nombre: formNombre.trim(),
        somatotipo: formSomatotipo,
        region: formRegion,
        imagenUrl: formImagenUrl.trim() || GALERIA_PLATOS_ECUADOR[0].url,
        descripcion: formDescripcion.trim() || 'Plan nutricional adaptado para requerimientos fisiológicos.',
        caloriasAprox: Number(formCalorias),
        proteinasG: Number(formProteinas),
        carbosG: Number(formCarbos),
        grasasG: Number(formGrasas),
        alimentosRecomendados: alimentosArray,
        fechaCreacion: new Date().toISOString().split('T')[0],
        autor: isAdminMode ? 'Administrador Central' : 'Nutricionista Oficial'
      };
      onUpdatePlan(updated);
      showNotify(`Plan "${formNombre}" actualizado correctamente.`);
    } else {
      // Crear
      const newPlan: PlanNutricion = {
        id: `nutri-${Date.now()}`,
        nombre: formNombre.trim(),
        somatotipo: formSomatotipo,
        region: formRegion,
        imagenUrl: formImagenUrl.trim() || GALERIA_PLATOS_ECUADOR[0].url,
        descripcion: formDescripcion.trim() || 'Plan nutricional adaptado para requerimientos fisiológicos.',
        caloriasAprox: Number(formCalorias),
        proteinasG: Number(formProteinas),
        carbosG: Number(formCarbos),
        grasasG: Number(formGrasas),
        alimentosRecomendados: alimentosArray,
        fechaCreacion: new Date().toISOString().split('T')[0],
        autor: isAdminMode ? 'Administrador Central' : 'Nutricionista Oficial'
      };
      onAddPlan(newPlan);
      showNotify(`Nuevo plan "${formNombre}" para ${formRegion} guardado.`);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, nombre: string) => {
    if (confirm(`¿Estás seguro de eliminar el plan "${nombre}"?`)) {
      onDeletePlan(id);
      showNotify(`Plan "${nombre}" eliminado.`);
    }
  };

  const handleDuplicate = (plan: PlanNutricion) => {
    const copia: PlanNutricion = {
      ...plan,
      id: `nutri-${Date.now()}`,
      nombre: plan.nombre.includes('(copia)') ? plan.nombre : `${plan.nombre} (copia)`,
      fechaCreacion: new Date().toISOString().split('T')[0],
    };
    onAddPlan(copia);
    showNotify(`Plan duplicado: "${copia.nombre}".`);
  };

  // Filtrado de planes
  const filteredPlanes = planes.filter(p => {
    const matchSomato = selectedSomatotipo === 'TODOS' || p.somatotipo === selectedSomatotipo;
    const matchReg = selectedRegion === 'TODAS' || p.region === selectedRegion;
    return matchSomato && matchReg;
  });

  const getRegionBadgeColor = (r: RegionEcuador) => {
    switch (r) {
      case 'Sierra':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Costa':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Oriente':
        return 'bg-lime-500/10 text-lime-400 border-lime-500/30';
      case 'Galápagos':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      default:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    }
  };

  return (
    <div className="space-y-6">

      {/* Pestañas: Platos | Calculadora */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-slate-950 border border-slate-800 w-fit">
        <button
          type="button"
          onClick={() => setNutriTab('platos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all ${
            nutriTab === 'platos'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Salad className="w-3.5 h-3.5" />
          Platos
        </button>
        <button
          type="button"
          onClick={() => setNutriTab('calculadora')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all ${
            nutriTab === 'calculadora'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          Calculadora
        </button>
        <button
          type="button"
          onClick={() => setNutriTab('baremos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all ${
            nutriTab === 'baremos'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Baremos edad
        </button>
      </div>

      {nutriTab === 'baremos' && <BaremosEdadCorporalManager />}

      {nutriTab === 'calculadora' && onAddAlimento && onUpdateAlimento && onDeleteAlimento && (
        <AlimentosCalculadoraManager
          alimentos={alimentos}
          onAdd={onAddAlimento}
          onUpdate={onUpdateAlimento}
          onDelete={onDeleteAlimento}
        />
      )}

      {nutriTab === 'platos' && (
      <>
      {/* Encabezado */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {isAdminMode ? 'Gestión Administrativa de Nutrición' : 'Departamento de Nutrición Táctica'}
              </span>
              <span className="text-xs text-slate-400">Distribución por Somatotipo & Región</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
              Planes Nutricionales (Sierra, Costa, Oriente)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Carga, edita o elimina planes nutricionales basados en los 9 somatotipos y la geografía del evaluado.
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Nuevo Plan</span>
          </button>
        </div>

        {/* Filtros de Somatotipo y Región */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-emerald-400" />
              <span>Filtrar por Somatotipo</span>
            </label>
            <select
              value={selectedSomatotipo}
              onChange={(e) => setSelectedSomatotipo(e.target.value as SomatotipoTipo | 'TODOS')}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none focus:border-emerald-500"
            >
              <option value="TODOS">Todos los Somatotipos ({planes.length} planes)</option>
              {Object.values(DEFINICIONES_SOMATOTIPOS).map((def) => (
                <option key={def.clave} value={def.nombre}>
                  {def.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Filtrar por Región Geográfica</span>
            </label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value as RegionEcuador | 'TODAS')}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none focus:border-emerald-500"
            >
              <option value="TODAS">Todas las Regiones (Sierra, Costa, Oriente, Galápagos)</option>
              <option value="Sierra">Sierra Andina</option>
              <option value="Costa">Costa del Pacífico</option>
              <option value="Oriente">Oriente / Amazonía</option>
              <option value="Galápagos">Región Insular / Galápagos</option>
            </select>
          </div>
        </div>

        {/* Resumen de conteo */}
        <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-slate-800/80 text-xs text-slate-400">
          <span className="font-bold text-slate-200">
            Mostrando {filteredPlanes.length} planes nutricionales disponibles
          </span>
          <span>•</span>
          <span className="text-emerald-400">
            {planes.filter(p => p.region === 'Sierra').length} Sierra
          </span>
          <span>•</span>
          <span className="text-amber-400">
            {planes.filter(p => p.region === 'Costa').length} Costa
          </span>
          <span>•</span>
          <span className="text-lime-400">
            {planes.filter(p => p.region === 'Oriente').length} Oriente
          </span>
        </div>
      </div>

      {notification && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Grid de Planes Nutricionales */}
      {filteredPlanes.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
          <Salad className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">No hay planes registrados para este filtro</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Puedes crear un nuevo plan con una fotografía del plato, descripción y asignarlo a {selectedRegion} y {selectedSomatotipo}.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            Crear Plan para este Criterio
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlanes.map((plan) => (
            <div
              key={plan.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between transition-all group"
            >
              {/* Imagen del Plato */}
              <div>
                <div className="relative h-48 w-full overflow-hidden bg-slate-950">
                  <img
                    src={plan.imagenUrl}
                    alt={plan.nombre}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/30" />
                  
                  {/* Badges superiores */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border backdrop-blur-md ${getRegionBadgeColor(plan.region)}`}>
                      📍 {plan.region}
                    </span>
                    <span className="text-[10px] font-bold text-white bg-slate-950/80 px-2.5 py-1 rounded-full border border-slate-700 backdrop-blur-md">
                      {plan.caloriasAprox || 2100} kcal
                    </span>
                  </div>

                  {/* Somatotipo Badge */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <span className="text-[10px] font-bold text-slate-200 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-700/80 backdrop-blur">
                      {plan.somatotipo}
                    </span>
                  </div>
                </div>

                {/* Contenido del Plan */}
                <div className="p-5 space-y-3">
                  <h3 className="text-base font-black text-white leading-snug group-hover:text-emerald-400 transition-colors">
                    {plan.nombre}
                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                    {plan.descripcion}
                  </p>

                  {/* Macros Desglosados */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center">
                    <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800">
                      <span className="text-[9px] font-bold text-rose-400 block uppercase">Proteína</span>
                      <span className="text-xs font-mono font-bold text-white">{plan.proteinasG || 140}g</span>
                    </div>
                    <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800">
                      <span className="text-[9px] font-bold text-blue-400 block uppercase">Carbos</span>
                      <span className="text-xs font-mono font-bold text-white">{plan.carbosG || 210}g</span>
                    </div>
                    <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800">
                      <span className="text-[9px] font-bold text-emerald-400 block uppercase">Grasas</span>
                      <span className="text-xs font-mono font-bold text-white">{plan.grasasG || 55}g</span>
                    </div>
                  </div>

                  {/* Alimentos Clave */}
                  {plan.alimentosRecomendados && plan.alimentosRecomendados.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Ingredientes recomendados:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {plan.alimentosRecomendados.slice(0, 4).map((al, idx) => (
                          <span key={idx} className="text-[10px] bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800 text-slate-300">
                            {al}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Botones de Acción (Editar / Eliminar) */}
              <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-500">
                  {plan.autor || 'Nutricionista'}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleDuplicate(plan)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer border border-slate-700"
                    title="Duplicar este plan"
                  >
                    <Copy className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Duplicar</span>
                  </button>
                  <button
                    onClick={() => handleOpenEdit(plan)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer border border-slate-700"
                    title="Editar este plan"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => handleDelete(plan.id, plan.nombre)}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer border border-slate-700 hover:border-rose-800/60"
                    title="Eliminar este plan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* MODAL CREAR / EDITAR PLAN NUTRICIONAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-5 my-8">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  {editingPlanId ? 'Modificar Plan Nutricional' : 'Nuevo Plan Nutricional por Somatotipo & Región'}
                </span>
                <h3 className="text-xl font-black text-white mt-1">
                  {editingPlanId ? 'Editar Detalles del Plan' : 'Cargar Plato y Pautas Nutricionales'}
                </h3>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Nombre del Plan / Plato *
                </label>
                <input
                  type="text"
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  placeholder="Ej: Plato Costeño de Pescado a la Plancha con Verde Asado"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Somatotipo Asignado *
                  </label>
                  <select
                    value={formSomatotipo}
                    onChange={(e) => setFormSomatotipo(e.target.value as SomatotipoTipo)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none focus:border-emerald-500"
                  >
                    {Object.values(DEFINICIONES_SOMATOTIPOS).map((def) => (
                      <option key={def.clave} value={def.nombre}>
                        {def.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Región Geográfica *
                  </label>
                  <select
                    value={formRegion}
                    onChange={(e) => setFormRegion(e.target.value as RegionEcuador)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none focus:border-emerald-500"
                  >
                    <option value="Sierra">Sierra</option>
                    <option value="Costa">Costa</option>
                    <option value="Oriente">Oriente</option>
                    <option value="Galápagos">Galápagos</option>
                  </select>
                </div>
              </div>

              {/* Imagen: URL o Seleccionar de Galería Ecuatoriana */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>URL de Imagen del Plato / Menú *</span>
                  <span className="text-[10px] text-emerald-400 font-semibold">O selecciona una sugerencia abajo</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={formImagenUrl}
                    onChange={(e) => setFormImagenUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-emerald-500"
                    required
                  />
                  {formImagenUrl && (
                    <img
                      src={formImagenUrl}
                      alt="Preview"
                      className="w-11 h-11 rounded-xl object-cover border border-slate-700 shrink-0"
                    />
                  )}
                </div>

                {/* Galería rápida de platos ecuatorianos */}
                <div className="mt-2.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Platos Típicos Ecuatorianos Disponibles:
                  </span>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {GALERIA_PLATOS_ECUADOR.map((pl, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setFormImagenUrl(pl.url);
                          if (!formNombre) setFormNombre(pl.nombre);
                          setFormRegion(pl.region as RegionEcuador);
                        }}
                        className={`shrink-0 flex items-center gap-1.5 p-1 rounded-xl border transition-all cursor-pointer ${
                          formImagenUrl === pl.url
                            ? 'border-emerald-500 bg-emerald-500/20 ring-1 ring-emerald-500'
                            : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                        }`}
                      >
                        <img src={pl.url} alt={pl.nombre} className="w-8 h-8 rounded-lg object-cover" />
                        <div className="text-left pr-2">
                          <span className="text-[10px] font-bold text-slate-200 block truncate max-w-[120px]">{pl.nombre}</span>
                          <span className="text-[9px] text-emerald-400 font-semibold">{pl.region}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Descripción, Preparación y Pautas *
                </label>
                <textarea
                  value={formDescripcion}
                  onChange={(e) => setFormDescripcion(e.target.value)}
                  rows={3}
                  placeholder="Instrucciones de cocción, horario sugerido, distribución en platos y recomendaciones..."
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {/* Macros y Calorías */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Calorías (kcal)</label>
                  <input
                    type="number"
                    value={formCalorias}
                    onChange={(e) => setFormCalorias(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-rose-400 uppercase mb-1">Proteínas (g)</label>
                  <input
                    type="number"
                    value={formProteinas}
                    onChange={(e) => setFormProteinas(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-blue-400 uppercase mb-1">Carbos (g)</label>
                  <input
                    type="number"
                    value={formCarbos}
                    onChange={(e) => setFormCarbos(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-emerald-400 uppercase mb-1">Grasas (g)</label>
                  <input
                    type="number"
                    value={formGrasas}
                    onChange={(e) => setFormGrasas(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none"
                  />
                </div>
              </div>

              {/* Ingredientes clave */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Alimentos e Ingredientes Recomendados (separados por coma)
                </label>
                <input
                  type="text"
                  value={formAlimentos}
                  onChange={(e) => setFormAlimentos(e.target.value)}
                  placeholder="Pechuga a la plancha, Verde cocido, Ensalada criolla, Aguacate..."
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>

              {/* Botones de acción */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  {editingPlanId ? 'Guardar Cambios' : 'Almacenar Plan Nutricional'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      </>
      )}

    </div>
  );
};
