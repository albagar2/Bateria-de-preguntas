// ============================================
// Support Page
// ============================================
import { Link } from 'react-router-dom';
import './Topics.css'; // Reusing some base styles

export default function Support() {
  return (
    <div className="container animate-slide-up">
      <div className="page-header">
        <h1 className="page-title">📞 Soporte Técnico</h1>
        <p className="page-subtitle">¿Tienes alguna duda o problema? Estamos aquí para ayudarte.</p>
      </div>

      <div className="grid grid-2" style={{ gap: 'var(--space-xl)', marginTop: 'var(--space-2xl)' }}>
        <div className="card">
          <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-md)' }}>📧</div>
          <h2 className="section-title">Contacto Directo</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
            Para cualquier consulta, puedes contactar con Alba García López:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            <a href="mailto:albagarcialopez39@gmail.com" className="btn btn-primary" style={{ textDecoration: 'none', textAlign: 'center' }}>
              ✉️ albagarcialopez39@gmail.com
            </a>
            <a href="tel:+34606990974" className="btn btn-ghost" style={{ textDecoration: 'none', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              📞 +34 606 990 974
            </a>
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-md)' }}>❓</div>
          <h2 className="section-title">Centro de Ayuda</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
            Consulta nuestras guías de usuario para resolver dudas rápidas sobre el funcionamiento de la app.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <Link to="/manual" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
              Manual Estudiante
            </Link>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 'var(--space-xl)' }}>
        <h2 className="section-title">Preguntas Frecuentes</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', marginTop: 'var(--space-lg)' }}>
          <div>
            <h4 style={{ color: 'var(--primary-400)', marginBottom: 'var(--space-xs)' }}>¿Cómo puedo cambiar mi oposición?</h4>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
              Puedes hacerlo en cualquier momento desde tu **Perfil**. Selecciona la nueva oposición y guarda los cambios.
            </p>
          </div>
          <div>
            <h4 style={{ color: 'var(--primary-400)', marginBottom: 'var(--space-xs)' }}>¿Mis temas creados son privados?</h4>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
              Sí, los temas y preguntas que creas manualmente son visibles para ti. Los administradores pueden supervisar el contenido para asegurar la calidad global.
            </p>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 'var(--space-2xl)', color: 'var(--text-muted)', fontSize: 'var(--font-xs)' }}>
        &copy; {new Date().getFullYear()} Alba García López. Todos los derechos reservados.
      </div>
    </div>
  );
}
