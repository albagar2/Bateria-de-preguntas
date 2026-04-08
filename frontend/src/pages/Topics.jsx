// ============================================
// Topics Page — List of all study topics
// ============================================
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './Topics.css';

export default function Topics() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newTopic, setNewTopic] = useState({ title: '', description: '', icon: '📖' });

  const loadTopics = () => {
    setLoading(true);
    api.getTopics()
      .then((res) => setTopics(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTopics();
  }, []);

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    try {
      await api.createTopic(newTopic);
      setNewTopic({ title: '', description: '', icon: '📖' });
      setShowForm(false);
      loadTopics();
    } catch (err) {
      alert(err.message || 'Error al crear tema');
    }
  };

  if (loading) {
    return <div className="loading-screen"><div className="spinner"></div><p>Cargando temas...</p></div>;
  }

  return (
    <div className="container animate-slide-up">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">📚 Temas</h1>
          <p className="page-subtitle">Selecciona un tema para empezar a estudiar</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Añadir Tema'}
        </button>
      </div>

      {showForm && (
        <form className="card animate-slide-up" onSubmit={handleCreateTopic} style={{ marginBottom: 'var(--space-xl)' }}>
          <h3 style={{ marginBottom: 'var(--space-md)' }}>Añadir Nuevo Tema</h3>
          <div className="input-group">
            <label className="input-label">Título</label>
            <input required type="text" className="input" value={newTopic.title} onChange={e => setNewTopic({ ...newTopic, title: e.target.value })} placeholder="Ej: Constitución Española" />
          </div>
          <div className="input-group">
            <label className="input-label">Descripción</label>
            <input type="text" className="input" value={newTopic.description} onChange={e => setNewTopic({ ...newTopic, description: e.target.value })} placeholder="Breve descripción del temario..." />
          </div>
          <button type="submit" className="btn btn-success">Guardar Tema</button>
        </form>
      )}

      <div className="topics-grid">
        {topics.map((topic, i) => (
          <Link key={topic.id} to={`/topics/${topic.id}`} className="topic-card" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="topic-card-header">
              <span className="topic-card-icon" style={{ background: `${topic.color || '#6366f1'}22` }}>
                {topic.icon || '📖'}
              </span>
              <span className="topic-card-order">Tema {topic.order || i + 1}</span>
            </div>
            <h3 className="topic-card-title">{topic.title}</h3>
            {topic.description && (
              <p className="topic-card-desc">{topic.description}</p>
            )}
            <div className="topic-card-footer">
              <div className="topic-card-stats">
                <span>{topic.totalQuestions || topic._count?.questions || 0} preguntas</span>
                {topic.progressPercent !== undefined && (
                  <span className="topic-card-progress-text">{topic.progressPercent}% completado</span>
                )}
              </div>
              <div className="progress-bar">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${topic.progressPercent || 0}%`,
                    background: topic.progressPercent === 100 ? 'var(--gradient-success)' : 'var(--gradient-primary)',
                  }}
                ></div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {topics.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <h3 className="empty-state-title">No hay temas disponibles</h3>
          <p>El administrador aún no ha añadido temas.</p>
        </div>
      )}
    </div>
  );
}
