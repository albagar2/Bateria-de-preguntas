import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, X, Maximize2 } from 'lucide-react';
import { usePomodoro } from '../context/PomodoroContext';
import { Link } from 'react-router-dom';

/**
 * BARRA FLOTANTE DE POMODORO
 * Este componente es global y se muestra cuando el cronómetro está activo o
 * cuando el usuario está en el "Modo Sin Distracciones".
 * Permite seguir el tiempo mientras se navega por la app o se hace un test.
 */
export default function PomodoroStickyBar() {
  const { 
    minutes, seconds, isActive, mode, 
    toggleTimer, resetTimer, isFocusMode, setIsFocusMode 
  } = usePomodoro();

  // Si el tiempo no está corriendo Y no estamos en modo enfoque, no mostramos nada
  if (!isActive && !isFocusMode) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: 100, opacity: 0 }} // Aparece desde abajo
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        style={{
          position: 'fixed',
          bottom: 'var(--space-md)',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-full)',
          padding: 'var(--space-xs) var(--space-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-md)',
          boxShadow: 'var(--shadow-xl)',
          color: 'white'
        }}
      >
        {/* Tiempo y Punto de Estado */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <span style={{ 
            width: '8px', 
            height: '8px', 
            borderRadius: '50%', 
            background: mode === 'study' ? 'var(--primary-500)' : 'var(--success-500)',
            boxShadow: `0 0 10px ${mode === 'study' ? 'var(--primary-500)' : 'var(--success-500)'}`
          }} />
          <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', width: '45px' }}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
        </div>

        <div style={{ width: '1px', height: '20px', background: 'var(--border-color)' }} />

        {/* Controles rápidos */}
        <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
          <button onClick={toggleTimer} className="btn-icon btn-sm" style={{ background: 'transparent' }} title={isActive ? 'Pausar' : 'Reanudar'}>
            {isActive ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button onClick={resetTimer} className="btn-icon btn-sm" style={{ background: 'transparent' }} title="Reiniciar">
            <RotateCcw size={18} />
          </button>
        </div>

        <div style={{ width: '1px', height: '20px', background: 'var(--border-color)' }} />

        {/* Acciones de ventana */}
        <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
          {/* Volver a la página completa de Pomodoro */}
          <Link to="/pomodoro" className="btn-icon btn-sm" style={{ background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'inherit' }} title="Ir a Pomodoro">
            <Maximize2 size={18} />
          </Link>
          {/* Cerrar barra / Desactivar enfoque */}
          <button onClick={() => setIsFocusMode(false)} className="btn-icon btn-sm" style={{ background: 'transparent' }} title="Cerrar/Salir de Enfoque">
            <X size={18} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
