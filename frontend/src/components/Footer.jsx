import React from 'react';
import { ShieldCheck, Heart } from 'lucide-react';
import { usePomodoro } from '../context/PomodoroContext';

const Footer = () => {
  const { isFocusMode } = usePomodoro();
  const currentYear = new Date().getFullYear();

  if (isFocusMode) return null;

  return (
    <footer style={{ 
      padding: 'var(--space-xl) 0', 
      textAlign: 'center', 
      marginTop: 'auto',
      borderTop: '1px solid var(--border-light)',
      background: 'rgba(15, 23, 42, 0.4)',
      backdropFilter: 'blur(10px)',
      color: 'var(--text-muted)',
      width: '100%'
    }}>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <p style={{ margin: 0, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldCheck size={16} className="text-primary" />
          © {currentYear} <b>BateriaQ</b> — Todos los derechos reservados
        </p>
        <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
          Diseñado y desarrollado por <span style={{ color: 'var(--primary-300)', fontWeight: 700 }}>Alba García López</span>
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', opacity: 0.6, marginTop: '8px' }}>
          <span>Innovación en el estudio</span>
          <span>•</span>
          <Heart size={10} style={{ color: '#ef4444' }} />
          <span>•</span>
          <span>Vercel PRO Deployment</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
