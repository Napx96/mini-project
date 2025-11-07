import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, Search, User } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function TopNavbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="d-flex align-items-center">
        <span className="navbar-brand">EMS Dashboard</span>
      </div>
      <div className="d-flex align-items-center">
        <div className="input-group me-3" style={{ width: '200px' }}>
          <span className="input-group-text"><Search size={16} /></span>
          <input type="text" className="form-control" placeholder="Search..." />
        </div>
        <button className="btn btn-outline-light me-2">
          <Bell size={16} />
        </button>
        <ThemeToggle />
        <div className="dropdown ms-3">
          <button className="btn btn-outline-light dropdown-toggle" type="button" data-bs-toggle="dropdown">
            <User size={16} className="me-1" />
            {user?.name}
          </button>
          <ul className="dropdown-menu">
            <li><a className="dropdown-item" href="/profile">Profile</a></li>
            <li><hr className="dropdown-divider" /></li>
            <li><button className="dropdown-item" onClick={logout}>Logout</button></li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
