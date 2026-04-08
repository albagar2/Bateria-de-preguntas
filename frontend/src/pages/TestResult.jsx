// ============================================
// Test Result Page
// ============================================
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

export default function TestResult() {
  const { testId } = useParams();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getTestResult(testId)
      .then((res) => setTest(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [testId]);

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;
  if (!test) return <div className="empty-state"><h3>Test no encontrado</h3></div>;

  const percentage = Math.round((test.correctAnswers / test.totalQuestions) * 100);
  const wrong = test.totalQuestions - test.correctAnswers;

  return (
    <div className="container animate-slide-up">
      <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>
          {percentage >= 80 ? '🏆' : percentage >= 60 ? '👍' : percentage >= 40 ? '📚' : '💪'}
        </div>
        <h1 className="page-title">Resultado del test</h1>
        <p className="page-subtitle" style={{ marginBottom: 'var(--space-2xl)' }}>
          {percentage >= 80 ? '¡Excelente resultado!' : percentage >= 60 ? 'Buen trabajo' : 'Sigue practicando'}
        </p>

        <div className="grid grid-3" style={{ marginBottom: 'var(--space-2xl)' }}>
          <div className="stat-card">
            <div className="stat-value" style={{ color: percentage >= 60 ? 'var(--success-400)' : 'var(--error-400)' }}>
              {percentage}%
            </div>
            <div className="stat-label">Puntuación</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{test.correctAnswers}/{test.totalQuestions}</div>
            <div className="stat-label">Aciertos</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{Math.round(test.timeSpent / 60)}min</div>
            <div className="stat-label">Tiempo</div>
          </div>
        </div>

        {test.penalizeErrors && (
          <div className="badge badge-warning" style={{ marginBottom: 'var(--space-lg)', display: 'inline-flex' }}>
            Nota con penalización: {test.score.toFixed(2)} / {test.totalQuestions}
          </div>
        )}

        {/* Answers review */}
        <div className="card" style={{ textAlign: 'left', marginBottom: 'var(--space-2xl)' }}>
          <h3 style={{ marginBottom: 'var(--space-lg)' }}>Revisión de respuestas</h3>
          {test.answers?.map((answer, idx) => (
            <div
              key={answer.id || idx}
              style={{
                padding: 'var(--space-md)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--space-sm)',
                background: answer.isCorrect ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                border: `1px solid ${answer.isCorrect ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
              }}
            >
              <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'flex-start', marginBottom: 'var(--space-sm)' }}>
                <span style={{ fontSize: '1.2rem' }}>{answer.isCorrect ? '✅' : '❌'}</span>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>
                    {idx + 1}. {answer.question?.questionText}
                  </p>
                  {answer.question?.topic && (
                    <span className="badge badge-primary" style={{ marginTop: '4px' }}>{answer.question.topic.title}</span>
                  )}
                </div>
              </div>
              {!answer.isCorrect && answer.question && (
                <div style={{ marginLeft: '2rem', fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
                  <p>Tu respuesta: <strong>{answer.question.options?.[answer.selectedIndex]}</strong></p>
                  <p style={{ color: 'var(--success-400)' }}>Correcta: <strong>{answer.question.options?.[answer.question.correctIndex]}</strong></p>
                  {answer.question.explanation && <p style={{ marginTop: '4px' }}>{answer.question.explanation}</p>}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/tests" className="btn btn-primary btn-lg">🧪 Nuevo test</Link>
          <Link to="/" className="btn btn-secondary btn-lg">🏠 Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
