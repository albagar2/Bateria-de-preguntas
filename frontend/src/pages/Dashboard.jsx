// ============================================
// Dashboard Page - Main hub
// ============================================
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [todayPlan, setTodayPlan] = useState(null);
  const [loading, setLoading] = useState(true);

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
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Cargando tu progreso...</p>
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
