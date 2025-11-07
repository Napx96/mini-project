import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import EmployeeForm from '../components/EmployeeForm';

export default function EmployeeProfile({ userId }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const targetUserId = userId || user.id;
  const isOwnProfile = !userId || userId === user.id;
  const isAdminOrHR = ['admin', 'hr'].includes(user?.role);
  const canEdit = isOwnProfile || isAdminOrHR;

  useEffect(() => {
    fetchProfile();
  }, [targetUserId]);

  const fetchProfile = async () => {
    try {
      if (isOwnProfile) {
        const res = await api.get('/employees.php?me');
        setProfile(res.data);
        // Also fetch user data for editing
        const userRes = await api.get('/users.php?id=' + user.id);
        setUserData(userRes.data);
      } else {
        // Fetch other user's profile
        const userRes = await api.get('/users.php?id=' + targetUserId);
        setUserData(userRes.data);
        setProfile(userRes.data.profile || {});
      }
    } catch (err) {
      setError('Failed to load profile: ' + (err.response?.data?.error || err.message));
      console.error('Profile fetch error:', err);
    }
  };

  const handleEditSuccess = () => {
    setIsEditing(false);
    fetchProfile();
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword) return;
    setLoading(true);
    try {
      await api.post(`/api/users.php?action=reset_password&id=${targetUserId}`, { password: newPassword });
      setNewPassword('');
      setShowResetModal(false);
      alert('Password reset successfully');
    } catch (err) {
      setError('Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!profile || !userData) return <div className="alert alert-info">Loading profile...</div>;

  if (isEditing) {
    return (
      <EmployeeForm
        userId={targetUserId}
        initialData={{ ...userData, ...profile }}
        onClose={() => setIsEditing(false)}
        onSuccess={handleEditSuccess}
        isEdit={true}
      />
    );
  }

  return (
    <div>
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <span>{isOwnProfile ? 'My Profile' : `${profile.name}'s Profile`}</span>
          {canEdit && (
            <div>
              <button className="btn btn-sm btn-outline-primary me-2" onClick={() => setIsEditing(true)}>
                Edit Profile
              </button>
              <button className="btn btn-sm btn-outline-warning" onClick={() => setShowResetModal(true)}>
                Reset Password
              </button>
            </div>
          )}
        </div>
        <div className="card-body">
          {error && <div className="alert alert-danger">{error}</div>}
          <div className="row g-3">
            <div className="col-md-6"><strong>Name:</strong> {profile.name}</div>
            <div className="col-md-6"><strong>Email:</strong> {profile.email}</div>
            <div className="col-md-6"><strong>Department:</strong> {profile.department || '-'}</div>
            <div className="col-md-6"><strong>Designation:</strong> {profile.designation || '-'} </div>
            <div className="col-md-6"><strong>Join Date:</strong> {profile.join_date || '-'}</div>
            <div className="col-md-6"><strong>Phone:</strong> {profile.phone || '-'}</div>
            <div className="col-12"><strong>Address:</strong> {profile.address || '-'}</div>
          </div>
        </div>
      </div>

      {showResetModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Reset Password</h5>
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
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
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
