@echo off
echo ==========================================
echo 🚀 ARRANCANDO BATERIA DE PREGUNTAS (Local)
echo ==========================================

:: Abrir Backend
echo [*] Iniciando Backend en nueva ventana...
start "BACKEND - Puerto 4000" cmd /k "cd backend && npm install && npx prisma generate && npm run dev"

:: Abrir AI Microservice
echo [*] Iniciando Microservicio IA en nueva ventana...
start "IA MICROSERVICE - Puerto 4001" cmd /k "cd ai-microservice && npm install && npm start"

:: Abrir Frontend
echo [*] Iniciando Frontend en nueva ventana...
start "FRONTEND - Puerto 5173" cmd /k "cd frontend && npm install && npm run dev"

echo.
echo ✅ Todas las peticiones de arranque enviadas.
echo Manten estas ventanas abiertas mientras uses la app.
echo Una vez esten listas, entra en http://localhost:5173
echo ==========================================
pause
