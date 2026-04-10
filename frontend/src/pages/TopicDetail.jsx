// ============================================
// Topic Detail Page
// ============================================
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import './Topics.css';

export default function TopicDetail() {
  const { id } = useParams();
  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getTopic(id)
      .then((res) => setTopic(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;
  if (!topic) return <div className="empty-state"><h3>Tema no encontrado</h3></div>;

  const questionCount = topic.questions?.length || topic._count?.questions || 0;

  return (
    <div className="container animate-slide-up">
      <div className="topic-detail-header">
        <div className="topic-detail-icon">{topic.icon || '📖'}</div>
        <div>
          <h1 className="page-title">{topic.title}</h1>
          <p className="page-subtitle">{topic.description || `${questionCount} preguntas disponibles`}</p>
        </div>
      </div>

      <div className="topic-detail-actions">
        {questionCount > 0 ? (
          <>
            <Link to={`/no-fail/${topic.id}`} className="btn btn-primary btn-lg">
              🔁 Modo sin fallos
            </Link>
            <Link
              to={`/tests?topicId=${topic.id}`}
              className="btn btn-secondary btn-lg"
            >
              🧪 Test del tema
            </Link>
          </>
        ) : (
          <div className="card text-center" style={{ width: '100%', background: 'rgba(99, 102, 241, 0.1)', border: '1px dashed var(--primary-400)' }}>
            <p style={{ margin: 'var(--space-md) 0' }}>💡 Este tema aún no tiene preguntas. ¡Añade algunas abajo para empezar a estudiar!</p>
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: 'var(--space-2xl)' }}>
        <h2 className="section-title">Información del tema</h2>
        <div className="grid grid-3" style={{ marginTop: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
          <div className="stat-card">
            <div className="stat-icon">📝</div>
            <div className="stat-value">{questionCount}</div>
            <div className="stat-label">Preguntas</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-value">{topic.progressPercent || 0}%</div>
            <div className="stat-label">Completado</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-value">{topic.mastered || 0}</div>
            <div className="stat-label">Dominadas</div>
          </div>
        </div>

        <hr style={{ border: '0', borderTop: '1px solid var(--border-color)', margin: 'var(--space-xl) 0' }} />

        <h3 className="section-title" style={{ fontSize: 'var(--font-lg)' }}>➕ Añadir Pregunta</h3>
        <QuestionForm topicId={topic.id} onCreated={() => {
          api.getTopic(id).then(res => setTopic(res.data));
        }} />
      </div>
    </div>
  );
}

function QuestionForm({ topicId, onCreated }) {
  const [form, setForm] = useState({
    questionText: '',
    options: ['', '', '', ''],
    correctIndex: 0,
    explanation: '',
    difficulty: 'MEDIUM'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.questionText || form.options.some(o => !o)) {
      alert('Por favor rellena todos los campos');
      return;
    }
    setLoading(true);
    try {
      await api.createQuestion({ ...form, topicId });
      setForm({
        questionText: '',
        options: ['', '', '', ''],
        correctIndex: 0,
        explanation: '',
        difficulty: 'MEDIUM'
      });
      onCreated();
      alert('Pregunta añadida correctamente');
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
      <div className="input-group">
        <label className="input-label">Texto de la pregunta</label>
        <textarea 
          className="input" 
          rows="3" 
          value={form.questionText} 
          onChange={e => setForm({...form, questionText: e.target.value})}
          placeholder="¿Cuál es el artículo de...?"
        />
      </div>

      <div className="grid grid-2" style={{ gap: 'var(--space-md)' }}>
        {form.options.map((opt, i) => (
          <div key={i} className="input-group">
            <label className="input-label" style={{ display: 'flex', gap: 'var(--space-xs)' }}>
              <input 
                type="radio" 
                checked={form.correctIndex === i} 
                onChange={() => setForm({...form, correctIndex: i})} 
              />
              Opción {i + 1} {form.correctIndex === i && '(Correcta)'}
            </label>
            <input 
              className="input" 
              value={opt} 
              onChange={e => {
                const newOpts = [...form.options];
                newOpts[i] = e.target.value;
                setForm({...form, options: newOpts});
              }}
              placeholder={`Respuesta ${i + 1}`}
            />
          </div>
        ))}
      </div>

      <div className="input-group">
        <label className="input-label">Explicación (opcional)</label>
        <textarea 
          className="input" 
          rows="2" 
          value={form.explanation} 
          onChange={e => setForm({...form, explanation: e.target.value})}
          placeholder="La base legal es..."
        />
      </div>

      <button type="submit" className="btn btn-success btn-lg" disabled={loading}>
        {loading ? 'Guardando...' : 'Guardar Pregunta'}
      </button>
    </form>
  );
}
