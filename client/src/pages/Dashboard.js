import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import EmployeeForm from '../components/EmployeeForm';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Clock, Calendar, FileText } from 'lucide-react';
import Pagination from '../components/Pagination';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [pageMeta, setPageMeta] = useState({ page: 1, per_page: 20, total: 0, total_pages: 0 });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [resetPassword, setResetPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({});
  const [pageLoading, setPageLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [perPage, setPerPage] = useState(20);

  const isAdminOrHR = ['admin', 'hr'].includes(user?.role);

  const searchDebounceRef = useRef(null);

  useEffect(() => {
    if (isAdminOrHR) {
      fetchUsers(pageMeta.page, perPage).then(() => setPageLoading(false)).catch(() => setPageLoading(false));
    } else {
      fetchStats().then(() => setPageLoading(false)).catch(() => setPageLoading(false));
    }
  }, [isAdminOrHR]);

  // Debounce searchTerm changes and reset to page 1
  useEffect(() => {
    if (!isAdminOrHR) return;
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      // Reset to first page when search/filter changes
      fetchUsers(1, perPage);
    }, 300);
    return () => clearTimeout(searchDebounceRef.current);
  }, [searchTerm, filterRole, filterDepartment, sortBy, sortDir, perPage]);

  const fetchStats = async () => {
    try {
      const res = await api.get('/stats.php');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch stats');
    }
  };

  const fetchUsers = async (page = 1, per_page = 20) => {
    try {
      const params = new URLSearchParams();
      params.set('page', page);
      params.set('per_page', per_page);
      if (searchTerm) params.set('q', searchTerm);
      if (filterRole) params.set('role', filterRole);
      if (filterDepartment) params.set('department', filterDepartment);
      if (sortBy) params.set('sort', sortBy);
      if (sortDir) params.set('dir', sortDir);

      const res = await api.get(`/users.php?${params.toString()}`);
      if (res.data && Array.isArray(res.data.data)) {
        setUsers(res.data.data.map(u => ({ ...u, profile: { department: u.department, designation: u.designation, employee_code: u.employee_code } })) );
        setPageMeta(res.data.meta || { page, per_page, total: 0, total_pages: 0 });
      } else {
        setUsers([]);
        setError('Failed to fetch users: ' + (res.data?.error || 'Unknown error'));
      }
    } catch (err) {
      setError('Failed to fetch users');
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pageMeta.total_pages) return;
    fetchUsers(newPage, perPage);
  };

  const handleAddSuccess = () => {
    fetchUsers();
  };

  const handleEditSuccess = () => {
    fetchUsers();
    setShowEditModal(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this user?')) return;
    setLoading(true);
    try {
      await api.delete(`/users.php?id=${id}`);
      fetchUsers();
    } catch (err) {
      setError('Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetPassword) return;
    setLoading(true);
    try {
      await api.post(`/users.php?action=reset_password&id=${selectedUser.id}`, { password: resetPassword });
      setResetPassword('');
      setShowResetModal(false);
      alert('Password reset successfully');
    } catch (err) {
      setError('Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/stats.php?action=export_users', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'users_export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export users');
    }
  };

  // Server-side filtering — users already reflect server response
  const filteredUsers = users;

  if (pageLoading) return <div>Loading...</div>;

  if (!isAdminOrHR) {
    return (
      <div>
        <h3 className="mb-3">Welcome, {user?.name}</h3>
        <div className="row">
          <div className="col-md-8">
            <div className="card">
              <div className="card-header">Profile Details</div>
              <div className="card-body p-0">
                <table className="table table-striped mb-0">
                  <tbody>
                    <tr>
                      <td><strong>Name</strong></td>
                      <td>{user?.name}</td>
                    </tr>
                    <tr>
                      <td><strong>Email</strong></td>
                      <td>{user?.email}</td>
                    </tr>
                    <tr>
                      <td><strong>Role</strong></td>
                      <td>{user?.role}</td>
                    </tr>
                    {user?.profile && (
                      <>
                        <tr>
                          <td><strong>Employee Code</strong></td>
                          <td>{user.profile.employee_code || '-'}</td>
                        </tr>
                        <tr>
                          <td><strong>Department</strong></td>
                          <td>{user.profile.department || '-'}</td>
                        </tr>
                        <tr>
                          <td><strong>Designation</strong></td>
                          <td>{user.profile.designation || '-'}</td>
                        </tr>
                        <tr>
                          <td><strong>Join Date</strong></td>
                          <td>{user.profile.join_date ? new Date(user.profile.join_date).toLocaleDateString() : '-'}</td>
                        </tr>
                        <tr>
                          <td><strong>Phone</strong></td>
                          <td>{user.profile.phone || '-'}</td>
                        </tr>
                        <tr>
                          <td><strong>Address</strong></td>
                          <td>{user.profile.address || '-'}</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card">
              <div className="card-header">Quick Stats</div>
              <div className="card-body">
                <p><strong>Leaves This Month:</strong> {stats.my_leaves_this_month || 0}</p>
                <p><strong>Present Today:</strong> {stats.user_present_today ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const chartData = [
    { day: 'Mon', present: 5 },
    { day: 'Tue', present: 8 },
    { day: 'Wed', present: 6 },
    { day: 'Thu', present: 7 },
    { day: 'Fri', present: 9 },
  ];

  return (
    <div>
      <h3 className="mb-3">Welcome, {user?.name}</h3>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row mb-4">
        {stats.total_users && (
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <Users size={40} className="text-primary mb-2" />
                <h5>{stats.total_users}</h5>
                <p className="text-muted">Total Users</p>
              </div>
            </div>
          </div>
        )}
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <Clock size={40} className="text-success mb-2" />
              <h5>{stats.present_today || 0}</h5>
              <p className="text-muted">Present Today</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <Calendar size={40} className="text-warning mb-2" />
              <h5>{stats.leaves_this_month || 0}</h5>
              <p className="text-muted">Leaves This Month</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <FileText size={40} className="text-info mb-2" />
              <h5>{stats.my_leaves || 0}</h5>
              <p className="text-muted">My Leaves</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-header">Attendance Overview (Last 7 Days)</div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="present" fill="#0d6efd" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="card mb-3">
        <div className="card-header d-flex justify-content-between align-items-center">
          <span>Users & Employees</span>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            Add New User
          </button>
        </div>
        <div className="card-body p-0">
          <div className="mb-3 d-flex gap-2 p-3">
            <input type="text" className="form-control" placeholder="Search by name or email" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <select className="form-select" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="hr">HR</option>
              <option value="employee">Employee</option>
            </select>
            <select className="form-select" value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)}>
              <option value="">All Departments</option>
              {[...new Set(users.map(u => u.profile?.department).filter(Boolean))].map(dep => (
                <option key={dep} value={dep}>{dep}</option>
              ))}
            </select>
            <select className="form-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="id">Sort: ID</option>
              <option value="name">Sort: Name</option>
              <option value="created_at">Sort: Created</option>
            </select>
            <select className="form-select" value={sortDir} onChange={(e) => setSortDir(e.target.value)}>
              <option value="asc">Asc</option>
              <option value="desc">Desc</option>
            </select>
            <select className="form-select" value={perPage} onChange={(e) => { setPerPage(parseInt(e.target.value, 10)); fetchUsers(1, parseInt(e.target.value, 10)); }}>
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>
            <button className="btn btn-success" onClick={handleExport}>Export Users</button>
          </div>
          <div className="table-responsive">
            <table className="table table-striped mb-0">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u, index) => (
                  <tr key={u.id}>
                    <td>{(pageMeta.page - 1) * pageMeta.per_page + index + 1}</td>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>{u.profile?.department || '-'}</td>
                    <td>{u.profile?.designation || '-'}</td>
                    <td>{u.is_active ? 'Active' : 'Inactive'}</td>
                    <td>
                      <button className="btn btn-sm btn-outline-primary me-1" onClick={() => { setSelectedUser(u); setShowEditModal(true); }}>
                        Edit
                      </button>
                      <button className="btn btn-sm btn-outline-warning me-1" onClick={() => { setSelectedUser(u); setShowResetModal(true); }}>
                        Reset Password
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(u.id)} disabled={loading}>
                        {loading ? 'Deleting...' : 'Deactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="d-flex justify-content-end">
            {/* Pagination control */}
            <Pagination page={pageMeta.page} totalPages={pageMeta.total_pages} onPageChange={handlePageChange} />
          </div>
        </div>
      </div>

      {showAddModal && (
        <EmployeeForm
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
          isEdit={false}
        />
      )}

      {showEditModal && selectedUser && (
        <EmployeeForm
          userId={selectedUser.id}
          initialData={selectedUser}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
          isEdit={true}
        />
      )}

      {showResetModal && selectedUser && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Reset Password for {selectedUser.name}</h5>
                <button type="button" className="btn-close" onClick={() => setShowResetModal(false)}></button>
              </div>
              <form onSubmit={handleResetPassword}>
                <div className="modal-body">
                  {error && <div className="alert alert-danger">{error}</div>}
                  <div className="mb-3">
                    <label className="form-label">New Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowResetModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-warning" disabled={loading}>
                    {loading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


