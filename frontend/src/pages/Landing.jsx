import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Zap, Brain, Trophy, ArrowRight, Shield, 
  Target, Rocket, CheckCircle 
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
          <p style={{ fontSize: 'clamp(1rem, 4vw, 1.25rem)', color: 'rgba(255,255,255,0.7)', maxWidth: '600px', margin: '0 auto var(--space-2xl)' }}>
            BateriaQ combina el método de Repetición Espaciada con un Tutor IA 24/7 y analíticas avanzadas para que no solo estudies, sino que domines cada tema.
          </p>
          
          <div style={{ display: 'flex', gap: 'var(--space-lg)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary btn-lg" style={{ padding: '16px 32px', fontSize: '1.1rem' }}>
              Empieza Gratis <ArrowRight style={{ marginLeft: '12px' }} />
            </Link>
            <Link to="/login" className="btn btn-outline btn-lg" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}>
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
              { icon: Brain, title: 'Tutor IA Personalizado', desc: 'Resuelve dudas al instante y genera estrategias de estudio personalizadas según tu progreso.' },
              { icon: Zap, title: 'Repetición Espaciada', desc: 'Nuestro algoritmo te pregunta lo que más te cuesta justo cuando tu memoria lo necesita.' },
              { icon: Target, title: 'Simulacros Oficiales', desc: 'Crea tests personalizados con miles de preguntas reales actualizadas.' },
              { icon: Trophy, title: 'Sistema de Logros', desc: 'Mantén la racha y desbloquea medallas que certifican tu dominio de la materia.' },
              { icon: Shield, title: 'Banco de Errores', desc: 'Tus preguntas falladas se guardan automáticamente para que nunca vuelvas a cometer el mismo error.' },
              { icon: Rocket, title: 'Planificador Inteligente', desc: 'Una agenda dinámica que se adapta a tu ritmo y fecha de examen.' }
            ].map((f, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card" 
                style={{ padding: 'var(--space-2xl)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <div style={{ width: '48px', height: '48px', background: 'rgba(79, 70, 225, 0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-xl)' }}>
                  <f.icon color="var(--primary)" size={24} />
                </div>
                <h3 style={{ color: 'white', marginBottom: 'var(--space-md)' }}>{f.title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section style={{ padding: 'var(--space-3xl) var(--space-xl)', background: 'linear-gradient(to bottom, #020617, #0f172a)' }}>
        <div className="container" style={{ textAlign: 'center', color: 'white' }}>
          <h2 style={{ marginBottom: 'var(--space-2xl)' }}>¿Por qué elegir BateriaQ?</h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-3xl)', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', fontWeight: 800 }}>+50k</div>
              <div style={{ color: 'rgba(255,255,255,0.6)' }}>Preguntas Base</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', fontWeight: 800 }}>98%</div>
              <div style={{ color: 'rgba(255,255,255,0.6)' }}>Satisfacción</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', fontWeight: 800 }}>+12</div>
              <div style={{ color: 'rgba(255,255,255,0.6)' }}>Oposiciones Soportadas</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: 'var(--space-3xl) var(--space-xl)', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: '800px', margin: '0 auto', padding: 'var(--space-3xl)', background: 'var(--gradient-primary)', color: 'white', border: 'none' }}>
          <h2 style={{ color: 'white' }}>Consigue tu plaza este año.</h2>
          <p style={{ marginBottom: 'var(--space-2xl)', opacity: 0.9 }}>Únete a los estudiantes que ya están optimizando su tiempo con BateriaQ.</p>
          <Link to="/register" className="btn btn-lg" style={{ background: 'white', color: 'var(--primary)', fontWeight: 700 }}>
            Registrarme Ahora
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Landing;
