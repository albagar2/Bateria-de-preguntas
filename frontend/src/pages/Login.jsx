// ============================================
// Login Page
// ============================================
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './Auth.css';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!form.email) return setErrors({ email: 'Email requerido' });
    if (!form.password) return setErrors({ password: 'Contraseña requerida' });

    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('¡Bienvenido de nuevo!');
    } catch (err) {
      toast.error(err.message || 'Error al iniciar sesión');
      if (err.errors) {
        const fieldErrors = {};
        err.errors.forEach((e) => (fieldErrors[e.field] = e.message));
        setErrors(fieldErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    if (demoLoading || loading) return;
    setDemoLoading(true);
    setErrors({});

    const demoEmail = 'demo@bateriapreguntas.com';
    const demoPassword = 'User@2024!';

    // Animate typing the email
    setForm({ email: '', password: '' });
    await new Promise(r => setTimeout(r, 150));

    for (let i = 1; i <= demoEmail.length; i++) {
      setForm(prev => ({ ...prev, email: demoEmail.slice(0, i) }));
      await new Promise(r => setTimeout(r, 25));
    }

    await new Promise(r => setTimeout(r, 200));

    // Animate typing the password
    for (let i = 1; i <= demoPassword.length; i++) {
      setForm(prev => ({ ...prev, password: demoPassword.slice(0, i) }));
      await new Promise(r => setTimeout(r, 25));
    }

    await new Promise(r => setTimeout(r, 300));

    // Submit login as demo
    try {
      await login(demoEmail, demoPassword);
      sessionStorage.setItem('isDemo', 'true');
      toast.success('¡Bienvenido al modo demo!');
    } catch (err) {
      toast.error(err.message || 'Error al iniciar sesión demo');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-bg-circle auth-bg-circle-1"></div>
        <div className="auth-bg-circle auth-bg-circle-2"></div>
        <div className="auth-bg-circle auth-bg-circle-3"></div>
      </div>

      <div className="auth-container animate-slide-up">
        <div className="auth-header">
          <div className="auth-logo">🎯</div>
          <h1 className="auth-title">BateriaQ</h1>
          <p className="auth-subtitle">Inicia sesión para continuar estudiando</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" id="login-form">
          <div className="input-group">
            <label className="input-label" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              className={`input ${errors.email ? 'input-error' : ''}`}
              placeholder="tu@email.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="password">Contraseña</label>
            <div className="password-wrapper">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                className={`input password-field ${errors.password ? 'input-error' : ''}`}
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
              />
              <button 
                type="button" 
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>

          <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading} id="login-submit">
            {loading ? <span className="spinner spinner-sm"></span> : null}
            {loading ? 'Entrando...' : 'Iniciar sesión'}
          </button>
        </form>

        <div className="auth-footer">
          <p>¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link></p>
        </div>

        <div className="auth-demo">
          <button
            type="button"
            className="btn-demo"
            onClick={handleDemo}
            disabled={demoLoading || loading}
            id="demo-button"
          >
            {demoLoading ? (
              <><span className="spinner spinner-sm"></span> Entrando en demo...</>
            ) : (
              <><span className="demo-icon">🚀</span> Probar Demo</>            )}
          </button>
          <p className="demo-hint">Explora la app sin registrarte</p>
        </div>

        <div className="copyright-footer">
          &copy; {new Date().getFullYear()} Alba García López. Todos los derechos reservados.
        </div>
      </div>
    </div>
  );
}
