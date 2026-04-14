import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Target, Clock, Award, Download, 
  TrendingUp, Calendar, Zap, Brain, ChevronRight
} from 'lucide-react';
import api from '../services/api';
import { ActivityChart, AccuracyPieChart } from '../components/StatsCharts';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import Card from '../components/common/Card';

const Stats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await api.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229); // Indigo
    doc.text('Informe de Progreso - BateriaQ', 20, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 20, 30);

    // Summary Box
    doc.setDrawColor(230);
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(20, 35, 170, 40, 3, 3, 'FD');
    
    doc.setTextColor(0);
    doc.setFontSize(14);
    doc.text('Resumen General', 25, 45);
    doc.setFontSize(10);
    doc.text(`Total Respondidas: ${stats.overview.totalAnswered}`, 25, 55);
    doc.text(`Porcentaje Aciertos: ${stats.overview.accuracyPercent}%`, 25, 60);
    doc.text(`Preguntas Dominadas: ${stats.overview.masteredCount}`, 110, 55);
    doc.text(`Racha Actual: ${stats.streak?.currentStreak || 0} días`, 110, 60);

    // Topic Table
    doc.setFontSize(14);
    doc.text('Progreso por Temas', 20, 85);
    
    const tableData = stats.topicStats.map(t => [
      t.title,
      t.answered,
      `${t.accuracyPercent}%`,
      `${t.progressPercent}%`
    ]);

    doc.autoTable({
      startY: 90,
      head: [['Tema', 'Respondidas', 'Precisión', 'Dominio']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] },
    });

    doc.save('BateriaQ_Progreso.pdf');
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner"></div>
      <p style={{ marginTop: 'var(--space-md)', color: 'var(--text-muted)' }}>Analizando tu potencial...</p>
    </div>
  );

  if (!stats) return null;

  return (
    <div className="container" style={{ paddingBottom: 'var(--space-2xl)' }}>
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="page-header"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2xl)' }}
      >
        <div>
          <h1 className="page-title" style={{ margin: 0, fontSize: '2.5rem' }}>Tu Rendimiento</h1>
          <p className="page-subtitle">Analiza tu evolución y celebra tus logros</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="btn btn-outline" 
          onClick={exportPDF}
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}
        >
          <Download size={18} />
          Exportar PDF
        </motion.button>
      </motion.div>

      {/* Stats Cards Grid */}
      <div className="grid grid-3" style={{ marginBottom: 'var(--space-2xl)' }}>
        <motion.div 
          whileHover={{ y: -5 }} 
          className="card" 
          style={{ 
            padding: 'var(--space-xl)', 
            background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)', 
            color: 'white',
            border: 'none',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginBottom: 'var(--space-xs)' }}>Precisión Global</p>
            <h2 style={{ fontSize: '3rem', margin: 0 }}>{stats.overview.accuracyPercent}%</h2>
            <div style={{ marginTop: 'var(--space-md)', fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)' }}>
              {stats.overview.correctAnswers} aciertos de {stats.overview.totalAnswered} intentos
            </div>
          </div>
          <Target size={120} style={{ position: 'absolute', right: -20, bottom: -20, opacity: 0.1, color: 'white' }} />
        </motion.div>

        <motion.div whileHover={{ y: -5 }} className="card" style={{ padding: 'var(--space-xl)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 'var(--space-xs)' }}>Tiempo Medio</p>
              <h2 style={{ fontSize: '2.5rem', margin: 0 }}>{(stats.overview.avgResponseTime / 1000).toFixed(1)}s</h2>
            </div>
            <div style={{ padding: '12px', background: 'rgba(79, 70, 225, 0.1)', borderRadius: '12px' }}>
              <Clock size={24} color="var(--primary)" />
            </div>
          </div>
          <p style={{ marginTop: 'var(--space-md)', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Zap size={14} className="text-warning" />
            ¡Velocidad óptima para simulacros!
          </p>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} className="card" style={{ padding: 'var(--space-xl)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 'var(--space-xs)' }}>Racha de Estudio</p>
              <h2 style={{ fontSize: '2.5rem', margin: 0 }}>{stats.streak?.currentStreak || 0}</h2>
            </div>
            <div style={{ padding: '12px', background: 'rgba(249, 115, 22, 0.1)', borderRadius: '12px' }}>
              <TrendingUp size={24} color="#f97316" />
            </div>
          </div>
          <p style={{ marginTop: 'var(--space-md)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Récord personal: {stats.streak?.maxStreak || 0} días
          </p>
        </motion.div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 'var(--space-2xl)' }}>
        {/* Activity & Topics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2xl)' }}>
          <Card title="📊 Actividad (Últimos 30 días)">
            <ActivityChart data={stats.recentActivity} />
          </Card>

          <Card title="📚 Progreso por Temas">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
              {stats.topicStats.map((topic, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-xs)' }}>
                    <span style={{ fontWeight: 600 }}>{topic.title}</span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{topic.progressPercent}%</span>
                  </div>
                  <div className="progress-bar" style={{ height: '8px', background: 'var(--bg-soft)' }}>
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${topic.progressPercent}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className="progress-bar-fill"
                      style={{ 
                        background: topic.progressPercent === 100 ? 'var(--gradient-success)' : 'var(--gradient-primary)'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Badges & Extra */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2xl)' }}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <Trophy size={20} className="text-warning" />
                <span>Logras y Condecoraciones</span>
              </div>
            }
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-md)' }}>
              {stats.achievements?.length > 0 ? (
                stats.achievements.map((ach, i) => (
                  <motion.div 
                    key={i}
                    whileHover={{ scale: 1.1 }}
                    title={ach.description}
                    style={{ 
                      textAlign: 'center', 
                      padding: 'var(--space-sm)', 
                      background: 'var(--bg-soft)',
                      borderRadius: '12px',
                      cursor: 'help',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <div style={{ fontSize: '2rem', marginBottom: 'var(--space-xs)' }}>{ach.icon}</div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {ach.name}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-muted)' }}>
                  <Award size={48} style={{ opacity: 0.2, marginBottom: 'var(--space-md)' }} />
                  <p style={{ fontSize: '0.9rem' }}>Aún no has ganado ninguna medalla.</p>
                </div>
              )}
            </div>
          </Card>

          <Card title="🦉 Sugerencia del Tutor IA">
            <div style={{ 
              background: 'var(--bg-soft)', 
              padding: 'var(--space-lg)', 
              borderRadius: '12px', 
              borderLeft: '4px solid var(--primary)',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
            }}>
              <p style={{ fontSize: '0.95rem', fontStyle: 'italic', margin: 0, color: 'var(--text-main)' }}>
                {stats.overview.accuracyPercent > 80 
                  ? "Vas por el buen camino. Tu precisión es altísima. Centrate en mejorar el tiempo por pregunta."
                  : "Buen trabajo, pero detectamos fallos recurrentes en temas legales. ¡Refuerza el Banco de Errores!"}
              </p>
            </div>
            <button 
              className="btn btn-text" 
              style={{ marginTop: 'var(--space-md)', width: '100%', justifyContent: 'center' }}
              onClick={() => document.getElementById('ai-chat-btn')?.click()}
            >
              Hablar con el tutor <ChevronRight size={16} />
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Stats;
