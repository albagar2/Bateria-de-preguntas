// ============================================
// Planner Page — Weekly Strategy & Calendar
// ============================================
import { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import './Topics.css'; // Reusing base grid styles

export default function Planner() {
  const toast = useToast();
  const [topics, setTopics] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [examDate, setExamDate] = useState('');
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [aiAdvice, setAiAdvice] = useState('');
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [topicsRes, plansRes] = await Promise.all([
          api.getTopics(),
          api.getPlans(),
        ]);
        setTopics(topicsRes.data || []);
        setPlans(plansRes.data || []);
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
      toast.success(`✅ Plan generado con éxito`);
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
      setPlans((prev) => prev.map(p => p.id === planId ? { ...p, isCompleted: !p.isCompleted } : p));
      toast.success('✅ Estado actualizado con éxito');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const fetchAIAdvice = async () => {
    setLoadingAdvice(true);
    try {
      const res = await api.getPlanAIAdvice();
      setAiAdvice(res.data.advice || res.data);
    } catch (err) {
      toast.error('No se pudo obtener el consejo de la IA');
    } finally {
      setLoadingAdvice(false);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  const today = new Date().toISOString().split('T')[0];
  
  // Group plans by Date for easy access
  const plansByDate = plans.reduce((acc, p) => {
    const dateStr = p.date.split('T')[0];
    acc[dateStr] = p;
    return acc;
  }, {});

  // Generate calendar days for the next month
  const calendarDays = [];
  const startDay = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(startDay);
    d.setDate(d.getDate() + i);
    calendarDays.push(d);
  }

  return (
    <div className="container animate-slide-up">
      <div className="page-header">
        <h1 className="page-title">📅 Mi Calendario Estratégico</h1>
        <p className="page-subtitle">Visualiza y gestiona tu hoja de ruta hacia el éxito</p>
      </div>

      <div className="grid grid-3" style={{ gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: 'var(--space-xl)', alignItems: 'start' }}>
        
        {/* Left Column: Generator & AI Advice */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
          
          <div className="card">
            <h3 style={{ marginBottom: 'var(--space-md)' }}>⚙️ Configurar Plan</h3>
            <div className="input-group" style={{ marginBottom: 'var(--space-md)' }}>
              <label className="input-label">Fecha del Examen</label>
              <input
                type="date"
                className="input"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
              />
            </div>
            <button onClick={handleGenerate} className="btn btn-primary btn-full" disabled={generating}>
              {generating ? <span className="spinner spinner-sm"></span> : '🔄 Regenerar Plan'}
            </button>
          </div>

          <div className="card" style={{ borderLeft: '4px solid var(--primary-500)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
              <h3 style={{ margin: 0 }}>🤖 Tutor IA</h3>
              <button onClick={fetchAIAdvice} className="btn btn-ghost btn-sm" disabled={loadingAdvice}>
                ✨ {loadingAdvice ? '...' : 'Estrategia'}
              </button>
            </div>
            <div style={{ fontSize: 'var(--font-sm)', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
              {aiAdvice || "Solicita una estrategia personalizada para tu plan actual."}
            </div>
          </div>

        </div>

        {/* Right Column: Interactive Grid */}
        <div className="card" style={{ padding: 'var(--space-xl)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
            <h3 style={{ margin: 0 }}>📋 Próximo Mes</h3>
            <div className="badge badge-success">Sincronizado</div>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(7, 1fr)', 
            gap: 'var(--space-md)',
            marginBottom: 'var(--space-md)'
          }}>
            {/* Day headers */}
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
              <div key={d} style={{ textAlign: 'center', fontWeight: 600, fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>{d}</div>
            ))}

            {/* Calendar Cells */}
            {calendarDays.map((date, idx) => {
              const dateStr = date.toISOString().split('T')[0];
              const plan = plansByDate[dateStr];
              const isToday = dateStr === today;

              return (
                <div 
                  key={idx}
                  style={{
                    minHeight: '120px',
                    padding: 'var(--space-xs)',
                    borderRadius: 'var(--radius-md)',
                    border: isToday ? '2px solid var(--primary-500)' : '1px solid var(--border-light)',
                    background: isToday ? 'rgba(99, 102, 241, 0.05)' : 'var(--bg-elevated)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    position: 'relative'
                  }}
                >
                  <div style={{ 
                    fontSize: 'var(--font-xs)', 
                    fontWeight: 700, 
                    color: isToday ? 'var(--primary-400)' : 'var(--text-muted)',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}>
                    {date.getDate()}
                    {plan?.isCompleted && <span>✅</span>}
                  </div>

                  {plan ? (
                    <div 
                      onClick={() => handleCompletePlan(plan.id)}
                      style={{ 
                        fontSize: '10px', 
                        lineHeight: '1.2',
                        color: 'var(--text-secondary)',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        flex: 1
                      }}
                    >
                      {plan.description.replace('📚 Estudiar: ', '')}
                      {!plan.isCompleted && (
                        <div style={{ marginTop: 'auto', fontSize: '9px', color: 'var(--primary-300)', textAlign: 'right' }}>
                           Picar aquí ✓
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)', opacity: 0.3 }}>Libre</div>
                  )}
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: 'var(--font-xs)', textAlign: 'center', color: 'var(--text-muted)' }}>
            💡 Haz clic en una tarea del calendario para marcarla como completada al instante.
          </p>
        </div>

      </div>
    </div>
  );
}
