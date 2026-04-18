// ============================================
// Test Play Page — Active test interface
// ============================================
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import './NoFailMode.css';

export default function TestPlay() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [test, setTest] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);
  const [startTime, setStartTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [answers, setAnswers] = useState({});
  const [marked, setMarked] = useState(new Set());

  const [shuffledIndices, setShuffledIndices] = useState([]);

  useEffect(() => {
    const question = test?.answers[currentIndex]?.question;
    if (question?.options) {
      const indices = question.options.map((_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      setShuffledIndices(indices);
    }
  }, [currentIndex, test]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (answered) {
        if (e.key === 'Enter') handleNext();
        return;
      }
      
      const key = e.key.toLowerCase();
      if (['a', 'b', 'c', 'd'].includes(key)) {
        const displayIdx = key.charCodeAt(0) - 97;
        const originalIdx = shuffledIndices[displayIdx];
        if (originalIdx !== undefined && test?.answers[currentIndex]?.question?.options[originalIdx]) {
          setSelectedIndex(originalIdx);
        }
      }
      
      if (e.key === 'Enter' && selectedIndex !== null) {
        handleAnswer();
      }

      if (e.key === 'm' || e.key === 'M') {
        toggleMarked();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [answered, selectedIndex, currentIndex, test, shuffledIndices]);

  useEffect(() => {
    api.getTestResult(testId)
      .then((res) => {
        if (res.data.isCompleted) {
          navigate(`/tests/${testId}/result`, { replace: true });
          return;
        }
        setTest(res.data);
      })
      .catch((err) => {
        toast.error(err.message);
        navigate('/tests');
      })
      .finally(() => setLoading(false));
  }, [testId]);

  // Timer
  useEffect(() => {
    if (!test || test.isCompleted) return;
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [test, startTime]);

  const handleAnswer = async () => {
    if (selectedIndex === null || answered) return;
    setChecking(true);
    setAnswered(true);

    const question = test.answers[currentIndex]?.question;
    const responseTime = Date.now() - startTime;

    try {
      const res = await api.submitTestAnswer(testId, {
        questionId: question.id,
        selectedIndex,
        responseTime,
      });
      setResult(res.data);
      setAnswers((prev) => ({ ...prev, [question.id]: { selectedIndex, isCorrect: res.data.isCorrect } }));
    } catch (err) {
      toast.error(err.message);
      setAnswered(false);
    } finally {
      setChecking(false);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < test.answers.length) {
      setCurrentIndex(currentIndex + 1);
      setSelectedIndex(null);
      setAnswered(false);
      setResult(null);
      setStartTime(Date.now());
    }
  };

  const handleComplete = async () => {
    try {
      await api.completeTest(testId);
      navigate(`/tests/${testId}/result`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;
  if (!test) return null;

  const question = test.answers[currentIndex]?.question;
  const totalAnswered = Object.keys(answers).length;
  const isLast = currentIndex + 1 >= test.answers.length;
  const timeLimit = test.timeLimit;
  const timeUp = timeLimit && elapsed >= timeLimit;

  if (timeUp) {
    handleComplete();
    return <div className="loading-screen"><div className="spinner"></div><p>Finalizando test...</p></div>;
  }

  const toggleMarked = () => {
    setMarked((prev) => {
      const next = new Set(prev);
      if (next.has(currentIndex)) next.delete(currentIndex);
      else next.add(currentIndex);
      return next;
    });
  };

  return (
    <div className="container">
      <div className="nofail-container animate-slide-up">
        {/* Header */}
        <div className="nofail-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <span className="nofail-question-counter">
              Pregunta {currentIndex + 1} / {test.answers.length}
            </span>
            <button 
                onClick={toggleMarked} 
                className={`btn btn-icon ${marked.has(currentIndex) ? 'btn-primary' : 'btn-ghost'}`}
                title="Marcar para revisión (M)"
            >
              {marked.has(currentIndex) ? '🚩' : '🏳️'}
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <span className={`badge ${timeLimit && elapsed > timeLimit * 0.8 ? 'badge-error' : 'badge-warning'}`}>
              ⏱️ {formatTime(timeLimit ? timeLimit - elapsed : elapsed)}
            </span>
            <button onClick={handleComplete} className="btn btn-ghost btn-sm">
              Finalizar
            </button>
          </div>
        </div>

        <div className="progress-bar" style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="progress-bar-fill" style={{ width: `${(totalAnswered / test.answers.length) * 100}%` }}></div>
        </div>

        {/* Question */}
        {question && (
          <div className="nofail-question-card card">
            {question.topic && (
              <div className="badge badge-primary" style={{ marginBottom: 'var(--space-md)' }}>
                {question.topic.title}
              </div>
            )}

            <h2 className="nofail-question-text">{question.questionText}</h2>

            <div className="nofail-options">
              {shuffledIndices.map((originalIdx, displayIdx) => {
                const option = question.options[originalIdx];
                let cls = 'nofail-option';
                if (answered && result) {
                  if (originalIdx === result.correctIndex) cls += ' correct';
                  else if (originalIdx === selectedIndex && !result.isCorrect) cls += ' incorrect';
                } else if (originalIdx === selectedIndex) cls += ' selected';

                return (
                  <button
                    key={originalIdx}
                    className={cls}
                    onClick={() => !answered && setSelectedIndex(originalIdx)}
                    disabled={answered}
                  >
                    <span className="nofail-option-letter">{String.fromCharCode(65 + displayIdx)}</span>
                    <span className="nofail-option-text">{option}</span>
                  </button>
                );
              })}
            </div>

            {answered && result?.explanation && (
              <div className="nofail-explanation">
                <strong>💡 Explicación:</strong> {result.explanation}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="nofail-actions">
          {!answered ? (
            <button 
              onClick={handleAnswer} 
              className="btn btn-primary btn-lg btn-full" 
              disabled={selectedIndex === null || checking}
            >
              {checking ? 'Comprobando...' : 'Confirmar respuesta'}
            </button>
          ) : isLast ? (
            <button onClick={handleComplete} className="btn btn-success btn-lg btn-full">
              📊 Ver resultados
            </button>
          ) : (
            <button onClick={handleNext} className="btn btn-success btn-lg btn-full">
              Siguiente pregunta →
            </button>
          )}
        </div>

        {/* Navigation dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: 'var(--space-lg)', flexWrap: 'wrap' }}>
          {test.answers.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (!answered || idx > currentIndex) return;
                setCurrentIndex(idx);
                setSelectedIndex(null);
                setAnswered(false);
                setResult(null);
              }}
              style={{
                width: '12px', height: '12px',
                borderRadius: '50%',
                border: marked.has(idx) ? '2px solid white' : 'none',
                boxShadow: marked.has(idx) ? '0 0 8px white' : 'none',
                cursor: idx <= currentIndex ? 'pointer' : 'default',
                background: answers[test.answers[idx]?.question?.id]
                  ? answers[test.answers[idx]?.question?.id].isCorrect ? 'var(--success-500)' : 'var(--error-500)'
                  : idx === currentIndex ? 'var(--primary-500)' : 'var(--border-color)',
                transition: 'all var(--transition-fast)',
                position: 'relative',
              }}
            >
              {marked.has(idx) && (
                <span style={{ position: 'absolute', top: '-15px', fontSize: '10px' }}>🚩</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
