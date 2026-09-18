import React, { useMemo, useRef, useState } from 'react';
import { SomatotipoTipo, PlanEntrenamiento, FichaEdadCatalogo } from '../../types/inbody';
import { DEFINICIONES_SOMATOTIPOS, GALERIA_ENTRENAMIENTO } from '../../data/mockData';
import { readImageAsDataUrl } from '../../utils/localPersistence';
import { uploadImageToStorage } from '../../lib/firestoreService';
import { extractYoutubeVideoId } from '../../utils/inbodyCalculations';
import { ZoomablePlanImage, ImageZoomLightbox } from '../ImageZoomLightbox';
import { YoutubeBackgroundAudio } from '../YoutubeBackgroundAudio';
import { PlanVideoEmbed } from '../PlanVideoEmbed';
import { 
  Dumbbell, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  Calendar, 
  Video, 
  ExternalLink,
  X,
  Filter,
  Flame,
  Upload,
  Image as ImageIcon,
  Users,
  Venus,
  Mars,
  Copy,
  Music,
  Eye,
  Play,
  Pause,
  Volume2,
  VolumeX,
} from 'lucide-react';

type SexoDestino = 'M' | 'F' | 'TODOS';

interface EntrenadorDashboardProps {
  planes: PlanEntrenamiento[];
  onAddPlan: (plan: PlanEntrenamiento) => void;
  onUpdatePlan: (plan: PlanEntrenamiento) => void;
  onDeletePlan: (id: string) => void;
  fichasEdad: FichaEdadCatalogo[];
  onAddFicha: (ficha: FichaEdadCatalogo) => void;
  onUpdateFicha: (ficha: FichaEdadCatalogo) => void;
  onDeleteFicha: (id: string) => void;
  isAdminMode?: boolean;
}

