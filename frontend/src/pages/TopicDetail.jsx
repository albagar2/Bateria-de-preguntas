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
        <Link to={`/no-fail/${topic.id}`} className="btn btn-primary btn-lg">
          🔁 Modo sin fallos
        </Link>
        <Link
          to={`/tests?topicId=${topic.id}`}
          className="btn btn-secondary btn-lg"
        >
          🧪 Test del tema
        </Link>
      </div>

      <div className="card" style={{ marginTop: 'var(--space-2xl)' }}>
        <h2 className="section-title">Información del tema</h2>
        <div className="grid grid-3" style={{ marginTop: 'var(--space-lg)' }}>
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
      </div>
    </div>
  );
}
