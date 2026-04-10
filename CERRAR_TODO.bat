@echo off
color 0c
echo ====================================================
echo    CERRANDO ECOSISTEMA BATERIAQ...
echo ====================================================
echo.

echo [+] Deteniendo AI Microservice (Puerto 4001)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":4001" ^| find "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
    echo   - Proceso %%a terminado.
)

echo [+] Deteniendo Backend Principal (Puerto 4000)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":4000" ^| find "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
    echo   - Proceso %%a terminado.
)

echo [+] Deteniendo Frontend Vite (Puerto 5173)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5173" ^| find "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
    echo   - Proceso %%a terminado.
)

echo.
echo ====================================================
echo    TODOS LOS SERVIDORES HAN SIDO APAGADOS.
echo ====================================================
echo.
pause
