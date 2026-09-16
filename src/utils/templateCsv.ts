import { UserAccount, InBodyRecord } from '../types/inbody';
import { calculateAge } from './inbodyCalculations';
import {
  calcularAnalisisCorporal,
  pctSmmFromKg,
  pctMusculoPiernasFromSegmental,
} from './composicionCorporal';

export interface ParsedImportRow {
  id: string;
  cedula: string;
  nombreDetectado?: string;
  gradoDetectado?: string;
  tituloCDetectado?: string;
  tituloDDetectado?: string;
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

/** Encabezado exacto del export LookinBody (INBODY 1.csv) — 106 columnas. */
const LOOKINBODY_HEADER =
  'cedula,grado,tituloC,tituloD,nombres,fechaNacimiento,fechaIngreso,sexoRaw,Tipo de usuario,unidad actual,REGIONES,3. Height,15. Weight,16. Lower Limit (Weight Normal Range),17. Upper Limit (Weight Normal Range),18. TBW (Total Body Water),19. Lower Limit (TBW Normal Range),20. Upper Limit (TBW Normal Range),21. Protein,22. Lower Limit (Protein Normal Range),23. Upper Limit (Protein Normal Range),24. Minerals,25. Lower Limit (Minerals Normal Range),26. Upper Limit (Minerals Normal Range),27. BFM (Body Fat Mass),28. Lower Limit (BFM Normal Range),29. Upper Limit (BFM Normal Range),30. FFM (Fat Free Mass),31. Lower Limit (FFM Normal Range),32. Upper Limit (FFM Normal Range),33. SMM (Skeletal Muscle Mass),34. Lower Limit (SMM Normal Range),35. Upper Limit (SMM Normal Range),36. BMI (Body Mass Index),37. Lower Limit (BMI Normal Range),38. Upper Limit (BMI Normal Range),39. PBF (Percent Body Fat),40. Lower Limit (PBF Normal Range),41. Upper Limit (PBF Normal Range),42. FFM of Right Arm,43. FFM% of Right Arm,44. FFM of Left Arm,45. FFM% of Left Arm,46. FFM of Trunk,47. FFM% of Trunk,48. FFM of Right Leg,49. FFM% of Right Leg,50. FFM of Left Leg,51. FFM% of Left Leg,52. BFM of Right Arm,53. BFM% of Right Arm,54. BFM of Left Arm,55. BFM% of Left Arm,56. BFM of Trunk,57. BFM% of Trunk,58. BFM of Right Leg,59. BFM% of Right Leg,60. BFM of Left Leg,61. BFM% of Left Leg,62. InBody Score,63. Target Weight,64. Weight Control,65. BFM Control,66. FFM Control,67. BMR (Basal Metabolic Rate),68. WHR (Waist-Hip Ratio),69. Lower Limit (WHR Normal Range),70. Upper Limit (WHR Normal Range),71. VFL (Visceral Fat Level),72. Obesity Degree,73. Lower Limit (Obesity Degree Normal Range),74. Upper Limit (Obesity Degree Normal Range),75. 20kHz-RA Impedance,76. 20kHz-LA Impedance,77. 20kHz-TR Impedance,78. 20kHz-RL Impedance,79. 20kHz-LL Impedance,80. 100kHz-RA Impedance,81. 100kHz-LA Impedance,82. 100kHz-TR Impedance,83. 100kHz-RL Impedance,84. 100kHz-LL Impedance,85. Measured Circumference of Abdomen,86. Growth Score,87. Obesity Degree of a Child,88. Lower Limit (Obesity Degree of a Child Normal Range),89. Upper Limit (Obesity Degree of a Child Normal Range),90. Systolic,91. Diastolic,92. Pulse,93. Mean Artery Pressure,94. Pulse Pressure,95. Rate Pressure Product,96. InBody Type,97. Local ID,98. SMI (Skeletal Muscle Index),99. Medical History,100. Group,101. Recommended Calorie Intake,102. Lower Limit (BMR Normal Range),103. Upper Limit (BMR Normal Range),104. SMM/WT,105. FFMI (Fat Free Mass Index),106. FMI (Fat Mass Index),12. Date of Registration,13. Date of Registration';

/** Primera fila de ejemplo (INBODY 1.csv), fechas de medición vacías. */
const LOOKINBODY_SAMPLE_ROW =
  '1712876208,TCRN,I,EM,ATUNA LARA LUIS FERNANDO,11/07/1980,10/08/2002,M,Militar en Servicio Activo,ES.FOR.S.FT,SIERRA,175,79.9,57.3,77.5,47,37.9,46.3,12.8,10.2,12.4,4.37,3.5,4.28,15.7,8.1,16.2,64.2,51.5,63,36.6,28.8,35.2,26.1,18.5,25,19.6,10,20,3.77,112.2,3.67,109.2,28.7,106.8,9.45,101,9.47,101.2,0.7,120.3,0.8,129.8,8.6,201.9,2.2,124.6,2.2,124.2,83,75.6,-4.3,-4.3,0,1758,0.9,0.8,0.9,Level 6,119,90,110,288.6,296.6,21.3,260.1,257.2,252.7,262.5,17.6,226.4,223.8,90.3,-,-,-,-,-,-,-,-,-,-,270,1393,8.6,OTROS,ENFERMEDAD CRONICA,2702,1690,1984,45.8,21,5.1,,';

function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/** Parte una línea CSV respetando comillas. */
function splitCsvLine(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
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
}

function parseNum(val: string | undefined, defaultVal: number): number {
  if (val == null || val === '' || val === '-') return defaultVal;
  const clean = String(val).replace(',', '.').replace(/[^0-9.-]/g, '');
  const num = parseFloat(clean);
  return Number.isFinite(num) ? num : defaultVal;
}

/** Convierte DD/MM/YYYY (o YYYY-MM-DD) a ISO YYYY-MM-DD. */
function toIsoDate(raw: string | undefined, fallback: string): string {
  if (!raw || !raw.trim()) return fallback;
  const s = raw.trim();
  const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) {
    return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
  }
  const ymd = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (ymd) {
    return `${ymd[1]}-${ymd[2].padStart(2, '0')}-${ymd[3].padStart(2, '0')}`;
  }
  return fallback;
}

