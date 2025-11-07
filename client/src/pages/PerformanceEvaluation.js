import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Star, Calendar, User, Edit, Trash2 } from 'lucide-react';

export default function PerformanceEvaluation() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    user_id: '',
    reviewer_id: user?.id || '',
    review_date: '',
    rating: 5,
    comments: ''
  });
  const [employees, setEmployees] = useState([]);

  const isAdminOrHR = ['admin', 'hr'].includes(user?.role);

  useEffect(() => {
    fetchReviews();
    if (isAdminOrHR) {
      fetchEmployees();
    }
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await api.get('/performance.php');
      setReviews(res.data || []);
    } catch (err) {
      setError('Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/users.php');
      setEmployees(res.data.filter(u => u.role === 'employee') || []);
    } catch (err) {
      console.error('Failed to fetch employees');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/performance.php', formData);
      setShowAddModal(false);
      fetchReviews();
      setFormData({ user_id: '', reviewer_id: user?.id || '', review_date: '', rating: 5, comments: '' });
    } catch (err) {
      setError('Failed to create review');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await api.delete(`/performance.php?id=${id}`);
      fetchReviews();
    } catch (err) {
      setError('Failed to delete review');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="container mt-4">
      <h2>Performance Evaluations</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      {isAdminOrHR && (
        <button className="btn btn-primary mb-3" onClick={() => setShowAddModal(true)}>
          Add Review
        </button>
      )}

      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Reviewer</th>
              <th>Date</th>
              <th>Rating</th>
              <th>Comments</th>
              {isAdminOrHR && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {reviews.map((review) => (
              <tr key={review.id}>
                <td>{review.employee_name}</td>
                <td>{review.reviewer_name}</td>
                <td>{review.review_date}</td>
                <td>
                  <div className="d-flex align-items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} fill={i < review.rating} className="text-warning me-1" />
                    ))}
                    <span className="ms-1">{review.rating}/5</span>
                  </div>
                </td>
                <td>{review.comments}</td>
                {isAdminOrHR && (
                  <td>
                    <button className="btn btn-sm btn-outline-primary me-1">Edit</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(review.id)}>
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
                <h5 className="modal-title">Add Performance Review</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Employee</label>
                    <select
                      className="form-select"
                      value={formData.user_id}
                      onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                      required
                    >
                      <option value="">Select Employee</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.user_id}>{emp.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Review Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.review_date}
                      onChange={(e) => setFormData({ ...formData, review_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Rating</label>
                    <select
                      className="form-select"
                      value={formData.rating}
                      onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                      required
                    >
                      {[1, 2, 3, 4, 5].map((num) => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Comments</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={formData.comments}
                      onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">Add Review</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
