// ============================================
// Test Setup Page
// ============================================
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export default function TestSetup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [form, setForm] = useState({
    type: 'QUICK',
    topicIds: searchParams.get('topicId') ? [searchParams.get('topicId')] : [],
    totalQuestions: 20,
    timeLimit: null,
    penalizeErrors: false,
  });

  useEffect(() => {
    api.getTopics().then((res) => setTopics(res.data)).catch(console.error);
    api.getTestHistory().then((res) => setHistory(res.data.tests || [])).catch(console.error);
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await api.createTest(form);
      navigate(`/tests/${res.data.id}/play`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleTopic = (id) => {
    setForm((prev) => ({
      ...prev,
      topicIds: prev.topicIds.includes(id)
        ? prev.topicIds.filter((t) => t !== id)
        : [...prev.topicIds, id],
    }));
  };

  const testTypes = [
    { value: 'QUICK', label: '⚡ Test rápido', desc: 'Preguntas aleatorias de todos los temas' },
    { value: 'TOPIC', label: '📚 Por temas', desc: 'Solo preguntas de los temas seleccionados' },
    { value: 'EXAM_SIMULATION', label: '📝 Simulacro', desc: 'Simula un examen real con temporizador' },
    { value: 'ERROR_REVIEW', label: '❌ Repasar errores', desc: 'Solo preguntas que has fallado' },
  ];

  return (
    <div className="container animate-slide-up">
      <div className="page-header">
        <h1 className="page-title">🧪 Tests</h1>
        <p className="page-subtitle">Configura y comienza un test</p>
      </div>

      <div style={{ maxWidth: '700px' }}>
        {/* Test Type */}
        <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
          <h3 style={{ marginBottom: 'var(--space-lg)' }}>Tipo de test</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {testTypes.map((t) => (
              <button
                key={t.value}
                className={`nofail-option ${form.type === t.value ? 'selected' : ''}`}
                onClick={() => setForm({ ...form, type: t.value })}
                style={{ border: '1px solid var(--border-color)' }}
              >
                <span className="nofail-option-text">
                  <strong>{t.label}</strong>
                  <br />
                  <small style={{ color: 'var(--text-muted)' }}>{t.desc}</small>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Topic selection */}
        {(form.type === 'TOPIC' || form.type === 'EXAM_SIMULATION') && (
          <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
            <h3 style={{ marginBottom: 'var(--space-lg)' }}>Seleccionar temas</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
              {topics.map((topic) => (
                <button
                  key={topic.id}
                  className={`btn ${form.topicIds.includes(topic.id) ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  onClick={() => toggleTopic(topic.id)}
                >
                  {topic.icon} {topic.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Configuration */}
        <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
          <h3 style={{ marginBottom: 'var(--space-lg)' }}>Configuración</h3>

          <div className="input-group" style={{ marginBottom: 'var(--space-md)' }}>
            <label className="input-label">Número de preguntas</label>
            <select
              className="input"
              value={form.totalQuestions}
              onChange={(e) => setForm({ ...form, totalQuestions: parseInt(e.target.value) })}
            >
              <option value={10}>10 preguntas</option>
              <option value={20}>20 preguntas</option>
              <option value={30}>30 preguntas</option>
              <option value={50}>50 preguntas</option>
              <option value={100}>100 preguntas</option>
            </select>
          </div>

          {form.type === 'EXAM_SIMULATION' && (
            <div className="input-group" style={{ marginBottom: 'var(--space-md)' }}>
              <label className="input-label">Tiempo límite (minutos)</label>
              <select
                className="input"
                value={form.timeLimit || ''}
                onChange={(e) => setForm({ ...form, timeLimit: e.target.value ? parseInt(e.target.value) * 60 : null })}
              >
                <option value="">Sin límite</option>
                <option value={15}>15 minutos</option>
                <option value={30}>30 minutos</option>
                <option value={60}>60 minutos</option>
                <option value={90}>90 minutos</option>
                <option value={120}>120 minutos</option>
              </select>
            </div>
          )}

          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', cursor: 'pointer', fontSize: 'var(--font-sm)' }}>
            <input
              type="checkbox"
              checked={form.penalizeErrors}
              onChange={(e) => setForm({ ...form, penalizeErrors: e.target.checked })}
            />
            Penalizar errores (-0.33 por fallo)
          </label>
        </div>

        <button
          onClick={handleSubmit}
          className="btn btn-primary btn-lg btn-full"
          disabled={loading}
        >
          {loading ? <span className="spinner spinner-sm"></span> : '🚀 Comenzar test'}
        </button>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="card" style={{ marginTop: 'var(--space-2xl)' }}>
          <h3 style={{ marginBottom: 'var(--space-lg)' }}>📋 Historial de tests</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {history.slice(0, 5).map((test) => (
              <div
                key={test.id}
                onClick={() => navigate(`/tests/${test.id}/result`)}
                className="dashboard-topic-item"
                style={{ cursor: 'pointer' }}
              >
                <div className="dashboard-topic-info">
                  <span className="dashboard-topic-name">
                    {test.type === 'QUICK' ? '⚡' : test.type === 'EXAM_SIMULATION' ? '📝' : test.type === 'ERROR_REVIEW' ? '❌' : '📚'}{' '}
                    {test.correctAnswers}/{test.totalQuestions} correctas
                  </span>
                  <span className="dashboard-topic-stats">
                    {new Date(test.completedAt).toLocaleDateString('es-ES')} · {Math.round(test.timeSpent / 60)}min
                  </span>
                </div>
                <span className="dashboard-topic-percent">
                  {Math.round((test.correctAnswers / test.totalQuestions) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
