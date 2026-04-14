import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, RotateCcw, Coffee, BookOpen, 
  Settings, Bell, BellOff, Volume2, Shield,
  Zap, Brain, Target, ArrowRight
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { usePomodoro } from '../context/PomodoroContext';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const Pomodoro = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const { 
    minutes, setMinutes, 
    seconds, setSeconds, 
    isActive, setIsActive, 
    mode, setMode, 
    sessions, setSessions,
    isFocusMode, setIsFocusMode,
    toggleTimer, resetTimer,
    muted, setMuted 
  } = usePomodoro();

  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);

  useEffect(() => {
    api.getTopics().then(res => setTopics(res.data)).catch(console.error);
  }, []);

  const totalTime = mode === 'study' ? 25 : (sessions > 0 && sessions % 4 === 0 ? 15 : 5);
  const remainingSeconds = minutes * 60 + seconds;
  const totalSeconds = totalTime * 60;
  const progressPercent = ((totalSeconds - remainingSeconds) / totalSeconds) * 100;
  
  // Circular progress math
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progressPercent / 100) * circumference;

  const handleStartTest = async () => {
    if (!selectedTopic && topics.length > 0) {
        toast.info("Selecciona un tema o elige 'Test Rápido'");
        return;
    }

    try {
        const testData = {
            type: selectedTopic ? 'TOPIC' : 'QUICK',
            topicIds: selectedTopic ? [selectedTopic] : [],
            totalQuestions: 10,
            timeLimit: null
        };
        const res = await api.createTest(testData);
        setIsFocusMode(true);
        if (!isActive) toggleTimer(); // Start timer if not running
        navigate(`/tests/${res.data.id}/play`);
    } catch (err) {
        toast.error("No se pudo iniciar el test");
    }
  };

  return (
    <div className="container animate-slide-up" style={{ maxWidth: '900px' }}>
      <div className="page-header" style={{ textAlign: 'center' }}>
        <h1 className="page-title">⏳ Modo Concentración</h1>
        <p className="page-subtitle">Personaliza tu sesión de profundidad y evita distracciones</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2xl)', alignItems: 'start' }}>
        
        {/* Left Col: Timer UI */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
          <div className="card" style={{ 
            padding: 'var(--space-2xl)', 
            textAlign: 'center',
            background: 'var(--bg-elevated)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Visual background element */}
            <div style={{
                position: 'absolute',
                top: -100,
                right: -100,
                width: 300,
                height: 300,
                background: mode === 'study' ? 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
                zIndex: 0
            }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: 'var(--space-lg)' }}>
                    <span className={`badge ${mode === 'study' ? 'badge-primary' : 'badge-success'}`}>
                        {mode === 'study' ? <BookOpen size={14} /> : <Coffee size={14} />}
                        {mode === 'study' ? ' ESTUDIANDO' : ' DESCANSO'}
                    </span>
                    <span className="badge" style={{ background: 'var(--bg-soft)' }}>S{sessions + 1}</span>
                </div>

                {/* SVG Progress Circle */}
                <div style={{ position: 'relative', width: '280px', height: '280px', margin: '0 auto var(--space-xl)' }}>
                    <svg width="280" height="280" style={{ transform: 'rotate(-90deg)' }}>
                        {/* Track */}
                        <circle 
                            cx="140" cy="140" r={radius}
                            fill="transparent" 
                            stroke="var(--bg-soft)" 
                            strokeWidth="12" 
                        />
                        {/* Progress */}
                        <motion.circle 
                            cx="140" cy="140" r={radius}
                            fill="transparent" 
                            stroke={mode === 'study' ? 'var(--primary-500)' : 'var(--success-500)'}
                            strokeWidth="12" 
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            animate={{ strokeDashoffset: offset }}
                            transition={{ duration: 0.5, ease: "linear" }}
                        />
                    </svg>
                    
                    <div style={{ 
                        position: 'absolute', 
                        top: '50%', left: '50%', 
                        transform: 'translate(-50%, -50%)',
                        fontSize: '4.5rem',
                        fontWeight: 900,
                        letterSpacing: '-2px',
                        fontVariantNumeric: 'tabular-nums'
                    }}>
                        {String(minutes).padStart(2, '0')}:
                        <span style={{ color: mode === 'study' ? 'var(--primary-400)' : 'var(--success-400)' }}>
                            {String(seconds).padStart(2, '0')}
                        </span>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-xl)', alignItems: 'center' }}>
                    <button onClick={resetTimer} className="btn-icon" style={{ background: 'var(--bg-soft)', width: '50px', height: '50px' }}>
                        <RotateCcw size={22} />
                    </button>
                    
                    <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={toggleTimer} 
                        className="btn" 
                        style={{ 
                            width: '90px', 
                            height: '90px', 
                            borderRadius: '50%', 
                            background: mode === 'study' ? 'var(--primary-500)' : 'var(--success-500)',
                            boxShadow: mode === 'study' ? 'var(--shadow-glow)' : 'var(--shadow-glow-success)'
                        }}
                    >
                        {isActive ? <Pause size={36} fill='white' /> : <Play size={36} fill='white' style={{ marginLeft: '6px' }} />}
                    </motion.button>

                    <button onClick={() => setMuted(!muted)} className="btn-icon" style={{ background: 'var(--bg-soft)', width: '50px', height: '50px' }}>
                        {muted ? <BellOff size={22} /> : <Bell size={22} />}
                    </button>
                </div>
            </div>
          </div>

          <div className="card" style={{ padding: 'var(--space-md)', background: isFocusMode ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-elevated)', border: isFocusMode ? '1px solid var(--primary-500)' : '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                      <div style={{ 
                          width: '40px', 
                          height: '40px', 
                          borderRadius: '10px', 
                          background: isFocusMode ? 'var(--primary-500)' : 'var(--bg-soft)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                      }}>
                          <Shield size={20} color={isFocusMode ? 'white' : 'var(--text-secondary)'} />
                      </div>
                      <div>
                          <h4 style={{ margin: 0 }}>Modo Sin Distracciones</h4>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Oculta menús y notificaciones</p>
                      </div>
                  </div>
                  <label className="switch">
                      <input 
                        type="checkbox" 
                        checked={isFocusMode}
                        onChange={() => setIsFocusMode(!isFocusMode)}
                      />
                      <span className="slider"></span>
                  </label>
              </div>
          </div>
        </div>

        {/* Right Col: Test Integration */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
            <div className="card" style={{ border: '1px solid var(--primary-300)', position: 'relative' }}>
                <div style={{ marginBottom: 'var(--space-lg)' }}>
                    <h3 style={{ marginBottom: 'var(--space-xs)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Zap size={20} color="var(--primary-400)" /> Potencia tu estudio
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Combina el tiempo de concentración con una batería rápida de preguntas.</p>
                </div>

                <div className="input-group" style={{ marginBottom: 'var(--space-lg)' }}>
                    <label className="input-label">Elegir tema (opcional)</label>
                    <select 
                        className="input" 
                        value={selectedTopic || ''} 
                        onChange={(e) => setSelectedTopic(e.target.value)}
                        style={{ background: 'var(--bg-soft)' }}
                    >
                        <option value="">⚡ Test Rápido (Aleatorio)</option>
                        {topics.map(t => (
                            <option key={t.id} value={t.id}>{t.icon} {t.title}</option>
                        ))}
                    </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: '0.85rem' }}>
                        <Brain size={16} color="var(--primary-400)" />
                        <span>10 preguntas seleccionadas por IA</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: '0.85rem' }}>
                        <Target size={16} color="var(--primary-400)" />
                        <span>Foco en tus áreas débiles</span>
                    </div>
                </div>

                <button 
                    onClick={handleStartTest}
                    className="btn btn-primary btn-lg btn-full"
                    style={{ gap: '12px' }}
                >
                    Comenzar Test <ArrowRight size={20} />
                </button>
            </div>

            <div className="card-glass" style={{ padding: 'var(--space-lg)', border: '1px dashed var(--border-color)' }}>
                <h4 style={{ margin: '0 0 var(--space-sm) 0', color: 'var(--primary-300)' }}>💡 Pro-Tip</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Realizar un test inmediatamente después de estudiar aumenta un 70% la retención a largo plazo. El cronómetro seguirá corriendo mientras haces el test.
                </p>
            </div>
        </div>

      </div>

    </div>
  );
};

export default Pomodoro;
