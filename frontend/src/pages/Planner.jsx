// ============================================
// Planner Page — Study plan management
// ============================================
import { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export default function Planner() {
  const toast = useToast();
  const [topics, setTopics] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [examDate, setExamDate] = useState('');
  const [selectedTopics, setSelectedTopics] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [topicsRes, plansRes] = await Promise.all([
          api.getTopics(),
          api.getPlans(),
        ]);
        setTopics(topicsRes.data || []);
        setPlans(plansRes.data || []);
        // Select all topics by default
        setSelectedTopics(topicsRes.data?.map(t => t.id) || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleGenerate = async () => {
    if (!examDate) {
      toast.error('Selecciona la fecha de examen');
      return;
    }
    if (selectedTopics.length === 0) {
      toast.error('Selecciona al menos un tema');
      return;
    }

    setGenerating(true);
    try {
      const res = await api.generatePlan({
        examDate: new Date(examDate).toISOString(),
        topicIds: selectedTopics,
      });
      toast.success(`✅ Plan generado: ${res.data.totalDays} días de estudio`);
      // Reload plans
      const plansRes = await api.getPlans();
      setPlans(plansRes.data || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleCompletePlan = async (planId) => {
    try {
      await api.completePlan(planId);
      setPlans((prev) => prev.map(p => p.id === planId ? { ...p, isCompleted: true } : p));
      toast.success('✅ Plan marcado como completado');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const toggleTopic = (id) => {
    setSelectedTopics((prev) =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  const today = new Date().toISOString().split('T')[0];
  const futurePlans = plans.filter(p => p.date >= today);

  return (
    <div className="container animate-slide-up">
      <div className="page-header">
        <h1 className="page-title">📅 Planificador de estudio</h1>
        <p className="page-subtitle">Organiza tu estudio automáticamente hasta el día del examen</p>
      </div>

      {/* Generate Plan */}
      <div className="card" style={{ marginBottom: 'var(--space-2xl)', maxWidth: '700px' }}>
        <h3 style={{ marginBottom: 'var(--space-lg)' }}>Generar plan de estudio</h3>

        <div className="input-group" style={{ marginBottom: 'var(--space-lg)' }}>
          <label className="input-label">Fecha de examen</label>
          <input
            type="date"
            className="input"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
          />
        </div>

        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <label className="input-label" style={{ marginBottom: 'var(--space-sm)', display: 'block' }}>Temas a estudiar</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
            {topics.map((t) => (
              <button
                key={t.id}
                className={`btn ${selectedTopics.includes(t.id) ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => toggleTopic(t.id)}
              >
                {t.icon} {t.title}
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleGenerate} className="btn btn-primary btn-lg btn-full" disabled={generating}>
          {generating ? <span className="spinner spinner-sm"></span> : '🗓️ Generar plan automático'}
        </button>
      </div>

      {/* Plans list */}
      {futurePlans.length > 0 && (
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-lg)' }}>📋 Tu plan de estudio</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {futurePlans.slice(0, 30).map((plan) => {
              const isToday = plan.date.split('T')[0] === today;
              return (
                <div
                  key={plan.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-md)',
                    padding: 'var(--space-md)',
                    borderRadius: 'var(--radius-md)',
                    background: isToday ? 'rgba(99, 102, 241, 0.1)' : plan.isCompleted ? 'rgba(16, 185, 129, 0.05)' : 'transparent',
                    border: isToday ? '1px solid var(--primary-500)' : '1px solid var(--border-light)',
                    opacity: plan.isCompleted ? 0.6 : 1,
                  }}
                >
                  <div style={{ minWidth: '70px', fontWeight: 600, fontSize: 'var(--font-sm)', color: isToday ? 'var(--primary-400)' : 'var(--text-secondary)' }}>
                    {new Date(plan.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    {isToday && <div className="badge badge-primary" style={{ marginTop: '4px' }}>Hoy</div>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 'var(--font-sm)', fontWeight: 500, textDecoration: plan.isCompleted ? 'line-through' : 'none' }}>
                      {plan.description}
                    </p>
                  </div>
                  {!plan.isCompleted && (
                    <button onClick={() => handleCompletePlan(plan.id)} className="btn btn-ghost btn-sm" title="Marcar completado">
                      ✓
                    </button>
                  )}
                  {plan.isCompleted && <span style={{ color: 'var(--success-400)' }}>✅</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {futurePlans.length === 0 && plans.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📅</div>
          <h3 className="empty-state-title">Sin plan de estudio</h3>
          <p>Introduce tu fecha de examen y genera un plan personalizado.</p>
        </div>
      )}
    </div>
  );
}
