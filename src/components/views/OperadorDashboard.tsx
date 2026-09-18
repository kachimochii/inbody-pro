import React, { useState, useRef } from 'react';
import { UserAccount, InBodyRecord } from '../../types/inbody';
import { createRecordFromRaw } from '../../utils/inbodyCalculations';
import { 
  downloadInbodyTemplate, 
  parseInbodyCsvContent, 
  ParsedImportRow 
} from '../../utils/templateCsv';
import { PlantillaGuiaModal } from '../PlantillaGuiaModal';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  UserPlus, 
  Search, 
  FileText,
  Sparkles,
  RefreshCw,
  Download,
  HelpCircle,
  X,
  FileCheck,
  Info
} from 'lucide-react';

interface OperadorDashboardProps {
  users: UserAccount[];
  onAddMeasurementToUser: (cedula: string, record: InBodyRecord) => void;
  onCreateNewUser: (newUser: UserAccount) => void;
}

export const OperadorDashboard: React.FC<OperadorDashboardProps> = ({
  users,
  onAddMeasurementToUser,
  onCreateNewUser
}) => {
  const [importRows, setImportRows] = useState<ParsedImportRow[]>([]);
  const [importSuccess, setImportSuccess] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [manualCedula, setManualCedula] = useState('');
  const [manualPeso, setManualPeso] = useState('78.5');
  const [manualAltura, setManualAltura] = useState('175');
  const [manualMusculo, setManualMusculo] = useState('36.2');
  const [manualGrasa, setManualGrasa] = useState('16.8');
  const [manualVisceral, setManualVisceral] = useState('6');
  const [manualScore, setManualScore] = useState('82');
  const [manualMsg, setManualMsg] = useState('');

  // Procesar archivo subido (CSV / Texto)
  const processUploadedFile = (file: File) => {
    setStatusMessage(null);
    setImportSuccess(false);

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      setStatusMessage({
        type: 'info',
        text: `El archivo "${file.name}" parece ser formato Excel binario (.xlsx). Para garantizar una lectura rápida y compatible con el navegador, guarde su hoja como "CSV delimitado por comas (.csv)" o use la plantilla oficial.`
      });
      // Aún así intentamos leerlo como texto por si es CSV con extensión cambiada
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) {
          setStatusMessage({ type: 'error', text: 'No se pudo leer el contenido del archivo seleccionado.' });
          return;
        }

        const result = parseInbodyCsvContent(text, users);

        if (result.errors.length > 0 && result.rows.length === 0) {
          setStatusMessage({
            type: 'error',
            text: `Error de formato: ${result.errors.join(' ')}. Puede consultar la "Guía de la Plantilla" para ver los nombres de columnas requeridos.`
          });
          return;
        }

        setImportRows(result.rows);
        setStatusMessage({
          type: 'success',
          text: `Archivo "${file.name}" procesado con éxito: ${result.totalParsed} evaluaciones detectadas (${result.existentes} militares existentes, ${result.nuevos} nuevos registros).`
        });
      } catch (err) {
        setStatusMessage({
          type: 'error',
          text: 'Ocurrió un error al procesar el archivo. Verifique que no tenga caracteres no válidos o descargue la plantilla guía.'
        });
      }
    };

    reader.onerror = () => {
      setStatusMessage({ type: 'error', text: 'Error al abrir el archivo en el navegador.' });
    };

    reader.readAsText(file, 'UTF-8');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processUploadedFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processUploadedFile(files[0]);
    }
  };

  // Generador de Lote de Prueba de InBody 270S (USB Export)
  const handleLoadSampleBatch = () => {
    const sampleBatch: ParsedImportRow[] = [
      {
        id: 'row-01',
        cedula: '1712345678', // Mayor Carlos Mendoza
        nombreDetectado: 'Carlos Mendoza Andrade',
        gradoDetectado: 'Mayor',
        sexoDetectado: 'M',
        unidadDetectada: 'Brigada de Fuerzas Especiales N° 9 Patria',
        peso: 81.8,
        alturaCm: 175,
        musculoKg: 36.1,
        grasaKg: 18.2,
        grasaVisceral: 6,
        score: 83,
        estadoMatch: 'EXISTENTE'
      },
      {
        id: 'row-02',
        cedula: '1719283746', // Edison Chávez
        nombreDetectado: 'Edison Chávez Morales',
        gradoDetectado: 'Cabo Segundo',
        sexoDetectado: 'M',
        unidadDetectada: 'Brigada de Infantería N° 1 El Oro',
        peso: 72.4,
        alturaCm: 170,
        musculoKg: 34.0,
        grasaKg: 15.1,
        grasaVisceral: 5,
        score: 81,
        estadoMatch: 'EXISTENTE'
      },
      {
        id: 'row-03',
        cedula: '0918273645', // Andrea Morales
        nombreDetectado: 'Andrea Morales Vaca',
        gradoDetectado: 'Capitán',
        sexoDetectado: 'F',
        unidadDetectada: 'Comando de Operaciones Aéreas y Defensa',
        peso: 57.9,
        alturaCm: 164,
        musculoKg: 25.9,
        grasaKg: 12.2,
        grasaVisceral: 3,
        score: 90,
        estadoMatch: 'EXISTENTE'
      },
      {
        id: 'row-04',
        cedula: '1720304050', // Nuevo Soldado
        nombreDetectado: 'Juan Sebastián Pérez Loor',
        gradoDetectado: 'Soldado',
        sexoDetectado: 'M',
        unidadDetectada: 'Escuela de Formación de Soldados Vencedores del Cenepa',
        peso: 71.2,
        alturaCm: 172,
        musculoKg: 33.4,
        grasaKg: 14.1,
        grasaVisceral: 4,
        score: 84,
        estadoMatch: 'NUEVO_USUARIO'
      }
    ];

    setImportRows(sampleBatch);
    setImportSuccess(false);
    setStatusMessage({
      type: 'info',
      text: 'Lote de demostración cargado: 4 evaluaciones (3 militares existentes, 1 nuevo recluta).'
    });
  };

  // Procesar e Integrar el Lote a la Base de Datos
  const handleConfirmImport = () => {
    importRows.forEach((row) => {
      const userExists = users.find(u => u.cedula === row.cedula);

      if (userExists) {
        // Generar registro antropométrico completo (priorizando el inbodyRecord oficial parseado)
        const record = row.inbodyRecord || createRecordFromRaw(row.cedula, {
          peso: row.peso,
          alturaCm: row.alturaCm,
          musculoKg: row.musculoKg,
          grasaKg: row.grasaKg,
          grasaVisceral: row.grasaVisceral,
          inbodyScore: row.score,
          sexo: userExists.sexo
        });
        onAddMeasurementToUser(row.cedula, record);
      } else {
        // Crear nuevo efectivo militar
        const newRecord = row.inbodyRecord || createRecordFromRaw(row.cedula, {
          peso: row.peso,
          alturaCm: row.alturaCm,
          musculoKg: row.musculoKg,
          grasaKg: row.grasaKg,
          grasaVisceral: row.grasaVisceral,
          inbodyScore: row.score,
          sexo: row.sexoDetectado || 'M'
        });

        const rawNombre = (row.nombreDetectado || 'Personal Evaluado').replace(row.gradoDetectado || '', '').trim();
        // Columna "nombres" de plantilla = nombre completo.
        const nombres = rawNombre || 'Efectivo Militar';

        const newUser: UserAccount = {
          cedula: row.cedula,
          nombres: nombres,
          grado: row.gradoDetectado || 'Cabo Segundo',
          tituloC: row.tituloCDetectado || '',
          tituloD: row.tituloDDetectado || '',
          sexo: row.sexoDetectado || 'M',
          fechaNacimiento: row.fechaNacimientoDetectada || '1998-06-15',
          fechaIngreso: row.fechaIngresoDetectada || '2020-03-01',
          tipoUsuario: row.tipoUsuarioDetectado || 'Militar en Servicio Activo',
          unidadActual: row.unidadDetectada || 'Fuerzas Armadas del Ecuador',
          region: row.regionDetectada || 'Sierra',
          role: 'usuario',
          mediciones: [newRecord]
        };

        onCreateNewUser(newUser);
      }
    });

    setImportSuccess(true);
    setStatusMessage({
      type: 'success',
      text: `¡Éxito! ${importRows.length} evaluaciones fueron integradas permanentemente a los expedientes de los efectivos.`
    });

    setTimeout(() => {
      setImportRows([]);
      setImportSuccess(false);
    }, 4000);
  };

  // Registro Manual de 1 Medición
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setManualMsg('');

    if (!manualCedula.trim()) {
      setManualMsg('Debe ingresar la cédula del evaluado.');
      return;
    }

    const user = users.find(u => u.cedula === manualCedula.trim());
    if (!user) {
      setManualMsg('Cédula no registrada en el sistema. Debe registrar los datos biográficos primero o cargar la plantilla con sus nombres.');
      return;
    }

    const newRec = createRecordFromRaw(user.cedula, {
      peso: parseFloat(manualPeso),
      alturaCm: parseFloat(manualAltura),
      musculoKg: parseFloat(manualMusculo),
      grasaKg: parseFloat(manualGrasa),
      grasaVisceral: parseInt(manualVisceral, 10),
      inbodyScore: parseInt(manualScore, 10),
      sexo: user.sexo
    });

    onAddMeasurementToUser(user.cedula, newRec);
    setManualMsg(`¡Medición registrada con éxito para ${user.grado} ${user.nombres}! Score: ${newRec.inbodyScore} pts.`);
    setManualCedula('');
  };

  return (
    <div className="space-y-6">
      
      {/* Encabezado del Módulo de Operador */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1">
                <span>Puesto</span>
                <span className="text-white font-black">IN</span>
                <span className="text-cyan-400 font-black">BODY</span>
                <span className="font-mono">270S</span>
              </span>
              <span className="text-xs text-slate-400">Importador LookinBody USB</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
              Ingesta y Procesamiento de Mediciones
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
              Carga el CSV exportado de LookinBody (mismo formato que INBODY 1.csv) o descarga la plantilla oficial. Misma cédula en otra fecha = nueva medición en el historial (2.ª, 3.ª…). Edad corporal y somatotipo los calcula la app automáticamente.
            </p>
          </div>

          {/* Botones Rápidos de Plantilla Guía */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setIsTemplateModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-all cursor-pointer hover:border-slate-600"
              title="Ver especificación de columnas y estructura de la plantilla"
            >
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              <span>Ver Guía de la Plantilla</span>
            </button>

            <button
              onClick={() => downloadInbodyTemplate(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-bold text-white transition-all cursor-pointer shadow-md shadow-blue-600/20"
              title="Descargar archivo CSV de ejemplo listo para abrir en Excel"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Plantilla (.csv)</span>
            </button>
          </div>
        </div>

        {/* Notificaciones de Estado de Carga */}
        {statusMessage && (
          <div className={`mt-4 p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between gap-3 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : statusMessage.type === 'error'
              ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              : 'bg-blue-500/10 border border-blue-500/30 text-blue-300'
          }`}>
            <div className="flex items-center gap-2.5">
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : statusMessage.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              ) : (
                <Info className="w-4 h-4 text-blue-400 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
            <button 
              onClick={() => setStatusMessage(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Zona de Arrastre de Archivos (Drag & Drop Real) */}
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`mt-6 border-2 border-dashed rounded-3xl p-8 text-center transition-all ${
            isDragging 
              ? 'border-cyan-400 bg-cyan-950/30 scale-[1.01]' 
              : 'border-slate-700 hover:border-blue-500 bg-slate-950/60'
          }`}
        >
          <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl border flex items-center justify-center transition-colors ${
            isDragging
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
              : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
          }`}>
            <UploadCloud className="w-8 h-8" />
          </div>

          <h4 className="text-base font-bold text-white mb-1">
            {isDragging ? 'Suelta el archivo aquí para procesarlo' : 'Arrastra aquí el archivo exportado de InBody 270S o tu plantilla (.csv / .txt)'}
          </h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
            El sistema detecta automáticamente la columna ID/Cédula, Nombres, Grado, Peso, Músculo Esquelético, Grasa y Grasa Visceral.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {/* Input Oculto de Selección de Archivo */}
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".csv, .txt, text/csv, text/plain" 
              className="hidden" 
              onChange={handleFileSelect} 
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-blue-600/20"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Examinar Archivo (.csv)</span>
            </button>

            {/* Descarga de Plantilla Directa */}
            <button
              onClick={() => downloadInbodyTemplate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Descargar Plantilla Guía</span>
            </button>

            {/* Guía Explicativa */}
            <button
              onClick={() => setIsTemplateModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Ver Guía de Columnas</span>
            </button>

            {/* Botón Demostración Rápida */}
            <button
              onClick={handleLoadSampleBatch}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Simular Lote de Prueba (4 Evaluaciones)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de Previsualización del Lote Importado */}
      {importRows.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
                <span>Previsualización del Lote InBody ({importRows.length} Registros Listos)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Revise la correspondencia de las cédulas y los valores antes de confirmar la inserción definitiva.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setImportRows([]);
                  setStatusMessage(null);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                Descartar Lote
              </button>

              <button
                onClick={handleConfirmImport}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmar e Integrar al Sistema</span>
              </button>
            </div>
          </div>

          {importSuccess && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>¡Todas las mediciones se han sincronizado con éxito en los perfiles de los evaluados!</span>
            </div>
          )}

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3">Estado Match</th>
                  <th className="p-3">Cédula ID</th>
                  <th className="p-3">Efectivo / Detectado</th>
                  <th className="p-3">Peso (kg)</th>
                  <th className="p-3">Músculo (kg)</th>
                  <th className="p-3">Grasa (kg)</th>
                  <th className="p-3">Visceral</th>
                  <th className="p-3">Score Calculado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {importRows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40">
                    <td className="p-3">
                      {r.estadoMatch === 'EXISTENTE' ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-sans font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Existente
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-sans font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          Nuevo Registro
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-bold text-white">{r.cedula}</td>
                    <td className="p-3 font-sans text-slate-200">{r.nombreDetectado}</td>
                    <td className="p-3">{r.peso}</td>
                    <td className="p-3 text-cyan-400">{r.musculoKg}</td>
                    <td className="p-3 text-pink-400">{r.grasaKg}</td>
                    <td className="p-3">{r.grasaVisceral}</td>
                    <td className="p-3 text-white font-black">{r.score} pts</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Formulario de Entrada Rápida Manual (Para 1 persona en vivo frente a la máquina) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-400" />
            <span>Registro Rápido de Medición Individual</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Ingreso manual directo si estás evaluando a un efectivo directamente en el consultorio/gimnasio.
          </p>
        </div>

        {manualMsg && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs font-bold text-blue-300">
            {manualMsg}
          </div>
        )}

        <form onSubmit={handleManualSubmit} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="col-span-2">
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
              Cédula Militar / Civil
            </label>
            <input
              type="text"
              value={manualCedula}
              onChange={(e) => setManualCedula(e.target.value)}
              placeholder="Ej. 1712345678"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
              Peso (kg)
            </label>
            <input
              type="number"
              step="0.1"
              value={manualPeso}
              onChange={(e) => setManualPeso(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
              Estatura (cm)
            </label>
            <input
              type="number"
              value={manualAltura}
              onChange={(e) => setManualAltura(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
              Músculo (SMM kg)
            </label>
            <input
              type="number"
              step="0.1"
              value={manualMusculo}
              onChange={(e) => setManualMusculo(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
              Grasa (BFM kg)
            </label>
            <input
              type="number"
              step="0.1"
              value={manualGrasa}
              onChange={(e) => setManualGrasa(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
              Grasa Visceral
            </label>
            <input
              type="number"
              value={manualVisceral}
              onChange={(e) => setManualVisceral(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
              InBody Score
            </label>
            <input
              type="number"
              value={manualScore}
              onChange={(e) => setManualScore(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono outline-none focus:border-blue-500"
            />
          </div>

          <div className="col-span-2 sm:col-span-4 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-blue-600/30"
            >
              Guardar Medición en Perfil
            </button>
          </div>
        </form>
      </div>

      {/* Modal Interactivo de Guía y Estructura de la Plantilla */}
      <PlantillaGuiaModal 
        isOpen={isTemplateModalOpen} 
        onClose={() => setIsTemplateModalOpen(false)} 
      />

    </div>
  );
};
