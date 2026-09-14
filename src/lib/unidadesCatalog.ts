import unidadesCsv from '../data/UNIDADES.csv?raw';

export interface UnidadInfo {
  ord: string;
  nombreCompleto: string;
  unidad: string;
  unidadPadre: string;
  unidadAbuelo: string;
  provincia: string;
  canton: string;
  parroquia: string;
  direccion: string;
  regiones: string;
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      out.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out;
}

function buildCatalog(): UnidadInfo[] {
  const lines = unidadesCsv
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];
  return lines.slice(1).map((line) => {
    const c = parseCsvLine(line);
    return {
      ord: c[0] || '',
      nombreCompleto: c[1] || '',
      unidad: c[2] || '',
      unidadPadre: c[3] || '',
      unidadAbuelo: c[4] || '',
      provincia: c[5] || '',
      canton: c[6] || '',
      parroquia: c[7] || '',
      direccion: c[8] || '',
      regiones: c[9] || '',
    };
  }).filter((u) => u.unidad);
}

export const UNIDADES_CATALOG: UnidadInfo[] = buildCatalog();

const byCodigo = new Map<string, UnidadInfo>();
for (const u of UNIDADES_CATALOG) {
  if (!byCodigo.has(u.unidad)) byCodigo.set(u.unidad, u);
}

export function normalizeUnidadCode(raw: string): string {
  return (raw || '').trim();
}

export function lookupUnidad(codigo: string): UnidadInfo | null {
  const key = normalizeUnidadCode(codigo);
  if (!key) return null;
  return byCodigo.get(key) || null;
}

export function getNombreCompletoUnidad(codigo: string): string {
  return lookupUnidad(codigo)?.nombreCompleto || '';
}

export function getProvinciaUnidad(codigo: string): string {
  return lookupUnidad(codigo)?.provincia || '';
}

export function getRegionUnidad(codigo: string): string {
  return lookupUnidad(codigo)?.regiones || '';
}

export function listUnidadCodes(): string[] {
  return Array.from(byCodigo.keys()).sort((a, b) => a.localeCompare(b));
}

export function listUnidadPadres(): string[] {
  return Array.from(
    new Set(
      UNIDADES_CATALOG.map((u) => u.unidadPadre).filter(
        (p) => p && p !== 'NO ENCONTRADO'
      )
    )
  ).sort((a, b) => a.localeCompare(b));
}

export function listUnidadAbuelos(): string[] {
  return Array.from(
    new Set(
      UNIDADES_CATALOG.map((u) => u.unidadAbuelo).filter(
        (p) => p && p !== 'NO ENCONTRADO'
      )
    )
  ).sort((a, b) => a.localeCompare(b));
}

/** Códigos de unidad que caen bajo un padre o abuelo (incluye el propio código si aplica). */
export function expandUnidadesPorJerarquia(
  nivel: 'unidad' | 'padre' | 'abuelo',
  valor: string
): string[] {
  const v = normalizeUnidadCode(valor);
  if (!v || v === 'TODAS') return [];
  if (nivel === 'unidad') return [v];
  if (nivel === 'padre') {
    return Array.from(
      new Set(
        UNIDADES_CATALOG.filter((u) => u.unidadPadre === v || u.unidad === v).map(
          (u) => u.unidad
        )
      )
    );
  }
  return Array.from(
    new Set(
      UNIDADES_CATALOG.filter((u) => u.unidadAbuelo === v || u.unidad === v).map(
        (u) => u.unidad
      )
    )
  );
}

export function userMatchesUnidadJerarquia(
  unidadUsuario: string,
  nivel: 'unidad' | 'padre' | 'abuelo',
  valor: string
): boolean {
  if (!valor || valor === 'TODAS') return true;
  const codes = new Set(expandUnidadesPorJerarquia(nivel, valor));
  return codes.has(normalizeUnidadCode(unidadUsuario));
}

export function hasInbodyData(mediciones: unknown[] | undefined): boolean {
  if (!Array.isArray(mediciones) || mediciones.length === 0) return false;
  return mediciones.some((m) => {
    if (!m || typeof m !== 'object') return false;
    const rec = m as Record<string, unknown>;
    const peso = Number(rec.pesoKg ?? rec.peso ?? 0);
    const score = Number(rec.inbodyScore ?? 0);
    const altura = Number(rec.alturaCm ?? 0);
    return peso > 0 || score > 0 || altura > 0;
  });
}
