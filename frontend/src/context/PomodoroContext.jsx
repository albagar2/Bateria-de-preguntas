import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useToast } from './ToastContext';

/**
 * CONTEXTO DE POMODORO Y ENFOQUE
 * Este context gestiona el cronómetro y el estado de "Modo Sin Distracciones" de forma global.
 * Al estar aquí, el tiempo no se detiene si cambias de página.
 */
const PomodoroContext = createContext();

export const PomodoroProvider = ({ children }) => {
  // --- ESTADOS DEL TEMPORIZADOR ---
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false); // ¿Está corriendo el tiempo?
  const [mode, setMode] = useState('study'); // 'study' (concentración) o 'break' (descanso)
  const [sessions, setSessions] = useState(0); // Contador de sesiones completadas
  const [isFocusMode, setIsFocusMode] = useState(false); // ¿Está activo el modo sin distracciones?
  const [muted, setMuted] = useState(false); // ¿Silenciar notificaciones sonoras?
  
  const toast = useToast();
  const timerRef = useRef(null);

  // EFECO: Maneja el tic-tac del reloj
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        if (seconds > 0) {
          setSeconds(s => s - 1);
        } else if (minutes > 0) {
          setMinutes(m => m - 1);
          setSeconds(59);
        } else {
          handleTimerEnd(); // Si llega a 00:00, termina la fase
        }
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isActive, minutes, seconds]);

  /**
   * MANEJO DE FIN DE TIEMPO
   * Decide si toca pasar a descanso corto, descanso largo o volver a estudiar.
   */
  const handleTimerEnd = () => {
    setIsActive(false);
    clearInterval(timerRef.current);
    
    // Reproducir sonido si no está silenciado
    if (!muted) {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(() => {});
    }

    if (mode === 'study') {
      const newSessions = sessions + 1;
      setSessions(newSessions);
      toast.success('🎯 ¡Sesión de estudio terminada! Toca un descanso.');
      // Cada 4 sesiones, damos un descanso largo (15 min), si no, corto (5 min)
      if (newSessions % 4 === 0) {
        setMode('break');
        setMinutes(15);
      } else {
        setMode('break');
        setMinutes(5);
      }
    } else {
      // Volver a fase de estudio
      setMode('study');
      setMinutes(25);
      toast.info('📚 ¡Descanso terminado! Volviendo al modo estudio.');
    }
    setSeconds(0);
  };

  // --- ACCIONES DEL CRONÓMETRO ---
  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setMinutes(mode === 'study' ? 25 : 5);
    setSeconds(0);
  };

  const toggleFocusMode = () => {
    setIsFocusMode(!isFocusMode);
  };

  // EFECTO: Cuando cambia el modo enfoque, añade una clase al body
  // para que los estilos globales (CSS) puedan ocultar el navbar/footer.
  useEffect(() => {
    if (isFocusMode) {
      document.body.classList.add('focus-mode-active');
    } else {
      document.body.classList.remove('focus-mode-active');
    }
  }, [isFocusMode]);

  // Valores que estarán disponibles para cualquier componente que use el hook usePomodoro()
  const value = {
    minutes, setMinutes,
    seconds, setSeconds,
    isActive, setIsActive,
    mode, setMode,
    sessions, setSessions,
    isFocusMode, setIsFocusMode,
    toggleFocusMode,
    toggleTimer,
    resetTimer,
    muted, setMuted
  };

  return (
    <PomodoroContext.Provider value={value}>
      {children}
    </PomodoroContext.Provider>
  );
};

/**
 * Hook personalizado para acceder fácilmente a los datos de Pomodoro
 */
export const usePomodoro = () => {
  const context = useContext(PomodoroContext);
  if (!context) {
    throw new Error('usePomodoro debe usarse dentro de un PomodoroProvider');
  }
  return context;
};
