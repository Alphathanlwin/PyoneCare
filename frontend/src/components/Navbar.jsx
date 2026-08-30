import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import pyoneCareIcon from '../assets/brand/pyonecare-icon.png';

function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const getInitials = () => {
    if (user?.full_name) {
      return user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <img src={pyoneCareIcon} alt="" className="navbar-brand-icon" />
          PyoneCare
        </Link>
        
        <div className="navbar-nav">
          <Link 
            to="/" 
            className={`navbar-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            Dashboard
          </Link>
          <Link 
            to="/assessment/new" 
            className={`navbar-link ${location.pathname.startsWith('/assessment') ? 'active' : ''}`}
          >
            New Assessment
          </Link>
          <Link 
            to="/history" 
            className={`navbar-link ${location.pathname === '/history' ? 'active' : ''}`}
          >
            History
          </Link>
        </div>

        <div className="navbar-user">
          <ThemeToggle />
          <span className="navbar-user-name">{user?.full_name || user?.email || 'User'}</span>
          <div className="navbar-user-avatar">{getInitials()}</div>
          <button 
            onClick={logout} 
            className="btn-secondary"
            style={{ padding: '0.5rem 1rem' }}
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;