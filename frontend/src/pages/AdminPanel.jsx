import { useState, useEffect } from 'react';
import api from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import './Dashboard.css';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const res = await api.getAdminStats();
        setStats(res.data);
      } else if (activeTab === 'users') {
        const res = await api.getAdminUsers();
        setUsers(res.data);
      } else if (activeTab === 'topics') {
        const res = await api.getTopics({ all: 'true' }); // Fetch all topics regardless of oppositionId
        setTopics(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) return;
    try {
      await api.deleteAdminUser(userId);
      setUsers(users.filter(u => u.id !== userId));
      setMessage({ type: 'success', text: 'Usuario eliminado con éxito' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al eliminar usuario' });
    }
  };

  const handleRoleToggle = async (user) => {
    const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    try {
      await api.updateAdminUserRole(user.id, newRole);
      setUsers(users.map(u => u.id === user.id ? { ...u, role: newRole } : u));
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al cambiar rol' });
    }
  };

  const viewQuestions = async (topic) => {
    setSelectedTopic(topic);
    setLoading(true);
    try {
      const res = await api.getQuestions({ topicId: topic.id });
      setTopicQuestions(res.data.questions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div className="container animate-slide-up">
      <header className="page-header">
        <h1 className="page-title">Centro de Control</h1>
        <p className="page-subtitle">Administración global del ecosistema BateriaQ</p>
      </header>

      {/* Admin Tabs */}
      <div className="tab-container" style={{ marginBottom: 'var(--space-xl)', display: 'flex', gap: 'var(--space-md)', borderBottom: '1px solid var(--border-color)', paddingBottom: 'var(--space-sm)' }}>
        <button className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('overview')}>📊 Resumen</button>
        <button className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('users')}>👥 Usuarios</button>
        <button className={`btn ${activeTab === 'topics' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setActiveTab('topics'); setSelectedTopic(null); }}>📚 Temas y Preguntas</button>
      </div>

      {message && (
        <div className={`alert alert-${message.type}`} style={{ marginBottom: 'var(--space-lg)' }}>
          {message.text}
        </div>
      )}

      {/* Selected Topic Detail (Questions View) */}
      {activeTab === 'topics' && selectedTopic && (
        <Card title={`Preguntas: ${selectedTopic.title}`}>
          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <Button size="sm" variant="ghost" onClick={() => setSelectedTopic(null)}>← Volver a Temas</Button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {topicQuestions.map(q => (
              <div key={q.id} className="card" style={{ padding: 'var(--space-md)', background: 'rgba(255,255,255,0.03)' }}>
                <p style={{ fontWeight: 600, marginBottom: 'var(--space-sm)' }}>{q.questionText}</p>
                <div style={{ display: 'flex', gap: 'var(--space-sm)', fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
                  <span>Dificultad: {q.difficulty}</span>
                  <span>ID: {q.id.split('-')[0]}...</span>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
                  <Button size="sm" variant="secondary" onClick={() => window.open(`/api/v1/questions/${q.id}`, '_blank')}>Ver JSON</Button>
                  <Button size="sm" variant="danger">Eliminar</Button>
                </div>
              </div>
            ))}
            {topicQuestions.length === 0 && <p>Este tema no tiene preguntas.</p>}
          </div>
        </Card>
      )}

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <>
            <section className="grid grid-4" style={{ marginBottom: 'var(--space-2xl)' }}>
                <Card className="stat-card">
                    <div className="stat-value">{stats?.users}</div>
                    <div className="stat-label">Usuarios Totales</div>
                </Card>
                <Card className="stat-card">
                    <div className="stat-value">{stats?.questions}</div>
                    <div className="stat-label">Preguntas en Base</div>
                </Card>
                <Card className="stat-card">
                    <div className="stat-value">{stats?.topics}</div>
                    <div className="stat-label">Temas Creados</div>
                </Card>
                <Card className="stat-card">
                    <div className="stat-value">{stats?.tests}</div>
                    <div className="stat-label">Tests Realizados</div>
                </Card>
            </section>
            
            <div className="grid grid-2">
                <Card title="Estado del Sistema">
                    <div className="stat-label">AI Service: <span className="badge badge-success">Online</span></div>
                    <div className="stat-label" style={{ marginTop: 'var(--space-sm)' }}>Database: <span className="badge badge-success">Connected</span></div>
                </Card>
                <Card title="Tareas Pendientes">
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>No hay reportes de fallos en preguntas pendientes.</p>
                </Card>
            </div>
        </>
      )}

      {/* USERS TAB */}
      {activeTab === 'users' && !selectedTopic && (
        <Card title="Gestión de Usuarios">
            <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ padding: 'var(--space-sm)' }}>Nombre</th>
                    <th style={{ padding: 'var(--space-sm)' }}>Email</th>
                    <th style={{ padding: 'var(--space-sm)' }}>Rol</th>
                    <th style={{ padding: 'var(--space-sm)' }}>Acciones</th>
                </tr>
                </thead>
                <tbody>
                {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: 'var(--space-sm)' }}>{u.name}</td>
                    <td style={{ padding: 'var(--space-sm)' }}>{u.email}</td>
                    <td style={{ padding: 'var(--space-sm)' }}>
                        <span className={`badge badge-${u.role === 'ADMIN' ? 'primary' : 'secondary'}`}>
                            {u.role}
                        </span>
                    </td>
                    <td style={{ padding: 'var(--space-sm)', display: 'flex', gap: '0.5rem' }}>
                        <Button variant="secondary" size="sm" onClick={() => handleRoleToggle(u)}>Cambiar Rol</Button>
                        <Button variant="danger" size="sm" onClick={() => handleDeleteUser(u.id)}>Eliminar</Button>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        </Card>
      )}

      {/* TOPICS TAB */}
      {activeTab === 'topics' && !selectedTopic && (
        <Card title="Listado Global de Temas">
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-md)' }}>
                <Button size="sm">+ Nuevo Tema</Button>
            </div>
            <div className="grid grid-3">
                {topics.map(t => (
                    <Card key={t.id} style={{ padding: 'var(--space-md)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                            <span style={{ fontSize: '1.5rem' }}>{t.icon || '📚'}</span>
                            <h4 style={{ margin: 0 }}>{t.title}</h4>
                        </div>
                        <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>{t.description}</p>
                        <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                            <Button size="sm" variant="secondary" fullWidth>Editar</Button>
                            <Button size="sm" variant="secondary" fullWidth onClick={() => viewQuestions(t)}>Preguntas</Button>
                        </div>
                    </Card>
                ))}
            </div>
        </Card>
      )}
    </div>
  );
}
