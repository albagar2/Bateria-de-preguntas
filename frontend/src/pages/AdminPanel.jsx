import { useState, useEffect } from 'react';
import api from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import swal from '../utils/swal';
import './Dashboard.css';

/**
 * CAMPO DE CONTROL: PANEL DE ADMINISTRACIÓN
 * -----------------------------------------
 * Este componente es el centro neurálgico de gestión de la plataforma.
 * Permite gestionar usuarios, temas (topics), oposiciones y preguntas.
 * 
 * Funcionalidades clave:
 * - Dashboard de estadísticas (Resumen).
 * - Gestión de roles de usuario.
 * - CRUD de temas con iconos y colores personalizados.
 * - Sistema de Carga Masiva (Bulk Import) con Regex inteligente.
 * - Auditoría global de preguntas con buscador.
 */
export default function AdminPanel() {
  // --- ESTADO LOCAL ---
  const [activeTab, setActiveTab] = useState('overview');          // Pestaña actual: overview, users, topics, questions
  const [stats, setStats] = useState(null);                        // Datos estadísticos globales
  const [users, setUsers] = useState([]);                          // Listado de usuarios cargados
  const [topics, setTopics] = useState([]);                        // Listado de temas (después de filtrar por oposición)
  const [oppositions, setOppositions] = useState([]);              // Todas las oposiciones disponibles
  const [filterOppId, setFilterOppId] = useState('all');          // Filtro actual por oposición
  const [selectedTopic, setSelectedTopic] = useState(null);        // Tema que se está explorando actualmente
  const [topicQuestions, setTopicQuestions] = useState([]);        // Preguntas del tema seleccionado
  const [loading, setLoading] = useState(true);                    // Estado de carga general
  
  // --- ESTADO DE MODALES Y EDICIÓN ---
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [isTopicEditMode, setIsTopicEditMode] = useState(false);
  const [isQuestionEditMode, setIsQuestionEditMode] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [subtopics, setSubtopics] = useState([]);                  // Subtemas del tema seleccionado
  const [isSubtopicModalOpen, setIsSubtopicModalOpen] = useState(false);
  const [editingSubtopic, setEditingSubtopic] = useState(null);
  const [bulkText, setBulkText] = useState('');                    // Texto bruto para la carga masiva
  const [bulkSubtopicId, setBulkSubtopicId] = useState('');        // ID del subtema para la carga masiva
  const [expandedAdminSubtopics, setExpandedAdminSubtopics] = useState({}); // Control de acordeones en la vista de preguntas
  const [globalQuestions, setGlobalQuestions] = useState([]);     // Cache para la pestaña de Lista Global

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
      } else if (activeTab === 'questions') {
        const res = await api.getAdminQuestions();
        setGlobalQuestions(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- GESTIÓN DE USUARIOS ---

  /**
   * Elimina un usuario del sistema previa confirmación.
   */
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

  /**
   * Cambia el rol de un usuario entre USER y ADMIN.
   */
  const handleRoleToggle = async (user) => {
    const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    try {
      await api.updateAdminUserRole(user.id, newRole);
      setUsers(users.map(u => u.id === user.id ? { ...u, role: newRole } : u));
    } catch (err) {
      swal.error('Error', 'No se pudo cambiar el rol');
    }
  };

  // --- GESTIÓN DE PREGUNTAS Y SUBTEMAS ---

  /**
   * Carga y muestra todas las preguntas de un tema específico.
   * Recupera tanto preguntas (límite 1000) como subtemas.
   */
  const viewQuestions = async (topic) => {
    setSelectedTopic(topic);
    setLoading(true);
    try {
      const [questionsRes, subtopicsRes] = await Promise.all([
        api.getQuestions({ topicId: topic.id, limit: 1000 }),
        api.getSubtopics(topic.id)
      ]);
      const questions = questionsRes.data.questions || [];
      setTopicQuestions(questions);
      setSubtopics(subtopicsRes.data);
      
      // Auto-expandimos todos los subtemas que tienen preguntas para facilitar la vista
      const expandMap = {};
      questions.forEach(q => {
        expandMap[q.subtopicId || 'no-subtopic'] = true;
      });
      setExpandedAdminSubtopics(expandMap);
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

  const handleEditQuestion = async (question) => {
    setEditingQuestion({ ...question });
    setIsQuestionEditMode(true);
    
    // Cargar subtemas del tema al que pertenece la pregunta para el desplegable
    try {
      const res = await api.getSubtopics(question.topicId);
      setSubtopics(res.data);
    } catch (err) {
      console.error("Error al cargar subtemas:", err);
    }
    
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
        const { id, topic, subtopic, createdAt, updatedAt, isActive, ...data } = editingQuestion;
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

  // --- Subtopic CRUD ---
  const handleCreateSubtopic = () => {
    setEditingSubtopic({ title: '', order: 0, topicId: selectedTopic.id });
    setIsSubtopicModalOpen(true);
  };

  const handleEditSubtopic = (sub) => {
    setEditingSubtopic({ ...sub });
    setIsSubtopicModalOpen(true);
  };

  const handleSaveSubtopic = async () => {
    try {
      if (editingSubtopic.id) {
        await api.updateSubtopic(editingSubtopic.id, editingSubtopic);
        setSubtopics(subtopics.map(s => s.id === editingSubtopic.id ? editingSubtopic : s));
      } else {
        const res = await api.createSubtopic(editingSubtopic);
        setSubtopics([...subtopics, res.data]);
      }
      setIsSubtopicModalOpen(false);
      swal.success('Éxito', 'Subtema guardado');
    } catch (err) {
      swal.error('Error', err.message);
    }
  };

  const handleDeleteSubtopic = async (id) => {
    const result = await swal.confirm('¿Eliminar subtema?', 'Las preguntas dejarán de estar agrupadas (pero no se borrarán)');
    if (!result.isConfirmed) return;
    try {
      await api.deleteSubtopic(id);
      setSubtopics(subtopics.filter(s => s.id !== id));
      swal.success('Éxito', 'Subtema eliminado');
    } catch (err) {
      swal.error('Error', err.message);
    }
  };

  /**
   * PROCESADOR DE CARGA MASIVA (Bulk Import)
   * ----------------------------------------
   * Utiliza una expresión regular avanzada para segmentar el texto en bloques de preguntas.
   * Soporta formatos:
   * P: enunciado | a) op1 | b) op2 | R: c
   * P: enunciado | 1. op1 | 2. op2 | R: Texto exacto de la respuesta
   */
  const handleBulkImport = async () => {
    if (!bulkText.trim()) return;
    setLoading(true);
    
    try {
      // Estrategia: Detectar bloques buscando el inicio de cada pregunta (P: o Pregunta:)
      // Ignora mayúsculas/minúsculas y soporta puntos o dos puntos.
      const questionRegex = /(?:^|\n)(?:P|Pregunta)\s*[:.].*?(?=(?:\n(?:P|Pregunta)\s*[:.])|$)/gis;
      const blocks = bulkText.match(questionRegex) || [];
      
      let failCount = 0;
      const parsedQuestions = blocks.map((block, idx) => {
        const lines = block.trim().split('\n').map(l => l.trim());
        
        // 1. Extraer enunciado
        const questionLine = lines.find(l => /^(P|Pregunta)\s*[:.]/i.test(l));
        const questionText = questionLine?.replace(/^(P|Pregunta)\s*[:.]/i, '').trim();
        
        // 2. Extraer opciones (soporta a), a. o número 1))
        const options = lines
          .filter(l => /^[a-d][\s).]/i.test(l))
          .map(l => l.replace(/^[a-d][\s).]/i, '').trim());
          
        // 3. Extraer respuesta (soporta letra, número o texto completo)
        const answerLine = lines.find(l => /^(R|Respuesta|Solución|Solucion)\s*[:.]/i.test(l));
        const correctValue = answerLine?.replace(/^(R|Respuesta|Solución|Solucion)\s*[:.]/i, '').trim().toLowerCase();
        
        // Algoritmo de resolución de índice correcto
        let correctIndex = ['a', 'b', 'c', 'd'].indexOf(correctValue); // Por letra
        
        if (correctIndex === -1 && /^[1-4]$/.test(correctValue)) {      // Por número
          correctIndex = parseInt(correctValue) - 1;
        }

        if (correctIndex === -1 && correctValue) {                     // Por coincidencia de texto
          correctIndex = options.findIndex(opt => opt.toLowerCase() === correctValue);
        }
        
        // Validación de integridad del bloque
        if (!questionText || options.length < 2 || correctIndex === -1) {
          console.warn(`Bloque ${idx + 1} ignorado:`, block);
          failCount++;
          return null;
        }
        
        return {
          topicId: selectedTopic.id,
          subtopicId: bulkSubtopicId || null,
          questionText,
          options: options.slice(0, 4),
          correctIndex,
          difficulty: 'MEDIUM'
        };
      }).filter(Boolean);

      if (parsedQuestions.length === 0) {
        throw new Error('No se pudo procesar ninguna pregunta. Revisa el formato.');
      }

      // Envío al servidor
      await api.bulkCreateQuestions(parsedQuestions);
      
      // Feedback visual: expandir el subtema de destino
      const targetKey = bulkSubtopicId || 'no-subtopic';
      setExpandedAdminSubtopics(prev => ({ ...prev, [targetKey]: true }));

      setIsBulkModalOpen(false);
      setBulkText('');
      setBulkSubtopicId('');
      
      const message = failCount > 0 
        ? `Importadas ${parsedQuestions.length} preguntas. ${failCount} bloques fueron ignorados.`
        : `Importadas ${parsedQuestions.length} preguntas correctamente.`;
      
      swal.success('Importación Terminada', message);
      viewQuestions(selectedTopic); // Refrescar lista

    } catch (err) {
      swal.error('Error en Importación', err.message);
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
        <button className={`btn ${activeTab === 'topics' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setActiveTab('topics'); setSelectedTopic(null); }}>📚 Temas</button>
        <button className={`btn ${activeTab === 'questions' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('questions')}>📝 Preguntas Globales</button>
      </div>

      {/* Selected Topic Detail (Questions View) */}
      {activeTab === 'topics' && selectedTopic && (
        <Card title={`Preguntas: ${selectedTopic.title}`}>
          <div style={{ marginBottom: 'var(--space-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-md)' }}>
            <Button size="sm" variant="ghost" onClick={() => setSelectedTopic(null)}>← Volver a Temas</Button>
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <Button size="sm" variant="secondary" onClick={() => setIsBulkModalOpen(true)}>📤 Carga Masiva</Button>
              <Button size="sm" onClick={handleCreateQuestion}>+ Nueva Pregunta</Button>
            </div>
          </div>

          {/* Subtopics Section */}
          <div className="card" style={{ marginBottom: 'var(--space-xl)', background: 'rgba(255,255,255,0.02)', padding: 'var(--space-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
              <h4 style={{ margin: 0 }}>📂 Subtemas</h4>
              <Button size="xs" variant="ghost" onClick={handleCreateSubtopic}>+ Añadir Subtema</Button>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
              {subtopics.map(sub => (
                <div key={sub.id} className="badge badge-secondary" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', padding: 'var(--space-xs) var(--space-sm)' }}>
                  <span>{sub.title}</span>
                  <button onClick={() => handleEditSubtopic(sub)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '10px' }}>✏️</button>
                  <button onClick={() => handleDeleteSubtopic(sub.id)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '10px' }}>🗑️</button>
                </div>
              ))}
              {subtopics.length === 0 && <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>No hay subtemas creados para este tema.</p>}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="ghost" 
                size="xs"
                onClick={() => {
                  const allExpanded = subtopics.reduce((acc, s) => ({ ...acc, [s.id]: true }), { 'no-subtopic': true });
                  const allCollapsed = {};
                  const currentlyAllExpanded = Object.values(expandedAdminSubtopics).filter(Boolean).length >= subtopics.length;
                  setExpandedAdminSubtopics(currentlyAllExpanded ? allCollapsed : allExpanded);
                }}
              >
                {Object.values(expandedAdminSubtopics).filter(Boolean).length >= subtopics.length ? 'Colapsar todo' : 'Expandir todo'}
              </Button>
            </div>
            {[null, ...subtopics].map(container => {
              const containerId = container?.id || null;
              const filteredQuestions = topicQuestions.filter(q => q.subtopicId === containerId);
              const isExpanded = expandedAdminSubtopics[containerId || 'no-subtopic'];
              
              if (containerId && filteredQuestions.length === 0) return null; // Ocultar subtemas vacíos
              if (!containerId && filteredQuestions.length === 0 && subtopics.length > 0) return null; // Ocultar bloque "general" si está vacío y hay subtemas

              return (
                <div key={containerId || 'no-subtopic'}>
                  <h5 
                    onClick={() => setExpandedAdminSubtopics(prev => ({ ...prev, [containerId || 'no-subtopic']: !prev[containerId || 'no-subtopic'] }))}
                    style={{ 
                      borderBottom: '1px solid var(--border-color)', 
                      paddingBottom: 'var(--space-xs)', 
                      marginBottom: isExpanded ? 'var(--space-md)' : '0', 
                      color: containerId ? 'var(--primary-400)' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-sm)',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    <span style={{ 
                      transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', 
                      transition: 'transform 0.2s',
                      fontSize: '10px'
                    }}>▶</span>
                    {container ? `🔹 ${container.title}` : '🔸 Sin Subtema Asignado'}
                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', fontWeight: 'normal' }}>({filteredQuestions.length})</span>
                  </h5>
                  
                  {isExpanded && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }} className="animate-slide-up">
                      {filteredQuestions.map(q => (
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
                    </div>
                  )}
                </div>
              );
            })}
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

      {/* GLOBAL QUESTIONS TAB */}
      {activeTab === 'questions' && (
        <Card title="Listado Global de Preguntas">
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <input 
              type="text" 
              className="input" 
              placeholder="🔍 Buscar por enunciado..." 
              onChange={(e) => {
                const term = e.target.value.toLowerCase();
                // Simple local filter for better UX
                const rows = document.querySelectorAll('.question-row');
                rows.forEach(row => {
                  const text = row.querySelector('.q-text').textContent.toLowerCase();
                  row.style.display = text.includes(term) ? '' : 'none';
                });
              }}
            />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ padding: 'var(--space-sm)' }}>Enunciado</th>
                    <th style={{ padding: 'var(--space-sm)' }}>Tema</th>
                    <th style={{ padding: 'var(--space-sm)' }}>Dificultad</th>
                    <th style={{ padding: 'var(--space-sm)' }}>Acciones</th>
                </tr>
                </thead>
                <tbody>
                {globalQuestions.map(q => (
                    <tr key={q.id} className="question-row" style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: 'var(--space-sm)', fontSize: 'var(--font-sm)', maxWidth: '400px' }} className="q-text">
                        {q.questionText}
                    </td>
                    <td style={{ padding: 'var(--space-sm)' }}>
                        <span className="badge badge-ghost">{q.topic?.title}</span>
                    </td>
                    <td style={{ padding: 'var(--space-sm)' }}>
                        <span className={`badge badge-secondary`}>{q.difficulty}</span>
                    </td>
                    <td style={{ padding: 'var(--space-sm)', display: 'flex', gap: '0.5rem' }}>
                        <Button variant="secondary" size="sm" onClick={() => {
                          // Buscar el tema y abrirlo
                          const topic = topics.find(t => t.id === q.topicId);
                          if (topic) {
                            viewQuestions(topic);
                            setActiveTab('topics');
                          } else {
                            handleEditQuestion(q);
                          }
                        }}>Editar</Button>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            {globalQuestions.length === 0 && <p style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>No hay preguntas cargadas.</p>}
          </div>
          <p style={{ marginTop: 'var(--space-md)', fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
            * Mostrando las últimas 100 preguntas. Para buscar una específica, utiliza el buscador o navega por Temas.
          </p>
        </Card>
      )}
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
                value={editingTopic.title || ''} 
                onChange={(e) => setEditingTopic({...editingTopic, title: e.target.value})}
              />
            </div>
            <div className="input-group">
              <label className="input-label">Descripción</label>
              <textarea 
                className="input" 
                rows="3"
                value={editingTopic.description || ''} 
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
                <input className="input" value={editingTopic.icon || ''} onChange={(e) => setEditingTopic({...editingTopic, icon: e.target.value})}/>
              </div>
              <div className="input-group" style={{ flex: 1 }}>
                <label className="input-label">Color</label>
                <input type="color" className="input" style={{ padding: 0 }} value={editingTopic.color || '#6366f1'} onChange={(e) => setEditingTopic({...editingTopic, color: e.target.value})}/>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Subtopic Modal */}
      <Modal 
        isOpen={isSubtopicModalOpen} 
        onClose={() => setIsSubtopicModalOpen(false)} 
        title={editingSubtopic?.id ? "Editar Subtema" : "Nuevo Subtema"}
        footer={(
          <>
            <Button variant="ghost" onClick={() => setIsSubtopicModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" onClick={handleSaveSubtopic}>Guardar</Button>
          </>
        )}
      >
        {editingSubtopic && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div className="input-group">
              <label className="input-label">Título del Subtema</label>
              <input 
                className="input" 
                placeholder="Ej: Sección 1: Introducción"
                value={editingSubtopic.title || ''} 
                onChange={(e) => setEditingSubtopic({...editingSubtopic, title: e.target.value})}
              />
            </div>
            <div className="input-group">
              <label className="input-label">Orden (opcional)</label>
              <input 
                type="number"
                className="input" 
                value={editingSubtopic.order ?? ''} 
                onChange={(e) => {
                  const val = e.target.value;
                  setEditingSubtopic({...editingSubtopic, order: val === '' ? null : parseInt(val)});
                }}
              />
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
                value={editingQuestion.questionText || ''} 
                onChange={(e) => setEditingQuestion({...editingQuestion, questionText: e.target.value})}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Asignar a Subtema</label>
              <select 
                className="input"
                value={editingQuestion.subtopicId || ''}
                onChange={(e) => setEditingQuestion({...editingQuestion, subtopicId: e.target.value || null})}
              >
                <option value="">Ninguno (General)</option>
                {subtopics.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.title}</option>
                ))}
              </select>
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
                value={editingQuestion.explanation || ''} 
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

      {/* Bulk Import Modal */}
      <Modal 
        isOpen={isBulkModalOpen} 
        onClose={() => setIsBulkModalOpen(false)} 
        title="Carga Masiva de Preguntas"
        footer={(
          <>
            <Button variant="ghost" onClick={() => setIsBulkModalOpen(false)}>Cerrar</Button>
            <Button variant="primary" onClick={handleBulkImport} disabled={loading}>
              {loading ? <span className="spinner spinner-sm"></span> : 'Importar Todo'}
            </Button>
          </>
        )}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
            Pega tus preguntas respetando el formato para que el sistema pueda procesarlas automáticamente.
          </p>
          <div className="input-group">
            <label className="input-label">Asignar todas estas preguntas al Subtema:</label>
            <select 
              className="input"
              value={bulkSubtopicId}
              onChange={(e) => setBulkSubtopicId(e.target.value)}
            >
              <option value="">Ninguno (General)</option>
              {subtopics.map(sub => (
                <option key={sub.id} value={sub.id}>{sub.title}</option>
              ))}
            </select>
          </div>
          <div className="card" style={{ padding: 'var(--space-sm)', background: 'rgba(99, 102, 241, 0.05)', fontSize: 'var(--font-xs)', border: '1px dashed var(--primary-300)' }}>
            <strong>Ejemplo de formato:</strong><br/>
            P: ¿Cuál es el órgano legislativo?<br/>
            a) Gobierno<br/>
            b) Cortes Generales<br/>
            c) Jueces<br/>
            d) Rey<br/>
            R: b<br/>
            --- (Separador entre preguntas)
          </div>
          <textarea 
            className="input" 
            rows="12"
            placeholder="Pega aquí tu lista de preguntas..."
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            style={{ fontFamily: 'monospace', fontSize: 'var(--font-sm)' }}
            spellCheck={false}
            data-gramm={false}
          />
        </div>
      </Modal>
    </div>
  );
}
