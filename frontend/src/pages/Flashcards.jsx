import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RotateCcw, Check, X, ChevronRight, 
  HelpCircle, Zap, BookOpen, Trophy
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const Flashcards = () => {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ correct: 0, wrong: 0 });

  useEffect(() => {
    loadQuestions();
  }, [topicId]);

  const loadQuestions = async () => {
    try {
      // Use the existing question endpoint for a topic
      const response = await api.getQuestions({ topicId, limit: 100 });
      // Shuffle questions
      const shuffled = response.data.questions.sort(() => Math.random() - 0.5);
      setQuestions(shuffled);
    } catch (error) {
      toast.error('No se pudieron cargar las flashcards');
      navigate('/topics');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = (correct) => {
    if (correct) setStats(s => ({ ...s, correct: s.correct + 1 }));
    else setStats(s => ({ ...s, wrong: s.wrong + 1 }));

    if (currentIndex < questions.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(i => i + 1), 300);
    } else {
      // Finished
      toast.success('¡Sesión de Flashcards completada!');
    }
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner"></div>
      <p>Preparando tus flashcards...</p>
    </div>
  );

  const currentQuestion = questions[currentIndex];

  return (
    <div className="container" style={{ maxWidth: '600px', paddingBottom: 'var(--space-2xl)' }}>
      {/* Progress Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
        <button className="btn-text" onClick={() => navigate(-1)}>&larr; Volver</button>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ margin: 0 }}>Modo Flashcards</h2>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Carta {currentIndex + 1} de {questions.length}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
          <span style={{ color: 'var(--success)', fontWeight: 700 }}>{stats.correct}</span>
          <span style={{ color: 'var(--error)', fontWeight: 700 }}>{stats.wrong}</span>
        </div>
      </div>

      {/* Card Container */}
      <div style={{ perspective: '1000px', minHeight: '400px', cursor: 'pointer' }} onClick={() => setIsFlipped(!isFlipped)}>
        <motion.div
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
          style={{ 
            width: '100%', 
            height: '400px', 
            position: 'relative', 
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Front */}
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            background: 'var(--bg-elevated)',
            borderRadius: '24px',
            border: '2px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 'var(--space-2xl)',
            textAlign: 'center',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <HelpCircle size={48} color="var(--primary)" style={{ marginBottom: 'var(--space-xl)', opacity: 0.3 }} />
            <h3 style={{ margin: 0, lineHeight: 1.4 }}>{currentQuestion.questionText}</h3>
            <p style={{ marginTop: 'var(--space-2xl)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Toca para girar
            </p>
          </div>

          {/* Back */}
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            background: 'var(--gradient-primary)',
            color: 'white',
            borderRadius: '24px',
            transform: 'rotateY(180deg)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 'var(--space-2xl)',
            textAlign: 'center',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <Trophy size={48} style={{ marginBottom: 'var(--space-xl)', opacity: 0.5 }} />
            <h4 style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8, marginBottom: 'var(--space-xs)' }}>RESPUESTA CORRECTA:</h4>
            <h3 style={{ margin: 0, lineHeight: 1.4 }}>
              {currentQuestion.options[currentQuestion.correctIndex]}
            </h3>
            {currentQuestion.explanation && (
              <p style={{ marginTop: 'var(--space-md)', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                {currentQuestion.explanation}
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Actions */}
      <AnimatePresence>
        {isFlipped && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: 'var(--space-xl)', 
              marginTop: 'var(--space-2xl)' 
            }}
          >
            <button 
              className="btn" 
              style={{ background: '#ef4444', border: 'none' }}
              onClick={(e) => { e.stopPropagation(); handleNext(false); }}
            >
              <X size={20} /> La fallé
            </button>
            <button 
              className="btn btn-success" 
              onClick={(e) => { e.stopPropagation(); handleNext(true); }}
            >
              <Check size={20} /> ¡Me la sabía!
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ marginTop: 'var(--space-2xl)', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Usa las flashcards para mejorar tu retención memora activa.
        </p>
      </div>
    </div>
  );
};

export default Flashcards;
