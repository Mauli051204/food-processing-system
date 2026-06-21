import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../services/authApi';

const ROLES = [
  { value: 'vendor', label: 'Vendor' },
  { value: 'purchase', label: 'Purchase Team' },
  { value: 'tech', label: 'Tech Team' },
  { value: 'production', label: 'Production Team' },
];

const PASSWORD_RULES = [
  { test: (p) => p.length >= 8, label: 'At least 8 characters' },
  { test: (p) => /[A-Z]/.test(p), label: 'One uppercase letter' },
  { test: (p) => /[a-z]/.test(p), label: 'One lowercase letter' },
  { test: (p) => /[0-9]/.test(p), label: 'One number' },
  { test: (p) => /[^A-Za-z0-9]/.test(p), label: 'One special character' },
];

function Register() {
  const navigate = useNavigate();
  const [role, setRole] = useState('vendor');
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    company_name: '',
    department: '',
    password: '',
    confirm_password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const passwordChecks = PASSWORD_RULES.map((rule) => ({ ...rule, passed: rule.test(form.password) }));
  const passwordsMatch = form.password && form.confirm_password && form.password === form.confirm_password;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');
    setFieldErrors({});

    if (form.password !== form.confirm_password) {
      setFieldErrors({ confirm_password: 'Passwords do not match.' });
      return;
    }

    const payload = {
      full_name: form.full_name,
      email: form.email,
      phone: form.phone,
      password: form.password,
      confirm_password: form.confirm_password,
    };
    if (role === 'vendor') {
      payload.company_name = form.company_name;
    } else {
      payload.department = form.department;
    }

    setLoading(true);
    try {
      await registerUser(role, payload);
      setSubmitted(true);
    } catch (err) {
      const detail = err.response?.data?.detail || err.response?.data;
      if (detail && typeof detail === 'object') {
        const errors = {};
        Object.entries(detail).forEach(([key, val]) => {
          errors[key] = Array.isArray(val) ? val.join(' ') : val;
        });
        setFieldErrors(errors);
      } else {
        setGeneralError(err.response?.data?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="container mt-5" style={{ maxWidth: '480px' }}>
        <div className="card">
          <div className="card-body text-center py-5">
            <h3 className="mb-3">Registration Successful</h3>
            <p className="text-muted">Waiting for Admin approval.</p>
            <p className="text-muted small">You'll be able to log in once your account has been reviewed.</p>
            <Link to="/login" className="btn btn-primary mt-3">Back to Login</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5 mb-5" style={{ maxWidth: '520px' }}>
      <div className="card">
        <div className="card-body">
          <h2 className="mb-4">Create Account</h2>

          {generalError && <div className="alert alert-danger">{generalError}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Role</label>
              <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">Full Name</label>
              <input
                className={`form-control ${fieldErrors.full_name ? 'is-invalid' : ''}`}
                value={form.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                required
              />
              {fieldErrors.full_name && <div className="invalid-feedback">{fieldErrors.full_name}</div>}
            </div>

            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                className={`form-control ${fieldErrors.email ? 'is-invalid' : ''}`}
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
              />
              {fieldErrors.email && <div className="invalid-feedback">{fieldErrors.email}</div>}
            </div>

            <div className="mb-3">
              <label className="form-label">Phone Number</label>
              <input
                className={`form-control ${fieldErrors.phone ? 'is-invalid' : ''}`}
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                required
              />
              {fieldErrors.phone && <div className="invalid-feedback">{fieldErrors.phone}</div>}
            </div>

            {role === 'vendor' ? (
              <div className="mb-3">
                <label className="form-label">Company Name</label>
                <input
                  className={`form-control ${fieldErrors.company_name ? 'is-invalid' : ''}`}
                  value={form.company_name}
                  onChange={(e) => handleChange('company_name', e.target.value)}
                  required
                />
                {fieldErrors.company_name && <div className="invalid-feedback">{fieldErrors.company_name}</div>}
              </div>
            ) : (
              <div className="mb-3">
                <label className="form-label">Department <span className="text-muted">(optional)</span></label>
                <input
                  className="form-control"
                  value={form.department}
                  onChange={(e) => handleChange('department', e.target.value)}
                />
              </div>
            )}

            <div className="mb-3">
              <label className="form-label">Password</label>
              <div className="input-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`form-control ${fieldErrors.password ? 'is-invalid' : ''}`}
                  value={form.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  required
                />
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowPassword((s) => !s)}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {fieldErrors.password && <div className="text-danger small mt-1">{fieldErrors.password}</div>}
              {form.password && (
                <ul className="list-unstyled small mt-2 mb-0">
                  {passwordChecks.map((c) => (
                    <li key={c.label} className={c.passed ? 'text-success' : 'text-muted'}>
                      {c.passed ? '✓' : '○'} {c.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mb-3">
              <label className="form-label">Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                className={`form-control ${fieldErrors.confirm_password ? 'is-invalid' : form.confirm_password && !passwordsMatch ? 'is-invalid' : ''}`}
                value={form.confirm_password}
                onChange={(e) => handleChange('confirm_password', e.target.value)}
                required
              />
              {fieldErrors.confirm_password && <div className="invalid-feedback d-block">{fieldErrors.confirm_password}</div>}
              {!fieldErrors.confirm_password && form.confirm_password && !passwordsMatch && (
                <div className="text-danger small mt-1">Passwords do not match.</div>
              )}
            </div>

            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>

          <p className="text-center mt-3 mb-0 small">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;