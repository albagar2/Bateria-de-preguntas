// ============================================
// Register Page
// ============================================
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './Auth.css';

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', oppositionId: '' });
  const [oppositions, setOppositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    import('../services/api').then(({ api }) => {
      api.getOppositions()
        .then(res => setOppositions(res.data))
        .catch(console.error);
    });
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const validate = () => {
    const errs = {};
    if (!form.name || form.name.length < 2) errs.name = 'Mínimo 2 caracteres';
    if (!form.email) errs.email = 'Email requerido';
    if (form.password.length < 8) errs.password = 'Mínimo 8 caracteres';
    if (!/[A-Z]/.test(form.password)) errs.password = 'Debe contener una mayúscula';
    if (!/[0-9]/.test(form.password)) errs.password = 'Debe contener un número';
    if (!/[^A-Za-z0-9]/.test(form.password)) errs.password = 'Debe contener un carácter especial';
    if (!form.oppositionId) errs.oppositionId = 'Debes seleccionar una oposición';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Las contraseñas no coinciden';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.oppositionId);
      toast.success('¡Cuenta creada correctamente!');
    } catch (err) {
      toast.error(err.message || 'Error al crear la cuenta');
    } finally {
      setLoading(false);
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
          <h1 className="auth-title">Crear Cuenta</h1>
          <p className="auth-subtitle">Únete y comienza a preparar tu oposición</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" id="register-form">
          <div className="input-group">
            <label className="input-label" htmlFor="reg-name">Nombre</label>
            <input
              id="reg-name"
              name="name"
              type="text"
              className={`input ${errors.name ? 'input-error' : ''}`}
              placeholder="Tu nombre"
              value={form.name}
              onChange={handleChange}
            />
            {errors.name && <span className="error-text">{errors.name}</span>}
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              name="email"
              type="email"
              className={`input ${errors.email ? 'input-error' : ''}`}
              placeholder="tu@email.com"
              value={form.email}
              onChange={handleChange}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="reg-opposition">Oposición a preparar</label>
            <select
              id="reg-opposition"
              name="oppositionId"
              className={`input ${errors.oppositionId ? 'input-error' : ''}`}
              value={form.oppositionId}
              onChange={handleChange}
            >
              <option value="">Selecciona tu oposición...</option>
              {Object.entries(
                oppositions.reduce((acc, opp) => {
                  const cat = opp.description || 'Otras';
                  if (!acc[cat]) acc[cat] = [];
                  acc[cat].push(opp);
                  return acc;
                }, {})
              ).map(([category, opps]) => (
                <optgroup key={category} label={category}>
                  {opps.map(opp => (
                    <option key={opp.id} value={opp.id}>{opp.icon} {opp.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            {errors.oppositionId && <span className="error-text">{errors.oppositionId}</span>}
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="reg-password">Contraseña</label>
            <div className="password-wrapper">
              <input
                id="reg-password"
                name="password"
                type={showPassword ? "text" : "password"}
                className={`input password-field ${errors.password ? 'input-error' : ''}`}
                placeholder="Min. 8 caracteres, mayúscula, número, especial"
                value={form.password}
                onChange={handleChange}
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

          <div className="input-group">
            <label className="input-label" htmlFor="reg-confirm">Confirmar contraseña</label>
            <div className="password-wrapper">
              <input
                id="reg-confirm"
                name="confirmPassword"
                type={showConfirm ? "text" : "password"}
                className={`input password-field ${errors.confirmPassword ? 'input-error' : ''}`}
                placeholder="Repite la contraseña"
                value={form.confirmPassword}
                onChange={handleChange}
              />
              <button 
                type="button" 
                className="password-toggle"
                onClick={() => setShowConfirm(!showConfirm)}
                title={showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showConfirm ? '🙈' : '👁️'}
              </button>
            </div>
            {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
          </div>

          <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading} id="register-submit">
            {loading ? <span className="spinner spinner-sm"></span> : null}
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <div className="auth-footer">
          <p>¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
        </div>

        <div className="copyright-footer">
          &copy; {new Date().getFullYear()} BateriaQ. Todos los derechos reservados.
        </div>
      </div>
    </div>
  );
}
