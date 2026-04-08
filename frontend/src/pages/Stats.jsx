// ============================================
// Stats Page — Statistics & Achievements
// ============================================
import { useState, useEffect } from 'react';
import api from '../services/api';

export default function Stats() {
  const [stats, setStats] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsRes, achievRes] = await Promise.all([
          api.getStats(),
          api.getAchievements(),
        ]);
        setStats(statsRes.data);
        setAchievements(achievRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;
  if (!stats) return null;

  const o = stats.overview;

  return (
    <div className="container animate-slide-up">
      <div className="page-header">
        <h1 className="page-title">📊 Estadísticas</h1>
        <p className="page-subtitle">Tu progreso detallado</p>
      </div>

      {/* Overview stats */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-2xl)' }}>
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-value">{o.totalAnswered}</div>
          <div className="stat-label">Preguntas respondidas</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{o.accuracyPercent}%</div>
          <div className="stat-label">Precisión</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-value">{o.masteredCount}</div>
          <div className="stat-label">Dominadas</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-value">{o.avgResponseTime ? (o.avgResponseTime / 1000).toFixed(1) + 's' : '--'}</div>
          <div className="stat-label">Tiempo medio</div>
        </div>
      </div>

      {/* Test stats */}
      <div className="card" style={{ marginBottom: 'var(--space-2xl)' }}>
        <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>🧪 Tests</h2>
        <div className="grid grid-3">
          <div className="stat-card">
            <div className="stat-value">{stats.tests.totalCompleted}</div>
            <div className="stat-label">Tests completados</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.tests.averageScore.toFixed(1)}</div>
            <div className="stat-label">Puntuación media</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{Math.round(stats.tests.averageTime / 60)}min</div>
            <div className="stat-label">Tiempo medio</div>
          </div>
        </div>
      </div>

      {/* Topic breakdown */}
      {stats.topicStats && (
        <div className="card" style={{ marginBottom: 'var(--space-2xl)' }}>
          <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>📚 Por temas</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {stats.topicStats.map((topic) => (
              <div key={topic.topicId} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)', padding: 'var(--space-sm) 0' }}>
                <span style={{ flex: 1, fontWeight: 500, fontSize: 'var(--font-sm)' }}>{topic.title}</span>
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', minWidth: '80px' }}>
                  {topic.correct}/{topic.totalQuestions}
                </span>
                <div className="progress-bar" style={{ width: '120px' }}>
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${topic.progressPercent}%`,
                      background: topic.progressPercent === 100 ? 'var(--gradient-success)' : 'var(--gradient-primary)',
                    }}
                  ></div>
                </div>
                <span style={{ fontWeight: 700, fontSize: 'var(--font-sm)', color: 'var(--primary-400)', minWidth: '40px', textAlign: 'right' }}>
                  {topic.progressPercent}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity chart */}
      {stats.recentActivity && (
        <div className="card" style={{ marginBottom: 'var(--space-2xl)' }}>
          <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>📈 Actividad semanal</h2>
          <div className="dashboard-activity-chart">
            {stats.recentActivity.map((day) => {
              const maxTotal = Math.max(...stats.recentActivity.map(d => d.total || 1));
              return (
                <div key={day.date} className="dashboard-activity-bar">
                  <div className="dashboard-activity-bar-fill-wrapper">
                    <div className="dashboard-activity-bar-fill" style={{ height: `${(day.total / maxTotal) * 100}%` }}></div>
                  </div>
                  <span className="dashboard-activity-label">
                    {new Date(day.date).toLocaleDateString('es-ES', { weekday: 'short' })}
                  </span>
                  <span className="dashboard-activity-count">{day.total}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Achievements */}
      <div className="card">
        <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>🏆 Logros</h2>
        <div className="grid grid-3">
          {achievements.map((a) => (
            <div
              key={a.id}
              className="stat-card"
              style={{
                opacity: a.isUnlocked ? 1 : 0.4,
                filter: a.isUnlocked ? 'none' : 'grayscale(1)',
                transition: 'all var(--transition-base)',
              }}
            >
              <div style={{ fontSize: '2rem' }}>{a.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 'var(--font-sm)', marginTop: 'var(--space-sm)' }}>{a.name}</div>
              <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: '2px' }}>{a.description}</div>
              {a.isUnlocked && a.unlockedAt && (
                <div className="badge badge-success" style={{ marginTop: 'var(--space-sm)' }}>
                  ✓ Desbloqueado
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
