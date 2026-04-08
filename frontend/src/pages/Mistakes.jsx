// ============================================
// Mistakes Page — Error bank
// ============================================
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export default function Mistakes() {
  const [mistakes, setMistakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState([]);
  const [filter, setFilter] = useState('');
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [mistakesRes, topicsRes] = await Promise.all([
          api.getMistakes({ topicId: filter || undefined }),
          api.getTopics(),
        ]);
        setMistakes(mistakesRes.data.mistakes || []);
        setTopics(topicsRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [filter]);

  const handleReviewErrors = async () => {
    try {
      const res = await api.createTest({ type: 'ERROR_REVIEW', totalQuestions: 20 });
      navigate(`/tests/${res.data.id}/play`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div className="container animate-slide-up">
      <div className="page-header">
        <h1 className="page-title">❌ Banco de errores</h1>
        <p className="page-subtitle">Repasa las preguntas que has fallado para dominarlas</p>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-2xl)', flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={handleReviewErrors} className="btn btn-primary" disabled={mistakes.length === 0}>
          🔁 Repetir errores ({mistakes.length})
        </button>

        <select className="input" style={{ width: 'auto', minWidth: '200px' }} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">Todos los temas</option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>{t.title}</option>
          ))}
        </select>
      </div>

      {mistakes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎉</div>
          <h3 className="empty-state-title">¡No tienes errores pendientes!</h3>
          <p>Sigue estudiando y aquí aparecerán las preguntas que falles.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {mistakes.map((mistake) => (
            <div key={mistake.id} className="card" style={{ padding: 'var(--space-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-md)' }}>
                <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
                  {mistake.question?.topic && (
                    <span className="badge badge-primary">{mistake.question.topic.title}</span>
                  )}
                  <span className="badge badge-error">{mistake.mistakeCount}x fallada</span>
                </div>
              </div>

              <p style={{ fontWeight: 600, marginBottom: 'var(--space-md)' }}>
                {mistake.question?.questionText}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                {mistake.question?.options?.map((opt, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: 'var(--space-sm) var(--space-md)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 'var(--font-sm)',
                      background: idx === mistake.question.correctIndex ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                      borderLeft: idx === mistake.question.correctIndex ? '3px solid var(--success-500)' : '3px solid transparent',
                    }}
                  >
                    {String.fromCharCode(65 + idx)}. {opt}
                    {idx === mistake.question.correctIndex && ' ✅'}
                  </div>
                ))}
              </div>

              {mistake.question?.explanation && (
                <div className="nofail-explanation" style={{ marginTop: 'var(--space-md)' }}>
                  💡 {mistake.question.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
