import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerVendor } from '../../api/vendorApi';

function VendorRegistration() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: '',
    company_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const res = await registerVendor(form);
      setSuccessMessage(res.data.message);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      if (err.response && err.response.data) {
        setErrors(err.response.data);
      } else {
        setErrors({ general: 'Registration failed. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: '500px' }}>
      <h2 className="mb-4">Vendor Registration</h2>

      {successMessage && <div className="alert alert-success">{successMessage}</div>}
      {errors.general && <div className="alert alert-danger">{errors.general}</div>}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Full Name</label>
          <input
            type="text"
            name="full_name"
            className="form-control"
            value={form.full_name}
            onChange={handleChange}
            required
          />
          {errors.full_name && <small className="text-danger">{errors.full_name}</small>}
        </div>

        <div className="mb-3">
          <label className="form-label">Company Name</label>
          <input
            type="text"
            name="company_name"
            className="form-control"
            value={form.company_name}
            onChange={handleChange}
            required
          />
          {errors.company_name && <small className="text-danger">{errors.company_name}</small>}
        </div>

        <div className="mb-3">
          <label className="form-label">Email</label>
          <input
            type="email"
            name="email"
            className="form-control"
            value={form.email}
            onChange={handleChange}
            required
          />
          {errors.email && <small className="text-danger">{errors.email}</small>}
        </div>

        <div className="mb-3">
          <label className="form-label">Phone Number</label>
          <input
            type="text"
            name="phone"
            className="form-control"
            value={form.phone}
            onChange={handleChange}
            required
          />
          {errors.phone && <small className="text-danger">{errors.phone}</small>}
        </div>

        <div className="mb-3">
          <label className="form-label">Password</label>
          <input
            type="password"
            name="password"
            className="form-control"
            value={form.password}
            onChange={handleChange}
            required
          />
          {errors.password && <small className="text-danger">{errors.password}</small>}
        </div>

        <div className="mb-3">
          <label className="form-label">Confirm Password</label>
          <input
            type="password"
            name="confirm_password"
            className="form-control"
            value={form.confirm_password}
            onChange={handleChange}
            required
          />
          {errors.confirm_password && <small className="text-danger">{errors.confirm_password}</small>}
        </div>

        <button type="submit" className="btn btn-primary w-100" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  );
}

export default VendorRegistration;