import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiLogOut } from 'react-icons/fi';

function Sidebar({ config, onLogout }) {
  return (
    <div className="d-flex flex-column bg-dark text-white p-3" style={{ width: '250px', minHeight: '100vh' }}>
      <h5 className="mb-4">{config.label}</h5>
      <nav className="nav nav-pills flex-column gap-1 flex-grow-1">
        {config.items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={`${config.basePath}/${item.to}`}
              className={({ isActive }) =>
                `nav-link text-white d-flex align-items-center gap-2 ${isActive ? 'active bg-primary' : ''}`
              }
            >
              <Icon /> {item.label}
            </NavLink>
          );
        })}
      </nav>
      <button className="btn btn-outline-light d-flex align-items-center gap-2 mt-3" onClick={onLogout}>
        <FiLogOut /> Logout
      </button>
    </div>
  );
}

export default Sidebar;