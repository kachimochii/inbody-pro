import { UserAccount, InBodyRecord, SomatotipoTipo, SegmentalValues } from '../types/inbody';
import { determineSomatotipo, calculateBiologicalAge, calculateAge } from './inbodyCalculations';

export interface ParsedImportRow {
  id: string;
  cedula: string;
  nombreDetectado?: string;
  apellidosDetectados?: string;
  gradoDetectado?: string;
  sexoDetectado?: 'M' | 'F';
  unidadDetectada?: string;
  peso: number;
  alturaCm: number;
  musculoKg: number;
  grasaKg: number;
  grasaVisceral: number;
  score: number;
  estadoMatch: 'EXISTENTE' | 'NUEVO_USUARIO';
  inbodyRecord?: InBodyRecord;
  fechaNacimientoDetectada?: string;
  fechaIngresoDetectada?: string;
  tipoUsuarioDetectado?: string;
  regionDetectada?: string;
}

export interface ParseResult {
  rows: ParsedImportRow[];
  totalParsed: number;
  existentes: number;
  nuevos: number;
  errors: string[];
}

/**
 * Descarga la plantilla oficial en formato CSV compatible con Excel y LookinBody
 */
export function downloadInbodyTemplate(withSampleData = true): void {
  const headers = [
    'Cedula',
    'Nombres',
    'Apellidos',
    'Grado',
    'Sexo',
    'Estatura_cm',
    'Peso_kg',
    'Musculo_kg',
    'Grasa_kg',
    'Grasa_Visceral',
    'Score_InBody',
    'Unidad',
    'Fecha_Medicion'
  ];

  const sampleRows = [
    [
      '1712345678',
      'Carlos Alberto',
      'Mendoza Andrade',
      'Mayor',
      'M',
      '175',
      '81.8',
      '36.1',
      '18.2',
      '6',
      '83',
      'Brigada de Fuerzas Especiales N° 9 Patria',
      '2025-03-01'
    ],
    [
      '1719283746',
      'Edison Patricio',
      'Chávez Morales',
      'Cabo Segundo',
      'M',
      '170',
      '72.4',
      '34.0',
      '15.1',
      '5',
      '81',
      'Brigada de Infantería N° 1 El Oro',
      '2025-03-01'
    ],
    [
      '0918273645',
      'Andrea Belén',
      'Morales Vaca',
      'Capitán',
      'F',
      '164',
      '57.9',
      '25.9',
      '12.2',
      '3',
      '90',
      'Comando de Operaciones Aéreas y Defensa',
      '2025-03-01'
    ],
    [
      '1720304050',
      'Juan Sebastián',
      'Pérez Loor',
      'Soldado',
      'M',
      '172',
      '71.2',
      '33.4',
      '14.1',
      '4',
      '84',
      'Escuela de Formación de Soldados Vencedores del Cenepa',
      '2025-03-01'
    ]
  ];

  const dataToExport = withSampleData ? sampleRows : [];

  // Formato CSV con delimitador coma estándar y entrecomillado seguro
  const csvContent = [
    headers.join(','),
    ...dataToExport.map(row => 
      row.map(field => {
        const str = String(field ?? '');
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',')
    )
  ].join('\r\n');

  // Añadir BOM (\uFEFF) para que Excel en Windows abra caracteres en español correctamente
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', withSampleData ? 'plantilla_guia_inbody270s_ejemplo.csv' : 'plantilla_vacia_inbody270s.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parsea el contenido de un archivo CSV exportado o llenado por el usuario
 */
export function parseInbodyCsvContent(
  content: string,
  existingUsers: UserAccount[]
): ParseResult {
  const result: ParseResult = {
    rows: [],
    totalParsed: 0,
    existentes: 0,
    nuevos: 0,
    errors: []
  };

  if (!content || !content.trim()) {
    result.errors.push('El archivo seleccionado se encuentra vacío.');
    return result;
  }

  // Detectar salto de línea
  const lines = content.split(/\r\n|\n|\r/).map(l => l.trim()).filter(l => l.length > 0);

  if (lines.length < 2) {
    result.errors.push('El archivo debe contener al menos la fila de encabezados y un registro.');
    return result;
  }

  // Detectar delimitador (coma o punto y coma)
  const headerLine = lines[0];
  const commaCount = (headerLine.match(/,/g) || []).length;
  const semicolonCount = (headerLine.match(/;/g) || []).length;
  const delimiter = semicolonCount > commaCount ? ';' : ',';

  // Función para partir una línea respetando comillas
  const splitLine = (line: string): string[] => {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // saltar comilla escapada
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    fields.push(current.trim());
    return fields;
  };

  const rawHeaders = splitLine(headerLine).map(h => 
    h.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '')
  );

  // Mapear índices
  const findIndex = (aliases: string[]) => {
    return rawHeaders.findIndex(h => aliases.some(alias => h.includes(alias)));
  };

  const colCedula = findIndex(['cedula', 'id', 'identificacion', 'codigo', 'dni']);
  const colNombre = findIndex(['nombres', 'nombre', 'name']);
  const colApellido = findIndex(['apellidos', 'apellido', 'lastname', 'surname']);
  const colGrado = findIndex(['grado', 'rango', 'rank']);
  const colSexo = findIndex(['sexo', 'genero', 'gender']);
  const colAltura = findIndex(['estatura', 'altura', 'height', 'talla']);
  const colPeso = findIndex(['peso', 'weight', 'weightkg']);
  const colMusculo = findIndex(['musculo', 'smm', 'muscle', 'masamuscular']);
  const colGrasa = findIndex(['grasa', 'bfm', 'fat', 'masagrasa']);
  const colVisceral = findIndex(['visceral', 'grasavisceral', 'vfl', 'nivvisceral']);
  const colScore = findIndex(['score', 'puntuacion', 'inbodyscore', 'evaluacion']);
  const colUnidad = findIndex(['unidad', 'brigada', 'batallon', 'unit']);

  if (colCedula === -1) {
    result.errors.push('No se encontró la columna requerida "Cedula" o "ID" en los encabezados.');
    return result;
  }

  const colFechaNac = findIndex(['fechanacimiento', 'nacimiento', 'birth']);
  const colFechaIng = findIndex(['fechaingreso', 'ingreso']);
  const colFechaMedicion = findIndex(['dateofregistration', 'fechamedicion', 'fecharegistro', 'measurementdate', 'testdate']);
  const colTipoUsuario = findIndex(['tipodeusuario', 'tipousuario', 'usuario']);
  const colRegion = findIndex(['regiones', 'region']);

  // Detección de plantilla oficial completa InBody (106 columnas)
  const isOfficialFullTemplate = rawHeaders.some(h => h.includes('3height') || h.includes('15weight') || h.includes('ffmofrightarm'));

  // Segmental indices si están presentes
  const colMusculoBD = findIndex(['ffmofrightarm', 'musculobd', 'ffmra']);
  const colMusculoBDPct = findIndex(['ffmofrightarm', 'musculobdpct', 'ffmrapct']);
  const colMusculoBI = findIndex(['ffmofleftarm', 'musculobi', 'ffmla']);
  const colMusculoTR = findIndex(['ffmoftrunk', 'musculotr', 'ffmtr']);
  const colMusculoPD = findIndex(['ffmofrightleg', 'musculopd', 'ffmrl']);
  const colMusculoPI = findIndex(['ffmofleftleg', 'musculopi', 'ffmll']);

  const colGrasaBD = findIndex(['bfmofrightarm', 'grasabd', 'bfmra']);
  const colGrasaBI = findIndex(['bfmofleftarm', 'grasabi', 'bfmla']);
  const colGrasaTR = findIndex(['bfmoftrunk', 'grasatr', 'bfmtr']);
  const colGrasaPD = findIndex(['bfmofrightleg', 'grasapd', 'bfmrl']);
  const colGrasaPI = findIndex(['bfmofleftleg', 'grasapi', 'bfmll']);

  const colTargetWeight = findIndex(['targetweight', 'pesoideal']);
  const colWeightControl = findIndex(['weightcontrol', 'controlpeso']);
  const colBfmControl = findIndex(['bfmcontrol', 'controlgrasa']);
  const colFfmControl = findIndex(['ffmcontrol', 'controlmuscular']);
  const colBmr = findIndex(['bmr', 'tmb', 'basalmetabolicrate']);
  const colWhr = findIndex(['whr', 'cinturacadera']);
  const colAdiposidad = findIndex(['obesitydegree', 'adiposidad']);
  const colCalorias = findIndex(['recommendedcalorieintake', 'caloriasrecomendadas']);

  // Parsear registros (a partir de la línea 1)
  for (let idx = 1; idx < lines.length; idx++) {
    const rawCols = splitLine(lines[idx]);
    if (rawCols.length <= 1) continue; // línea vacía

    const rawCedula = (rawCols[colCedula] || '').replace(/[^0-9]/g, '').trim();
    if (!rawCedula) continue;

    // REGLA CLAVE: Columna L (Altura) en adelante contiene los datos de InBody.
    // Si no tiene información en la columna L en adelante, se DESCARTA de la base de datos.
    const rawAlturaVal = colAltura !== -1 ? rawCols[colAltura] : '';
    const rawPesoVal = colPeso !== -1 ? rawCols[colPeso] : '';
    
    // Si la columna L (o altura) está vacía o no tiene valor numérico válido, se descarta el registro
    if (!rawAlturaVal || rawAlturaVal.trim() === '' || (!rawPesoVal || rawPesoVal.trim() === '')) {
      continue; // Descartar registro sin InBody
    }

    const parseNum = (val: string | undefined, defaultVal: number): number => {
      if (!val) return defaultVal;
      const clean = val.replace(',', '.').replace(/[^0-9.-]/g, '');
      const num = parseFloat(clean);
      return isNaN(num) ? defaultVal : num;
    };

    const alturaCm = parseNum(rawAlturaVal, 0);
    const peso = parseNum(rawPesoVal, 0);

    if (alturaCm <= 0 || peso <= 0) {
      continue; // Descartar si los valores antropométricos son inválidos
    }

    // Buscar si existe en la base de datos
    const existing = existingUsers.find(u => u.cedula === rawCedula);

    const musculoKg = colMusculo !== -1 ? parseNum(rawCols[colMusculo], +(peso * 0.45).toFixed(1)) : +(peso * 0.45).toFixed(1);
    const grasaKg = colGrasa !== -1 ? parseNum(rawCols[colGrasa], +(peso * 0.22).toFixed(1)) : +(peso * 0.22).toFixed(1);
    
    let rawVisceralStr = colVisceral !== -1 ? (rawCols[colVisceral] || '') : '';
    const cleanVisceral = rawVisceralStr.replace(/[^0-9]/g, '');
    const grasaVisceral = cleanVisceral ? parseInt(cleanVisceral, 10) : Math.round(parseNum(rawVisceralStr, 5));

    let score = colScore !== -1 ? Math.round(parseNum(rawCols[colScore], 0)) : 0;
    if (score <= 0) {
      const pctGrasa = (grasaKg / peso) * 100;
      score = Math.min(99, Math.max(50, Math.round(80 + (musculoKg - 32) * 1.5 - (pctGrasa - 18) * 1.2)));
    }

    const nombre = colNombre !== -1 && rawCols[colNombre] ? rawCols[colNombre] : (existing ? existing.nombres : 'Personal Evaluado');
    const apellido = colApellido !== -1 && rawCols[colApellido] ? rawCols[colApellido] : (existing ? existing.apellidos : '');
    const grado = colGrado !== -1 && rawCols[colGrado] ? rawCols[colGrado] : (existing ? existing.grado : 'Cabo Segundo');
    const sexoRaw = colSexo !== -1 && rawCols[colSexo] ? rawCols[colSexo].toUpperCase().trim() : (existing ? existing.sexo : 'M');
    const sexo: 'M' | 'F' = sexoRaw.startsWith('F') ? 'F' : 'M';
    const unidad = colUnidad !== -1 && rawCols[colUnidad] ? rawCols[colUnidad] : (existing ? existing.unidadActual : 'Fuerzas Armadas del Ecuador');
    const fechaNac = colFechaNac !== -1 && rawCols[colFechaNac] ? rawCols[colFechaNac] : (existing ? existing.fechaNacimiento : '1990-01-01');
    const fechaIng = colFechaIng !== -1 && rawCols[colFechaIng] ? rawCols[colFechaIng] : (existing ? existing.fechaIngreso : '2010-01-01');
    const tipoUsuario = colTipoUsuario !== -1 && rawCols[colTipoUsuario] ? rawCols[colTipoUsuario] : (existing ? existing.tipoUsuario : 'Militar en Servicio Activo');
    const region = colRegion !== -1 && rawCols[colRegion] ? rawCols[colRegion] : (existing ? existing.region : 'Sierra');

    // Mapeo detallado de cilindros segmentales para detección de asimetrías
    const musculoBD = colMusculoBD !== -1 ? parseNum(rawCols[colMusculoBD], +(musculoKg * 0.10).toFixed(2)) : +(musculoKg * 0.10).toFixed(2);
    const musculoBI = colMusculoBI !== -1 ? parseNum(rawCols[colMusculoBI], +(musculoKg * 0.10).toFixed(2)) : +(musculoKg * 0.10).toFixed(2);
    const musculoTR = colMusculoTR !== -1 ? parseNum(rawCols[colMusculoTR], +(musculoKg * 0.45).toFixed(1)) : +(musculoKg * 0.45).toFixed(1);
    const musculoPD = colMusculoPD !== -1 ? parseNum(rawCols[colMusculoPD], +(musculoKg * 0.17).toFixed(2)) : +(musculoKg * 0.17).toFixed(2);
    const musculoPI = colMusculoPI !== -1 ? parseNum(rawCols[colMusculoPI], +(musculoKg * 0.17).toFixed(2)) : +(musculoKg * 0.17).toFixed(2);

    const grasaBD = colGrasaBD !== -1 ? parseNum(rawCols[colGrasaBD], +(grasaKg * 0.08).toFixed(2)) : +(grasaKg * 0.08).toFixed(2);
    const grasaBI = colGrasaBI !== -1 ? parseNum(rawCols[colGrasaBI], +(grasaKg * 0.08).toFixed(2)) : +(grasaKg * 0.08).toFixed(2);
    const grasaTR = colGrasaTR !== -1 ? parseNum(rawCols[colGrasaTR], +(grasaKg * 0.52).toFixed(1)) : +(grasaKg * 0.52).toFixed(1);
    const grasaPD = colGrasaPD !== -1 ? parseNum(rawCols[colGrasaPD], +(grasaKg * 0.16).toFixed(2)) : +(grasaKg * 0.16).toFixed(2);
    const grasaPI = colGrasaPI !== -1 ? parseNum(rawCols[colGrasaPI], +(grasaKg * 0.16).toFixed(2)) : +(grasaKg * 0.16).toFixed(2);

    const alturaM = alturaCm / 100;
    const imc = parseFloat((peso / (alturaM * alturaM)).toFixed(1));
    const pctGrasa = parseFloat(((grasaKg / peso) * 100).toFixed(1));
    const ffmKg = parseFloat((peso - grasaKg).toFixed(1));
    const somatotipo = determineSomatotipo(imc, pctGrasa, sexo);
    const edadCron = calculateAge(fechaNac);
    const edadCorp = calculateBiologicalAge(edadCron, score);

    const pesoIdeal = colTargetWeight !== -1 ? parseNum(rawCols[colTargetWeight], +(alturaM * alturaM * 22).toFixed(1)) : +(alturaM * alturaM * 22).toFixed(1);
    const controlPeso = colWeightControl !== -1 ? parseNum(rawCols[colWeightControl], +(pesoIdeal - peso).toFixed(1)) : +(pesoIdeal - peso).toFixed(1);
    const controlGrasa = colBfmControl !== -1 ? parseNum(rawCols[colBfmControl], +(pesoIdeal * 0.15 - grasaKg).toFixed(1)) : +(pesoIdeal * 0.15 - grasaKg).toFixed(1);
    const controlMuscular = colFfmControl !== -1 ? parseNum(rawCols[colFfmControl], +(Math.max(0, 32 - musculoKg)).toFixed(1)) : +(Math.max(0, 32 - musculoKg)).toFixed(1);
    const tmb = colBmr !== -1 ? Math.round(parseNum(rawCols[colBmr], 370 + 21.6 * ffmKg)) : Math.round(370 + 21.6 * ffmKg);
    const caloriasRecomendadas = colCalorias !== -1 ? Math.round(parseNum(rawCols[colCalorias], tmb * 1.35)) : Math.round(tmb * 1.35);

    // Fecha de la toma: preferir Date of Registration del CSV (LookinBody); si no, hoy
    let fechaMedicion = new Date().toISOString().split('T')[0];
    if (colFechaMedicion !== -1 && rawCols[colFechaMedicion]) {
      const rawFecha = rawCols[colFechaMedicion].trim();
      // Soporta DD/MM/YYYY o YYYY-MM-DD
      const dmy = rawFecha.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
      const ymd = rawFecha.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
      if (dmy) {
        fechaMedicion = `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
      } else if (ymd) {
        fechaMedicion = `${ymd[1]}-${ymd[2].padStart(2, '0')}-${ymd[3].padStart(2, '0')}`;
      }
    }

    const fullRecord: InBodyRecord = {
      id: `med-${rawCedula}-${fechaMedicion}-${idx}`,
      fecha: fechaMedicion,
      alturaCm,
      peso,
      aguaKg: +(peso * 0.58).toFixed(1),
      proteinaKg: +(peso * 0.16).toFixed(1),
      mineralesKg: +(peso * 0.05).toFixed(1),
      grasaKg,
      ffmKg,
      musculoKg,
      imc,
      pctGrasa,
      inbodyScore: score,
      tmb,
      grasaVisceral,
      grasaSubcutaneaKg: +(grasaKg * 0.88).toFixed(1),
      adiposidad: Math.round(parseNum(colAdiposidad !== -1 ? rawCols[colAdiposidad] : undefined, (grasaKg / (pesoIdeal * 0.15)) * 100)),
      caloriasRecomendadas,
      tipoCuerpo: somatotipo,
      edadCorporal: edadCorp,
      pesoIdeal,
      controlPeso,
      controlGrasa,
      controlMuscular,
      rangoPesoMin: +(pesoIdeal * 0.85).toFixed(1),
      rangoPesoMax: +(pesoIdeal * 1.15).toFixed(1),
      rangoSmmMin: +(musculoKg * 0.88).toFixed(1),
      rangoSmmMax: +(musculoKg * 1.12).toFixed(1),
      rangoBfmMin: 8.5,
      rangoBfmMax: 16.5,
      rangoImcMin: 18.5,
      rangoImcMax: 25.0,
      rangoPbfMin: sexo === 'M' ? 10.0 : 18.0,
      rangoPbfMax: sexo === 'M' ? 20.0 : 28.0,
      segmental: {
        musculoBD,
        musculoBDPct: 100,
        musculoBI,
        musculoBIPct: 100,
        musculoTR,
        musculoTRPct: 100,
        musculoPD,
        musculoPDPct: 100,
        musculoPI,
        musculoPIPct: 100,
        grasaBD,
        grasaBDPct: 100,
        grasaBI,
        grasaBIPct: 100,
        grasaTR,
        grasaTRPct: 100,
        grasaPD,
        grasaPDPct: 100,
        grasaPI,
        grasaPIPct: 100
      }
    };

    const row: ParsedImportRow = {
      id: `row-${idx}-${rawCedula}`,
      cedula: rawCedula,
      nombreDetectado: `${grado} ${nombre} ${apellido}`.trim(),
      apellidosDetectados: apellido,
      gradoDetectado: grado,
      sexoDetectado: sexo,
      unidadDetectada: unidad,
      peso,
      alturaCm,
      musculoKg,
      grasaKg,
      grasaVisceral,
      score: Math.round(score),
      estadoMatch: existing ? 'EXISTENTE' : 'NUEVO_USUARIO',
      inbodyRecord: fullRecord,
      fechaNacimientoDetectada: fechaNac,
      fechaIngresoDetectada: fechaIng,
      tipoUsuarioDetectado: tipoUsuario,
      regionDetectada: region
    };

    if (existing) {
      result.existentes++;
    } else {
      result.nuevos++;
    }

    result.rows.push(row);
  }

  result.totalParsed = result.rows.length;
  if (result.totalParsed === 0 && result.errors.length === 0) {
    result.errors.push('No se encontraron registros con mediciones InBody activas (Columna L en adelante).');
  }

  return result;
}
