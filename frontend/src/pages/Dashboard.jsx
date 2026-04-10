// ============================================
// Dashboard Page - Main hub
// ============================================
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Dashboard.css';

export default function Dashboard() {
  const { user, updateUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [todayPlan, setTodayPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [oppositions, setOppositions] = useState([]);
  const [selectingOpposition, setSelectingOpposition] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsRes, planRes] = await Promise.all([
          api.getStats(),
          api.getTodayPlan(),
        ]);
        setStats(statsRes.data);
        setTodayPlan(planRes.data);
      } catch (err) {
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.oppositionId) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user?.oppositionId]);

  useEffect(() => {
    if (user && !user.oppositionId) {
      api.getOppositions().then(res => setOppositions(res.data)).catch(console.error);
    }
  }, [user]);

  const handleSelectOpposition = async (oppId) => {
    setSelectingOpposition(true);
    try {
      const res = await api.updateProfile({ oppositionId: oppId });
      updateUser(res.data);
    } catch (err) {
      console.error('Error selecting opposition:', err);
    } finally {
      setSelectingOpposition(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Cargando tu progreso...</p>
      </div>
    );
  }

  if (user && !user.oppositionId) {
    return (
      <div className="container animate-slide-up">
        <div className="card text-center" style={{ padding: 'var(--space-xl)', maxWidth: '800px', margin: 'var(--space-xl) auto' }}>
          <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>🎯</div>
          <h1 className="page-title">¡Bienvenido a BateriaQ!</h1>
          <p className="page-subtitle" style={{ marginBottom: 'var(--space-lg)' }}>
            Para empezar, cuéntanos qué oposición estás preparando. Así podremos mostrarte el temario y las preguntas adecuadas.
          </p>

          <div className="grid grid-2" style={{ textAlign: 'left', gap: 'var(--space-md)' }}>
            {oppositions.map(opp => (
              <button
                key={opp.id}
                className="dashboard-action-card"
                onClick={() => handleSelectOpposition(opp.id)}
                style={{ width: '100%', border: '1px solid var(--border-color)', background: 'none' }}
                disabled={selectingOpposition}
              >
                <span className="dashboard-action-icon">{opp.icon}</span>
                <span className="dashboard-action-label" style={{ display: 'block' }}>{opp.name}</span>
                <span className="dashboard-action-desc">{opp.description || 'Prepárate con nosotros'}</span>
              </button>
            ))}

            <button
              className="dashboard-action-card"
              onClick={() => {
                const name = prompt('Nombre de la oposición:');
                if (name) {
                  const description = prompt('Breve descripción:');
                  api.createOpposition({ name, description, icon: '🎯' })
                    .then(res => handleSelectOpposition(res.data.id))
                    .catch(err => alert('Error al crear oposición: ' + err.message));
                }
              }}
              style={{ width: '100%', border: '1px dashed var(--primary-500)', background: 'rgba(99, 102, 241, 0.05)' }}
              disabled={selectingOpposition}
            >
              <span className="dashboard-action-icon">➕</span>
              <span className="dashboard-action-label" style={{ display: 'block' }}>Abrir nueva...</span>
              <span className="dashboard-action-desc">Crea tu propio temario personalizado</span>
            </button>
          </div>

          {selectingOpposition && (
            <div style={{ marginTop: 'var(--space-lg)' }}>
              <span className="spinner spinner-sm"></span> Configurando tu plan...
            </div>
          )}
        </div>
      </div>
    );
  }

  const overview = stats?.overview || {};
  const streak = stats?.streak || {};

  return (
    <div className="container animate-slide-up">
      {/* Welcome Section */}
      <div className="dashboard-welcome">
        <div className="dashboard-welcome-text">
          <h1 className="page-title">
            ¡Hola, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="page-subtitle">
            {streak.currentStreak > 0
              ? `🔥 Llevas ${streak.currentStreak} días seguidos estudiando. ¡No pares!`
              : 'Es un buen momento para empezar a estudiar'}
          </p>
        </div>
        <Link to="/topics" className="btn btn-primary btn-lg dashboard-continue-btn">
          📚 Continuar estudio
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-4 dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-value">{overview.progressPercent || 0}%</div>
          <div className="stat-label">Progreso total</div>
          <div className="progress-bar" style={{ marginTop: '0.75rem' }}>
            <div className="progress-bar-fill" style={{ width: `${overview.progressPercent || 0}%` }}></div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-value">{streak.currentStreak || 0}</div>
          <div className="stat-label">Racha actual (días)</div>
          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Máxima: {streak.maxStreak || 0}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{overview.accuracyPercent || 0}%</div>
          <div className="stat-label">Precisión total</div>
          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            {overview.correctAnswers || 0} / {overview.totalAnswered || 0}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⚡</div>
          <div className="stat-value">{streak.currentNoFail || 0}</div>
          <div className="stat-label">Racha sin fallos</div>
          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Máxima: {streak.maxNoFail || 0}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dashboard-actions">
        <h2 className="section-title">Acceso rápido</h2>
        <div className="grid grid-3">
          <Link to="/topics" className="dashboard-action-card">
            <span className="dashboard-action-icon">📚</span>
            <span className="dashboard-action-label">Temas</span>
            <span className="dashboard-action-desc">Estudia por temas</span>
          </Link>
          <Link to="/tests" className="dashboard-action-card">
            <span className="dashboard-action-icon">🧪</span>
            <span className="dashboard-action-label">Test Global</span>
            <span className="dashboard-action-desc">Simulacro de examen</span>
          </Link>
          <Link to="/mistakes" className="dashboard-action-card">
            <span className="dashboard-action-icon">❌</span>
            <span className="dashboard-action-label">Banco de errores</span>
            <span className="dashboard-action-desc">{overview.pendingErrors || 0} errores pendientes</span>
          </Link>
        </div>
      </div>

      {/* Today's Plan */}
      {todayPlan && (
        <div className="dashboard-plan card">
          <h2 className="section-title">📅 Plan de hoy</h2>
          <p className="dashboard-plan-desc">{todayPlan.description}</p>
          {todayPlan.topics && (
            <div className="dashboard-plan-topics">
              {todayPlan.topics.map((topic) => (
                <Link
                  key={topic.id}
                  to={`/topics/${topic.id}`}
                  className="badge badge-primary"
                >
                  {topic.icon} {topic.title}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recent Activity */}
      {stats?.recentActivity && (
        <div className="dashboard-activity card">
          <h2 className="section-title">📈 Actividad semanal</h2>
          <div className="dashboard-activity-chart">
            {stats.recentActivity.map((day) => (
              <div key={day.date} className="dashboard-activity-bar">
                <div className="dashboard-activity-bar-fill-wrapper">
                  <div
                    className="dashboard-activity-bar-fill"
                    style={{ height: `${Math.min(100, (day.total / Math.max(...stats.recentActivity.map(d => d.total || 1))) * 100)}%` }}
                  ></div>
                </div>
                <span className="dashboard-activity-label">
                  {new Date(day.date).toLocaleDateString('es-ES', { weekday: 'short' })}
                </span>
                <span className="dashboard-activity-count">{day.total}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Topic Progress */}
      {stats?.topicStats && stats.topicStats.length > 0 && (
        <div className="dashboard-topics card">
          <h2 className="section-title">📚 Progreso por temas</h2>
          <div className="dashboard-topic-list">
            {stats.topicStats.map((topic) => (
              <Link key={topic.topicId} to={`/topics/${topic.topicId}`} className="dashboard-topic-item">
                <div className="dashboard-topic-info">
                  <span className="dashboard-topic-name">{topic.title}</span>
                  <span className="dashboard-topic-stats">
                    {topic.correct}/{topic.totalQuestions} · {topic.accuracyPercent}%
                  </span>
                </div>
                <div className="progress-bar" style={{ flex: 1, maxWidth: '200px' }}>
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${topic.progressPercent}%` }}
                  ></div>
                </div>
                <span className="dashboard-topic-percent">{topic.progressPercent}%</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
