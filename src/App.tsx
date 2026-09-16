/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { UserAccount, UserRole, InBodyRecord, PlanNutricion, PlanEntrenamiento, FichaEdadCatalogo } from './types/inbody';
import { MOCK_USUARIOS, MOCK_PLANES_NUTRICION, MOCK_PLANES_ENTRENAMIENTO } from './data/mockData';
import { FOOD_DATABASE, FoodItem } from './data/foodDatabase';
import { DEFAULT_FICHAS_EDAD } from './utils/localPersistence';
import {
  fetchUserByCedula,
  fetchUsuariosPage,
  exportUsuariosFiltrados,
  RosterQueryFilters,
  RosterPageResult,
  ROSTER_PAGE_SIZE,
  getEstadoInBodyLabel,
  seedPlanesIfEmpty,
  seedAlimentosIfEmpty,
  upsertPlanEntrenamiento,
  deletePlanEntrenamiento,
  upsertPlanNutricion,
  deletePlanNutricion,
  upsertFichaEdad,
  deleteFichaEdad,
  upsertAlimentoCalculadora,
  deleteAlimentoCalculadora,
  saveUserRoleToFirestore,
  saveUserAccountToFirestore,
  appendMedicionToFirestore,
} from './lib/firestoreService';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { HeaderNavbar } from './components/HeaderNavbar';
import { LoginModal } from './components/LoginModal';
import { SplashScreen } from './components/SplashScreen';
import { EvaluadoDashboard } from './components/views/EvaluadoDashboard';
import { AdminDashboard } from './components/views/AdminDashboard';
import { OperadorDashboard } from './components/views/OperadorDashboard';
import { EntrenadorDashboard } from './components/views/EntrenadorDashboard';
import { NutricionistaDashboard } from './components/views/NutricionistaDashboard';
import { ArrowLeft, Shield, Cloud, CloudOff } from 'lucide-react';

