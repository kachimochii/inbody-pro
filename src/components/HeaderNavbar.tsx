import React from 'react';
import { UserAccount, UserRole } from '../types/inbody';
import { useTheme } from '../context/ThemeContext';
import { BrandLogo } from './BrandLogo';
import { 
  Shield, 
  Activity, 
  User, 
  Dumbbell, 
  Salad, 
  LogOut, 
  ArrowLeft,
  Lock,
  Sun,
  Moon,
  IdCard
} from 'lucide-react';

interface HeaderNavbarProps {
  currentRole: UserRole;
  currentUser: UserAccount;
  inspectingUser?: UserAccount | null;
  onBackToAdmin?: () => void;
  onViewOwnFicha?: () => void;
  onLogout: () => void;
}

export const HeaderNavbar: React.FC<HeaderNavbarProps> = ({
  currentRole,
  currentUser,
  inspectingUser,
  onBackToAdmin,
  onViewOwnFicha,
  onLogout
}) => {
  const { isDark, toggleTheme } = useTheme();

  // Configuración del rol oficial asignado por la base de datos
  const roleConfig: Record<UserRole, { label: string; icon: React.ReactNode; color: string }> = {
    admin: {
      label: 'Administrador Institucional',
      icon: <Shield className="w-3.5 h-3.5 text-rose-400" />,
      color: isDark ? 'bg-rose-500/10 text-rose-300 border-rose-500/30' : 'bg-rose-50 text-rose-700 border-rose-200'
    },
    operador: {
      label: 'Operador InBody 270S',
      icon: <Activity className="w-3.5 h-3.5 text-cyan-400" />,
      color: isDark ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30' : 'bg-cyan-50 text-cyan-700 border-cyan-200'
    },
    entrenador: {
      label: 'Preparador Físico Táctico',
      icon: <Dumbbell className="w-3.5 h-3.5 text-blue-400" />,
      color: isDark ? 'bg-blue-500/10 text-blue-300 border-blue-500/30' : 'bg-blue-50 text-blue-700 border-blue-200'
    },
    nutricionista: {
      label: 'Nutrición Militar Institucional',
      icon: <Salad className="w-3.5 h-3.5 text-emerald-400" />,
      color: isDark ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    usuario: {
      label: 'Personal Evaluado',
      icon: <User className="w-3.5 h-3.5 text-indigo-400" />,
      color: isDark ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
    }
  };

  const currentRoleInfo = roleConfig[currentUser.role] || roleConfig.usuario;

  return (
    <header className={`sticky top-0 z-40 w-full backdrop-blur-md border-b shadow-lg transition-colors duration-300 ${
      isDark ? 'bg-slate-900/95 border-slate-800 text-slate-100' : 'bg-white/95 border-slate-200 text-slate-900'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between py-3 gap-3">
          
          {/* Logo y Nombre del Sistema */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between">
            <div className="flex items-center gap-3">
              <BrandLogo sizeClassName="h-11" className="shrink-0" />
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-xl font-black tracking-wider flex items-center">
                    <span className={isDark ? 'text-white' : 'text-slate-900'}>IN</span>
                    <span className="text-blue-500">BODY</span>
                  </h1>
                  <span className="text-xs font-mono font-bold text-cyan-500 dark:text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                    270S
                  </span>
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                    isDark ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-600 border-blue-200'
                  }`}>
                    Pro
                  </span>
                </div>
              </div>
            </div>

            {/* Acciones en móvil: Switcher de tema y salir */}
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className={`p-1.5 rounded-lg border text-xs ${
                  isDark ? 'bg-slate-800 text-amber-300 border-slate-700' : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
                title="Cambiar Modo Blanco / Negro"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              <button
                onClick={onLogout}
                className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 px-2 py-1 rounded bg-rose-500/10 border border-rose-500/20"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Salir</span>
              </button>
            </div>
          </div>

          {/* CREDENCIAL DE USUARIO Y CONTROL INSTITUCIONAL */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Si el administrador está inspeccionando a un evaluado, mostrar botón de retorno */}
            {currentUser.role === 'admin' && inspectingUser && onBackToAdmin ? (
              <button
                onClick={onBackToAdmin}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer animate-pulse"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver a Panel Administrador</span>
              </button>
            ) : null}

            {/* Admin: acceso rápido a su propia ficha */}
            {currentUser.role === 'admin' && !inspectingUser && onViewOwnFicha ? (
              <button
                onClick={onViewOwnFicha}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-bold transition-all cursor-pointer"
              >
                <IdCard className="w-4 h-4" />
                <span>Mi ficha</span>
              </button>
            ) : null}

            {/* Badge oficial del usuario/rol activo */}
            <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-extrabold shadow-sm ${currentRoleInfo.color}`}>
              {currentRoleInfo.icon}
              {currentUser.role === 'usuario' ? (
                <div className="flex items-center gap-1.5">
                  <span className="opacity-75 font-semibold">Usuario:</span>
                  <span>{currentUser.tipoUsuario || 'Militar en Servicio Activo'}</span>
                </div>
              ) : (
                <span>{currentRoleInfo.label}</span>
              )}
            </div>
          </div>

          {/* Selector de Modo Blanco/Negro, Información del Usuario Activo y Logout */}
          <div className="hidden md:flex items-center gap-3">
            
            {/* Botón Switcher Tema Blanco / Negro */}
            <button
              onClick={toggleTheme}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-black transition-all cursor-pointer shadow-sm ${
                isDark
                  ? 'bg-slate-800/90 hover:bg-slate-700 text-amber-300 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
              }`}
              title={isDark ? "Cambiar a Versión Blanca" : "Cambiar a Versión Negra"}
            >
              {isDark ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
                  <span>Versión Blanca</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Versión Negra</span>
                </>
              )}
            </button>

            {/* Info Usuario */}
            <div className={`flex items-center gap-2.5 border rounded-xl px-3.5 py-1.5 ${
              isDark ? 'bg-slate-800/70 border-slate-700/60' : 'bg-slate-100/90 border-slate-200'
            }`}>
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-500 flex items-center justify-center font-bold text-xs">
                {currentUser.grado.substring(0, 3)}
              </div>
              <div className="text-left">
                <p className={`text-xs font-bold leading-tight truncate max-w-[150px] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {currentUser.grado} {currentUser.apellidos.split(' ')[0]}
                </p>
                <p className={`text-[10px] font-mono leading-tight ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  CI: {currentUser.cedula}
                </p>
              </div>
            </div>

            {/* Botón Cerrar Sesión / Cambiar Cédula */}
            <button
              onClick={onLogout}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-sm ${
                isDark 
                  ? 'bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-300 border-slate-700 hover:border-rose-500/30' 
                  : 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border-slate-200 hover:border-rose-200'
              }`}
              title="Cerrar sesión e ingresar con otra cédula"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
