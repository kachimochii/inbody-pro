export type UserRole = 'admin' | 'operador' | 'usuario' | 'entrenador' | 'nutricionista';

export type Sexo = 'M' | 'F';

export type SomatotipoTipo = 
  | 'Tipo obeso edematoso'
  | 'Tipo muscular con sobrepeso'
  | 'Tipo de sobrepeso muscular'
  | 'Falta de tipo de ejercicio'
  | 'Tipo estándar'
  | 'Tipo muscular estándar'
  | 'Tipo delgado'
  | 'Tipo musculoso magro'
  | 'Tipo musculoso desarrollado';

export interface SegmentalValues {
  musculoBD: number;
  musculoBDPct: number;
  musculoBI: number;
  musculoBIPct: number;
  musculoTR: number;
  musculoTRPct: number;
  musculoPD: number;
  musculoPDPct: number;
  musculoPI: number;
  musculoPIPct: number;

  grasaBD: number;
  grasaBDPct: number;
  grasaBI: number;
  grasaBIPct: number;
  grasaTR: number;
  grasaTRPct: number;
  grasaPD: number;
  grasaPDPct: number;
  grasaPI: number;
  grasaPIPct: number;
}

export interface InBodyRecord {
  id: string;
  fecha: string;
  alturaCm: number;
  peso: number;
  aguaKg: number;
  proteinaKg: number;
  mineralesKg: number;
  grasaKg: number;
  ffmKg: number;
  musculoKg: number;
  imc: number;
  pctGrasa: number;
  inbodyScore: number;
  tmb: number;
  grasaVisceral: number;
  grasaSubcutaneaKg: number;
  adiposidad: number;
  caloriasRecomendadas: number;
  tipoCuerpo: SomatotipoTipo;
  edadCorporal: number;
  
  // Rangos de referencia
  pesoIdeal: number;
  controlPeso: number;
  controlGrasa: number;
  controlMuscular: number;
  
  rangoPesoMin: number;
  rangoPesoMax: number;
  rangoSmmMin: number;
  rangoSmmMax: number;
  rangoBfmMin: number;
  rangoBfmMax: number;
  rangoImcMin: number;
  rangoImcMax: number;
  rangoPbfMin: number;
  rangoPbfMax: number;

  segmental: SegmentalValues;
}

export interface UserAccount {
  cedula: string;
  nombres: string;
  apellidos: string;
  grado: string;
  /** Arma / especialidad corta (escalafón). Preferir tituloD si viene lleno. */
  tituloC?: string;
  tituloD?: string;
  sexo: Sexo;
  fechaNacimiento: string;
  fechaIngreso: string;
  tipoUsuario: string;
  /** En Firebase el campo oficial es `unidad`; aquí se normaliza a unidadActual. */
  unidadActual: string;
  region: string;
  telefono?: string;
  email?: string;
  role: UserRole;
  mediciones: InBodyRecord[];
  /** Legado local (INBODY embebido); no se escribe a Firebase. */
  especialidad?: string;
  rachaDias?: number;
  misionCompletadaHoy?: boolean;
}

/** Preferencia: tituloD si no está vacío; si no, tituloC; si no, especialidad legado. Nunca concatena ambos. */
export function resolveTituloArma(user: Pick<UserAccount, 'tituloC' | 'tituloD' | 'especialidad'>): string {
  const d = (user.tituloD || '').trim();
  if (d) return d;
  const c = (user.tituloC || '').trim();
  if (c) return c;
  return (user.especialidad || '').trim();
}

export interface VideoComplemento {
  id: string;
  nombre: string;
  descripcion: string;
  link: string;
  sexo: 'M' | 'F' | 'TODOS';
  tipoCuerpo: SomatotipoTipo | 'TODOS';
  categoria: 'entrenamiento' | 'motivacion' | 'tecnica';
}

export interface SomatotipoDefinicion {
  clave: string;
  nombre: SomatotipoTipo;
  color: 'rojo' | 'naranja' | 'azul' | 'verde';
  tituloModal: string;
  descripcion: string;
  diagnosticoGeneral: string;
  enfoqueEntrenamiento: string;
  enfoqueNutricion: string;
}

export interface MisionTactico {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: 'cardio' | 'fuerza' | 'recuperacion' | 'nutricion';
  tipoCuerpoAsociado: 'obeso' | 'delgado' | 'estandar';
  puntos: number;
}

export interface FraseMando {
  preventiva: string;
  ejecutiva: string;
}

export type RegionEcuador = 'Sierra' | 'Costa' | 'Oriente' | 'Galápagos';

export interface PlanNutricion {
  id: string;
  nombre: string;
  somatotipo: SomatotipoTipo;
  region: RegionEcuador;
  imagenUrl: string;
  descripcion: string;
  caloriasAprox?: number;
  proteinasG?: number;
  carbosG?: number;
  grasasG?: number;
  alimentosRecomendados?: string[];
  fechaCreacion?: string;
  autor?: string;
}

export interface PlanEntrenamiento {
  id: string;
  nombre: string;
  somatotipo: SomatotipoTipo;
  fichaEdad: string; // e.g. "Ficha 1 (20 a 30 años)"
  fichaId?: string; // id del catálogo de fichas reutilizable
  rangoEdadMin: number;
  rangoEdadMax: number;
  /** Destinatarios del plan */
  sexoDestino: 'M' | 'F' | 'TODOS';
  /** Portada / miniatura (hero al abrir, luego thumbnail junto al título) */
  portadaUrl?: string;
  /** Imagen guía completa del plan (ej. PLAN1.jpeg) */
  imagenUrl: string;
  videoUrl?: string;
  /** URL de YouTube para audio de fondo (iframe oculto) */
  musicaFondoUrl?: string;
  descripcion: string;
  enfoque?: string;
  diasPorSemana?: number;
  ejerciciosClave?: string[];
  fechaCreacion?: string;
  autor?: string;
}

/** Catálogo editable de fichas etarias (tarjetas reutilizables) */
export interface FichaEdadCatalogo {
  id: string;
  nombre: string;
  edadMin: number;
  edadMax: number;
}
