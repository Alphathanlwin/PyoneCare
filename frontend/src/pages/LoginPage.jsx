import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { login } from '../api/auth';
import AuthSidePanel from '../components/AuthSidePanel';
import pyoneCareLogo from '../assets/brand/pyonecare-logo.png';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  
  const { login: authLogin, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const validate = () => {
    const newErrors = {};
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    
    if (!validate()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await login({ email, password });
      
      if (response.success && response.data) {
        const { access_token, user } = response.data;
        authLogin(access_token, user || { id: 'current-user' });
        showToast('Login successful.', 'success');
        navigate('/');
      }
    } catch (error) {
      const message = error.response?.data?.error?.message ||
                     error.response?.data?.detail ||
                     error.response?.data?.message ||
                     'Login failed. Please check your credentials.';
      setServerError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <img src={pyoneCareLogo} alt="PyoneCare" className="auth-logo-image" />
          <h1 className="auth-title">Sign In</h1>
          <p>Welcome back! Sign in to access your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={validate}
              placeholder="Enter your email"
              disabled={loading}
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={validate}
              placeholder="Enter your password"
              disabled={loading}
            />
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          {serverError && <span className="form-error">{serverError}</span>}

          <div className="form-footer">
            <button
              type="submit"
              className="btn-primary btn-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </div>
        </form>

        <div className="auth-switch">
          Don't have an account? <a href="/register">Sign up</a>
        </div>
      </div>

      <AuthSidePanel />
    </div>
  );
}

export default LoginPage;