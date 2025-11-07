import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';

export default function Profile() {
  const { user, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.profile?.phone || '',
    address: user?.profile?.address || ''
  });
  const [loading, setLoading] = useState(false);

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.profile?.phone || '',
      address: user?.profile?.address || ''
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put(`/users.php?id=${user.id}`, formData);
      toast.success('Profile updated successfully');
      setEditing(false);
      // Optionally, refresh user data
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div>
      <h3 className="mb-3">My Profile</h3>
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <span>Personal Information</span>
          {!editing ? (
            <button className="btn btn-primary" onClick={handleEdit}>
              Edit Profile
            </button>
          ) : (
            <div>
              <button className="btn btn-secondary me-2" onClick={handleCancel}>
                Cancel
              </button>
              <button className="btn btn-success" onClick={handleSave} disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">Name</label>
                {editing ? (
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                ) : (
                  <p className="form-control-plaintext">{user?.name}</p>
                )}
              </div>
              <div className="mb-3">
                <label className="form-label">Email</label>
                {editing ? (
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                ) : (
                  <p className="form-control-plaintext">{user?.email}</p>
                )}
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">Phone</label>
                {editing ? (
                  <input
                    type="text"
                    className="form-control"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                ) : (
                  <p className="form-control-plaintext">{user?.profile?.phone || '-'}</p>
                )}
              </div>
              <div className="mb-3">
                <label className="form-label">Address</label>
                {editing ? (
                  <textarea
                    className="form-control"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows="3"
                  />
                ) : (
                  <p className="form-control-plaintext">{user?.profile?.address || '-'}</p>
                )}
              </div>
            </div>
          </div>
          <hr />
          <div className="row">
            <div className="col-md-6">
              <p><strong>Role:</strong> {user?.role}</p>
              <p><strong>Employee Code:</strong> {user?.profile?.employee_code || '-'}</p>
              <p><strong>Department:</strong> {user?.profile?.department || '-'}</p>
            </div>
            <div className="col-md-6">
              <p><strong>Designation:</strong> {user?.profile?.designation || '-'}</p>
              <p><strong>Join Date:</strong> {user?.profile?.join_date ? new Date(user.profile.join_date).toLocaleDateString() : '-'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
