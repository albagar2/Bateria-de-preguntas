import { useState, useEffect } from 'react';
import api from '../services/api';
import Card from '../components/common/Card';

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
        <p className="page-subtitle">Tu progreso detallado y logros</p>
      </div>

      {/* Main Overview */}
      <section className="grid grid-4" style={{ marginBottom: 'var(--space-2xl)' }}>
        <Card className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-value">{o.totalAnswered}</div>
          <div className="stat-label">Preguntas respondidas</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-value">{o.accuracyPercent}%</div>
          <div className="stat-label">Precisión media</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-value">{o.masteredCount}</div>
          <div className="stat-label">Preguntas dominadas</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-value">{o.avgResponseTime ? (o.avgResponseTime / 1000).toFixed(1) + 's' : '--'}</div>
          <div className="stat-label">Tiempo por pregunta</div>
        </Card>
      </section>

      <div className="grid grid-2" style={{ marginBottom: 'var(--space-2xl)' }}>
         {/* Topic breakdown */}
         <Card title="📚 Progreso por Temas">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {stats.topicStats.map((topic) => (
                <div key={topic.topicId}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-xs)' }}>
                        <span style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>{topic.title}</span>
                        <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>{topic.progressPercent}%</span>
                    </div>
                    <div className="progress-bar">
                    <div
                        className="progress-bar-fill"
                        style={{
                        width: `${topic.progressPercent}%`,
                        background: topic.progressPercent === 100 ? 'var(--gradient-success)' : 'var(--gradient-primary)',
                        }}
                    ></div>
                    </div>
                </div>
                ))}
            </div>
         </Card>

         {/* Weekly activity */}
         <Card title="📉 Actividad Semanal">
            <div className="dashboard-activity-chart" style={{ height: '180px', marginTop: 'var(--space-lg)' }}>
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
                    </div>
                );
                })}
            </div>
         </Card>
      </div>

      {/* Achievements Section */}
      <Card title="🏆 Logros y Condecoraciones">
        <div className="grid grid-4" style={{ marginTop: 'var(--space-md)' }}>
          {achievements.map((a) => (
            <Card
              key={a.id}
              className={`stat-card achievement-card ${a.isUnlocked ? 'unlocked' : 'locked'}`}
              style={{
                opacity: a.isUnlocked ? 1 : 0.4,
                filter: a.isUnlocked ? 'none' : 'grayscale(1)',
                padding: 'var(--space-lg)',
                border: a.isUnlocked ? '1px solid var(--primary-500)' : '1px solid var(--border-color)',
                background: a.isUnlocked ? 'var(--bg-elevated)' : 'transparent'
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-sm)' }}>{a.icon}</div>
              <h4 style={{ fontSize: 'var(--font-sm)', fontWeight: 700 }}>{a.name}</h4>
              <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginTop: '4px' }}>{a.description}</p>
              {a.isUnlocked && (
                 <div className="badge badge-success" style={{ marginTop: 'var(--space-md)' }}>DESBLOQUEADO</div>
              )}
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}

