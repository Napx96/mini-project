import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">EMS</Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#nav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="nav">
          {token && (
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item"><Link className="nav-link" to="/">Dashboard</Link></li>
              <li className="nav-item"><Link className="nav-link" to="/profile">Profile</Link></li>
              <li className="nav-item"><Link className="nav-link" to="/attendance">Attendance</Link></li>
              <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">Leaves</a>
                <ul className="dropdown-menu">
                  <li><Link className="dropdown-item" to="/leaves/apply">Apply Leave</Link></li>
                  {user?.role === 'admin' && (
                    <li><Link className="dropdown-item" to="/leaves/manage">Manage Leaves</Link></li>
                  )}
                </ul>
              </li>
              <li className="nav-item"><Link className="nav-link" to="/holidays">Holidays</Link></li>
            </ul>
          )}
          <ul className="navbar-nav ms-auto">
            {!token ? (
              <li className="nav-item"><Link className="nav-link" to="/login">Login</Link></li>
            ) : (
              <li className="nav-item d-flex align-items-center text-white">
                <span className="me-3">{user?.name} ({user?.role})</span>
                <button className="btn btn-outline-light btn-sm" onClick={onLogout}>Logout</button>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}


