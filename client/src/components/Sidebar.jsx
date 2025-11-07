import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Home,
  Calendar,
  User,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Users,
  Clock,
  Briefcase,
  TrendingUp,
  File
} from 'lucide-react';

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home, roles: ['employee', 'hr', 'admin'] },
    { path: '/attendance', label: 'My Attendance', icon: Clock, roles: ['employee', 'hr', 'admin'] },
    { path: '/leaves/apply', label: 'Apply Leave', icon: FileText, roles: ['employee', 'hr', 'admin'] },
    { path: '/holidays', label: 'Holidays', icon: Calendar, roles: ['employee', 'hr', 'admin'] },
    { path: '/profile', label: 'Profile', icon: User, roles: ['employee', 'hr', 'admin'] },
    { path: '/admin/attendance', label: 'Attendance Mgmt', icon: Users, roles: ['hr', 'admin'] },
    { path: '/leaves/manage', label: 'Leave Mgmt', icon: Briefcase, roles: ['hr', 'admin'] },
    { path: '/performance', label: 'Performance', icon: TrendingUp, roles: ['hr', 'admin'] },
    { path: '/documents', label: 'Documents', icon: File, roles: ['hr', 'admin'] },
  ];

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="d-flex justify-content-end p-2">
        <button className="btn btn-sm btn-outline-secondary" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </button>
      </div>
      <nav>
        {navItems
          .filter(item => item.roles.includes(user?.role))
          .map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${location.pathname === item.path ? 'active' : ''} ${collapsed ? 'collapsed' : ''}`}
            >
              <item.icon className="icon" size={20} />
              <span className="label">{item.label}</span>
            </Link>
          ))}
      </nav>
    </div>
  );
}
