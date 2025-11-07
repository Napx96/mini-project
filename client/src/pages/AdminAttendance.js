import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext'; // Assuming you have this context
import Pagination from '../components/Pagination';

function AdminAttendance() {
  const { user } = useAuth(); // Get current user for role-based access
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ name: '', date: '' });
  const [pageMeta, setPageMeta] = useState({ page: 1, per_page: 20, total: 0, total_pages: 0 });
  const [editingRecord, setEditingRecord] = useState(null);

  const fetchAttendance = async (page = 1, per_page = 20) => {
    try {
      const params = new URLSearchParams();
      params.set('admin', 'true');
      params.set('page', page);
      params.set('per_page', per_page);
      if (filters.name) params.set('q', filters.name);
      if (filters.date) params.set('start_date', filters.date) && params.set('end_date', filters.date);

      const response = await api.get(`/attendance.php?${params.toString()}`);
      if (response.data && Array.isArray(response.data.data)) {
        setAttendance(response.data.data);
        setPageMeta(response.data.meta || { page, per_page, total: 0, total_pages: 0 });
      } else {
        setAttendance([]);
      }
    } catch (error) {
      toast.error('Failed to fetch attendance records.');
      console.error('Fetch attendance error:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    fetchAttendance(pageMeta.page, pageMeta.per_page);
  };

  useEffect(() => {
    fetchAttendance(pageMeta.page, pageMeta.per_page);
  }, []);

  // Server-side filtered attendance
  const filteredAttendance = attendance;

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = (record) => {
    // Make a copy to avoid mutating state directly
    setEditingRecord({ ...record });
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;

    try {
      const { id, user_id, work_date, ...dataToUpdate } = editingRecord;
      await api.put(`/attendance.php?id=${id}`, dataToUpdate);
      toast.success('Record updated successfully!');
      setEditingRecord(null);
      refreshData(); // Refresh data
    } catch (error) {
      toast.error('Failed to update record.');
      console.error('Update attendance error:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await api.delete(`/attendance.php?id=${id}`);
        toast.success('Record deleted successfully!');
        refreshData(); // Refresh data
      } catch (error) {
        toast.error('Failed to delete record.');
        console.error('Delete attendance error:', error);
      }
    }
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditingRecord(prev => ({ ...prev, [name]: value }));
  };

  // Role-based access control
  if (!user || !['admin', 'hr'].includes(user.role)) {
    return (
      <div className="container mt-4">
        <h2>Access Denied</h2>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pageMeta.total_pages) return;
    fetchAttendance(newPage, pageMeta.per_page);
  };

  return (
    <div className="container mt-4">
      <h2>Admin Attendance Management</h2>

      {/* Filters */}
      <div className="row mb-3">
        <div className="col-md-4">
          <input
            type="text"
            name="name"
            className="form-control"
            placeholder="Filter by name..."
            value={filters.name}
            onChange={handleFilterChange}
          />
        </div>
        <div className="col-md-4">
          <input
            type="date"
            name="date"
            className="form-control"
            value={filters.date}
            onChange={handleFilterChange}
          />
        </div>
      </div>

      {/* Attendance Table */}
      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>User Name</th>
              <th>Date</th>
              <th>Clock In</th>
              <th>Clock Out</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="text-center">Loading...</td></tr>
            ) : (
              filteredAttendance.map(record => (
                <tr key={record.id}>
                  <td>{record.user_name}</td>
                  <td>{record.work_date}</td>
                  <td>{record.clock_in ? new Date(record.clock_in).toLocaleTimeString() : 'N/A'}</td>
                  <td>{record.clock_out ? new Date(record.clock_out).toLocaleTimeString() : 'N/A'}</td>
                  <td>{record.notes}</td>
                  <td>
                    <button className="btn btn-sm btn-primary me-2" onClick={() => handleEdit(record)} data-bs-toggle="modal" data-bs-target="#editAttendanceModal">Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(record.id)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="d-flex justify-content-end p-3">
        <Pagination page={pageMeta.page} totalPages={pageMeta.total_pages} onPageChange={handlePageChange} />
      </div>

      {/* Edit Modal */}
      {editingRecord && (
        <div className="modal fade" id="editAttendanceModal" tabIndex="-1" aria-labelledby="editModalLabel" aria-hidden="true">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="editModalLabel">Edit Attendance for {editingRecord.user_name}</h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={() => setEditingRecord(null)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Work Date</label>
                  <input type="date" name="work_date" className="form-control" value={editingRecord.work_date} onChange={handleEditFormChange} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Clock In (YYYY-MM-DD HH:MM:SS)</label>
                  <input type="text" name="clock_in" className="form-control" value={editingRecord.clock_in || ''} onChange={handleEditFormChange} placeholder="e.g., 2024-01-01 09:00:00" />
                </div>
                <div className="mb-3">
                  <label className="form-label">Clock Out (YYYY-MM-DD HH:MM:SS)</label>
                  <input type="text" name="clock_out" className="form-control" value={editingRecord.clock_out || ''} onChange={handleEditFormChange} placeholder="e.g., 2024-01-01 17:00:00" />
                </div>
                <div className="mb-3">
                  <label className="form-label">Notes</label>
                  <textarea name="notes" className="form-control" value={editingRecord.notes || ''} onChange={handleEditFormChange}></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal" onClick={() => setEditingRecord(null)}>Close</button>
                <button type="button" className="btn btn-primary" data-bs-dismiss="modal" onClick={handleSaveEdit}>Save changes</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminAttendance;
