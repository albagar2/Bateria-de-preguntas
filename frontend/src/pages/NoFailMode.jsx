// ============================================
// No-Fail Mode Page — Core feature
// Restart from beginning on any mistake
// ============================================
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import './NoFailMode.css';

export default function NoFailMode() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [failed, setFailed] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [streak, setStreak] = useState(0);
  const [maxReached, setMaxReached] = useState(0);

  const [shuffledIndices, setShuffledIndices] = useState([]);

  useEffect(() => {
    loadQuestions();
  }, [topicId]);

  useEffect(() => {
    if (questions[currentIndex]?.options) {
      const indices = questions[currentIndex].options.map((_, i) => i);
      // Modern Durstenfeld shuffle (Fisher-Yates)
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      setShuffledIndices(indices);
    }
  }, [currentIndex, questions]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const res = await api.getNoFailMode(topicId);
      setQuestions(res.data);
      setCurrentIndex(0);
      setStreak(0);
      setFailed(false);
      setCompleted(false);
      setAnswered(false);
      setSelectedIndex(null);
      setResult(null);
      setStartTime(Date.now());
    } catch (err) {
      toast.error(err.message);
      navigate('/topics');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = useCallback(async () => {
    if (selectedIndex === null || answered) return;

    const question = questions[currentIndex];
    const responseTime = Date.now() - startTime;

    setChecking(true);
    setAnswered(true);

    try {
      const res = await api.answerQuestion({
        questionId: question.id,
        selectedIndex,
        responseTime,
      });

      setResult(res.data);

      if (res.data.isCorrect) {
        const newStreak = streak + 1;
        setStreak(newStreak);
        if (newStreak > maxReached) setMaxReached(newStreak);

        // Check if completed all questions
        if (currentIndex + 1 >= questions.length) {
          setCompleted(true);
          toast.success('🎉 ¡Felicidades! Has completado todas las preguntas sin fallar');
          // Check achievements
          api.checkAchievements().catch(() => {});
        }
      } else {
        setFailed(true);
      }
    } catch (err) {
      toast.error('Error al enviar respuesta');
      setAnswered(false);
    } finally {
      setChecking(false);
    }
  }, [selectedIndex, answered, currentIndex, questions, startTime, streak, maxReached, toast]);

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
      setSelectedIndex(null);
      setAnswered(false);
      setResult(null);
      setStartTime(Date.now());
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setStreak(0);
    setFailed(false);
    setCompleted(false);
    setAnswered(false);
    setSelectedIndex(null);
    setResult(null);
    setStartTime(Date.now());
  };

  if (loading) {
    return <div className="loading-screen"><div className="spinner"></div><p>Cargando preguntas...</p></div>;
  }

  const question = questions[currentIndex];
  const progress = ((currentIndex + (answered && result?.isCorrect ? 1 : 0)) / questions.length) * 100;

  // Failed screen
  if (failed) {
    return (
      <div className="container">
        <div className="nofail-failed animate-slide-up">
          <div className="nofail-failed-icon">😔</div>
          <h1 className="nofail-failed-title">¡Has fallado!</h1>
          <p className="nofail-failed-subtitle">
            Pregunta {currentIndex + 1} de {questions.length} — Racha: {streak}
          </p>

          {result && (
            <div className="nofail-failed-explanation card">
              <p className="nofail-failed-question">{question.questionText}</p>
              <p className="nofail-failed-answer">
                ✅ Respuesta correcta: <strong>{question.options[result.correctIndex]}</strong>
              </p>
              {result.explanation && (
                <p className="nofail-failed-explain">{result.explanation}</p>
              )}
            </div>
          )}

          <div className="nofail-failed-actions">
            <button onClick={handleRestart} className="btn btn-primary btn-lg">
              🔁 Reintentar desde el inicio
            </button>
            <button onClick={() => navigate(`/topics/${topicId}`)} className="btn btn-secondary btn-lg">
              ← Volver al tema
            </button>
          </div>

          <div className="nofail-failed-stats">
            <span>Racha alcanzada: <strong>{streak}</strong></span>
            <span>Mejor racha: <strong>{maxReached}</strong></span>
          </div>
        </div>
      </div>
    );
  }

  // Completed screen
  if (completed) {
    return (
      <div className="container">
        <div className="nofail-completed animate-slide-up">
          <div className="nofail-completed-icon">🏆</div>
          <h1 className="nofail-completed-title">¡Perfecto!</h1>
          <p className="nofail-completed-subtitle">
            Has completado las {questions.length} preguntas sin fallar
          </p>
          <div className="nofail-completed-stats">
            <div className="stat-card">
              <div className="stat-value">{questions.length}</div>
              <div className="stat-label">Preguntas</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">100%</div>
              <div className="stat-label">Precisión</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">🔥 {streak}</div>
              <div className="stat-label">Racha</div>
            </div>
          </div>
          <div className="nofail-completed-actions">
            <button onClick={() => navigate('/topics')} className="btn btn-primary btn-lg">
              📚 Continuar con otro tema
            </button>
            <button onClick={handleRestart} className="btn btn-secondary btn-lg">
              🔁 Repetir tema
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Question screen
  return (
    <div className="container">
      <div className="nofail-container animate-slide-up">
        {/* Progress Header */}
        <div className="nofail-header">
          <button onClick={() => navigate(`/topics/${topicId}`)} className="btn btn-ghost btn-sm">
            ← Salir
          </button>
          <div className="nofail-progress-info">
            <span className="nofail-question-counter">
              Pregunta {currentIndex + 1} / {questions.length}
            </span>
            <span className="nofail-streak">🔥 {streak}</span>
          </div>
        </div>

        <div className="progress-bar" style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
        </div>

        {/* Question Card */}
        <div className="nofail-question-card card">
          <div className="nofail-difficulty">
            <span className={`badge badge-${question.difficulty === 'EASY' ? 'success' : question.difficulty === 'HARD' ? 'error' : 'warning'}`}>
              {question.difficulty === 'EASY' ? 'Fácil' : question.difficulty === 'HARD' ? 'Difícil' : 'Media'}
            </span>
          </div>

          <h2 className="nofail-question-text">{question.questionText}</h2>

          <div className="nofail-options">
            {shuffledIndices.map((originalIdx, displayIdx) => {
              const option = question.options[originalIdx];
              let optionClass = 'nofail-option';
              if (answered && result) {
                if (originalIdx === result.correctIndex) optionClass += ' correct';
                else if (originalIdx === selectedIndex && !result.isCorrect) optionClass += ' incorrect';
              } else if (originalIdx === selectedIndex) {
                optionClass += ' selected';
              }

              return (
                <button
                  key={originalIdx}
                  className={optionClass}
                  onClick={() => !answered && setSelectedIndex(originalIdx)}
                  disabled={answered}
                >
                  <span className="nofail-option-letter">
                    {String.fromCharCode(65 + displayIdx)}
                  </span>
                  <span className="nofail-option-text">{option}</span>
                  {answered && result && originalIdx === result.correctIndex && <span className="nofail-option-check">✓</span>}
                  {answered && result && originalIdx === selectedIndex && !result.isCorrect && <span className="nofail-option-check">✗</span>}
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {answered && result?.explanation && (
            <div className="nofail-explanation">
              <strong>💡 Explicación:</strong> {result.explanation}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="nofail-actions">
          {!answered ? (
            <button
              onClick={handleAnswer}
              className="btn btn-primary btn-lg btn-full"
              disabled={selectedIndex === null || checking}
            >
              {checking ? 'Comprobando...' : 'Confirmar respuesta'}
            </button>
          ) : result?.isCorrect && !completed ? (
            <button onClick={handleNext} className="btn btn-success btn-lg btn-full">
              Siguiente pregunta →
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
