import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { register } from '../api/auth';
import AuthSidePanel from '../components/AuthSidePanel';
import type { ApiErrorLike } from '../types/api';
import pyoneCareLogo from '../assets/brand/pyonecare-logo.png';

interface RegisterFormData {
  email: string;
  password: string;
  full_name: string;
  date_of_birth: string;
}

type RegisterFieldErrors = Partial<Record<keyof RegisterFormData, string>>;

function RegisterPage() {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    full_name: '',
    date_of_birth: '',
  });
  const [errors, setErrors] = useState<RegisterFieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = (): boolean => {
    const newErrors: RegisterFieldErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    } else if (formData.full_name.length > 150) {
      newErrors.full_name = 'Full name must be less than 150 characters';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.date_of_birth && new Date(formData.date_of_birth) >= new Date()) {
      newErrors.date_of_birth = 'Date of birth must be in the past';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError('');
    setSuccessMessage('');

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        date_of_birth: formData.date_of_birth || null,
      };

      const response = await register(payload);

      if (response.success && response.data) {
        setSuccessMessage('Account created successfully! Please sign in.');
        showToast('Account created successfully.', 'success');
        setFormData({
          email: '',
          password: '',
          full_name: '',
          date_of_birth: '',
        });
        setErrors({});
      }
    } catch (error) {
      const err = error as ApiErrorLike;
      const message =
        err.response?.data?.error?.message ||
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Registration failed. Please try again.';
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
          <h1 className="auth-title">Create Account</h1>
          <p>Join us and start managing your oral health.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="full_name">Full Name</label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              className="form-input"
              value={formData.full_name}
              onChange={handleChange}
              onBlur={validate}
              placeholder="Enter your full name"
              disabled={loading}
              maxLength={150}
            />
            {errors.full_name && <span className="form-error">{errors.full_name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
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
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              onBlur={validate}
              placeholder="Enter your password"
              disabled={loading}
            />
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="date_of_birth">Date of Birth (Optional)</label>
            <input
              type="date"
              id="date_of_birth"
              name="date_of_birth"
              className="form-input"
              value={formData.date_of_birth}
              onChange={handleChange}
              onBlur={validate}
              disabled={loading}
            />
            {errors.date_of_birth && <span className="form-error">{errors.date_of_birth}</span>}
          </div>

          {serverError && <span className="form-error">{serverError}</span>}
          {successMessage && <span className="text-success">{successMessage}</span>}

          <div className="form-footer">
            <button type="submit" className="btn-primary btn-full" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </div>
        </form>

        <div className="auth-switch">
          Already have an account? <a href="/login">Sign in</a>
        </div>
      </div>

      <AuthSidePanel />
    </div>
  );
}

export default RegisterPage;
