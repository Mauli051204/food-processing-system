import React from 'react';

function DashboardCard({ label, value, color = 'primary', icon }) {
  return (
    <div className="col-md-3 col-sm-6 mb-3">
      <div className={`card border-${color} h-100`}>
        <div className="card-body d-flex align-items-center justify-content-between">
          <div>
            <h6 className="card-subtitle text-muted small mb-1">{label}</h6>
            <h3 className={`text-${color} mb-0`}>{value}</h3>
          </div>
          {icon && <div className={`text-${color} fs-2`}>{icon}</div>}
        </div>
      </div>
    </div>
  );
}

export default DashboardCard;