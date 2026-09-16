import { UserAccount } from '../types/inbody';

/** Nombre completo unificado (nombres + apellidos si ambos existen en Firestore). */
export function resolveNombreCompleto(
  user: Pick<UserAccount, 'nombres' | 'apellidos'>
): string {
  const n = (user.nombres || '').trim();
  const a = (user.apellidos || '').trim();
  if (n && a) return `${n} ${a}`.replace(/\s+/g, ' ').trim();
  return (n || a || 'Sin nombre').replace(/\s+/g, ' ').trim();
}

/**
 * Apellido corto para badge / medalla Nivel 3.
 * Ej: "DE LA CRUZ DE LA CRUZ STALIN..." → "DE LA CRUZ"
 *     "SIGCHA DE LA CRUZ JORDY..." → "SIGCHA"
 *     "RON DIAZ MARIO..." → "RON"
 * Si el token tiene ≤2 letras (DE, LA, DEL…), toma el siguiente hasta uno >2.
 */
export function extractApellidoCorto(nombreCompleto: string): string {
  const parts = (nombreCompleto || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  const out: string[] = [];
  for (const p of parts) {
    out.push(p);
    if (p.length > 2) break;
  }
  return out.join(' ').toUpperCase();
}

/** Sigla de grado a 4 caracteres (TCRN, TNTE, GRAD, SLDO…). */
export function resolveGradoSigla(grado: string): string {
  const g = (grado || '').trim().toUpperCase().replace(/\s+/g, '');
  if (!g) return '----';
  return g.slice(0, 4).padEnd(Math.min(4, g.length), '');
}

const GENERALES: Record<string, string> = {
  GRAB: 'GENERAL DE BRIGADA',
  GRAD: 'GENERAL DE DIVISIÓN',
  GRAE: 'GENERAL DE EJÉRCITO',
};

const UNIDADES_GRAE = ['JEF/CCFFAA', 'C.G.F.T', 'CGFT', 'CCFFAA', 'JEFCCFFAA'];

function normalizeUnidad(u: string): string {
  return (u || '')
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/\./g, '');
}

function isUnidadAltoMando(unidad: string): boolean {
  const n = normalizeUnidad(unidad);
  return UNIDADES_GRAE.some((u) => n.includes(normalizeUnidad(u)) || normalizeUnidad(u).includes(n));
}

export type GradoEstilo = 'normal' | 'plata' | 'oro';

export interface GradoDisplay {
  /** Texto visible (sigla o "GENERAL DE…") */
  texto: string;
  /** Sigla de 4 letras para el badge */
  sigla: string;
  estilo: GradoEstilo;
  /** Si es general de alto mando: no mostrar tituloC/D */
  omitirTitulos: boolean;
}

/**
 * Resuelve grado visible.
 * - GRAB / GRAD / GRAE → nombre completo en mayúsculas (plata / oro).
 * - GRAD o GRAB en JEF/CCFFAA, C.G.F.T, CCFFAA → se otorgan como GRAE (dorado).
 */
export function resolveGradoDisplay(
  user: Pick<UserAccount, 'grado' | 'unidadActual'>
): GradoDisplay {
  let codigo = (user.grado || '').trim().toUpperCase().replace(/\s+/g, '');
  if (codigo.length > 4) codigo = codigo.slice(0, 4);

  if ((codigo === 'GRAD' || codigo === 'GRAB') && isUnidadAltoMando(user.unidadActual || '')) {
    codigo = 'GRAE';
  }

  if (codigo === 'GRAE') {
    return {
      texto: GENERALES.GRAE,
      sigla: 'GRAE',
      estilo: 'oro',
      omitirTitulos: true,
    };
  }
  if (codigo === 'GRAD') {
    return {
      texto: GENERALES.GRAD,
      sigla: 'GRAD',
      estilo: 'plata',
      omitirTitulos: true,
    };
  }
  if (codigo === 'GRAB') {
    return {
      texto: GENERALES.GRAB,
      sigla: 'GRAB',
      estilo: 'plata',
      omitirTitulos: true,
    };
  }

  return {
    texto: codigo || (user.grado || '').trim().toUpperCase(),
    sigla: resolveGradoSigla(codigo || user.grado || ''),
    estilo: 'normal',
    omitirTitulos: false,
  };
}

/**
 * tituloD si tiene texto (oculta tituloC); si no, tituloC; si no, especialidad legado.
 * Nunca concatena ambos (evita "A.E / EMC").
 */
export function resolveTituloArmaUnico(
  user: Pick<UserAccount, 'tituloC' | 'tituloD' | 'especialidad'>
): string {
  const d = (user.tituloD || '').trim();
  if (d) return d;
  const c = (user.tituloC || '').trim();
  if (c) return c;
  return (user.especialidad || '').trim();
}

/** Línea "GRADO + título" o solo "GENERAL DE…" según reglas. */
export function resolveGradoTituloLinea(
  user: Pick<UserAccount, 'grado' | 'unidadActual' | 'tituloC' | 'tituloD' | 'especialidad'>
): { linea: string; estilo: GradoEstilo } {
  const g = resolveGradoDisplay(user);
  if (g.omitirTitulos) {
    return { linea: g.texto, estilo: g.estilo };
  }
  const titulo = resolveTituloArmaUnico(user);
  const linea = titulo ? `${g.texto} ${titulo}` : g.texto;
  return { linea: linea.trim(), estilo: g.estilo };
}

/** Badge navbar: sigla 4 letras + apellido corto. */
export function resolveBadgeUsuario(
  user: Pick<UserAccount, 'grado' | 'unidadActual' | 'nombres' | 'apellidos'>
): { sigla: string; etiqueta: string; estilo: GradoEstilo } {
  const g = resolveGradoDisplay(user);
  const apellido = extractApellidoCorto(resolveNombreCompleto(user));
  const etiqueta =
    g.estilo !== 'normal'
      ? `${g.texto}${apellido ? ` ${apellido}` : ''}`
      : `${g.sigla}${apellido ? ` ${apellido}` : ''}`;
  return { sigla: g.sigla, etiqueta: etiqueta.trim(), estilo: g.estilo };
}

export function claseEstiloGrado(estilo: GradoEstilo, isDark: boolean): string {
  if (estilo === 'oro') {
    return isDark
      ? 'bg-amber-500/15 text-amber-300 border-amber-400/50 shadow-amber-500/20'
      : 'bg-amber-50 text-amber-800 border-amber-300';
  }
  if (estilo === 'plata') {
    return isDark
      ? 'bg-slate-300/15 text-slate-200 border-slate-300/50 shadow-slate-400/20'
      : 'bg-slate-100 text-slate-700 border-slate-400';
  }
  return isDark
    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    : 'bg-blue-50 text-blue-700 border-blue-200';
}