/**
 * Descarga plantilla CSV en formato export LookinBody (INBODY 1.csv).
 */
export function downloadInbodyTemplate(withSampleData = true): void {
  const csvContent = withSampleData
    ? `${LOOKINBODY_HEADER}\r\n${LOOKINBODY_SAMPLE_ROW}`
    : LOOKINBODY_HEADER;

  // BOM para que Excel abra bien acentos en español
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    withSampleData ? 'plantilla_lookinbody_INBODY.csv' : 'plantilla_lookinbody_INBODY_vacia.csv'
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parsea CSV LookinBody / plantilla INBODY.
 * Edad corporal y somatotipo se calculan siempre (no se leen del equipo).
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
    errors: [],
  };

  if (!content || !content.trim()) {
    result.errors.push('El archivo seleccionado se encuentra vacío.');
    return result;
  }

  const lines = content
    .replace(/^\uFEFF/, '')
    .split(/\r\n|\n|\r/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    result.errors.push('El archivo debe contener al menos la fila de encabezados y un registro.');
    return result;
  }

  const headerLine = lines[0];
  const commaCount = (headerLine.match(/,/g) || []).length;
  const semicolonCount = (headerLine.match(/;/g) || []).length;
  const delimiter = semicolonCount > commaCount ? ';' : ',';

  const rawHeaders = splitCsvLine(headerLine, delimiter).map(normalizeHeader);

  const findIndex = (aliases: string[]): number => {
    for (const alias of aliases) {
      const exact = rawHeaders.findIndex((h) => h === alias);
      if (exact !== -1) return exact;
    }
    for (const alias of aliases) {
      const idx = rawHeaders.findIndex((h) => h.includes(alias));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  // Demográficos
  const colCedula = findIndex(['cedula', 'identificacion', 'dni']);
  const colGrado = findIndex(['grado']);
  const colTituloC = findIndex(['tituloc']);
  const colTituloD = findIndex(['titulod']);
  const colNombres = findIndex(['nombres', 'nombre']);
  const colFechaNac = findIndex(['fechanacimiento', 'nacimiento', 'birth']);
  const colFechaIng = findIndex(['fechaingreso', 'ingreso']);
  const colSexo = findIndex(['sexoraw', 'sexo', 'genero', 'gender']);
  const colTipoUsuario = findIndex(['tipodeusuario', 'tipousuario']);
  const colUnidad = findIndex(['unidadactual', 'unidad']);
  const colRegion = findIndex(['regiones', 'region']);

  // Antropometría y composición (prefijos numéricos LookinBody)
  const colAltura = findIndex(['3height', 'height', 'estatura', 'altura']);
  const colPeso = findIndex(['15weight', 'peso']);
  const colRangoPesoMin = findIndex(['16lowerlimitweight', 'lowerlimitweightnormalrange']);
  const colRangoPesoMax = findIndex(['17upperlimitweight', 'upperlimitweightnormalrange']);
  const colAgua = findIndex(['18tbw', 'tbwtotalbodywater', 'tbw']);
  const colProteina = findIndex(['21protein', 'protein']);
  const colMinerales = findIndex(['24minerals', 'minerals']);
  const colGrasa = findIndex(['27bfm', 'bfmbodyfatmass']);
  const colRangoBfmMin = findIndex(['28lowerlimitbfm', 'lowerlimitbfmnormalrange']);
  const colRangoBfmMax = findIndex(['29upperlimitbfm', 'upperlimitbfmnormalrange']);
  const colFfm = findIndex(['30ffm', 'ffmfatfreemass']);
  const colMusculo = findIndex(['33smm', 'smmskeletalmusclemass']);
  const colRangoSmmMin = findIndex(['34lowerlimitsmm', 'lowerlimitsmmnormalrange']);
  const colRangoSmmMax = findIndex(['35upperlimitsmm', 'upperlimitsmmnormalrange']);
  const colImc = findIndex(['36bmi', 'bmibodymassindex']);
  const colRangoImcMin = findIndex(['37lowerlimitbmi', 'lowerlimitbminormalrange']);
  const colRangoImcMax = findIndex(['38upperlimitbmi', 'upperlimitbminormalrange']);
  const colPctGrasa = findIndex(['39pbf', 'pbfpercentbodyfat']);
  const colRangoPbfMin = findIndex(['40lowerlimitpbf', 'lowerlimitpbfnormalrange']);
  const colRangoPbfMax = findIndex(['41upperlimitpbf', 'upperlimitpbfnormalrange']);

  // Segmental FFM / BFM
  const colMusculoBD = findIndex(['42ffmofrightarm']);
  const colMusculoBDPct = findIndex(['43ffmofrightarm']);
  const colMusculoBI = findIndex(['44ffmofleftarm']);
  const colMusculoBIPct = findIndex(['45ffmofleftarm']);
  const colMusculoTR = findIndex(['46ffmoftrunk']);
  const colMusculoTRPct = findIndex(['47ffmoftrunk']);
  const colMusculoPD = findIndex(['48ffmofrightleg']);
  const colMusculoPDPct = findIndex(['49ffmofrightleg']);
  const colMusculoPI = findIndex(['50ffmofleftleg']);
  const colMusculoPIPct = findIndex(['51ffmofleftleg']);

  const colGrasaBD = findIndex(['52bfmofrightarm']);
  const colGrasaBDPct = findIndex(['53bfmofrightarm']);
  const colGrasaBI = findIndex(['54bfmofleftarm']);
  const colGrasaBIPct = findIndex(['55bfmofleftarm']);
  const colGrasaTR = findIndex(['56bfmoftrunk']);
  const colGrasaTRPct = findIndex(['57bfmoftrunk']);
  const colGrasaPD = findIndex(['58bfmofrightleg']);
  const colGrasaPDPct = findIndex(['59bfmofrightleg']);
  const colGrasaPI = findIndex(['60bfmofleftleg']);
  const colGrasaPIPct = findIndex(['61bfmofleftleg']);

  const colScore = findIndex(['62inbodyscore', 'inbodyscore']);
  const colTargetWeight = findIndex(['63targetweight', 'targetweight']);
  const colWeightControl = findIndex(['64weightcontrol', 'weightcontrol']);
  const colBfmControl = findIndex(['65bfmcontrol', 'bfmcontrol']);
  const colFfmControl = findIndex(['66ffmcontrol', 'ffmcontrol']);
  const colBmr = findIndex(['67bmr', 'bmrbasalmetabolicrate']);
  const colVisceral = findIndex(['71vfl', 'vflvisceralfatlevel', 'visceral']);
  const colAdiposidad = findIndex(['72obesitydegree', 'obesitydegree']);
  const colCalorias = findIndex(['101recommendedcalorieintake', 'recommendedcalorieintake']);
  const colPctSmm = findIndex(['104smmwt', 'smmwt']);
  // Fecha medición: preferir "12. Date of Registration" (no usar InBody Type ni edad corporal)
  const colFechaMedicion = findIndex([
    '12dateofregistration',
    'dateofregistration',
    'fechamedicion',
    'fecharegistro',
  ]);

  if (colCedula === -1) {
    result.errors.push('No se encontró la columna requerida "cedula" en los encabezados.');
    return result;
  }

  const uploadStamp = Date.now();

  for (let idx = 1; idx < lines.length; idx++) {
    const rawCols = splitCsvLine(lines[idx], delimiter);
    if (rawCols.length <= 1) continue;

    const rawCedula = (rawCols[colCedula] || '').replace(/[^0-9]/g, '').trim();
    if (!rawCedula) continue;

    const rawAlturaVal = colAltura !== -1 ? rawCols[colAltura] : '';
    const rawPesoVal = colPeso !== -1 ? rawCols[colPeso] : '';

    // Sin altura + peso → descartar (sin medición InBody útil)
    if (!rawAlturaVal?.trim() || !rawPesoVal?.trim()) continue;

    const alturaCm = parseNum(rawAlturaVal, 0);
    const peso = parseNum(rawPesoVal, 0);
    if (alturaCm <= 0 || peso <= 0) continue;

    const existing = existingUsers.find((u) => u.cedula === rawCedula);
    const cell = (col: number) => (col !== -1 ? rawCols[col] : undefined);

    const musculoKg =
      colMusculo !== -1
        ? parseNum(cell(colMusculo), +(peso * 0.45).toFixed(1))
        : +(peso * 0.45).toFixed(1);
    const grasaKg =
      colGrasa !== -1
        ? parseNum(cell(colGrasa), +(peso * 0.22).toFixed(1))
        : +(peso * 0.22).toFixed(1);

    const rawVisceral = cell(colVisceral) || '';
    const visceralDigits = rawVisceral.replace(/[^0-9]/g, '');
    const grasaVisceral = visceralDigits
      ? parseInt(visceralDigits, 10)
      : Math.round(parseNum(rawVisceral, 5));

    let score = colScore !== -1 ? Math.round(parseNum(cell(colScore), 0)) : 0;
    if (score <= 0) {
      const pctEst = (grasaKg / peso) * 100;
      score = Math.min(99, Math.max(50, Math.round(80 + (musculoKg - 32) * 1.5 - (pctEst - 18) * 1.2)));
    }

    const nombresFull =
      colNombres !== -1 && rawCols[colNombres]
        ? rawCols[colNombres]
        : existing
          ? existing.nombres.trim()
          : 'Personal Evaluado';
    const grado =
      colGrado !== -1 && rawCols[colGrado]
        ? rawCols[colGrado]
        : existing?.grado || 'Cabo Segundo';
    const tituloC =
      colTituloC !== -1 && rawCols[colTituloC]
        ? rawCols[colTituloC]
        : existing?.tituloC || '';
    const tituloD =
      colTituloD !== -1 && rawCols[colTituloD]
        ? rawCols[colTituloD]
        : existing?.tituloD || '';
    const sexoRaw =
      colSexo !== -1 && rawCols[colSexo]
        ? rawCols[colSexo].toUpperCase().trim()
        : existing?.sexo || 'M';
    const sexo: 'M' | 'F' = sexoRaw.startsWith('F') ? 'F' : 'M';
    const unidad =
      colUnidad !== -1 && rawCols[colUnidad]
        ? rawCols[colUnidad]
        : existing?.unidadActual || 'Fuerzas Armadas del Ecuador';
    const fechaNacIso = toIsoDate(
      cell(colFechaNac),
      existing?.fechaNacimiento || '1990-01-01'
    );
    const fechaIngIso = toIsoDate(
      cell(colFechaIng),
      existing?.fechaIngreso || '2010-01-01'
    );
    const tipoUsuario =
      colTipoUsuario !== -1 && rawCols[colTipoUsuario]
        ? rawCols[colTipoUsuario]
        : existing?.tipoUsuario || 'Militar en Servicio Activo';
    const region =
      colRegion !== -1 && rawCols[colRegion]
        ? rawCols[colRegion]
        : existing?.region || 'Sierra';

    const musculoBD =
      colMusculoBD !== -1
        ? parseNum(cell(colMusculoBD), +(musculoKg * 0.1).toFixed(2))
        : +(musculoKg * 0.1).toFixed(2);
    const musculoBDPct = colMusculoBDPct !== -1 ? parseNum(cell(colMusculoBDPct), 100) : 100;
    const musculoBI =
      colMusculoBI !== -1
        ? parseNum(cell(colMusculoBI), +(musculoKg * 0.1).toFixed(2))
        : +(musculoKg * 0.1).toFixed(2);
    const musculoBIPct = colMusculoBIPct !== -1 ? parseNum(cell(colMusculoBIPct), 100) : 100;
    const musculoTR =
      colMusculoTR !== -1
        ? parseNum(cell(colMusculoTR), +(musculoKg * 0.45).toFixed(1))
        : +(musculoKg * 0.45).toFixed(1);
    const musculoTRPct = colMusculoTRPct !== -1 ? parseNum(cell(colMusculoTRPct), 100) : 100;
    const musculoPD =
      colMusculoPD !== -1
        ? parseNum(cell(colMusculoPD), +(musculoKg * 0.17).toFixed(2))
        : +(musculoKg * 0.17).toFixed(2);
    const musculoPDPct = colMusculoPDPct !== -1 ? parseNum(cell(colMusculoPDPct), 100) : 100;
    const musculoPI =
      colMusculoPI !== -1
        ? parseNum(cell(colMusculoPI), +(musculoKg * 0.17).toFixed(2))
        : +(musculoKg * 0.17).toFixed(2);
    const musculoPIPct = colMusculoPIPct !== -1 ? parseNum(cell(colMusculoPIPct), 100) : 100;

    const grasaBD =
      colGrasaBD !== -1
        ? parseNum(cell(colGrasaBD), +(grasaKg * 0.08).toFixed(2))
        : +(grasaKg * 0.08).toFixed(2);
    const grasaBDPct = colGrasaBDPct !== -1 ? parseNum(cell(colGrasaBDPct), 100) : 100;
    const grasaBI =
      colGrasaBI !== -1
        ? parseNum(cell(colGrasaBI), +(grasaKg * 0.08).toFixed(2))
        : +(grasaKg * 0.08).toFixed(2);
    const grasaBIPct = colGrasaBIPct !== -1 ? parseNum(cell(colGrasaBIPct), 100) : 100;
    const grasaTR =
      colGrasaTR !== -1
        ? parseNum(cell(colGrasaTR), +(grasaKg * 0.52).toFixed(1))
        : +(grasaKg * 0.52).toFixed(1);
    const grasaTRPct = colGrasaTRPct !== -1 ? parseNum(cell(colGrasaTRPct), 100) : 100;
    const grasaPD =
      colGrasaPD !== -1
        ? parseNum(cell(colGrasaPD), +(grasaKg * 0.16).toFixed(2))
        : +(grasaKg * 0.16).toFixed(2);
    const grasaPDPct = colGrasaPDPct !== -1 ? parseNum(cell(colGrasaPDPct), 100) : 100;
    const grasaPI =
      colGrasaPI !== -1
        ? parseNum(cell(colGrasaPI), +(grasaKg * 0.16).toFixed(2))
        : +(grasaKg * 0.16).toFixed(2);
    const grasaPIPct = colGrasaPIPct !== -1 ? parseNum(cell(colGrasaPIPct), 100) : 100;

    const alturaM = alturaCm / 100;
    const imc =
      colImc !== -1
        ? parseNum(cell(colImc), +(peso / (alturaM * alturaM)).toFixed(1))
        : +(peso / (alturaM * alturaM)).toFixed(1);
    const pctGrasa =
      colPctGrasa !== -1
        ? parseNum(cell(colPctGrasa), +((grasaKg / peso) * 100).toFixed(1))
        : +((grasaKg / peso) * 100).toFixed(1);
    const ffmKg =
      colFfm !== -1
        ? parseNum(cell(colFfm), +(peso - grasaKg).toFixed(1))
        : +(peso - grasaKg).toFixed(1);

    const aguaKg =
      colAgua !== -1 ? parseNum(cell(colAgua), +(peso * 0.58).toFixed(1)) : +(peso * 0.58).toFixed(1);
    const proteinaKg =
      colProteina !== -1
        ? parseNum(cell(colProteina), +(peso * 0.16).toFixed(1))
        : +(peso * 0.16).toFixed(1);
    const mineralesKg =
      colMinerales !== -1
        ? parseNum(cell(colMinerales), +(peso * 0.05).toFixed(1))
        : +(peso * 0.05).toFixed(1);

    const pesoIdeal =
      colTargetWeight !== -1
        ? parseNum(cell(colTargetWeight), +(alturaM * alturaM * 22).toFixed(1))
        : +(alturaM * alturaM * 22).toFixed(1);
    const adiposidad = Math.round(
      parseNum(cell(colAdiposidad), (grasaKg / (pesoIdeal * 0.15)) * 100)
    );
    const controlPeso =
      colWeightControl !== -1
        ? parseNum(cell(colWeightControl), +(pesoIdeal - peso).toFixed(1))
        : +(pesoIdeal - peso).toFixed(1);
    const controlGrasa =
      colBfmControl !== -1
        ? parseNum(cell(colBfmControl), +(pesoIdeal * 0.15 - grasaKg).toFixed(1))
        : +(pesoIdeal * 0.15 - grasaKg).toFixed(1);
    const controlMuscular =
      colFfmControl !== -1
        ? parseNum(cell(colFfmControl), +(Math.max(0, 32 - musculoKg)).toFixed(1))
        : +(Math.max(0, 32 - musculoKg)).toFixed(1);
    const tmb =
      colBmr !== -1
        ? Math.round(parseNum(cell(colBmr), 370 + 21.6 * ffmKg))
        : Math.round(370 + 21.6 * ffmKg);
    const caloriasRecomendadas =
      colCalorias !== -1
        ? Math.round(parseNum(cell(colCalorias), tmb * 1.35))
        : Math.round(tmb * 1.35);

    const rangoPesoMin =
      colRangoPesoMin !== -1
        ? parseNum(cell(colRangoPesoMin), +(pesoIdeal * 0.85).toFixed(1))
        : +(pesoIdeal * 0.85).toFixed(1);
    const rangoPesoMax =
      colRangoPesoMax !== -1
        ? parseNum(cell(colRangoPesoMax), +(pesoIdeal * 1.15).toFixed(1))
        : +(pesoIdeal * 1.15).toFixed(1);
    const rangoSmmMin =
      colRangoSmmMin !== -1
        ? parseNum(cell(colRangoSmmMin), +(musculoKg * 0.88).toFixed(1))
        : +(musculoKg * 0.88).toFixed(1);
    const rangoSmmMax =
      colRangoSmmMax !== -1
        ? parseNum(cell(colRangoSmmMax), +(musculoKg * 1.12).toFixed(1))
        : +(musculoKg * 1.12).toFixed(1);
    const rangoBfmMin = colRangoBfmMin !== -1 ? parseNum(cell(colRangoBfmMin), 8.5) : 8.5;
    const rangoBfmMax = colRangoBfmMax !== -1 ? parseNum(cell(colRangoBfmMax), 16.5) : 16.5;
    const rangoImcMin = colRangoImcMin !== -1 ? parseNum(cell(colRangoImcMin), 18.5) : 18.5;
    const rangoImcMax = colRangoImcMax !== -1 ? parseNum(cell(colRangoImcMax), 25.0) : 25.0;
    const rangoPbfMin =
      colRangoPbfMin !== -1
        ? parseNum(cell(colRangoPbfMin), sexo === 'M' ? 10.0 : 18.0)
        : sexo === 'M'
          ? 10.0
          : 18.0;
    const rangoPbfMax =
      colRangoPbfMax !== -1
        ? parseNum(cell(colRangoPbfMax), sexo === 'M' ? 20.0 : 28.0)
        : sexo === 'M'
          ? 20.0
          : 28.0;

    const pctSMM =
      colPctSmm !== -1 && cell(colPctSmm)?.trim()
        ? parseNum(cell(colPctSmm), pctSmmFromKg(musculoKg, peso))
        : pctSmmFromKg(musculoKg, peso);
    const pctMusculoPiernas = pctMusculoPiernasFromSegmental(musculoPDPct, musculoPIPct);

    const edadCron = calculateAge(fechaNacIso);
    // Siempre calcular: no importar edad corporal ni InBody Type (col 96)
    const analisis = calcularAnalisisCorporal({
      edad: edadCron,
      sexo,
      pctGrasa,
      pctSMM,
      grasaVisceral,
      pctMusculoPiernas,
      puntajeSalud: score,
    });

    const hoyIso = new Date().toISOString().split('T')[0];
    const fechaMedicion = toIsoDate(cell(colFechaMedicion), hoyIso);

    // ID único por carga (Date.now + idx) para historial
    const medId = `med-${rawCedula}-${fechaMedicion}-${uploadStamp}-${idx}`;

    const fullRecord: InBodyRecord = {
      id: medId,
      fecha: fechaMedicion,
      alturaCm,
      peso,
      aguaKg,
      proteinaKg,
      mineralesKg,
      grasaKg,
      ffmKg,
      musculoKg,
      imc,
      pctGrasa,
      inbodyScore: score,
      tmb,
      grasaVisceral,
      grasaSubcutaneaKg: +(grasaKg * 0.88).toFixed(1),
      adiposidad,
      caloriasRecomendadas,
      tipoCuerpo: analisis.tipoCuerpo,
      edadCorporal: analisis.edadCorporal,
      pesoIdeal,
      controlPeso,
      controlGrasa,
      controlMuscular,
      rangoPesoMin,
      rangoPesoMax,
      rangoSmmMin,
      rangoSmmMax,
      rangoBfmMin,
      rangoBfmMax,
      rangoImcMin,
      rangoImcMax,
      rangoPbfMin,
      rangoPbfMax,
      segmental: {
        musculoBD,
        musculoBDPct,
        musculoBI,
        musculoBIPct,
        musculoTR,
        musculoTRPct,
        musculoPD,
        musculoPDPct,
        musculoPI,
        musculoPIPct,
        grasaBD,
        grasaBDPct,
        grasaBI,
        grasaBIPct,
        grasaTR,
        grasaTRPct,
        grasaPD,
        grasaPDPct,
        grasaPI,
        grasaPIPct,
      },
    };

    const row: ParsedImportRow = {
      id: `row-${uploadStamp}-${idx}-${rawCedula}`,
      cedula: rawCedula,
      nombreDetectado: nombresFull,
      gradoDetectado: grado,
      tituloCDetectado: tituloC || undefined,
      tituloDDetectado: tituloD || undefined,
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
      fechaNacimientoDetectada: fechaNacIso,
      fechaIngresoDetectada: fechaIngIso,
      tipoUsuarioDetectado: tipoUsuario,
      regionDetectada: region,
    };

    if (existing) result.existentes++;
    else result.nuevos++;

    result.rows.push(row);
  }

  result.totalParsed = result.rows.length;
  if (result.totalParsed === 0 && result.errors.length === 0) {
    result.errors.push(
      'No se encontraron registros con mediciones InBody (altura y peso requeridos).'
    );
  }

  return result;
}
