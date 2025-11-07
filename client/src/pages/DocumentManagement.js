import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { File, User, Upload, Trash2 } from 'lucide-react';

export default function DocumentManagement() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '',
    document_type: '',
    file_path: ''
  });
  const [employees, setEmployees] = useState([]);

  const isAdminOrHR = ['admin', 'hr'].includes(user?.role);

  useEffect(() => {
    fetchDocuments();
    if (isAdminOrHR) {
      fetchEmployees();
    }
  }, []);

  const fetchDocuments = async () => {
    try {
      const url = user?.employee_id ? `/documents.php?employee_id=${user.employee_id}` : '/documents.php';
      const res = await api.get(url);
      setDocuments(Array.isArray(res.data) ? res.data : []);
      if (!Array.isArray(res.data)) {
        setError('Failed to fetch documents: ' + (res.data.error || 'Unknown error'));
      }
    } catch (err) {
      setError('Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees.php');
      setEmployees(res.data);
    } catch (err) {
      console.error('Failed to fetch employees');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/documents.php', formData);
      setShowAddModal(false);
      fetchDocuments();
      setFormData({ employee_id: '', document_type: '', file_path: '' });
    } catch (err) {
      setError('Failed to upload document');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await api.delete(`/documents.php?id=${id}`);
      fetchDocuments();
    } catch (err) {
      setError('Failed to delete document');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="container mt-4">
      <h2>Document Management</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      {isAdminOrHR && (
        <button className="btn btn-primary mb-3" onClick={() => setShowAddModal(true)}>
          <Upload size={16} className="me-1" /> Upload Document
        </button>
      )}

      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Type</th>
              <th>File Path</th>
              <th>Uploaded At</th>
              {isAdminOrHR && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id}>
                <td>{doc.employee_name}</td>
                <td><span className="badge bg-secondary">{doc.document_type}</span></td>
                <td>{doc.file_path}</td>
                <td>{doc.uploaded_at}</td>
                {isAdminOrHR && (
                  <td>
                    <a href={doc.file_path} className="btn btn-sm btn-outline-primary me-1" target="_blank" rel="noopener noreferrer">
                      View
                    </a>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(doc.id)}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Upload Document</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Employee</label>
                    <select
                      className="form-select"
                      value={formData.employee_id}
                      onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                      required
                    >
                      <option value="">Select Employee</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Document Type</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g., Resume, ID Proof"
                      value={formData.document_type}
                      onChange={(e) => setFormData({ ...formData, document_type: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">File Path</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Path to uploaded file"
                      value={formData.file_path}
                      onChange={(e) => setFormData({ ...formData, file_path: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">Upload</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
