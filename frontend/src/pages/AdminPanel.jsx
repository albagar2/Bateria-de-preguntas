import { useState, useEffect } from 'react';
import api from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import './Dashboard.css';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [topicQuestions, setTopicQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  
  // Modal states
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [isModeEdit, setIsModeEdit] = useState(false);

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
        const res = await api.getTopics({ all: 'true' });
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

  // --- Topic CRUD ---
  const handleCreateTopic = () => {
    setEditingTopic({ title: '', description: '', icon: '📚', color: '#6366f1' });
    setIsModeEdit(false);
    setIsTopicModalOpen(true);
  };

  const handleEditTopic = (topic) => {
    setEditingTopic({ ...topic });
    setIsModeEdit(true);
    setIsTopicModalOpen(true);
  };

  const handleDeleteTopic = async (id) => {
    if (!window.confirm('¿Eliminar este tema? Se perderán todas las preguntas asociadas.')) return;
    try {
      await api.deleteAdminTopic(id);
      setTopics(topics.filter(t => t.id !== id));
      setMessage({ type: 'success', text: 'Tema eliminado' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleSaveTopic = async () => {
    try {
      if (isModeEdit) {
        const { id, ...data } = editingTopic;
        await api.updateAdminTopic(id, data);
        setTopics(topics.map(t => t.id === id ? editingTopic : t));
      } else {
        const res = await api.createTopic(editingTopic);
        setTopics([res.data, ...topics]);
      }
      setIsTopicModalOpen(false);
      setMessage({ type: 'success', text: `Tema ${isModeEdit ? 'actualizado' : 'creado'} correctamente` });
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al procesar el tema' });
    }
  };

  // --- Question CRUD ---
  const handleCreateQuestion = () => {
    setEditingQuestion({
      topicId: selectedTopic.id,
      questionText: '',
      options: ['', '', '', ''],
      correctIndex: 0,
      explanation: '',
      difficulty: 'MEDIUM'
    });
    setIsModeEdit(false);
    setIsQuestionModalOpen(true);
  };

  const handleEditQuestion = (question) => {
    setEditingQuestion({ ...question });
    setIsModeEdit(true);
    setIsQuestionModalOpen(true);
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('¿Eliminar esta pregunta?')) return;
    try {
      await api.deleteAdminQuestion(id);
      setTopicQuestions(topicQuestions.filter(q => q.id !== id));
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al eliminar pregunta' });
    }
  };

  const handleSaveQuestion = async () => {
    try {
      if (isModeEdit) {
        const { id, ...data } = editingQuestion;
        await api.updateAdminQuestion(id, data);
        setTopicQuestions(topicQuestions.map(q => q.id === id ? editingQuestion : q));
      } else {
        const res = await api.createQuestion(editingQuestion);
        setTopicQuestions([res.data, ...topicQuestions]);
      }
      setIsQuestionModalOpen(false);
      setMessage({ type: 'success', text: `Pregunta ${isModeEdit ? 'actualizada' : 'creada'} correctamente` });
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al procesar la pregunta' });
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
          <div style={{ marginBottom: 'var(--space-lg)', display: 'flex', justifyContent: 'space-between' }}>
            <Button size="sm" variant="ghost" onClick={() => setSelectedTopic(null)}>← Volver a Temas</Button>
            <Button size="sm" onClick={handleCreateQuestion}>+ Nueva Pregunta</Button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {topicQuestions.map(q => (
              <div key={q.id} className="card" style={{ padding: 'var(--space-md)', background: 'rgba(255,255,255,0.03)' }}>
                <p style={{ fontWeight: 600, marginBottom: 'var(--space-sm)' }}>{q.questionText}</p>
                <div style={{ display: 'flex', gap: 'var(--space-sm)', fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
                   <span className="badge badge-secondary">{q.difficulty}</span>
                   <span>{q.options.length} opciones</span>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
                  <Button size="sm" variant="secondary" onClick={() => handleEditQuestion(q)}>Editar</Button>
                  <Button size="sm" variant="danger" onClick={() => handleDeleteQuestion(q.id)}>Eliminar</Button>
                </div>
              </div>
            ))}
            {topicQuestions.length === 0 && <p style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-muted)' }}>Este tema no tiene preguntas todavía.</p>}
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
                <Button size="sm" onClick={handleCreateTopic}>+ Nuevo Tema</Button>
            </div>
            <div className="grid grid-3">
                {topics.map(t => (
                    <Card key={t.id} style={{ padding: 'var(--space-md)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                            <span style={{ fontSize: '1.5rem' }}>{t.icon || '📚'}</span>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ margin: 0 }}>{t.title}</h4>
                                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Opo ID: {t.oppositionId?.split('-')[0] || 'Gral'}</span>
                            </div>
                        </div>
                        <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)', height: '40px', overflow: 'hidden' }}>{t.description}</p>
                        <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                            <Button size="sm" variant="secondary" fullWidth onClick={() => handleEditTopic(t)}>Editar</Button>
                            <Button size="sm" variant="secondary" fullWidth onClick={() => viewQuestions(t)}>Preguntas</Button>
                            <Button size="sm" variant="danger" onClick={() => handleDeleteTopic(t.id)}>🗑️</Button>
                        </div>
                    </Card>
                ))}
            </div>
        </Card>
      )}
      {/* Edit Topic Modal */}
      <Modal 
        isOpen={isTopicModalOpen} 
        onClose={() => setIsTopicModalOpen(false)} 
        title={isModeEdit ? "Editar Tema" : "Nuevo Tema"}
        footer={(
          <>
            <Button variant="ghost" onClick={() => setIsTopicModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" onClick={handleSaveTopic}>Guardar</Button>
          </>
        )}
      >
        {editingTopic && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div className="input-group">
              <label className="input-label">Título</label>
              <input 
                className="input" 
                value={editingTopic.title} 
                onChange={(e) => setEditingTopic({...editingTopic, title: e.target.value})}
              />
            </div>
            <div className="input-group">
              <label className="input-label">Descripción</label>
              <textarea 
                className="input" 
                rows="3"
                value={editingTopic.description} 
                onChange={(e) => setEditingTopic({...editingTopic, description: e.target.value})}
              />
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
              <div className="input-group" style={{ flex: 1 }}>
                <label className="input-label">Icono</label>
                <input className="input" value={editingTopic.icon} onChange={(e) => setEditingTopic({...editingTopic, icon: e.target.value})}/>
              </div>
              <div className="input-group" style={{ flex: 1 }}>
                <label className="input-label">Color</label>
                <input type="color" className="input" style={{ padding: 0 }} value={editingTopic.color || '#6366f1'} onChange={(e) => setEditingTopic({...editingTopic, color: e.target.value})}/>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Question Modal */}
      <Modal 
        isOpen={isQuestionModalOpen} 
        onClose={() => setIsQuestionModalOpen(false)} 
        title={isModeEdit ? "Editar Pregunta" : "Nueva Pregunta"}
        footer={(
          <>
            <Button variant="ghost" onClick={() => setIsQuestionModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" onClick={handleSaveQuestion}>Guardar</Button>
          </>
        )}
      >
        {editingQuestion && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div className="input-group">
              <label className="input-label">Enunciado</label>
              <textarea 
                className="input" 
                rows="3"
                value={editingQuestion.questionText} 
                onChange={(e) => setEditingQuestion({...editingQuestion, questionText: e.target.value})}
              />
            </div>
            
            <div className="input-group">
              <label className="input-label">Opciones (Marca la correcta)</label>
              {editingQuestion.options.map((opt, i) => (
                <div key={i} style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-xs)' }}>
                  <input 
                    type="radio" 
                    name="correct-idx" 
                    checked={editingQuestion.correctIndex === i} 
                    onChange={() => setEditingQuestion({...editingQuestion, correctIndex: i})}
                  />
                  <input 
                    className="input" 
                    placeholder={`Opción ${i+1}`}
                    value={opt} 
                    onChange={(e) => {
                      const newOpts = [...editingQuestion.options];
                      newOpts[i] = e.target.value;
                      setEditingQuestion({...editingQuestion, options: newOpts});
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="input-group">
              <label className="input-label">Explicación</label>
              <textarea 
                className="input" 
                rows="2"
                value={editingQuestion.explanation} 
                onChange={(e) => setEditingQuestion({...editingQuestion, explanation: e.target.value})}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Dificultad</label>
              <select 
                className="input"
                value={editingQuestion.difficulty}
                onChange={(e) => setEditingQuestion({...editingQuestion, difficulty: e.target.value})}
              >
                <option value="EASY">Fácil</option>
                <option value="MEDIUM">Media</option>
                <option value="HARD">Difícil</option>
              </select>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
