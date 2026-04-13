// ============================================
// Dashboard Page - Main hub
// ============================================
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import swal from '../utils/swal';
import './Dashboard.css';

export default function Dashboard() {
  const { user, updateUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [todayPlan, setTodayPlan] = useState(null);
  const [allPlans, setAllPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [oppositions, setOppositions] = useState([]);
  const [selectingOpposition, setSelectingOpposition] = useState(false);
  const [selectedOpps, setSelectedOpps] = useState([]);
  
  // Modal states for new opposition
  const [isOppModalOpen, setIsOppModalOpen] = useState(false);
  const [newOppName, setNewOppName] = useState('');
  const [newOppDesc, setNewOppDesc] = useState('');
  const [newOppIcon, setNewOppIcon] = useState('🎯');
  const [newOppCategory, setNewOppCategory] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsRes, planRes, allPlansRes] = await Promise.all([
          api.getStats(),
          api.getTodayPlan(),
          api.getPlans(), // New: load all for the preview
        ]);
        setStats(statsRes.data);
        setTodayPlan(planRes.data);
        setAllPlans(allPlansRes.data || []);
      } catch (err) {
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.oppositions?.length > 0) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user?.oppositions]);

  const handleCompletePlan = async (planId) => {
    try {
      await api.completePlan(planId);
      setAllPlans((prev) => prev.map(p => p.id === planId ? { ...p, isCompleted: !p.isCompleted } : p));
      
      // Also update todayPlan if it's the same record
      setTodayPlan(prev => prev && prev.id === planId ? { ...prev, isCompleted: !prev.isCompleted } : prev);
      
      toast.success('✅ Estado actualizado');
    } catch (err) {
      toast.error('No se pudo actualizar el plan');
    }
  };

  useEffect(() => {
    if (user && user.oppositions?.length === 0) {
      api.getOppositions().then(res => setOppositions(res.data)).catch(console.error);
    }
  }, [user]);

  const toggleOpposition = (oppId) => {
    setSelectedOpps(prev => 
      prev.includes(oppId) ? prev.filter(id => id !== oppId) : [...prev, oppId]
    );
  };

  const handleConfirmOppositions = async () => {
    if (selectedOpps.length === 0) return;
    setSelectingOpposition(true);
    try {
      const res = await api.updateProfile({ oppositionId: selectedOpps });
      updateUser(res.data);
    } catch (err) {
      console.error('Error selecting oppositions:', err);
    } finally {
      setSelectingOpposition(false);
    }
  };

  const handleCreateOpposition = async () => {
    if (!newOppName.trim()) return;
    try {
      const res = await api.createOpposition({ 
        name: newOppName, 
        description: newOppDesc, 
        icon: newOppIcon,
        category: newOppCategory 
      });
      setOppositions(prev => [...prev, res.data]);
      toggleOpposition(res.data.id);
      setIsOppModalOpen(false);
      setNewOppName('');
      setNewOppDesc('');
      setNewOppIcon('🎯');
      setNewOppCategory('');
    } catch (err) {
      swal.error('Error', 'No se pudo crear la oposición: ' + err.message);
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

  if (user && user.oppositions?.length === 0) {
    return (
      <div className="container animate-slide-up">
        <div className="card text-center" style={{ padding: 'var(--space-2xl)', maxWidth: '900px', margin: 'var(--space-xl) auto' }}>
          <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>🎯</div>
          <h1 className="page-title">¡Bienvenido a BateriaQ!</h1>
          <p className="page-subtitle" style={{ marginBottom: 'var(--space-xl)', fontSize: '1.2rem' }}>
            Selecciona <b>una o varias</b> oposiciones que estés preparando. Adaptaremos todo el temario para ti.
          </p>

          <div className="grid grid-2" style={{ textAlign: 'left', gap: 'var(--space-md)', marginBottom: 'var(--space-2xl)' }}>
            {oppositions.map(opp => {
              const isSelected = selectedOpps.includes(opp.id);
              return (
                <button
                  key={opp.id}
                  className={`dashboard-action-card ${isSelected ? 'active' : ''}`}
                  onClick={() => toggleOpposition(opp.id)}
                  disabled={selectingOpposition}
                >
                  <span className="dashboard-action-icon">{opp.icon}</span>
                  <div className="dashboard-action-content">
                    {opp.category && <span className="dashboard-action-category">{opp.category}</span>}
                    <span className="dashboard-action-label">{opp.name}</span>
                    <span className="dashboard-action-desc">{opp.description || 'Prepárate con nosotros'}</span>
                  </div>
                  {isSelected && <div className="dashboard-action-badge">✓</div>}
                </button>
              );
            })}

            <button
              className="dashboard-action-card"
              onClick={() => setIsOppModalOpen(true)}
              style={{ 
                border: '2px dashed var(--primary-400)', 
                background: 'rgba(99, 102, 241, 0.05)',
                justifyContent: 'center',
                textAlign: 'center'
              }}
              disabled={selectingOpposition}
            >
              <div style={{ padding: 'var(--space-md)' }}>
                <span className="dashboard-action-icon" style={{ margin: '0 auto var(--space-md)' }}>✨</span>
                <span className="dashboard-action-label" style={{ display: 'block', marginBottom: 'var(--space-xs)' }}>
                  Oposición Personalizada
                </span>
                <span className="dashboard-action-desc">Crea un temario a tu medida</span>
              </div>
            </button>
          </div>

          <div style={{ textAlign: 'center' }}>
            <button 
                className="btn btn-primary btn-lg" 
                style={{ minWidth: '300px' }}
                onClick={handleConfirmOppositions}
                disabled={selectedOpps.length === 0 || selectingOpposition}
            >
                {selectingOpposition ? 'Configurando...' : 'Comenzar mi preparación'}
            </button>
            <p style={{ marginTop: 'var(--space-md)', fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                Podrás cambiar tu selección más adelante desde tu perfil.
            </p>
          </div>
        </div>

        {/* Modal de Nueva Oposición */}
        <Modal 
          isOpen={isOppModalOpen} 
          onClose={() => setIsOppModalOpen(false)} 
          title="✨ Nueva Oposición Personalizada"
          footer={(
            <>
              <Button variant="ghost" onClick={() => setIsOppModalOpen(false)}>Cancelar</Button>
              <Button variant="primary" onClick={handleCreateOpposition} disabled={!newOppName.trim()}>
                Crear Oposición
              </Button>
            </>
          )}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
              <div className="input-group" style={{ flex: '0 0 80px' }}>
                <label className="input-label">Icono</label>
                <select 
                  className="input" 
                  value={newOppIcon} 
                  onChange={e => setNewOppIcon(e.target.value)}
                  style={{ fontSize: '1.5rem', textAlign: 'center', padding: '0.5rem' }}
                >
                  <option value="🎯">🎯</option>
                  <option value="🚓">🚓</option>
                  <option value="🚒">🚒</option>
                  <option value="🚑">🚑</option>
                  <option value="⚖️">⚖️</option>
                  <option value="📚">📚</option>
                  <option value="🏛️">🏛️</option>
                  <option value="💻">💻</option>
                </select>
              </div>
              <div className="input-group" style={{ flex: 1 }}>
                <label className="input-label">Nombre de la Oposición</label>
                <input 
                  type="text" 
                  className="input" 
                  value={newOppName} 
                  onChange={e => setNewOppName(e.target.value)} 
                  placeholder="Ej: Policía Local Madrid" 
                  autoFocus
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Categoría o Cuerpo</label>
              <input 
                type="text" 
                className="input" 
                value={newOppCategory} 
                onChange={e => setNewOppCategory(e.target.value)} 
                placeholder="Ej: Seguridad Ciudadana" 
              />
            </div>

            <div className="input-group">
              <label className="input-label">Descripción</label>
              <textarea 
                className="input" 
                value={newOppDesc} 
                onChange={e => setNewOppDesc(e.target.value)} 
                placeholder="Indica de qué trata esta oposición o qué temario incluye..." 
                rows={3} 
              />
            </div>
            
            <div style={{ padding: 'var(--space-md)', background: 'rgba(99, 102, 241, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', margin: 0 }}>
                💡 <b>Tip:</b> Una vez creada, podrás añadir temas específicos y preguntas desde tu panel.
              </p>
            </div>
          </div>
        </Modal>
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

      {/* Weekly Planning Quick View */}
      <div className="dashboard-plan card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
          <h2 className="section-title" style={{ margin: 0 }}>📅 Mi Planificación</h2>
          {(todayPlan || allPlans.length > 0) && (
            <Link to="/planner" className="btn btn-ghost btn-sm" style={{ color: 'var(--primary-300)' }}>Ver calendario completo →</Link>
          )}
        </div>
        
        {allPlans.length > 0 ? (
          <div style={{ display: 'flex', gap: 'var(--space-md)', overflowX: 'auto', paddingBottom: 'var(--space-sm)' }}>
             {/* Show today + next 4 days */}
             { [0,1,2,3,4].map(offset => {
                const date = new Date();
                date.setDate(date.getDate() + offset);
                const dateStr = date.toISOString().split('T')[0];
                const plan = allPlans.find(p => p.date.split('T')[0] === dateStr);
                const isToday = offset === 0;

                return (
                  <div key={offset} 
                    onClick={plan ? () => handleCompletePlan(plan.id) : null}
                    style={{
                      minWidth: '160px',
                      padding: 'var(--space-md)',
                      borderRadius: 'var(--radius-md)',
                      background: isToday ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-elevated)',
                      border: isToday ? '1px solid var(--primary-500)' : '1px solid var(--border-light)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-xs)',
                      cursor: plan ? 'pointer' : 'default',
                      transition: 'transform 0.2s',
                    }}
                  >
                    <div style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: isToday ? 'var(--primary-400)' : 'var(--text-muted)' }}>
                      {isToday ? 'HOY' : date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }).toUpperCase()}
                    </div>
                    {plan ? (
                      <div style={{ fontSize: 'var(--font-sm)', fontWeight: 500, color: 'var(--text-secondary)' }}>
                        {plan.description.replace('📚 Estudiar: ', '').replace('📝 Repaso general intensivo', 'Repaso General')}
                        {plan.isCompleted && <span style={{ marginLeft: '4px' }}>✅</span>}
                      </div>
                    ) : (
                      <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        Libre
                      </div>
                    )}
                  </div>
                );
             })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 'var(--space-lg)', background: 'rgba(99, 102, 241, 0.05)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--primary-400)' }}>
             <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>Aún no tienes un plan de estudio activo para el examen.</p>
             <Link to="/planner" className="btn btn-primary">✨ Configurar mi Planificador</Link>
          </div>
        )}
      </div>

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
