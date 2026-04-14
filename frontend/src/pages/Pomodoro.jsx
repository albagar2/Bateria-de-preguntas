import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, RotateCcw, Coffee, BookOpen, 
  Settings, Bell, BellOff, Volume2 
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Pomodoro = () => {
  const toast = useToast();
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState('study'); // 'study' or 'break'
  const [sessions, setSessions] = useState(0);
  const [muted, setMuted] = useState(false);
  
  const timerRef = useRef(null);

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        if (seconds > 0) {
          setSeconds(s => s - 1);
        } else if (minutes > 0) {
          setMinutes(m => m - 1);
          setSeconds(59);
        } else {
          handleTimerEnd();
        }
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isActive, minutes, seconds]);

  const handleTimerEnd = () => {
    setIsActive(false);
    clearInterval(timerRef.current);
    
    if (!muted) {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(() => {});
    }

    if (mode === 'study') {
      const newSessions = sessions + 1;
      setSessions(newSessions);
      toast.success('🎯 ¡Sesión terminada! Toca un descanso.');
      // Long break every 4 sessions
      if (newSessions % 4 === 0) {
        setMode('break');
        setMinutes(15);
      } else {
        setMode('break');
        setMinutes(5);
      }
    } else {
      setMode('study');
      setMinutes(25);
      toast.info('📚 ¡A estudiar! Concentración máxima.');
    }
    setSeconds(0);
  };

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setMinutes(mode === 'study' ? 25 : 5);
    setSeconds(0);
  };

  const progress = ((mode === 'study' ? 25 : (sessions % 4 === 0 ? 15 : 5)) * 60 - (minutes * 60 + seconds)) / 
                   ((mode === 'study' ? 25 : (sessions % 4 === 0 ? 15 : 5)) * 60) * 100;

  return (
    <div className="container animate-slide-up" style={{ maxWidth: '600px', textAlign: 'center' }}>
      <div className="page-header">
        <h1 className="page-title">⏳ Modo Concentración</h1>
        <p className="page-subtitle">Método Pomodoro para maximizar tu retención</p>
      </div>

      <div className="card" style={{ padding: 'var(--space-3xl)', position: 'relative', overflow: 'hidden' }}>
        {/* Glow Background */}
        <div style={{ 
          position: 'absolute', 
          top: '-50%', 
          left: '-50%', 
          width: '200%', 
          height: '200%', 
          background: mode === 'study' ? 'radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, transparent 70%)',
          zIndex: 0 
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
            <span className={`badge ${mode === 'study' ? 'badge-primary' : 'badge-success'}`}>
              {mode === 'study' ? <BookOpen size={14} /> : <Coffee size={14} />}
              {mode === 'study' ? ' ESTUDIANDO' : ' DESCANSO'}
            </span>
            <span className="badge" style={{ background: 'var(--bg-soft)' }}> SESIÓN {sessions + 1}</span>
          </div>

          <div style={{ 
            fontSize: '8rem', 
            fontWeight: 800, 
            lineHeight: 1, 
            letterSpacing: '-4px',
            color: 'white',
            marginBottom: 'var(--space-xl)',
            fontVariantNumeric: 'tabular-nums'
          }}>
            {String(minutes).padStart(2, '0')}:
            <span style={{ color: mode === 'study' ? 'var(--primary-400)' : 'var(--success-400)' }}>
              {String(seconds).padStart(2, '0')}
            </span>
          </div>

          {/* Progress Circle Visual */}
          <div style={{ 
            width: '100%', 
            height: '4px', 
            background: 'var(--bg-soft)', 
            borderRadius: '2px', 
            marginBottom: 'var(--space-2xl)',
            overflow: 'hidden'
          }}>
            <motion.div 
              style={{ 
                height: '100%', 
                background: mode === 'study' ? 'var(--gradient-primary)' : 'var(--gradient-success)',
                width: `${progress}%`
              }} 
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-xl)', alignItems: 'center' }}>
            <button onClick={resetTimer} className="btn-icon" style={{ padding: '16px', background: 'var(--bg-soft)' }}>
              <RotateCcw size={24} />
            </button>
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={toggleTimer} 
              className="btn" 
              style={{ 
                width: '80px', 
                height: '80px', 
                borderRadius: '50%', 
                background: mode === 'study' ? 'var(--primary)' : 'var(--success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 10px 25px ${mode === 'study' ? 'rgba(99, 102, 241, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`
              }}
            >
              {isActive ? <Pause size={32} /> : <Play size={32} style={{ marginLeft: '4px' }} />}
            </motion.button>
            <button onClick={() => setMuted(!muted)} className="btn-icon" style={{ padding: '16px', background: 'var(--bg-soft)' }}>
              {muted ? <BellOff size={24} /> : <Bell size={24} />}
            </button>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 'var(--space-2xl)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
        <div className="card" style={{ padding: 'var(--space-md)', textAlign: 'left', fontSize: 'var(--font-xs)' }}>
          <h4 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Settings size={14} /> ¿Cómo funciona?
          </h4>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>
            25 min de foco profundo seguidos de 5 min de descanso mental.
          </p>
        </div>
        <div className="card" style={{ padding: 'var(--space-md)', textAlign: 'left', fontSize: 'var(--font-xs)' }}>
          <h4 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Volume2 size={14} /> ¡Atención!
          </h4>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>
            Recibirás una notificación sonora al terminar cada fase.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Pomodoro;
