import React from 'react';
import { Link } from 'react-router-dom';
import { FiTruck, FiShield, FiBarChart2, FiArrowRight } from 'react-icons/fi';

function Home() {
  const features = [
    {
      icon: <FiTruck size={28} />,
      title: 'Vendor to Production Pipeline',
      text: 'Track raw materials from vendor upload through purchase approval, encryption, and final release.',
    },
    {
      icon: <FiShield size={28} />,
      title: 'AES-256 Encrypted Data',
      text: 'Every material batch is encrypted end-to-end before it reaches the production floor.',
    },
    {
      icon: <FiBarChart2 size={28} />,
      title: 'Live Dashboards for Every Role',
      text: 'Vendor, Purchase, Tech, Production, and Admin each get real-time stats and activity tracking.',
    },
  ];

  return (
    <div>
      <section className="bg-dark text-white py-5">
        <div className="container py-5 text-center">
          <h1 className="display-5 fw-bold mb-3">Food Processing System</h1>
          <p className="lead text-white-50 mb-4" style={{ maxWidth: '600px', margin: '0 auto' }}>
            Optimizing food processing with automation and data efficiency —
            from vendor intake to encrypted, audited production release.
          </p>
          <div className="d-flex justify-content-center gap-3 mt-4">
            <Link to="/login" className="btn btn-primary btn-lg px-4">
              Login
            </Link>
            <Link to="/register" className="btn btn-outline-light btn-lg px-4">
              Register <FiArrowRight className="ms-1" />
            </Link>
          </div>
        </div>
      </section>

      <section className="container py-5">
        <div className="row g-4">
          {features.map((f) => (
            <div className="col-md-4" key={f.title}>
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center p-4">
                  <div className="text-primary mb-3">{f.icon}</div>
                  <h5 className="card-title">{f.title}</h5>
                  <p className="card-text text-muted small">{f.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-center text-muted py-4 border-top">
        Food Processing System
      </footer>
    </div>
  );
}

export default Home;