export const EntrenadorDashboard: React.FC<EntrenadorDashboardProps> = ({
  planes,
  onAddPlan,
  onUpdatePlan,
  onDeletePlan,
  fichasEdad,
  onAddFicha,
  onUpdateFicha,
  onDeleteFicha,
  isAdminMode = false
}) => {
  const [selectedSomatotipo, setSelectedSomatotipo] = useState<SomatotipoTipo | 'TODOS'>('TODOS');
  const [selectedFicha, setSelectedFicha] = useState<string>('TODAS');
  const [selectedSexo, setSelectedSexo] = useState<SexoDestino | 'FILTRO_TODOS'>('FILTRO_TODOS');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [previewPlan, setPreviewPlan] = useState<PlanEntrenamiento | null>(null);
  const [formPreviewSrc, setFormPreviewSrc] = useState<{ src: string; alt: string } | null>(null);
  const [previewAudioPlaying, setPreviewAudioPlaying] = useState(false);
  const [previewAudioMuted, setPreviewAudioMuted] = useState(false);
  const [previewSesionIniciada, setPreviewSesionIniciada] = useState(false);

  const [formNombre, setFormNombre] = useState('');
  const [formSomatotipo, setFormSomatotipo] = useState<SomatotipoTipo>('Tipo estándar');
  const [formFichaId, setFormFichaId] = useState<string>('');
  const [formSexo, setFormSexo] = useState<SexoDestino>('TODOS');
  const [formImagenUrl, setFormImagenUrl] = useState('');
  const [formPortadaUrl, setFormPortadaUrl] = useState('');
  const [formVideoUrl, setFormVideoUrl] = useState('');
  const [formMusicaFondoUrl, setFormMusicaFondoUrl] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formEnfoque, setFormEnfoque] = useState('Fuerza Táctica & Acondicionamiento Físico');
  const [formDiasSemana, setFormDiasSemana] = useState(4);
  const [formEjercicios, setFormEjercicios] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const portadaInputRef = useRef<HTMLInputElement>(null);

  // Nueva ficha (tarjeta)
  const [nuevaFichaNombre, setNuevaFichaNombre] = useState('');
  const [nuevaFichaMin, setNuevaFichaMin] = useState(20);
  const [nuevaFichaMax, setNuevaFichaMax] = useState(30);
  const [editingFichaId, setEditingFichaId] = useState<string | null>(null);

  const [notification, setNotification] = useState<string | null>(null);

  const showNotify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const fichaActiva = useMemo(
    () => fichasEdad.find(f => f.id === formFichaId) || fichasEdad[0],
    [fichasEdad, formFichaId]
  );

  const handleOpenAdd = () => {
    setEditingPlanId(null);
    setFormNombre('');
    setFormSomatotipo(selectedSomatotipo === 'TODOS' ? 'Tipo estándar' : selectedSomatotipo);
    setFormFichaId(selectedFicha === 'TODAS' ? (fichasEdad[0]?.id || '') : selectedFicha);
    setFormSexo(selectedSexo === 'FILTRO_TODOS' ? 'TODOS' : selectedSexo);
    setFormImagenUrl('/planes/PLAN1.jpeg');
    setFormPortadaUrl('https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80');
    setFormVideoUrl('https://www.youtube.com/watch?v=ml6cT4AZdqI');
    setFormMusicaFondoUrl('');
    setFormDescripcion('');
    setFormEnfoque('Fuerza Táctica & Rendimiento Operativo');
    setFormDiasSemana(4);
    setFormEjercicios('');
    setUploadError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plan: PlanEntrenamiento) => {
    setEditingPlanId(plan.id);
    setFormNombre(plan.nombre);
    setFormSomatotipo(plan.somatotipo);
    const matchFicha =
      fichasEdad.find(f => f.id === plan.fichaId) ||
      fichasEdad.find(f => f.nombre === plan.fichaEdad) ||
      fichasEdad[0];
    setFormFichaId(matchFicha?.id || '');
    setFormSexo(plan.sexoDestino || 'TODOS');
    setFormImagenUrl(plan.imagenUrl);
    setFormPortadaUrl(plan.portadaUrl || plan.imagenUrl);
    setFormVideoUrl(plan.videoUrl || '');
    setFormMusicaFondoUrl(plan.musicaFondoUrl || '');
    setFormDescripcion(plan.descripcion);
    setFormEnfoque(plan.enfoque || 'Fuerza Táctica & Rendimiento');
    setFormDiasSemana(plan.diasPorSemana || 4);
    setFormEjercicios(plan.ejerciciosClave ? plan.ejerciciosClave.join('\n') : '');
    setUploadError('');
    setIsModalOpen(true);
  };

  const handleImageUpload = async (file: File | null, target: 'guia' | 'portada') => {
    if (!file) return;
    setUploadError('');
    setUploading(true);
    try {
      if (!file.type.startsWith('image/') && !/\.(jpe?g|png|webp|gif)$/i.test(file.name)) {
        throw new Error('Seleccione un archivo de imagen (JPG, PNG o WEBP).');
      }
      const url = await uploadImageToStorage(file, target === 'portada' ? 'portadas' : 'guias');
      if (target === 'portada') {
        setFormPortadaUrl(url);
        showNotify(`Portada en la nube: ${file.name}`);
      } else {
        setFormImagenUrl(url);
        showNotify(`Imagen guía en la nube: ${file.name}`);
      }
    } catch (cloudErr) {
      console.error('Storage upload failed:', cloudErr);
      const message =
        cloudErr instanceof Error
          ? cloudErr.message
          : 'No se pudo subir a Firebase Storage.';
      setUploadError(message);
      // Fallback local SOLO para previsualizar; no sirve para que otros lo vean
      try {
        const dataUrl = await readImageAsDataUrl(file);
        if (target === 'portada') setFormPortadaUrl(dataUrl);
        else setFormImagenUrl(dataUrl);
        showNotify('Vista previa local (no compartida). Corrija Storage y vuelva a subir.');
      } catch {
        /* ignore */
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim() || !fichaActiva) return;

    const ejerciciosArray = formEjercicios
      ? formEjercicios.split('\n').map(s => s.trim()).filter(Boolean)
      : ['Entrenamiento de fuerza funcional', 'Acondicionamiento cardiovascular'];

    const base = {
      nombre: formNombre.trim(),
      somatotipo: formSomatotipo,
      fichaEdad: fichaActiva.nombre,
      fichaId: fichaActiva.id,
      rangoEdadMin: fichaActiva.edadMin,
      rangoEdadMax: fichaActiva.edadMax,
      sexoDestino: formSexo,
      portadaUrl: formPortadaUrl.trim() || formImagenUrl.trim() || '/planes/PLAN1.jpeg',
      imagenUrl: formImagenUrl.trim() || '/planes/PLAN1.jpeg',
      videoUrl: formVideoUrl.trim(),
      musicaFondoUrl: formMusicaFondoUrl.trim(),
      descripcion: formDescripcion.trim() || 'Plan de entrenamiento táctico militar.',
      enfoque: formEnfoque.trim(),
      diasPorSemana: Number(formDiasSemana),
      ejerciciosClave: ejerciciosArray,
      fechaCreacion: new Date().toISOString().split('T')[0],
      autor: isAdminMode ? 'Administrador Central' : 'Entrenador Táctico'
    };

    if (editingPlanId) {
      onUpdatePlan({ id: editingPlanId, ...base });
      showNotify(`Plan "${formNombre}" actualizado y guardado.`);
    } else {
      onAddPlan({ id: `entreno-${Date.now()}`, ...base });
      showNotify(`Nuevo plan "${formNombre}" guardado para ${fichaActiva.nombre}.`);
    }

    if (base.portadaUrl.startsWith('data:') || base.imagenUrl.startsWith('data:')) {
      setUploadError(
        'Guardó con imagen local (data URL). Otros no la verán. Suba de nuevo cuando Storage esté activo (reglas inbody/**).'
      );
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, nombre: string) => {
    if (confirm(`¿Estás seguro de eliminar el plan "${nombre}"?`)) {
      onDeletePlan(id);
      showNotify(`Plan "${nombre}" eliminado.`);
    }
  };

  const handleDuplicate = (plan: PlanEntrenamiento) => {
    const copia: PlanEntrenamiento = {
      ...plan,
      id: `entreno-${Date.now()}`,
      nombre: plan.nombre.includes('(copia)') ? plan.nombre : `${plan.nombre} (copia)`,
      fechaCreacion: new Date().toISOString().split('T')[0],
    };
    onAddPlan(copia);
    showNotify(`Plan duplicado: "${copia.nombre}".`);
  };

  const openPreview = (plan: PlanEntrenamiento) => {
    setPreviewAudioPlaying(false);
    setPreviewAudioMuted(false);
    setPreviewSesionIniciada(false);
    setPreviewPlan(plan);
  };

  const closePreview = () => {
    setPreviewAudioPlaying(false);
    setPreviewSesionIniciada(false);
    setPreviewPlan(null);
  };

  const handleSaveFichaCard = () => {
    if (!nuevaFichaNombre.trim()) {
      alert('Ingrese un nombre para la ficha (ej. Ficha Juvenil).');
      return;
    }
    if (nuevaFichaMin > nuevaFichaMax) {
      alert('La edad mínima no puede ser mayor que la máxima.');
      return;
    }
    if (editingFichaId) {
      onUpdateFicha({
        id: editingFichaId,
        nombre: nuevaFichaNombre.trim(),
        edadMin: Number(nuevaFichaMin),
        edadMax: Number(nuevaFichaMax),
      });
      showNotify('Ficha de edad actualizada.');
    } else {
      onAddFicha({
        id: `ficha-${Date.now()}`,
        nombre: nuevaFichaNombre.trim(),
        edadMin: Number(nuevaFichaMin),
        edadMax: Number(nuevaFichaMax),
      });
      showNotify('Nueva ficha de edad guardada como tarjeta.');
    }
    setEditingFichaId(null);
    setNuevaFichaNombre('');
    setNuevaFichaMin(20);
    setNuevaFichaMax(30);
  };

  const filteredPlanes = planes.filter(p => {
    const matchSomato = selectedSomatotipo === 'TODOS' || p.somatotipo === selectedSomatotipo;
    const matchFicha =
      selectedFicha === 'TODAS' ||
      p.fichaId === selectedFicha ||
      p.fichaEdad === fichasEdad.find(f => f.id === selectedFicha)?.nombre;
    const matchSexo =
      selectedSexo === 'FILTRO_TODOS' ||
      (p.sexoDestino || 'TODOS') === 'TODOS' ||
      p.sexoDestino === selectedSexo;
    return matchSomato && matchFicha && matchSexo;
  });

  const sexoLabel = (s: SexoDestino) =>
    s === 'M' ? 'Masculino' : s === 'F' ? 'Femenino' : 'Todos';

  return (
    <div className="space-y-6">
      
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {isAdminMode ? 'Gestión Administrativa de Entrenamiento' : 'Área de Preparación Física Táctica'}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
              Planes de Entrenamiento
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Sube imagen guía (JPG), video (YouTube/TikTok), sexo destino y fichas de edad. Las imágenes y planes se guardan en Firebase para que todos los usuarios las vean.
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Nuevo Plan</span>
          </button>
        </div>

        {/* Catálogo de Fichas (tarjetas editables) */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Fichas de edad (tarjetas reutilizables)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {fichasEdad.map(f => (
              <div
                key={f.id}
                className={`rounded-2xl border p-3.5 transition-all ${
                  selectedFicha === f.id
                    ? 'bg-blue-600/20 border-blue-500/50'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-600'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedFicha(selectedFicha === f.id ? 'TODAS' : f.id)}
                  className="w-full text-left cursor-pointer"
                >
                  <div className="text-xs font-black text-white">{f.nombre}</div>
                  <div className="text-[11px] text-cyan-400 font-mono mt-1">{f.edadMin} – {f.edadMax} años</div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {planes.filter(p => p.fichaId === f.id || p.fichaEdad === f.nombre).length} plan(es)
                  </div>
                </button>
                <div className="flex gap-1.5 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingFichaId(f.id);
                      setNuevaFichaNombre(f.nombre);
                      setNuevaFichaMin(f.edadMin);
                      setNuevaFichaMax(f.edadMax);
                    }}
                    className="flex-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`¿Eliminar ficha "${f.nombre}"? Los planes existentes no se borran.`)) {
                        onDeleteFicha(f.id);
                        if (selectedFicha === f.id) setSelectedFicha('TODAS');
                      }
                    }}
                    className="px-2 py-1 rounded-lg bg-rose-950/40 text-rose-400 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <input
              type="text"
              value={nuevaFichaNombre}
              onChange={(e) => setNuevaFichaNombre(e.target.value)}
              placeholder="Nombre ficha (ej. Cadetes 18-22)"
              className="sm:col-span-2 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-blue-500"
            />
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={nuevaFichaMin}
                onChange={(e) => setNuevaFichaMin(Number(e.target.value))}
                className="w-full px-2 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none"
                title="Edad desde"
              />
              <span className="text-slate-500 text-xs">a</span>
              <input
                type="number"
                value={nuevaFichaMax}
                onChange={(e) => setNuevaFichaMax(Number(e.target.value))}
                className="w-full px-2 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none"
                title="Edad hasta"
              />
            </div>
            <button
              type="button"
              onClick={handleSaveFichaCard}
              className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold cursor-pointer"
            >
              {editingFichaId ? 'Actualizar ficha' : '+ Guardar ficha'}
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-blue-400" />
              <span>Somatotipo</span>
            </label>
            <select
              value={selectedSomatotipo}
              onChange={(e) => setSelectedSomatotipo(e.target.value as SomatotipoTipo | 'TODOS')}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none focus:border-blue-500"
            >
              <option value="TODOS">Todos los Somatotipos</option>
              {Object.values(DEFINICIONES_SOMATOTIPOS).map((def) => (
                <option key={def.clave} value={def.nombre}>{def.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>Ficha de Edad</span>
            </label>
            <select
              value={selectedFicha}
              onChange={(e) => setSelectedFicha(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none focus:border-blue-500"
            >
              <option value="TODAS">Todas las Fichas</option>
              {fichasEdad.map((f) => (
                <option key={f.id} value={f.id}>{f.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>Sexo destino</span>
            </label>
            <select
              value={selectedSexo}
              onChange={(e) => setSelectedSexo(e.target.value as SexoDestino | 'FILTRO_TODOS')}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none focus:border-blue-500"
            >
              <option value="FILTRO_TODOS">Todos (sin filtrar)</option>
              <option value="TODOS">Planes mixtos (TODOS)</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-slate-800/80 text-xs text-slate-400">
          <span className="font-bold text-slate-200">Mostrando {filteredPlanes.length} de {planes.length} planes</span>
          <span>•</span>
          <span className="text-blue-400">{fichasEdad.length} fichas en catálogo</span>
        </div>
      </div>

      {notification && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl text-blue-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-blue-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {filteredPlanes.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
          <Dumbbell className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">No hay planes con este filtro</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Puede subir 3 o más planes por somatotipo + ficha + sexo para que el evaluado elija.
          </p>
          <button onClick={handleOpenAdd} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl cursor-pointer">
            Crear Plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlanes.map((plan) => (
            <div key={plan.id} className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between transition-all group">
              <div>
                <div className="relative h-48 w-full overflow-hidden bg-slate-950">
                  <img
                    src={plan.portadaUrl || plan.imagenUrl}
                    alt={plan.nombre}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/40" />
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border bg-blue-500/20 text-blue-300 border-blue-500/40 backdrop-blur-md">
                      {plan.fichaEdad}
                    </span>
                    <span className="text-[10px] font-bold text-white bg-slate-950/80 px-2.5 py-1 rounded-full border border-slate-700 backdrop-blur-md flex items-center gap-1">
                      {(plan.sexoDestino || 'TODOS') === 'M' ? <Mars className="w-3 h-3" /> : (plan.sexoDestino || 'TODOS') === 'F' ? <Venus className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                      {sexoLabel(plan.sexoDestino || 'TODOS')}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-200 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-700/80 backdrop-blur">
                      {plan.somatotipo}
                    </span>
                    <div className="flex items-center gap-1">
                      {plan.videoUrl && (
                        <span className="text-[10px] font-bold text-cyan-400 bg-slate-950/90 px-2 py-0.5 rounded flex items-center gap-1 border border-cyan-500/30">
                          <Video className="w-3 h-3" />
                          Video
                        </span>
                      )}
                      {plan.musicaFondoUrl && (
                        <span className="text-[10px] font-bold text-fuchsia-300 bg-slate-950/90 px-2 py-0.5 rounded flex items-center gap-1 border border-fuchsia-500/30">
                          <Music className="w-3 h-3" />
                          Audio
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <h3 className="text-base font-black text-white leading-snug group-hover:text-blue-400 transition-colors">
                    {plan.nombre}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-semibold">
                    <Flame className="w-3.5 h-3.5" />
                    <span>{plan.enfoque || 'Acondicionamiento Físico'}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{plan.descripcion}</p>
                  {plan.videoUrl && (
                    <a href={plan.videoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-bold">
                      <Video className="w-3.5 h-3.5" />
                      Ver video
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-500">{plan.autor || 'Entrenador'}</span>
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  <button
                    onClick={() => openPreview(plan)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-bold transition-colors cursor-pointer border border-emerald-500/40"
                    title="Ver como lo ve el usuario"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Ver
                  </button>
                  <button
                    onClick={() => handleDuplicate(plan)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer border border-slate-700"
                    title="Duplicar este plan"
                  >
                    <Copy className="w-3.5 h-3.5 text-cyan-400" />
                    Duplicar
                  </button>
                  <button
                    onClick={() => handleOpenEdit(plan)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer border border-slate-700"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(plan.id, plan.nombre)}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer border border-slate-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 my-4 sm:my-6 max-h-[min(92vh,900px)] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 sticky top-0 bg-slate-900 z-10 -mx-1 px-1">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                  {editingPlanId ? 'Modificar plan' : 'Nuevo plan de entrenamiento'}
                </span>
                <h3 className="text-lg font-black text-white mt-1">
                  Portada + Guía + Video + Sexo + Ficha
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Nombre del Plan *</label>
                <input
                  type="text"
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  placeholder="Ej: Rutina Diaria — Entrena tu cuerpo completo"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Somatotipo *</label>
                  <select
                    value={formSomatotipo}
                    onChange={(e) => setFormSomatotipo(e.target.value as SomatotipoTipo)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none focus:border-blue-500"
                  >
                    {Object.values(DEFINICIONES_SOMATOTIPOS).map((def) => (
                      <option key={def.clave} value={def.nombre}>{def.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Ficha de edad *</label>
                  <select
                    value={formFichaId}
                    onChange={(e) => setFormFichaId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none focus:border-blue-500"
                    required
                  >
                    {fichasEdad.map((f) => (
                      <option key={f.id} value={f.id}>{f.nombre} ({f.edadMin}-{f.edadMax})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Dirigido a (sexo) *</label>
                  <select
                    value={formSexo}
                    onChange={(e) => setFormSexo(e.target.value as SexoDestino)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none focus:border-blue-500"
                  >
                    <option value="TODOS">Todos</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </div>
              </div>

              {/* Portada */}
              <div className="space-y-2 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Imagen de portada (hero / miniatura) *
                </label>
                <p className="text-[10px] text-slate-500">Se ve grande al abrir el plan y luego pequeña junto al título.</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => portadaInputRef.current?.click()}
                    disabled={uploading}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    Cargar portada
                  </button>
                  <input
                    ref={portadaInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e.target.files?.[0] || null, 'portada')}
                  />
                </div>
                <input
                  type="text"
                  value={formPortadaUrl.startsWith('data:') ? '(portada cargada desde archivo)' : formPortadaUrl}
                  onChange={(e) => {
                    if (!e.target.value.startsWith('(')) setFormPortadaUrl(e.target.value);
                  }}
                  placeholder="O pegue URL de portada: https://..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-blue-500"
                />
                {formPortadaUrl && (
                  <button
                    type="button"
                    onClick={() => setFormPreviewSrc({ src: formPortadaUrl, alt: 'Portada del plan' })}
                    className="mt-2 rounded-xl overflow-hidden border border-slate-800 bg-black h-20 w-full cursor-zoom-in text-left"
                    title="Ver portada a tamaño completo"
                  >
                    <img src={formPortadaUrl} alt="Portada" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                )}
                <div className="flex gap-1 overflow-x-auto pt-1">
                  {GALERIA_ENTRENAMIENTO.map((im, idx) => (
                    <button key={idx} type="button" onClick={() => setFormPortadaUrl(im.url)} className="p-0.5 rounded border border-slate-800 hover:border-indigo-500 shrink-0 cursor-pointer">
                      <img src={im.url} alt={im.nombre} className="w-7 h-7 rounded object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Imagen guía: cargar archivo + URL */}
              <div className="space-y-2 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                  Imagen guía del entrenamiento (PLAN completo) *
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    {uploading ? 'Cargando…' : 'Cargar imagen guía'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormImagenUrl('/planes/PLAN1.jpeg')}
                    className="px-3 py-2.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold cursor-pointer border border-slate-700"
                  >
                    Usar PLAN1.jpeg
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e.target.files?.[0] || null, 'guia')}
                  />
                </div>
                <input
                  type="text"
                  value={formImagenUrl.startsWith('data:') ? '(imagen guía cargada desde archivo)' : formImagenUrl}
                  onChange={(e) => {
                    if (!e.target.value.startsWith('(')) setFormImagenUrl(e.target.value);
                  }}
                  placeholder="O pegue URL: https://..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-blue-500"
                />
                {uploadError && <p className="text-[11px] text-rose-400">{uploadError}</p>}
                {formImagenUrl && (
                  <button
                    type="button"
                    onClick={() => setFormPreviewSrc({ src: formImagenUrl, alt: 'Imagen guía del plan' })}
                    className="mt-2 rounded-xl overflow-hidden border border-slate-800 bg-black max-h-28 w-full cursor-zoom-in text-left"
                    title="Ver imagen guía a tamaño completo"
                  >
                    <img src={formImagenUrl} alt="Vista previa guía" className="w-full max-h-28 object-contain" referrerPolicy="no-referrer" />
                  </button>
                )}
                <div className="flex gap-1 overflow-x-auto pt-1">
                  {GALERIA_ENTRENAMIENTO.map((im, idx) => (
                    <button key={idx} type="button" onClick={() => setFormImagenUrl(im.url)} className="p-0.5 rounded border border-slate-800 hover:border-blue-500 shrink-0 cursor-pointer">
                      <img src={im.url} alt={im.nombre} className="w-7 h-7 rounded object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Video (YouTube / TikTok / enlace)
                </label>
                <input
                  type="url"
                  value={formVideoUrl}
                  onChange={(e) => setFormVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... o TikTok"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-blue-500"
                />
                <span className="text-[10px] text-slate-500 block mt-1">Se muestra debajo de la imagen guía al abrir el plan.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-cyan-400" />
                  Música de fondo (YouTube)
                </label>
                <input
                  type="url"
                  value={formMusicaFondoUrl}
                  onChange={(e) => setFormMusicaFondoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-cyan-500"
                />
                <span className="text-[10px] text-slate-500 block mt-1">
                  Audio de fondo oculto. Se reproduce al pulsar Iniciar entrenamiento.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Días / semana</label>
                  <select
                    value={formDiasSemana}
                    onChange={(e) => setFormDiasSemana(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none"
                  >
                    {[3, 4, 5, 6].map(n => <option key={n} value={n}>{n} días</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Enfoque</label>
                  <input
                    type="text"
                    value={formEnfoque}
                    onChange={(e) => setFormEnfoque(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Descripción *</label>
                <textarea
                  value={formDescripcion}
                  onChange={(e) => setFormDescripcion(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Ejercicios (uno por línea)</label>
                <textarea
                  value={formEjercicios}
                  onChange={(e) => setFormEjercicios(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 font-mono text-xs bg-slate-950 border border-slate-700 rounded-xl text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-blue-600/30 cursor-pointer">
                  {editingPlanId ? 'Guardar cambios' : 'Almacenar plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vista previa: cómo lo ve el evaluado (con música real) */}
      {previewPlan && (() => {
        const musicaVideoId = extractYoutubeVideoId(previewPlan.musicaFondoUrl || '');
        return (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-start justify-center p-3 sm:p-4 overflow-y-auto">
            {musicaVideoId && (
              <YoutubeBackgroundAudio
                videoId={musicaVideoId}
                playing={previewAudioPlaying}
                muted={previewAudioMuted}
              />
            )}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full shadow-2xl my-4 sm:my-6 overflow-hidden max-h-[min(94vh,960px)] flex flex-col">
              <div className="flex items-center justify-between gap-3 p-4 sm:p-5 border-b border-slate-800 bg-slate-950/95 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border border-slate-700 shrink-0 bg-slate-800">
                    <img
                      src={previewPlan.portadaUrl || previewPlan.imagenUrl}
                      alt=""
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                      Vista del usuario · Previsualización
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-white truncate">
                      {previewPlan.nombre}
                    </h3>
                    <p className="text-[11px] text-slate-400 truncate">
                      {previewPlan.somatotipo} · {previewPlan.fichaEdad} · {sexoLabel(previewPlan.sexoDestino || 'TODOS')}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closePreview}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] sm:text-xs font-bold uppercase tracking-wider cursor-pointer border border-slate-700 shrink-0"
                >
                  <X className="w-4 h-4 text-emerald-400" />
                  Cerrar
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 min-h-0">
                <div className="space-y-5 rounded-3xl border border-slate-800 bg-slate-950 p-4 sm:p-6">
                  <div>
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                      {previewPlan.enfoque || 'Entrenamiento'} · {previewPlan.fichaEdad}
                    </span>
                    <h4 className="text-xl font-black text-white mt-1">{previewPlan.nombre}</h4>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Descripción e instrucciones
                    </span>
                    <p className="text-sm text-slate-300 leading-relaxed">{previewPlan.descripcion}</p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Imagen guía del plan
                    </span>
                    <ZoomablePlanImage
                      src={previewPlan.imagenUrl}
                      alt={previewPlan.nombre}
                      overlay={
                        musicaVideoId ? (
                          <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewSesionIniciada(true);
                                setPreviewAudioPlaying((prev) => !prev);
                              }}
                              className="w-9 h-9 rounded-full bg-slate-950/80 border border-white/20 text-white flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer backdrop-blur-md shadow-lg"
                              title={previewAudioPlaying ? 'Pausar música' : 'Reproducir música'}
                            >
                              {previewAudioPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => setPreviewAudioMuted((prev) => !prev)}
                              className="w-9 h-9 rounded-full bg-slate-950/80 border border-white/20 text-white flex items-center justify-center hover:bg-slate-700 transition-colors cursor-pointer backdrop-blur-md shadow-lg"
                              title={previewAudioMuted ? 'Activar sonido' : 'Silenciar'}
                            >
                              {previewAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                            </button>
                          </div>
                        ) : null
                      }
                    />
                  </div>

                  {musicaVideoId ? (
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewSesionIniciada(true);
                        setPreviewAudioPlaying(true);
                      }}
                      className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        previewSesionIniciada && previewAudioPlaying
                          ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/30'
                          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30'
                      }`}
                    >
                      {previewSesionIniciada && previewAudioPlaying ? (
                        <>
                          <Music className="w-4 h-4" />
                          Entrenamiento en curso · escuchando audio
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Iniciar entrenamiento (probar música)
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => setPreviewSesionIniciada(true)}
                        className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-600/30"
                      >
                        <Play className="w-4 h-4" />
                        Iniciar entrenamiento
                      </button>
                      <p className="text-[10px] text-amber-400/90 text-center">
                        Este plan no tiene música de fondo cargada. Agrega una URL de YouTube en Editar para probarla aquí.
                      </p>
                    </div>
                  )}

                  {previewPlan.videoUrl && (
                    <PlanVideoEmbed videoUrl={previewPlan.videoUrl} title={previewPlan.nombre} />
                  )}

                  {previewPlan.ejerciciosClave && previewPlan.ejerciciosClave.length > 0 && (
                    <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Protocolos (opcional)
                      </span>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {previewPlan.ejerciciosClave.map((ej, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                            <span>{ej}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <p className="text-[10px] leading-relaxed text-center text-orange-200/85 pt-1">
                    Entrena con seguridad: suspende el ejercicio ante dolor, mareo o malestar. Adapta el
                    volumen a tu nivel y consulta a un profesional cuando exista una condición médica.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {formPreviewSrc && (
        <ImageZoomLightbox
          src={formPreviewSrc.src}
          alt={formPreviewSrc.alt}
          onClose={() => setFormPreviewSrc(null)}
        />
      )}
    </div>
  );
};
