import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Zap, Brain, Trophy, ArrowRight, Shield, 
  Target, Rocket, CheckCircle, BookOpen
} from 'lucide-react';

const Landing = () => {
  return (
    <div className="landing-page" style={{ overflowX: 'hidden' }}>
      {/* Hero Section */}
      <section style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center',
        background: 'radial-gradient(circle at top right, #1e1b4b 0%, #020617 100%)',
        textAlign: 'center',
        padding: '0 var(--space-xl)',
        position: 'relative'
      }}>
        {/* Animated Background Elements */}
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }} 
          transition={{ duration: 20, repeat: Infinity }}
          style={{ position: 'absolute', top: '10%', right: '10%', width: '300px', height: '300px', background: 'var(--primary)', borderRadius: '50%', filter: 'blur(120px)', opacity: 0.15 }} 
        />
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="badge badge-primary" style={{ marginBottom: 'var(--space-xl)', padding: '8px 16px', borderRadius: '100px' }}>
            🚀 Nueva Versión 2.0 con IA Integrada
          </div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', fontWeight: 800, color: 'white', lineHeight: 1.1, maxWidth: '900px', margin: '0 auto var(--space-xl)' }}>
            Supera tu <span style={{ color: 'var(--primary)' }}>Oposición</span> con Inteligencia Real.
          </h1>
          <p style={{ fontSize: 'clamp(1rem, 4vw, 1.25rem)', color: 'rgba(255,255,255,0.9)', maxWidth: '600px', margin: '0 auto var(--space-2xl)' }}>
            BateriaQ combina el método de Repetición Espaciada con un Tutor IA 24/7 y analíticas avanzadas para que no solo estudies, sino que domines cada tema.
          </p>
          
          <div style={{ display: 'flex', gap: 'var(--space-lg)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary btn-lg" style={{ padding: '16px 32px', fontSize: '1.1rem' }}>
              Empieza Gratis <ArrowRight style={{ marginLeft: '12px' }} />
            </Link>
            <Link to="/login" className="btn btn-outline btn-lg" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)' }}>
              Identificarse
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section style={{ padding: 'var(--space-3xl) var(--space-xl)', background: '#020617' }}>
        <div className="container" style={{ maxWidth: '1200px' }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-3xl)' }}>
            <h2 style={{ fontSize: '2.5rem', color: 'white' }}>Herramientas de Alto Rendimiento</h2>
            <p style={{ color: 'var(--text-muted)' }}>Diseñado por opositores, optimizado por ingenieros.</p>
          </div>

          <div className="grid grid-3" style={{ gap: 'var(--space-2xl)' }}>
            {[
              { icon: Brain, title: 'Tutor IA Personalizado', desc: 'Resuelve dudas al instante y genera estrategias de estudio personalizadas según tu progreso.', color: '#6366f1' },
              { icon: Zap, title: 'Repetición Espaciada', desc: 'Nuestro algoritmo te pregunta lo que más te cuesta justo cuando tu memoria lo necesita.', color: '#f59e0b' },
              { icon: Target, title: 'Simulacros Oficiales', desc: 'Crea tests personalizados con miles de preguntas reales actualizadas.', color: '#10b981' },
              { icon: Trophy, title: 'Sistema de Logros', desc: 'Mantén la racha y desbloquea medallas que certifican tu dominio de la materia.', color: '#ec4899' },
              { icon: Shield, title: 'Banco de Errores', desc: 'Tus preguntas falladas se guardan automáticamente para que nunca vuelvas a cometer el mismo error.', color: '#ef4444' },
              { icon: Rocket, title: 'Planificador Inteligente', desc: 'Una agenda dinámica que se adapta a tu ritmo y fecha de examen.', color: '#3b82f6' }
            ].map((f, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.05)' }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card" 
                style={{ 
                  padding: 'var(--space-2xl)', 
                  background: 'rgba(255,255,255,0.02)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ 
                  width: '56px', 
                  height: '56px', 
                  background: `${f.color}15`, 
                  borderRadius: '16px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  marginBottom: 'var(--space-xl)',
                  border: `1px solid ${f.color}30`
                }}>
                  <f.icon color={f.color} size={28} />
                </div>
                <h3 style={{ color: 'white', marginBottom: 'var(--space-md)', fontSize: '1.25rem' }}>{f.title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, fontSize: '0.95rem' }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section style={{ padding: 'var(--space-3xl) var(--space-xl)', background: 'linear-gradient(to bottom, #020617, #0f172a)' }}>
        <div className="container" style={{ textAlign: 'center', color: 'white' }}>
          <h2 style={{ marginBottom: 'var(--space-3xl)', fontSize: '2rem' }}>¿Por qué confiar su futuro a BateriaQ?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-2xl)' }}>
            {[
              { val: '+50k', label: 'Preguntas Base', icon: BookOpen, color: '#6366f1' },
              { val: '98%', label: 'Satisfacción', icon: CheckCircle, color: '#10b981' },
              { val: '+12', label: 'Oposiciones', icon: Shield, color: '#f59e0b' }
            ].map((s, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                style={{ 
                  padding: 'var(--space-2xl)', 
                  background: 'rgba(255,255,255,0.03)', 
                  borderRadius: '24px',
                  border: '1px solid rgba(255,255,255,0.05)'
                }}
              >
                <s.icon size={32} color={s.color} style={{ marginBottom: 'var(--space-md)', opacity: 0.8 }} />
                <div style={{ fontSize: '3.5rem', fontWeight: 900, letterSpacing: '-2px', marginBottom: '4px', background: `linear-gradient(to bottom, #fff, ${s.color} )`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {s.val}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '2px', fontWeight: 600 }}>
                  {s.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: 'var(--space-3xl) var(--space-xl)', textAlign: 'center' }}>
        <motion.div 
          whileHover={{ scale: 1.01 }}
          className="card" 
          style={{ 
            maxWidth: '1000px', 
            margin: '0 auto', 
            padding: 'var(--space-3xl)', 
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', 
            color: 'white', 
            border: 'none',
            borderRadius: '40px',
            boxShadow: '0 25px 60px -15px rgba(79, 70, 229, 0.4)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Decorative circle */}
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
          
          <h2 style={{ color: 'white', fontSize: '2.5rem', marginBottom: 'var(--space-md)', position: 'relative' }}>¿Preparado para conseguir tu plaza?</h2>
          <p style={{ marginBottom: 'var(--space-2xl)', opacity: 0.9, fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto var(--space-2xl)' }}>
            Únete a miles de opositores que ya están optimizando su tiempo con el ecosistema BateriaQ.
          </p>
          <Link 
            to="/register" 
            className="btn btn-lg" 
            style={{ 
              background: 'white', 
              color: '#4f46e5', 
              fontWeight: 800, 
              padding: '20px 48px',
              fontSize: '1.2rem',
              borderRadius: '100px',
              boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            Empieza ahora gratis <ArrowRight size={20} />
          </Link>
        </motion.div>
      </section>
    </div>
  );
};

export default Landing;
