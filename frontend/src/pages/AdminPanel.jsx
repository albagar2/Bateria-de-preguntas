import { useState, useEffect } from 'react';
import api from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import swal from '../utils/swal';
import './Dashboard.css';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [topics, setTopics] = useState([]);
  const [oppositions, setOppositions] = useState([]);
  const [filterOppId, setFilterOppId] = useState('all');
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [topicQuestions, setTopicQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states — flags separados para evitar conflictos entre modales
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [isTopicEditMode, setIsTopicEditMode] = useState(false);
  const [isQuestionEditMode, setIsQuestionEditMode] = useState(false);

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
        const [topicsRes, oppsRes] = await Promise.all([
          api.getTopics({ all: 'true' }),
          api.getOppositions()
        ]);
        setTopics(topicsRes.data);
        setOppositions(oppsRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    const result = await swal.confirm('¿Eliminar usuario?', 'Esta acción no se puede deshacer');
    if (!result.isConfirmed) return;
    try {
      await api.deleteAdminUser(userId);
      setUsers(users.filter(u => u.id !== userId));
      swal.success('Eliminado', 'Usuario eliminado con éxito');
    } catch (err) {
      swal.error('Error', 'No se pudo eliminar el usuario');
    }
  };

  const handleRoleToggle = async (user) => {
    const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    try {
      await api.updateAdminUserRole(user.id, newRole);
      setUsers(users.map(u => u.id === user.id ? { ...u, role: newRole } : u));
    } catch (err) {
      swal.error('Error', 'No se pudo cambiar el rol');
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
    setEditingTopic({ title: '', description: '', icon: '📚', color: '#6366f1', oppositionId: '' });
    setIsTopicEditMode(false);
    setIsTopicModalOpen(true);
  };

  const handleEditTopic = (topic) => {
    setEditingTopic({ ...topic });
    setIsTopicEditMode(true);
    setIsTopicModalOpen(true);
  };

  const handleDeleteTopic = async (id) => {
    const result = await swal.confirm('¿Eliminar tema?', 'Se borrarán las preguntas asociadas');
    if (!result.isConfirmed) return;
    try {
      await api.deleteAdminTopic(id);
      setTopics(topics.filter(t => t.id !== id));
      swal.success('Eliminado', 'Tema eliminado');
    } catch (err) {
      swal.error('Error', err.message);
    }
  };

  const handleSaveTopic = async () => {
    try {
      if (isTopicEditMode) {
        // Editar: extraer el ID y pasar solo el resto de campos al endpoint PATCH
        const { id, _count, createdAt, updatedAt, ...data } = editingTopic;
        await api.updateAdminTopic(id, data);
        setTopics(topics.map(t => t.id === id ? { ...t, ...data } : t));
      } else {
        // Crear: usar el endpoint admin protegido POST /admin/topics
        const res = await api.createAdminTopic(editingTopic);
        setTopics([res.data, ...topics]);
      }
      setIsTopicModalOpen(false);
      swal.success('Éxito', `Tema ${isTopicEditMode ? 'actualizado' : 'creado'} correctamente`);
    } catch (err) {
      swal.error('Error', err.message || 'Error al procesar el tema');
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
    setIsQuestionEditMode(false);
    setIsQuestionModalOpen(true);
  };

  const handleEditQuestion = (question) => {
    setEditingQuestion({ ...question });
    setIsQuestionEditMode(true);
    setIsQuestionModalOpen(true);
  };

  const handleDeleteQuestion = async (id) => {
    const result = await swal.confirm('¿Eliminar pregunta?', '¿Estás seguro?');
    if (!result.isConfirmed) return;
    try {
      await api.deleteAdminQuestion(id);
      setTopicQuestions(topicQuestions.filter(q => q.id !== id));
      swal.success('Eliminado', 'Pregunta eliminada');
    } catch (err) {
      swal.error('Error', 'No se pudo eliminar la pregunta');
    }
  };

  const handleSaveQuestion = async () => {
    try {
      if (isQuestionEditMode) {
        // Editar: extraer el ID y campos no editables
        const { id, topic, createdAt, updatedAt, isActive, ...data } = editingQuestion;
        await api.updateAdminQuestion(id, data);
        setTopicQuestions(topicQuestions.map(q => q.id === id ? { ...q, ...data } : q));
      } else {
        // Crear: usar el endpoint admin protegido POST /admin/questions
        const res = await api.createAdminQuestion(editingQuestion);
        setTopicQuestions([res.data, ...topicQuestions]);
      }
      setIsQuestionModalOpen(false);
      swal.success('Éxito', `Pregunta ${isQuestionEditMode ? 'actualizada' : 'creada'} correctamente`);
    } catch (err) {
      swal.error('Error', err.message || 'Error al procesar la pregunta');
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
        <Card title="Gestión de Contenidos: Temas">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <label style={{ fontSize: 'var(--font-sm)', fontWeight: 600 }}>Filtrar por Oposición:</label>
                  <select 
                    className="input" 
                    style={{ width: '250px', padding: 'var(--space-xs) var(--space-sm)' }}
                    value={filterOppId}
                    onChange={(e) => setFilterOppId(e.target.value)}
                  >
                    <option value="all">Todas las Oposiciones</option>
                    <option value="none">Sin Oposición (Generales)</option>
                    {oppositions.map(opp => (
                      <option key={opp.id} value={opp.id}>{opp.name}</option>
                    ))}
                  </select>
                </div>
                <button 
                  id="btn-create-topic"
                  className="btn btn-primary btn-sm" 
                  type="button"
                  onClick={handleCreateTopic}
                >
                  + Nuevo Tema
                </button>
            </div>
            <div className="grid grid-3">
                {topics
                  .filter(t => {
                    if (filterOppId === 'all') return true;
                    if (filterOppId === 'none') return !t.oppositionId;
                    return t.oppositionId === filterOppId;
                  })
                  .map(t => {
                    const opp = oppositions.find(o => o.id === t.oppositionId);
                    return (
                        <Card key={t.id} style={{ padding: 'var(--space-md)', borderTop: opp ? '4px solid var(--primary-500)' : '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                                <span style={{ fontSize: '1.5rem' }}>{t.icon || '📚'}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <h4 style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</h4>
                                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--primary-400)', fontWeight: 600 }}>
                                      {opp ? opp.name : 'Tema General'}
                                    </span>
                                </div>
                            </div>
                            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)', height: '40px', overflow: 'hidden' }}>{t.description}</p>
                            <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                                <Button size="sm" variant="secondary" fullWidth onClick={() => handleEditTopic(t)}>Editar</Button>
                                <Button size="sm" variant="secondary" fullWidth onClick={() => viewQuestions(t)}>Preguntas</Button>
                                <Button size="sm" variant="danger" onClick={() => handleDeleteTopic(t.id)}>🗑️</Button>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </Card>
      )}
      {/* Edit Topic Modal */}
      <Modal 
        isOpen={isTopicModalOpen} 
        onClose={() => setIsTopicModalOpen(false)} 
        title={isTopicEditMode ? "Editar Tema" : "Nuevo Tema"}
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
            <div className="input-group">
              <label className="input-label">Vincular a Oposición</label>
              <select 
                className="input"
                value={editingTopic.oppositionId || ''}
                onChange={(e) => setEditingTopic({...editingTopic, oppositionId: e.target.value || null})}
              >
                <option value="">General (Sin oposición específica)</option>
                {oppositions.map(opp => (
                  <option key={opp.id} value={opp.id}>{opp.name}</option>
                ))}
              </select>
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
        title={isQuestionEditMode ? "Editar Pregunta" : "Nueva Pregunta"}
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
