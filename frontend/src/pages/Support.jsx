// ============================================
// Support Page
// ============================================
import './Topics.css'; 

export default function Support() {
  return (
    <div className="container animate-slide-up">
      <div className="page-header">
        <h1 className="page-title">📞 Centro de Soporte</h1>
        <p className="page-subtitle">Documentación técnica, guías de estudio y contacto directo.</p>
      </div>

      <div className="grid grid-2" style={{ gap: 'var(--space-xl)', marginTop: 'var(--space-2xl)' }}>
        {/* Student Manual */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-md)' }}>🎓</div>
            <h2 className="section-title">Guía del Estudiante</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
              Manual completo para opositores. Aprende a usar el planificador IA y el modo sin fallos.
            </p>
          </div>
          <a href="/MANUAL_USUARIO.html" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ textDecoration: 'none', textAlign: 'center' }}>
            Abrir Guía Online
          </a>
        </div>

        {/* Enterprise Manual */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-md)' }}>🏢</div>
            <h2 className="section-title">Dossier Empresa</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
              Especificaciones técnicas, arquitectura serverless y potencial de escalabilidad B2B.
            </p>
          </div>
          <a href="/MANUAL_EMPRESA.html" target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ textDecoration: 'none', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            Ver Technical Specs
          </a>
        </div>
      </div>

      {/* Contact Section */}
      <div className="card" style={{ marginTop: 'var(--space-xl)', textAlign: 'center' }}>
        <h2 className="section-title">¿Aún tienes dudas?</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
          Contacta directamente con nuestro equipo de desarrollo y soporte.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="mailto:albagarcialopez39@gmail.com" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
            ✉️ Email Soporte
          </a>
          <a href="tel:+34606990974" className="btn btn-ghost" style={{ textDecoration: 'none', border: '1px solid var(--border-color)' }}>
            📞 Llamar ahora
          </a>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 'var(--space-2xl)', color: 'var(--text-muted)', fontSize: 'var(--font-xs)' }}>
        &copy; {new Date().getFullYear()} **BateriaQ Study Platform**. Todos los derechos reservados sobre el software, diseño y algoritmos.
      </div>
    </div>
  );
}
