import React, { useState } from 'react';
import api from '../services/api';
import Modal from './common/Modal';
import Button from './common/Button';
import swal from '../utils/swal';

/**
 * BulkUploadModal Component
 * Unified interface for uploading questions via:
 * - Text (copy-paste)
 * - Files (PDF, Image, Word)
 * Uses AI to extract questions from unstructured content.
 */
export default function BulkUploadModal({ isOpen, onClose, onUploadSuccess, defaultTopicId }) {
  const [activeTab, setActiveTab] = useState('file'); // 'file' or 'text'
  const [file, setFile] = useState(null);
  const [textContent, setTextContent] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedQuestions, setScannedQuestions] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState(defaultTopicId || '');
  const [loadingTopics, setLoadingTopics] = useState(false);

  // Load topics if not provided
  React.useEffect(() => {
    if (isOpen && !defaultTopicId) {
      setLoadingTopics(true);
      api.getTopics()
        .then(res => {
          setTopics(res.data);
          if (res.data.length > 0) setSelectedTopicId(res.data[0].id);
        })
        .catch(err => console.error('Error loading topics:', err))
        .finally(() => setLoadingTopics(false));
    } else if (defaultTopicId) {
      setSelectedTopicId(defaultTopicId);
    }
  }, [isOpen, defaultTopicId]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setScannedQuestions([]);
    }
  };

  const handleScan = async () => {
    if (activeTab === 'file' && !file) return swal.error('Error', 'Selecciona un archivo primero');
    if (activeTab === 'text' && !textContent.trim()) return swal.error('Error', 'Introduce algo de texto primero');

    setIsScanning(true);
    setScannedQuestions([]);

    try {
      let payload = {
        topicHint: topics.find(t => t.id === selectedTopicId)?.title || 'Oposiciones',
      };

      if (activeTab === 'file') {
        const reader = new FileReader();
        const base64Promise = new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.onerror = (e) => reject(e);
          reader.readAsDataURL(file);
        });
        payload.fileBase64 = await base64Promise;
        payload.mimeType = file.type;
      } else {
        payload.textContent = textContent;
      }

      const res = await api.scanDocument(payload.topicHint, payload.fileBase64, payload.mimeType, payload.textContent);
      const questions = res.data.questions || res.questions || [];
      
      if (questions.length === 0) {
        swal.warning('Sin resultados', 'No se han podido detectar preguntas. Inténtalo con un formato más claro.');
      } else {
        setScannedQuestions(questions);
        swal.success('Escaneo Completado', `Se han detectado ${questions.length} preguntas.`);
      }
    } catch (err) {
      swal.error('Error de Escaneo', err.message);
    } finally {
      setIsScanning(false);
    }
  };

  const handleImport = async () => {
    if (scannedQuestions.length === 0) return;
    if (!selectedTopicId) return swal.error('Error', 'Selecciona un tema para las preguntas');

    setIsScanning(true);
    try {
      const questionsToImport = scannedQuestions.map(q => ({
        ...q,
        topicId: selectedTopicId,
        difficulty: 'MEDIUM',
        options: q.options.slice(0, 4)
      }));

      await api.bulkCreateQuestions(questionsToImport);
      
      swal.success('Importación Exitosa', `Se han guardado ${questionsToImport.length} preguntas.`);
      onUploadSuccess && onUploadSuccess();
      onClose();
      // Reset state
      setScannedQuestions([]);
      setFile(null);
      setTextContent('');
    } catch (err) {
      swal.error('Error al guardar', err.message);
    } finally {
      setIsScanning(false);
    }
  };

  const removeScannedQuestion = (index) => {
    setScannedQuestions(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="🚀 Carga Masiva Inteligente"
      size="lg"
      footer={(
        <>
          <Button variant="ghost" onClick={onClose} disabled={isScanning}>Cancelar</Button>
          {scannedQuestions.length > 0 ? (
            <Button variant="primary" onClick={handleImport} disabled={isScanning}>
              {isScanning ? 'Guardando...' : `Importar ${scannedQuestions.length} preguntas`}
            </Button>
          ) : (
            <Button variant="primary" onClick={handleScan} disabled={isScanning || (activeTab === 'file' && !file) || (activeTab === 'text' && !textContent.trim())}>
              {isScanning ? 'Analizando...' : 'Analizar con IA'}
            </Button>
          )}
        </>
      )}
    >
      <div className="bulk-upload-container">
        {!defaultTopicId && (
          <div className="input-group" style={{ marginBottom: 'var(--space-lg)' }}>
            <label className="input-label">Tema de destino</label>
            <select 
              className="input" 
              value={selectedTopicId} 
              onChange={e => setSelectedTopicId(e.target.value)}
              disabled={isScanning || loadingTopics}
            >
              {loadingTopics ? <option>Cargando temas...</option> : topics.map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </div>
        )}

        {scannedQuestions.length === 0 ? (
          <>
            <div className="card" style={{ padding: 'var(--space-sm)', background: 'rgba(99,102,241,0.05)', fontSize: 'var(--font-xs)', border: '1px dashed var(--primary-300)', marginBottom: 'var(--space-sm)' }}>
              💡 <b>Tip:</b> No te preocupes demasiado por el formato. La IA es inteligente y entenderá tus preguntas aunque no estén perfectas.
            </div>

            <div className="tab-container" style={{ marginBottom: 'var(--space-md)', display: 'flex', gap: 'var(--space-sm)' }}>
              <button 
                className={`btn btn-sm ${activeTab === 'file' ? 'btn-primary' : 'btn-ghost'}`} 
                onClick={() => setActiveTab('file')}
              >
                📁 Archivo (PDF, Word, Foto)
              </button>
              <button 
                className={`btn btn-sm ${activeTab === 'text' ? 'btn-primary' : 'btn-ghost'}`} 
                onClick={() => setActiveTab('text')}
              >
                ✍️ Texto (Copiar/Pegar)
              </button>
            </div>

            {activeTab === 'file' ? (
              <div className="file-drop-zone" onClick={() => document.getElementById('bulk-file-input').click()}>
                <input 
                  id="bulk-file-input"
                  type="file" 
                  hidden 
                  accept=".pdf,.doc,.docx,image/*" 
                  onChange={handleFileChange} 
                />
                <div className="drop-zone-content">
                  <span style={{ fontSize: '3rem' }}>{file ? '📄' : '📤'}</span>
                  <p>{file ? file.name : 'Haz clic para seleccionar un archivo'}</p>
                  <span className="text-muted" style={{ fontSize: 'var(--font-xs)' }}>
                    Soporta PDF, Word (.docx) e Imágenes
                  </span>
                </div>
              </div>
            ) : (
              <div className="input-group">
                <textarea 
                  className="input" 
                  rows="10" 
                  placeholder={`Pega aquí tus preguntas. Ejemplo:
1. ¿Cuál es el capital de Francia?
a) Madrid
b) París
c) Londres
d) Roma
Respuesta: b`}
                  value={textContent}
                  onChange={e => setTextContent(e.target.value)}
                  style={{ resize: 'vertical', minHeight: '200px' }}
                />
              </div>
            )}
          </>
        ) : (
          <div className="scanned-preview-list animate-slide-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
              <h4 style={{ margin: 0 }}>🔍 Revisión de preguntas detectadas</h4>
              <Button size="xs" variant="ghost" onClick={() => setScannedQuestions([])}>Limpiar y volver</Button>
            </div>
            <div className="preview-scroll-area">
              {scannedQuestions.map((q, idx) => (
                <div key={idx} className="preview-item card" style={{ padding: 'var(--space-md)', marginBottom: 'var(--space-sm)', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <p style={{ fontWeight: 600, fontSize: 'var(--font-sm)', margin: 0, flex: 1 }}>{q.questionText}</p>
                    <button onClick={() => removeScannedQuestion(idx)} style={{ background: 'none', border: 'none', color: 'var(--error-400)', cursor: 'pointer' }}>✕</button>
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, marginTop: 'var(--space-sm)', fontSize: 'var(--font-xs)' }}>
                    {q.options.map((opt, oIdx) => (
                      <li key={oIdx} style={{ color: oIdx === q.correctIndex ? 'var(--success-400)' : 'inherit', opacity: oIdx === q.correctIndex ? 1 : 0.7 }}>
                        {String.fromCharCode(97 + oIdx)}) {opt} {oIdx === q.correctIndex && '✓'}
                      </li>
                    ))}
                  </ul>
                  {q.explanation && (
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: 'var(--space-xs)', fontStyle: 'italic' }}>
                      💡 {q.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .bulk-upload-container {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }
        .file-drop-zone {
          border: 2px dashed var(--border-color);
          border-radius: var(--radius-lg);
          padding: var(--space-2xl);
          text-align: center;
          cursor: pointer;
          transition: all var(--transition-base);
          background: rgba(255,255,255,0.02);
        }
        .file-drop-zone:hover {
          border-color: var(--primary-500);
          background: rgba(99, 102, 241, 0.05);
        }
        .drop-zone-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-sm);
        }
        .preview-scroll-area {
          max-height: 400px;
          overflow-y: auto;
          padding-right: var(--space-xs);
        }
        .preview-scroll-area::-webkit-scrollbar {
          width: 4px;
        }
        .preview-item:hover {
          border-color: var(--primary-400);
        }
      `}} />
    </Modal>
  );
}
