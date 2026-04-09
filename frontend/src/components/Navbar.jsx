// ============================================
// Navbar Component
// ============================================
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/', label: 'Dashboard', icon: '🏠' },
    ...(user?.role === 'ADMIN' ? [{ to: '/admin', label: 'Admin', icon: '🛠️' }] : []),
    { to: '/topics', label: 'Temas', icon: '📚' },
    { to: '/tests', label: 'Tests', icon: '🧪' },
    { to: '/mistakes', label: 'Errores', icon: '❌' },
    { to: '/stats', label: 'Estadísticas', icon: '📊' },
    { to: '/planner', label: 'Planificador', icon: '📅' },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="navbar-logo">🎯</span>
          <span className="navbar-title">BateriaQ</span>
        </Link>

        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`navbar-link ${location.pathname === link.to ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <span className="navbar-link-icon">{link.icon}</span>
              <span className="navbar-link-label">{link.label}</span>
            </Link>
          ))}
        </div>

        <div className="navbar-actions">
          {user && (
            <div className="navbar-user">
              <Link to="/profile" className="navbar-avatar" title="Mi perfil">
                {user.name.charAt(0).toUpperCase()}
              </Link>
              <button onClick={handleLogout} className="btn-logout" title="Cerrar sesión">
                <span>Cerrar sesión</span>
                <span className="logout-icon">🚪</span>
              </button>
            </div>
          )}
          <button
            className="navbar-hamburger"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </nav>
  );
}
