@echo off
echo Iniciando backend y frontend...

REM Iniciar backend en nueva ventana
start "Backend (curvas-back)" cmd /k "cd curvas-back && npm start"

REM Iniciar frontend en nueva ventana
start "Frontend (curvas-front)" cmd /k "cd curvas-front && npm run dev"

echo Backend y frontend iniciados en ventanas separadas.
echo Cierra este mensaje cuando termines.
pause
