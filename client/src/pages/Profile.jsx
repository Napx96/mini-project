import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams } from 'react-router-dom';
import api from '../services/api';

export default function Profile() {
  const { user } = useAuth();
  const { id } = useParams(); // For editing specific user if provided
  const isSelf = !id;
  const targetId = id ? parseInt(id) : user.id;
  const isAdminOrHR = ['admin', 'hr'].includes(user.role);
  const canEdit = isAdminOrHR || isSelf;

  const [profile, setProfile] = useState(null);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({});
  const [resetPassword, setResetPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
  const res = await api.get(`/users.php?id=${targetId}`);
      const data = res.data;
      setProfile(data);
      if (data.profile) {
        setForm({
          name: data.name,
          email: data.email,
          employee_code: data.profile.employee_code || '',
          department: data.profile.department || '',
          designation: data.profile.designation || '',
          join_date: data.profile.join_date || '',
          phone: data.profile.phone || '',
          address: data.profile.address || ''
        });
      } else {
        setForm({
          name: data.name,
          email: data.email
        });
      }
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (targetId) load();
  }, [targetId]);

  const save = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Update user
      const userUpdate = {
        name: form.name,
        email: form.email
      };
      if (form.password) userUpdate.password = form.password;
  await api.put(`/users.php?id=${targetId}`, userUpdate);

      // Update profile if employee
      if (profile.role === 'employee' && profile.profile) {
        const profileUpdate = {
          employee_code: form.employee_code,
          department: form.department,
          designation: form.designation,
          join_date: form.join_date,
          phone: form.phone,
          address: form.address
        };
  await api.put(`/employees.php?id=${profile.profile.id}`, profileUpdate);
      }

      setEdit(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetPassword) return;
    setLoading(true);
    try {
  await api.post(`/users.php?action=reset_password&id=${targetId}`, { password: resetPassword });
      setResetPassword('');
      alert('Password reset successfully');
    } catch (err) {
      setError('Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !profile) return <div>Loading...</div>;

  const title = isSelf ? 'My Profile' : `${profile.name}'s Profile`;

  return (
    <div className="row justify-content-center">
      <div className="col-md-8">
        <div className="card p-3">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="mb-0">{title}</h4>
            {canEdit && (
              <button className="btn btn-sm btn-primary" onClick={() => setEdit(!edit)} disabled={loading}>
                {edit ? 'Cancel' : 'Edit'}
              </button>
            )}
          </div>
          {error && <div className="alert alert-danger">{error}</div>}
          {!edit ? (
            <div className="mt-3">
              <div className="row">
                <div className="col-md-6"><strong>Name:</strong> {profile.name}</div>
                <div className="col-md-6"><strong>Email:</strong> {profile.email}</div>
                <div className="col-md-6"><strong>Role:</strong> {profile.role}</div>
                <div className="col-md-6"><strong>Status:</strong> {profile.is_active ? 'Active' : 'Inactive'}</div>
                {profile.role === 'employee' && profile.profile && (
                  <>
                    <div className="col-md-6"><strong>Employee Code:</strong> {profile.profile.employee_code || '-'}</div>
                    <div className="col-md-6"><strong>Department:</strong> {profile.profile.department || '-'}</div>
                    <div className="col-md-6"><strong>Designation:</strong> {profile.profile.designation || '-'}</div>
                    <div className="col-md-6"><strong>Join Date:</strong> {profile.profile.join_date || '-'}</div>
                    <div className="col-md-6"><strong>Phone:</strong> {profile.profile.phone || '-'}</div>
                    <div className="col-md-6"><strong>Address:</strong> {profile.profile.address || '-'}</div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <form className="mt-3" onSubmit={save}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Name</label>
                  <input className="form-control" name="name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-control" name="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">New Password (optional)</label>
                  <input type="password" className="form-control" name="password" placeholder="Leave blank to keep current" onChange={e => setForm({...form, password: e.target.value})} />
                </div>
                {profile.role === 'employee' && (
                  <>
                    <div className="col-md-6">
                      <label className="form-label">Employee Code</label>
                      <input className="form-control" name="employee_code" value={form.employee_code} onChange={e => setForm({...form, employee_code: e.target.value})} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Department</label>
                      <input className="form-control" name="department" value={form.department} onChange={e => setForm({...form, department: e.target.value})} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Designation</label>
                      <input className="form-control" name="designation" value={form.designation} onChange={e => setForm({...form, designation: e.target.value})} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Join Date</label>
                      <input type="date" className="form-control" name="join_date" value={form.join_date} onChange={e => setForm({...form, join_date: e.target.value})} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Phone</label>
                      <input type="tel" className="form-control" name="phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Address</label>
                      <textarea className="form-control" name="address" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
                    </div>
                  </>
                )}
                <div className="col-12">
                  <button className="btn btn-primary" type="submit" disabled={loading}>
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </form>
          )}
          {isAdminOrHR && !isSelf && (
            <div className="mt-4">
              <h5>Reset Password</h5>
              <form onSubmit={handleResetPassword}>
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
                <button type="submit" className="btn btn-warning" disabled={loading}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


