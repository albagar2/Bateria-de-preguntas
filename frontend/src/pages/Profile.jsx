// ============================================
// Profile Page — Settings & user management
// ============================================
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(user?.name || '');
  const [darkMode, setDarkMode] = useState(user?.darkMode || false);
  const [notifications, setNotifications] = useState(user?.notifications ?? true);
  const [oppositionId, setOppositionId] = useState(user?.oppositions?.map(o => o.id) || []);
  const [oppositions, setOppositions] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getOppositions().then(res => setOppositions(res.data)).catch(console.error);
  }, []);

  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [changingPass, setChangingPass] = useState(false);

  const [deletePassword, setDeletePassword] = useState('');
  const [showDelete, setShowDelete] = useState(false);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await api.updateProfile({ name, darkMode, notifications, oppositionId });
      updateUser(res.data);

      // Apply dark/light mode
      document.documentElement.setAttribute('data-theme', darkMode ? '' : 'light');

      toast.success('Perfil actualizado');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwords.newPassword !== passwords.confirm) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    setChangingPass(true);
    try {
      await api.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      toast.success('Contraseña cambiada. Inicia sesión de nuevo.');
      setPasswords({ currentPassword: '', newPassword: '', confirm: '' });
      setTimeout(() => logout(), 2000);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setChangingPass(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error('Introduce tu contraseña para confirmar');
      return;
    }

    try {
      await api.deleteAccount(deletePassword);
      toast.success('Cuenta eliminada');
      logout();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="container animate-slide-up">
      <div className="page-header">
        <h1 className="page-title">⚙️ Mi perfil</h1>
        <p className="page-subtitle">Gestiona tu cuenta y preferencias</p>
      </div>

      <div style={{ maxWidth: '600px' }}>
        {/* Profile info */}
        <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
          <h3 style={{ marginBottom: 'var(--space-lg)' }}>Datos personales</h3>

          <div className="input-group" style={{ marginBottom: 'var(--space-md)' }}>
            <label className="input-label">Nombre</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="input-group" style={{ marginBottom: 'var(--space-md)' }}>
            <label className="input-label">Email</label>
            <input className="input" value={user?.email || ''} disabled />
          </div>

          <div className="input-group" style={{ marginBottom: 'var(--space-md)' }}>
            <label className="input-label">Rol</label>
            <input className="input" value={user?.role === 'ADMIN' ? 'Administrador' : 'Estudiante'} disabled />
          </div>

          <div className="input-group" style={{ marginBottom: 'var(--space-md)' }}>
            <label className="input-label">Oposiciones inscritas</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', padding: 'var(--space-md)', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', maxHeight: '200px', overflowY: 'auto' }}>
              {oppositions.map(opp => {
                const isSelected = Array.isArray(oppositionId) ? oppositionId.includes(opp.id) : oppositionId === opp.id;
                return (
                  <label key={opp.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', cursor: 'pointer', padding: 'var(--space-xs) 0' }}>
                    <input 
                      type="checkbox" 
                      checked={isSelected} 
                      onChange={(e) => {
                        const current = Array.isArray(oppositionId) ? [...oppositionId] : (oppositionId ? [oppositionId] : []);
                        if (e.target.checked) {
                          setOppositionId([...current, opp.id]);
                        } else {
                          setOppositionId(current.filter(id => id !== opp.id));
                        }
                      }} 
                    />
                    <span>{opp.icon} {opp.name}</span>
                  </label>
                );
              })}
            </div>
            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Puedes preparar varias oposiciones a la vez.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', cursor: 'pointer' }}>
              <input type="checkbox" checked={darkMode} onChange={(e) => {
                setDarkMode(e.target.checked);
                // Apply immediately
                document.documentElement.setAttribute('data-theme', e.target.checked ? '' : 'light');
              }} />
              🌙 Modo oscuro
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', cursor: 'pointer' }}>
              <input type="checkbox" checked={notifications} onChange={(e) => setNotifications(e.target.checked)} />
              🔔 Notificaciones
            </label>
          </div>

          <button onClick={handleSaveProfile} className="btn btn-primary" disabled={saving}>
            {saving ? <span className="spinner spinner-sm"></span> : 'Guardar cambios'}
          </button>
        </div>

        {/* Change password */}
        <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
          <h3 style={{ marginBottom: 'var(--space-lg)' }}>Cambiar contraseña</h3>

          <div className="input-group" style={{ marginBottom: 'var(--space-md)' }}>
            <label className="input-label">Contraseña actual</label>
            <input
              className="input"
              type="password"
              value={passwords.currentPassword}
              onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
            />
          </div>

          <div className="input-group" style={{ marginBottom: 'var(--space-md)' }}>
            <label className="input-label">Nueva contraseña</label>
            <input
              className="input"
              type="password"
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              placeholder="Min. 8 caracteres, mayúscula, número, especial"
            />
          </div>

          <div className="input-group" style={{ marginBottom: 'var(--space-md)' }}>
            <label className="input-label">Confirmar nueva contraseña</label>
            <input
              className="input"
              type="password"
              value={passwords.confirm}
              onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
            />
          </div>

          <button onClick={handleChangePassword} className="btn btn-secondary" disabled={changingPass}>
            {changingPass ? <span className="spinner spinner-sm"></span> : '🔐 Cambiar contraseña'}
          </button>
        </div>

        {/* Danger zone */}
        <div className="card" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <h3 style={{ color: 'var(--error-400)', marginBottom: 'var(--space-md)' }}>⚠️ Zona de peligro</h3>

          {!showDelete ? (
            <button onClick={() => setShowDelete(true)} className="btn btn-danger">
              Eliminar mi cuenta
            </button>
          ) : (
            <div>
              <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
                Esta acción es irreversible. Se eliminarán todos tus datos, progreso, tests y estadísticas.
              </p>
              <div className="input-group" style={{ marginBottom: 'var(--space-md)' }}>
                <label className="input-label">Confirma tu contraseña</label>
                <input
                  className="input input-error"
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                <button onClick={handleDeleteAccount} className="btn btn-danger">
                  Confirmar eliminación
                </button>
                <button onClick={() => setShowDelete(false)} className="btn btn-ghost">
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{ marginTop: 'var(--space-2xl)', textAlign: 'center', opacity: 0.7 }}>
          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
            ¿Necesitas ayuda? <a href="/support" style={{ color: 'var(--primary-400)', textDecoration: 'none', fontWeight: 600 }}>Contactar con Soporte</a>
          </p>
          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-md)' }}>
            &copy; {new Date().getFullYear()} Alba García López. Todos los derechos reservados.
          </div>
        </div>
      </div>
    </div>
  );
}
