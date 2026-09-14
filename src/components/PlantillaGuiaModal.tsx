import React, { useState } from 'react';
import { 
  X, 
  Download, 
  FileSpreadsheet, 
  CheckCircle2, 
  HelpCircle, 
  FileText, 
  Table, 
  Sparkles,
  Info,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { downloadInbodyTemplate } from '../utils/templateCsv';

interface PlantillaGuiaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlantillaGuiaModal: React.FC<PlantillaGuiaModalProps> = ({
  isOpen,
  onClose
}) => {
  const [copiedNotification, setCopiedNotification] = useState(false);

  if (!isOpen) return null;

  const columnsSpec = [
    {
      col: 'Cedula',
      req: true,
      tipo: 'Texto / 10 Dígitos',
      ejemplo: '1712345678',
      desc: 'Cédula de ciudadanía o identidad militar sin guiones. Llave primaria de sincronización.'
    },
    {
      col: 'Nombres',
      req: false,
      tipo: 'Texto',
      ejemplo: 'Carlos Alberto',
      desc: 'Nombres completos del evaluado. Si ya existe en la base, se mantiene su ficha.'
    },
    {
      col: 'Apellidos',
      req: false,
      tipo: 'Texto',
      ejemplo: 'Mendoza Andrade',
      desc: 'Apellidos del evaluado para fichas de nuevo ingreso.'
    },
    {
      col: 'Grado',
      req: false,
      tipo: 'Texto',
      ejemplo: 'Cabo Segundo',
      desc: 'Grado militar institucional (Soldado, Cabo Segundo, Cabo Primero, Sargento, Suboficial, Oficial).'
    },
    {
      col: 'Sexo',
      req: true,
      tipo: 'M / F',
      ejemplo: 'M',
      desc: 'Sexo biológico para el cálculo de los rangos de grasa esencial y masa muscular.'
    },
    {
      col: 'Estatura_cm',
      req: true,
      tipo: 'Numérico (cm)',
      ejemplo: '175',
      desc: 'Estatura del militar en centímetros (sin calzado táctico).'
    },
    {
      col: 'Peso_kg',
      req: true,
      tipo: 'Decimal (kg)',
      ejemplo: '81.8',
      desc: 'Peso total registrado en la báscula del InBody 270S.'
    },
    {
      col: 'Musculo_kg',
      req: true,
      tipo: 'Decimal (kg)',
      ejemplo: '36.1',
      desc: 'Masa de Músculo Esquelético (SMM) reportada en la hoja de resultados InBody.'
    },
    {
      col: 'Grasa_kg',
      req: true,
      tipo: 'Decimal (kg)',
      ejemplo: '18.2',
      desc: 'Masa Grasa Corporal (BFM) en kilogramos reportada por el analizador.'
    },
    {
      col: 'Grasa_Visceral',
      req: true,
      tipo: 'Entero (1 - 20)',
      ejemplo: '6',
      desc: 'Nivel de grasa visceral. Valor de 1 a 9 es rango seguro/óptimo; ≥ 10 es alerta.'
    },
    {
      col: 'Score_InBody',
      req: false,
      tipo: 'Entero (0 - 100)',
      ejemplo: '83',
      desc: 'Puntuación global InBody. Si se deja vacío, el sistema lo calcula con el algoritmo oficial.'
    },
    {
      col: 'Unidad',
      req: false,
      tipo: 'Texto',
      ejemplo: 'Brigada N° 9 Patria',
      desc: 'Reparto, batallón o escuela de formación a la que pertenece.'
    },
    {
      col: 'Fecha_Medicion',
      req: false,
      tipo: 'YYYY-MM-DD',
      ejemplo: '2025-03-01',
      desc: 'Fecha de la toma. Si no se incluye, se asignará la fecha actual de carga.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra superior de acento */}
        <div className="h-1.5 bg-gradient-to-r from-blue-600 via-cyan-400 to-indigo-600 w-full shrink-0" />

        {/* Encabezado del Modal */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-start justify-between gap-4 shrink-0 bg-slate-950/60">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                <span>Formato Oficial</span>
                <span className="text-white font-black">IN</span>
                <span className="text-blue-400 font-black">BODY</span>
                <span className="text-cyan-400 font-mono">270S</span>
              </span>
              <span className="text-xs text-slate-400">Guía de Estructura de Carga Masiva</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              Plantilla Guía para Importación de Mediciones
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Descarga la plantilla oficial en formato CSV (compatible con Excel), visualiza la estructura exacta requerida y aprende a cargar lotes de evaluaciones sin errores.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido con scroll */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-slate-300 text-xs">
          
          {/* Botones de Descarga Destacados */}
          <div className="bg-gradient-to-br from-blue-950/50 via-slate-900 to-indigo-950/50 border border-blue-500/30 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-cyan-400 shrink-0" />
                <span className="text-sm font-black text-white">Descarga Directa de la Plantilla</span>
              </div>
              <p className="text-xs text-slate-300">
                Selecciona la versión que prefieras: lista con ejemplos reales o totalmente en blanco.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  downloadInbodyTemplate(true);
                  setCopiedNotification(true);
                  setTimeout(() => setCopiedNotification(false), 3500);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Descargar con Datos de Ejemplo (.csv)</span>
              </button>

              <button
                onClick={() => {
                  downloadInbodyTemplate(false);
                  setCopiedNotification(true);
                  setTimeout(() => setCopiedNotification(false), 3500);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 text-slate-400" />
                <span>Descargar Plantilla en Blanco</span>
              </button>
            </div>
          </div>

          {copiedNotification && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>¡Plantilla descargada con éxito! Puedes abrirla en Microsoft Excel o Google Sheets.</span>
            </div>
          )}

          {/* Pasos Rápidos de Uso */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
              <div className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center mb-2">
                1
              </div>
              <h5 className="font-bold text-white text-xs mb-1">Abrir y Completar</h5>
              <p className="text-[11px] text-slate-400">
                Abre el archivo descargado en Excel. Llena las filas con las mediciones tomadas por la máquina InBody 270S.
              </p>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
              <div className="w-7 h-7 rounded-xl bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center mb-2">
                2
              </div>
              <h5 className="font-bold text-white text-xs mb-1">Guardar como CSV</h5>
              <p className="text-[11px] text-slate-400">
                Guarda el archivo en formato delimitado por comas (.csv) para conservar la compatibilidad de columnas.
              </p>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center mb-2">
                3
              </div>
              <h5 className="font-bold text-white text-xs mb-1">Arrastrar y Cargar</h5>
              <p className="text-[11px] text-slate-400">
                Arrastra el archivo en el recuadro del Operador. El sistema sincronizará los perfiles por número de cédula.
              </p>
            </div>
          </div>

          {/* Especificación Técnica de Cada Columna */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Table className="w-4 h-4 text-blue-400" />
                <span>Especificación de Columnas y Encabezados</span>
              </h4>
              <span className="text-[11px] text-slate-400">13 campos reconocidos automáticamente</span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80">
              <table className="w-full text-left text-[11px] text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-3">Nombre Columna</th>
                    <th className="p-3">Obligatorio</th>
                    <th className="p-3">Formato Esperado</th>
                    <th className="p-3">Ejemplo</th>
                    <th className="p-3">Descripción e Impacto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {columnsSpec.map((spec) => (
                    <tr key={spec.col} className="hover:bg-slate-900/60 transition-colors">
                      <td className="p-3 font-bold text-cyan-300">{spec.col}</td>
                      <td className="p-3">
                        {spec.req ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-sans font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                            Requerido
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-sans font-semibold bg-slate-800 text-slate-400">
                            Opcional
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-sans text-slate-300">{spec.tipo}</td>
                      <td className="p-3 font-bold text-white bg-slate-900/40">{spec.ejemplo}</td>
                      <td className="p-3 font-sans text-slate-400">{spec.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Consejos Clave para Excel y Formatos */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2">
            <h5 className="font-bold text-white text-xs flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-400" />
              <span>Consejos Importantes para Evitar Errores de Lectura:</span>
            </h5>
            <ul className="list-disc list-inside space-y-1.5 text-[11px] text-slate-400">
              <li>
                <strong className="text-slate-200">Separador de decimales:</strong> Puedes usar tanto punto (<code className="text-cyan-300">81.8</code>) como coma (<code className="text-cyan-300">81,8</code>). El sistema los normaliza de forma automática.
              </li>
              <li>
                <strong className="text-slate-200">Mapeo por Cédula:</strong> Si la cédula ya existe en la base de datos de la unidad, la medición se insertará como una nueva toma en su historial temporal. Si es nueva, se dará de alta con su grado militar.
              </li>
              <li>
                <strong className="text-slate-200">LookinBody 120 / USB InBody:</strong> Si tu máquina InBody exporta directamente a Excel mediante el software LookinBody, puedes exportar la hoja de cálculo y cargarla directamente aquí.
              </li>
            </ul>
          </div>

        </div>

        {/* Pie del Modal */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Validación Segura con Cifrado de Datos Antropométricos</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadInbodyTemplate(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md shadow-blue-600/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar Plantilla (.csv)</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Entendido / Cerrar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
