import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/Pagination';

export default function LeaveManagement() {
  const [leaves, setLeaves] = useState([]);
  const [pageMeta, setPageMeta] = useState({ page: 1, per_page: 20, total: 0, total_pages: 0 });
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [editLeaveTypeId, setEditLeaveTypeId] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editReason, setEditReason] = useState('');

  const { user } = useAuth();
  const formatDate = (date) => {
    if (!date) return '-';
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  const load = async (page = 1, per_page = 20) => {
    setLoading(true);
    try {
      const isAdminOrHR = user && ['admin', 'hr'].includes(user.role);
      const url = isAdminOrHR ? `/leaves.php?all=1&page=${page}&per_page=${per_page}` : `/leaves.php?page=${page}&per_page=${per_page}`;
      const res = await api.get(url);
      if (res.data && Array.isArray(res.data.data)) {
        setLeaves(res.data.data);
        setPageMeta(res.data.meta || { page, per_page, total: 0, total_pages: 0 });
      } else {
        setLeaves(res.data || []);
      }
    } catch (err) {
      setLeaves([]);
      toast.error('Failed to load leave requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(pageMeta.page, pageMeta.per_page); loadTypes(); }, []);

  const loadTypes = async () => {
    try {
      const res = await api.get('/leaves.php?action=getTypes');
      setLeaveTypes(res.data || []);
    } catch (err) {
      setLeaveTypes([]);
    }
  };

  const setStatus = async (id, status) => {
    if (!window.confirm(`Are you sure you want to ${status} this leave request?`)) return;
    try {
      await api.put(`/leaves.php?id=${id}`, { status });
      toast.success(`Leave ${status} successfully`);
      await load();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleEdit = (leave) => {
    setSelectedLeave(leave);
    setEditLeaveTypeId(leave.leave_type_id);
    setEditStartDate(leave.start_date);
    setEditEndDate(leave.end_date);
    setEditReason(leave.reason || '');
    setShowEditModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this leave request?')) return;
    try {
      await api.delete(`/leaves.php?id=${id}`);
      toast.success('Leave deleted successfully');
      await load();
    } catch (err) {
      toast.error('Failed to delete leave');
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/leaves.php?id=${selectedLeave.id}`, {
        leave_type_id: editLeaveTypeId,
        start_date: editStartDate,
        end_date: editEndDate,
        reason: editReason
      });
      setShowEditModal(false);
      toast.success('Leave updated successfully');
      await load();
    } catch (err) {
      toast.error('Failed to update leave');
    }
  };

  return (
    <div className="card">
      <div className="card-header">Leave Management</div>
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-striped mb-0">
            <thead>
              <tr>
                <th>#</th>
                <th>Employee</th>
                <th>Type</th>
                <th>Start</th>
                <th>End</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="text-center">Loading...</td></tr>
              ) : leaves.length === 0 ? (
                <tr><td colSpan="7" className="text-center">No leave records found.</td></tr>
              ) : leaves.map(l => (
                <tr key={l.id}>
                  <td>{l.id}</td>
                  <td>{l.user_name || 'N/A'}</td>
                  <td>{l.leave_type_name || 'N/A'}</td>
                  <td>{formatDate(l.start_date)}</td>
                  <td>{formatDate(l.end_date)}</td>
                  <td><span className={`badge bg-${l.status === 'approved' ? 'success' : l.status === 'rejected' ? 'danger' : 'secondary'}`}>{l.status}</span></td>
                  <td>
                    <div className="dropdown">
                      <button className="btn btn-sm btn-secondary dropdown-toggle" type="button" id={`action-menu-${l.id}`} data-bs-toggle="dropdown" aria-expanded="false">
                        Actions
                      </button>
                      <ul className="dropdown-menu" aria-labelledby={`action-menu-${l.id}`}>
                        <li><button className="dropdown-item" onClick={() => setStatus(l.id, 'approved')}>Approve</button></li>
                        <li><button className="dropdown-item" onClick={() => setStatus(l.id, 'rejected')}>Reject</button></li>
                        <li><hr className="dropdown-divider" /></li>
                        <li><button className="dropdown-item" onClick={() => handleEdit(l)}>Edit</button></li>
                        <li><button className="dropdown-item text-danger" onClick={() => handleDelete(l.id)}>Delete</button></li>
                      </ul>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="d-flex justify-content-end p-3">
        <Pagination page={pageMeta.page} totalPages={pageMeta.total_pages} onPageChange={(p) => load(p, pageMeta.per_page)} />
      </div>

      {showEditModal && selectedLeave && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Leave for {selectedLeave.name}</h5>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
              </div>
              <form onSubmit={handleSaveEdit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Leave Type</label>
                    <select
                      className="form-control"
                      value={editLeaveTypeId}
                      onChange={(e) => setEditLeaveTypeId(e.target.value)}
                      required
                    >
                      {leaveTypes.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Start Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={editStartDate}
                      onChange={(e) => setEditStartDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">End Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={editEndDate}
                      onChange={(e) => setEditEndDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Reason</label>
                    <textarea
                      className="form-control"
                      value={editReason}
                      onChange={(e) => setEditReason(e.target.value)}
                      rows="3"
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
