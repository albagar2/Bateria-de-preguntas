@echo off
echo ==========================================
echo ARRANCANDO BATERIA DE PREGUNTAS (Local)
echo ==========================================

:: Asegurar que la Base de Datos esté corriendo
echo [*] Levantando base de Datos PostgreSQL (Puerto 5433)...
docker-compose up -d db

:: Abrir Backend
echo [*] Iniciando Backend en nueva ventana...
start "BACKEND - Puerto 5000" cmd /k "cd backend && npm run dev"

:: Abrir AI Microservice
echo [*] Iniciando Microservicio IA en nueva ventana...
start "IA MICROSERVICE - Puerto 4001" cmd /k "cd ai-microservice && npm start"

:: Abrir Frontend
echo [*] Iniciando Frontend en nueva ventana...
start "FRONTEND - Puerto 5174" cmd /k "cd frontend && npm run dev"

echo.
echo Todas las peticiones de arranque enviadas.
echo Manten estas ventanas abiertas mientras uses la app.
echo Una vez esten listas, entra en http://localhost:5174
echo ==========================================
pause
