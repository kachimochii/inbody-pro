@echo off
cd /d "%~dp0"
echo.
echo === IN BODY: deploy de Functions ===
set FUNCTIONS_DISCOVERY_TIMEOUT=60
if not exist "node_modules\.bin\firebase.cmd" (
  echo Instalando firebase-tools...
  call npm.cmd install -D firebase-tools
)
if not exist "functions\node_modules\typescript\bin\tsc" (
  echo Instalando dependencias de functions...
  call npm.cmd --prefix functions install
)
echo Compilando functions...
call node functions\node_modules\typescript\bin\tsc -p functions\tsconfig.json
if errorlevel 1 goto :fail
echo Desplegando...
call "node_modules\.bin\firebase.cmd" deploy --only functions
if errorlevel 1 goto :fail
echo.
echo Listo. Recargue http://localhost:3000 e intente ingresar.
pause
exit /b 0
:fail
echo.
echo Fallo el deploy. Copie el error y peguelo en el chat.
pause
exit /b 1
