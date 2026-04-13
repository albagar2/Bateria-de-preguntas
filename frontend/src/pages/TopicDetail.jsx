// ============================================
// Topic Detail Page
// ============================================
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import swal from '../utils/swal';
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

        {topic.subtopics?.length > 0 && (
          <div className="subtopics-list" style={{ marginBottom: 'var(--space-xl)' }}>
            <h3 className="section-title" style={{ fontSize: 'var(--font-md)', marginBottom: 'var(--space-md)' }}>📂 Subtemas en este tema</h3>
            <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
              {topic.subtopics.map(sub => (
                <div key={sub.id} className="badge badge-secondary" style={{ padding: 'var(--space-xs) var(--space-md)' }}>
                  {sub.title} ({sub._count?.questions || 0})
                </div>
              ))}
            </div>
          </div>
        )}

        <hr style={{ border: '0', borderTop: '1px solid var(--border-color)', margin: 'var(--space-xl) 0' }} />

        <div className="topic-content-preview">
           <h3 className="section-title" style={{ fontSize: 'var(--font-lg)', marginBottom: 'var(--space-xl)' }}>📖 Contenido del tema</h3>
           {[null, ...(topic.subtopics || [])].map(container => {
              const containerId = container?.id || null;
              const filteredQuestions = (topic.questions || []).filter(q => q.subtopicId === containerId);
              
              if (filteredQuestions.length === 0) return null;

              return (
                <div key={containerId || 'no-subtopic'} style={{ marginBottom: 'var(--space-2xl)' }}>
                  <h4 style={{ 
                    borderBottom: '2px solid var(--primary-100)', 
                    paddingBottom: 'var(--space-xs)', 
                    marginBottom: 'var(--space-lg)', 
                    color: containerId ? 'var(--primary-600)' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-sm)'
                  }}>
                    {container ? `🔹 ${container.title}` : '🔸 Preguntas generales'}
                    <span style={{ fontSize: 'var(--font-xs)', fontWeight: 'normal', background: 'var(--bg-light)', padding: '2px 8px', borderRadius: '10px' }}>
                      {filteredQuestions.length}
                    </span>
                  </h4>
                  <div className="questions-grid" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                    {filteredQuestions.map((q, idx) => (
                      <div key={q.id} className="card" style={{ padding: 'var(--space-md)', background: 'var(--bg-light)', border: '1px solid var(--border-color)' }}>
                        <p style={{ margin: 0, fontWeight: 500, fontSize: 'var(--font-sm)' }}>
                          <span style={{ color: 'var(--text-muted)', marginRight: 'var(--space-sm)' }}>{idx + 1}.</span>
                          {q.questionText}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
           })}
        </div>

        <hr style={{ border: '0', borderTop: '1px solid var(--border-color)', margin: 'var(--space-xl) 0' }} />

        <h3 className="section-title" style={{ fontSize: 'var(--font-lg)' }}>➕ Añadir Pregunta</h3>
        <QuestionForm 
          topicId={topic.id} 
          subtopics={topic.subtopics || []}
          onCreated={() => {
            api.getTopic(id).then(res => setTopic(res.data));
          }} 
        />
      </div>
    </div>
  );
}

function QuestionForm({ topicId, subtopics, onCreated }) {
  const [form, setForm] = useState({
    questionText: '',
    options: ['', '', '', ''],
    correctIndex: 0,
    explanation: '',
    difficulty: 'MEDIUM',
    subtopicId: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.questionText || form.options.some(o => !o)) {
      swal.alert('Atención', 'Por favor rellena todos los campos', 'warning');
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
        difficulty: 'MEDIUM',
        subtopicId: ''
      });
      onCreated();
      swal.success('¡Hecho!', 'Pregunta añadida correctamente');
    } catch (err) {
      swal.error('Error', err.message);
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

      {subtopics.length > 0 && (
        <div className="input-group">
          <label className="input-label">Vincular a Subtema</label>
          <select 
            className="input"
            value={form.subtopicId}
            onChange={e => setForm({...form, subtopicId: e.target.value})}
          >
            <option value="">Ninguno (General)</option>
            {subtopics.map(sub => (
              <option key={sub.id} value={sub.id}>{sub.title}</option>
            ))}
          </select>
        </div>
      )}

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