function MainAppContent() {
  const { isDark } = useTheme();
  /** Solo cuentas locales/mock al inicio — NO se cargan 25k de Firebase */
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [rosterLoaded, setRosterLoaded] = useState(false);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterProgress, setRosterProgress] = useState(0);
  const [rosterPage, setRosterPage] = useState(1);
  const [rosterHasNext, setRosterHasNext] = useState(false);
  const [rosterHasPrev, setRosterHasPrev] = useState(false);
  const [rosterFirstDocId, setRosterFirstDocId] = useState<string | null>(null);
  const [rosterLastDocId, setRosterLastDocId] = useState<string | null>(null);
  const [rosterScanCursorId, setRosterScanCursorId] = useState<string | null>(null);
  /** Pila de scanCursor al inicio de cada página (para Anterior) */
  const [rosterCursorStack, setRosterCursorStack] = useState<(string | null)[]>([]);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('usuario');
  const [inspectingUser, setInspectingUser] = useState<UserAccount | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [showSplash, setShowSplash] = useState(false);
  const [cloudReady, setCloudReady] = useState(false);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [cloudLoading, setCloudLoading] = useState(true);

  const [planesNutricion, setPlanesNutricion] = useState<PlanNutricion[]>(MOCK_PLANES_NUTRICION);
  const [planesEntrenamiento, setPlanesEntrenamiento] = useState<PlanEntrenamiento[]>(MOCK_PLANES_ENTRENAMIENTO);
  const [fichasEdad, setFichasEdad] = useState<FichaEdadCatalogo[]>(DEFAULT_FICHAS_EDAD);
  const [alimentosCalculadora, setAlimentosCalculadora] = useState<FoodItem[]>(FOOD_DATABASE);

  // Solo planes/fichas/alimentos — no descargar todos los usuarios
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setCloudLoading(true);
      try {
        const seeded = await seedPlanesIfEmpty(
          MOCK_PLANES_ENTRENAMIENTO,
          DEFAULT_FICHAS_EDAD,
          MOCK_PLANES_NUTRICION
        );
        const alimentos = await seedAlimentosIfEmpty(FOOD_DATABASE);
        if (cancelled) return;
        // Firebase gana: no pisar planes ya editados (imágenes/videos). Solo completar faltantes.
        const byId = new Map<string, PlanEntrenamiento>();
        MOCK_PLANES_ENTRENAMIENTO.forEach((p) => byId.set(p.id, p));
        seeded.planes.forEach((p) => byId.set(p.id, p));
        setPlanesEntrenamiento(Array.from(byId.values()));
        setFichasEdad(seeded.fichas.length ? seeded.fichas : DEFAULT_FICHAS_EDAD);
        setPlanesNutricion(seeded.nutri.length ? seeded.nutri : MOCK_PLANES_NUTRICION);
        setAlimentosCalculadora(alimentos.length ? alimentos : FOOD_DATABASE);
        setCloudReady(true);
        setCloudError(null);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setCloudReady(false);
          setCloudError(
            'No se pudo conectar a Firebase. Active Storage y publique reglas (Firestore + Storage).'
          );
          // Aun sin nube, muestra los planes originales locales
          setPlanesEntrenamiento(MOCK_PLANES_ENTRENAMIENTO);
          setAlimentosCalculadora(FOOD_DATABASE);
        }
      } finally {
        if (!cancelled) setCloudLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const applyRosterPage = (result: RosterPageResult, page: number, stack: (string | null)[]) => {
    setUsers(
      result.users.map((u) =>
        u.cedula === '0703887042' ? { ...u, role: 'admin' as UserRole } : u
      )
    );
    setRosterLoaded(true);
    setRosterPage(page);
    setRosterHasNext(result.hasNext);
    setRosterHasPrev(page > 1);
    setRosterFirstDocId(result.firstDocId);
    setRosterLastDocId(result.lastDocId);
    setRosterScanCursorId(result.scanCursorId);
    setRosterCursorStack(stack);
  };

  const handleFetchRosterPage = async (
    direction: 'first' | 'next' | 'prev',
    filters: RosterQueryFilters
  ) => {
    setRosterLoading(true);
    setRosterProgress(0);
    try {
      if (direction === 'first') {
        const result = await fetchUsuariosPage({ filters, direction: 'first', pageSize: ROSTER_PAGE_SIZE });
        applyRosterPage(result, 1, [null]);
        return;
      }

      if (direction === 'next') {
        const result = await fetchUsuariosPage({
          filters,
          direction: 'next',
          cursorId: rosterLastDocId,
          scanCursorId: rosterScanCursorId,
          pageSize: ROSTER_PAGE_SIZE,
        });
        applyRosterPage(result, rosterPage + 1, [...rosterCursorStack, rosterScanCursorId]);
        return;
      }

      // prev: volver a consultar desde el cursor de la página anterior en la pila
      const stack = [...rosterCursorStack];
      stack.pop();
      const prevScan = stack.length ? stack[stack.length - 1] : null;
      const result = await fetchUsuariosPage({
        filters,
        direction: stack.length <= 1 ? 'first' : 'next',
        cursorId: prevScan,
        scanCursorId: prevScan,
        pageSize: ROSTER_PAGE_SIZE,
      });
      applyRosterPage(result, Math.max(1, rosterPage - 1), stack.length ? stack : [null]);
    } catch (e) {
      console.error(e);
      alert('No se pudo cargar la página de personal desde Firebase. Revise reglas e índices.');
    } finally {
      setRosterLoading(false);
    }
  };

  const handleExportRosterCsv = async (filters: RosterQueryFilters) => {
    setRosterLoading(true);
    setRosterProgress(0);
    try {
      const list = await exportUsuariosFiltrados(filters, (n) => setRosterProgress(n));
      const headers = ['cedula', 'nombre', 'unidad', 'estadoInBody', 'score'];
      const rows = list.map((u) => {
        const med = u.mediciones[0];
        return [
          u.cedula,
          u.nombres.trim(),
          u.unidadActual,
          getEstadoInBodyLabel(u),
          med?.inbodyScore ?? '',
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(',');
      });
      const bom = '\uFEFF';
      const csv = bom + [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inbody_estadisticas_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('No se pudo exportar el CSV. Revise conexión y reglas de Firestore.');
    } finally {
      setRosterLoading(false);
    }
  };

  const handleSearchCedula = async (cedula: string) => {
    const id = cedula.replace(/\D/g, '');
    if (id.length !== 10) {
      alert('Ingrese una cédula de 10 dígitos para buscar.');
      return;
    }
    setRosterLoading(true);
    try {
      const remote = await fetchUserByCedula(id);
      if (!remote) {
        alert('No se encontró esa cédula en Firebase (colección usuarios).');
        return;
      }
      const fixed = id === '0703887042' ? { ...remote, role: 'admin' as UserRole } : remote;
      setUsers((prev) => {
        const others = prev.filter((u) => u.cedula !== fixed.cedula);
        return [fixed, ...others];
      });
      setRosterLoaded(true);
      setInspectingUser(fixed);
    } catch (e) {
      console.error(e);
      alert('Error al buscar en Firebase.');
    } finally {
      setRosterLoading(false);
    }
  };

  const handleInspectUser = async (user: UserAccount) => {
    setInspectingUser(user);
    try {
      const fresh = await fetchUserByCedula(user.cedula);
      if (fresh) {
        const fixed =
          fresh.cedula === '0703887042' ? { ...fresh, role: 'admin' as UserRole } : fresh;
        setUsers((prev) => {
          const others = prev.filter((u) => u.cedula !== fixed.cedula);
          return [fixed, ...others];
        });
        setInspectingUser(fixed);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddPlanNutricion = (newPlan: PlanNutricion) => {
    setPlanesNutricion(prev => [newPlan, ...prev]);
    upsertPlanNutricion(newPlan).catch(console.error);
  };

  const handleUpdatePlanNutricion = (updatedPlan: PlanNutricion) => {
    setPlanesNutricion(prev => prev.map(p => p.id === updatedPlan.id ? updatedPlan : p));
    upsertPlanNutricion(updatedPlan).catch(console.error);
  };

  const handleDeletePlanNutricion = (id: string) => {
    setPlanesNutricion(prev => prev.filter(p => p.id !== id));
    deletePlanNutricion(id).catch(console.error);
  };

  const handleAddAlimento = (item: FoodItem) => {
    setAlimentosCalculadora((prev) => [item, ...prev.filter((a) => a.id !== item.id)]);
    upsertAlimentoCalculadora(item).catch(console.error);
  };

  const handleUpdateAlimento = (item: FoodItem) => {
    setAlimentosCalculadora((prev) => prev.map((a) => (a.id === item.id ? item : a)));
    upsertAlimentoCalculadora(item).catch(console.error);
  };

  const handleDeleteAlimento = (id: string) => {
    setAlimentosCalculadora((prev) => prev.filter((a) => a.id !== id));
    deleteAlimentoCalculadora(id).catch(console.error);
  };

  const handleAddPlanEntrenamiento = (newPlan: PlanEntrenamiento) => {
    setPlanesEntrenamiento(prev => [newPlan, ...prev]);
    upsertPlanEntrenamiento(newPlan).catch(console.error);
  };

  const handleUpdatePlanEntrenamiento = (updatedPlan: PlanEntrenamiento) => {
    setPlanesEntrenamiento(prev => prev.map(p => p.id === updatedPlan.id ? updatedPlan : p));
    upsertPlanEntrenamiento(updatedPlan).catch(console.error);
  };

  const handleDeletePlanEntrenamiento = (id: string) => {
    setPlanesEntrenamiento(prev => prev.filter(p => p.id !== id));
    deletePlanEntrenamiento(id).catch(console.error);
  };

  const handleAddFicha = (ficha: FichaEdadCatalogo) => {
    setFichasEdad(prev => [...prev, ficha]);
    upsertFichaEdad(ficha).catch(console.error);
  };

  const handleUpdateFicha = (ficha: FichaEdadCatalogo) => {
    setFichasEdad(prev => prev.map(f => (f.id === ficha.id ? ficha : f)));
    setPlanesEntrenamiento(prev =>
      prev.map(p =>
        p.fichaId === ficha.id
          ? { ...p, fichaEdad: ficha.nombre, rangoEdadMin: ficha.edadMin, rangoEdadMax: ficha.edadMax }
          : p
      )
    );
    upsertFichaEdad(ficha).catch(console.error);
  };

  const handleDeleteFicha = (id: string) => {
    setFichasEdad(prev => prev.filter(f => f.id !== id));
    deleteFichaEdad(id).catch(console.error);
  };

  // Agregar nueva medición a un usuario (historial: más reciente primero; NUNCA reemplaza tomas previas)
  const handleAddMeasurementToUser = (cedula: string, record: InBodyRecord) => {
    const mergeMediciones = (prev: InBodyRecord[]) => {
      // Si llega el mismo id (reintento), actualiza esa toma; si no, concatena historial
      const withoutSameId = prev.filter((m) => m.id !== record.id);
      // Evita duplicar la misma toma del mismo día con mismos kg/score
      const withoutExactDup = withoutSameId.filter(
        (m) =>
          !(
            m.fecha === record.fecha &&
            Math.abs(m.peso - record.peso) < 0.05 &&
            m.inbodyScore === record.inbodyScore
          )
      );
      return [record, ...withoutExactDup].sort((a, b) =>
        String(b.fecha).localeCompare(String(a.fecha))
      );
    };

    setUsers(prevUsers => 
      prevUsers.map(u => {
        if (u.cedula === cedula) {
          return {
            ...u,
            mediciones: mergeMediciones(u.mediciones)
          };
        }
        return u;
      })
    );

    if (currentUser && currentUser.cedula === cedula) {
      setCurrentUser(prev => prev ? ({
        ...prev,
        mediciones: mergeMediciones(prev.mediciones)
      }) : null);
    }

    if (inspectingUser?.cedula === cedula) {
      setInspectingUser(prev => prev ? ({
        ...prev,
        mediciones: mergeMediciones(prev.mediciones)
      }) : null);
    }

    appendMedicionToFirestore(cedula, record).catch(console.error);
  };

  // Registrar nuevo usuario desde el módulo de operador
  const handleCreateNewUser = (newUser: UserAccount) => {
    setUsers(prev => [newUser, ...prev]);
    saveUserAccountToFirestore(newUser).catch(console.error);
  };

  const handleUpdateUserRole = (cedula: string, role: UserRole) => {
    setUsers(prev => prev.map(u => (u.cedula === cedula ? { ...u, role } : u)));
    if (currentUser?.cedula === cedula) {
      setCurrentUser(prev => (prev ? { ...prev, role } : null));
      setCurrentRole(role);
    }
    saveUserRoleToFirestore(cedula, role).catch(console.error);
  };

  const handleDeleteUser = (cedula: string) => {
    setUsers(prev => prev.filter(u => u.cedula !== cedula));
    if (inspectingUser?.cedula === cedula) {
      setInspectingUser(null);
    }
  };

  const handlePurgeDemoUsers = () => {
    setUsers(prev => prev.filter(u => !/^170000000[1-4]$/.test(u.cedula)));
    if (inspectingUser && /^170000000[1-4]$/.test(inspectingUser.cedula)) {
      setInspectingUser(null);
    }
  };

  // Login de usuario con cédula: EL ROL SE ASIGNA EXCLUSIVAMENTE POR LA BASE DE DATOS
  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    setCurrentRole(user.role);
    setInspectingUser(null);
    setShowSplash(true);
  };

  const handleSplashFinish = () => {
    setShowSplash(false);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setInspectingUser(null);
    setShowSplash(false);
  };

  if (showSplash) {
    return (
      <div className="min-h-screen bg-black">
        <SplashScreen onFinish={handleSplashFinish} />
      </div>
    );
  }

  // Si no está autenticado, se muestra inmediatamente la pantalla de Login por Cédula
  if (!isLoggedIn || !currentUser) {
    return (
      <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${
        isDark 
          ? 'bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white' 
          : 'bg-slate-50 text-slate-900 selection:bg-blue-500 selection:text-white'
      }`}>
        {(cloudLoading || cloudError || cloudReady) && (
          <div className={`px-4 py-2 text-[11px] font-bold text-center border-b ${
            cloudError
              ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
              : cloudReady
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                : 'bg-slate-800 text-slate-300 border-slate-700'
          }`}>
            {cloudLoading && 'Conectando con Firebase…'}
            {!cloudLoading && cloudReady && (
              <span className="inline-flex items-center gap-1.5 justify-center">
                <Cloud className="w-3.5 h-3.5" /> Firebase conectado · planes e imágenes en la nube
              </span>
            )}
            {!cloudLoading && cloudError && (
              <span className="inline-flex items-center gap-1.5 justify-center">
                <CloudOff className="w-3.5 h-3.5" /> {cloudError}
              </span>
            )}
          </div>
        )}
        <LoginModal
          users={MOCK_USUARIOS}
          onLoginSuccess={handleLoginSuccess}
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${
      isDark 
        ? 'bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white' 
        : 'bg-slate-50 text-slate-900 selection:bg-blue-500 selection:text-white'
    }`}>
      
      {/* Barra de Navegación Superior con Rol Fijo Asignado en BD */}
      <HeaderNavbar
        currentRole={currentRole}
        currentUser={currentUser}
        inspectingUser={inspectingUser}
        onBackToAdmin={() => setInspectingUser(null)}
        onViewOwnFicha={currentRole === 'admin' ? () => handleInspectUser(currentUser) : undefined}
        onLogout={handleLogout}
      />

      {/* Contenedor Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Vista según el Rol Asignado a la Cédula */}
        {currentRole === 'admin' && (
          inspectingUser ? (
            <div className="space-y-5">
              {/* Banner de Inspección Administrativa */}
              <div className={`border rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg backdrop-blur ${
                isDark 
                  ? 'bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-slate-900/50 border-blue-500/30' 
                  : 'bg-gradient-to-r from-blue-50 via-indigo-50 to-white border-blue-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-500 flex items-center justify-center font-bold">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider block">
                      {inspectingUser.cedula === currentUser.cedula
                        ? 'Mi Ficha Personal (Administrador)'
                        : 'Modo Inspección de Administrador'}
                    </span>
                    <h3 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {inspectingUser.cedula === currentUser.cedula
                        ? `Mi Ficha InBody: ${inspectingUser.grado} ${inspectingUser.nombres}`
                        : `Examinando Ficha InBody: ${inspectingUser.grado} ${inspectingUser.nombres}`}
                    </h3>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      C.I.: {inspectingUser.cedula} • Unidad: {inspectingUser.unidadActual}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setInspectingUser(null)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer self-end sm:self-center"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Volver al Panel de Administrador</span>
                </button>
              </div>

              {/* Ficha del Evaluado */}
              <EvaluadoDashboard 
                user={users.find(u => u.cedula === inspectingUser.cedula) || inspectingUser}
                onBack={() => setInspectingUser(null)}
                planesNutricion={planesNutricion}
                planesEntrenamiento={planesEntrenamiento}
                alimentosCalculadora={alimentosCalculadora}
              />
            </div>
          ) : (
            <AdminDashboard
              users={users}
              currentUser={currentUser}
              onSelectUser={(u) => handleInspectUser(u)}
              onViewOwnFicha={() => handleInspectUser(currentUser)}
              onUpdateUserRole={handleUpdateUserRole}
              onDeleteUser={handleDeleteUser}
              onPurgeDemoUsers={handlePurgeDemoUsers}
              onAddMeasurementToUser={handleAddMeasurementToUser}
              onCreateNewUser={handleCreateNewUser}
              planesNutricion={planesNutricion}
              onAddPlanNutricion={handleAddPlanNutricion}
              onUpdatePlanNutricion={handleUpdatePlanNutricion}
              onDeletePlanNutricion={handleDeletePlanNutricion}
              alimentosCalculadora={alimentosCalculadora}
              onAddAlimento={handleAddAlimento}
              onUpdateAlimento={handleUpdateAlimento}
              onDeleteAlimento={handleDeleteAlimento}
              planesEntrenamiento={planesEntrenamiento}
              onAddPlanEntrenamiento={handleAddPlanEntrenamiento}
              onUpdatePlanEntrenamiento={handleUpdatePlanEntrenamiento}
              onDeletePlanEntrenamiento={handleDeletePlanEntrenamiento}
              fichasEdad={fichasEdad}
              onAddFicha={handleAddFicha}
              onUpdateFicha={handleUpdateFicha}
              onDeleteFicha={handleDeleteFicha}
              rosterLoaded={rosterLoaded}
              rosterLoading={rosterLoading}
              rosterProgress={rosterProgress}
              rosterPage={rosterPage}
              rosterPageSize={ROSTER_PAGE_SIZE}
              rosterHasNext={rosterHasNext}
              rosterHasPrev={rosterHasPrev}
              onFetchRosterPage={handleFetchRosterPage}
              onExportRosterCsv={handleExportRosterCsv}
              onSearchCedula={handleSearchCedula}
            />
          )
        )}

        {currentRole === 'operador' && (
          <OperadorDashboard
            users={[...MOCK_USUARIOS, ...users]}
            onAddMeasurementToUser={handleAddMeasurementToUser}
            onCreateNewUser={handleCreateNewUser}
          />
        )}

        {currentRole === 'usuario' && (
          <EvaluadoDashboard
            user={currentUser}
            planesNutricion={planesNutricion}
            planesEntrenamiento={planesEntrenamiento}
            alimentosCalculadora={alimentosCalculadora}
          />
        )}

        {currentRole === 'entrenador' && (
          <EntrenadorDashboard
            planes={planesEntrenamiento}
            onAddPlan={handleAddPlanEntrenamiento}
            onUpdatePlan={handleUpdatePlanEntrenamiento}
            onDeletePlan={handleDeletePlanEntrenamiento}
            fichasEdad={fichasEdad}
            onAddFicha={handleAddFicha}
            onUpdateFicha={handleUpdateFicha}
            onDeleteFicha={handleDeleteFicha}
          />
        )}

        {currentRole === 'nutricionista' && (
          <NutricionistaDashboard
            planes={planesNutricion}
            onAddPlan={handleAddPlanNutricion}
            onUpdatePlan={handleUpdatePlanNutricion}
            onDeletePlan={handleDeletePlanNutricion}
            alimentos={alimentosCalculadora}
            onAddAlimento={handleAddAlimento}
            onUpdateAlimento={handleUpdateAlimento}
            onDeleteAlimento={handleDeleteAlimento}
          />
        )}

      </main>

      {/* Footer Institucional */}
      <footer className={`w-full py-6 text-center text-xs transition-colors duration-300 ${
        isDark ? 'bg-slate-950 border-t border-slate-900 text-slate-500' : 'bg-white border-t border-slate-200 text-slate-500'
      }`}>
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            Plataforma Integral InBody 270S • Sistema de Diagnóstico Antropométrico y Rendimiento Físico
          </p>
          <div className={`flex items-center gap-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <span>LookinBody Compatible</span>
            <span>•</span>
            <span>Matriz 3x3 Somatotipos</span>
            <span>•</span>
            <span>Planes Regionales & Fichas de Edad</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MainAppContent />
    </ThemeProvider>
  );
}
