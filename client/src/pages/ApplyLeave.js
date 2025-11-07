import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';

export default function ApplyLeave() {
  const [types, setTypes] = useState([]);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [typeId, setTypeId] = useState('');
  const [reason, setReason] = useState('');
  const [activeTab, setActiveTab] = useState('apply');
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);

  const formatDate = (date) => {
    if (!date) return '-';
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  useEffect(() => {
    // leave types from DB
    async function loadTypes() {
      try {
        const res = await api.get('/leaves.php?action=getTypes');
        if (Array.isArray(res.data)) {
          setTypes(res.data);
        } else {
          setTypes([]);
        }
      } catch (err) {
        setTypes([]);
        toast.error('Failed to load leave types');
      }
    }
    loadTypes();
  }, []);

  const loadLeaves = async () => {
    try {
      const res = await api.get('/leaves.php');
      if (Array.isArray(res.data)) {
        setLeaves(res.data);
      } else {
        setLeaves([]);
      }
    } catch (err) {
      setLeaves([]);
      toast.error('Failed to load leave requests');
    }
  };

  useEffect(() => {
    if (activeTab === 'requests') {
      loadLeaves();
    }
  }, [activeTab]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/leaves.php', { leave_type_id: Number(typeId), start_date: start, end_date: end, reason });
      toast.success('Leave applied successfully');
      setStart(''); setEnd(''); setTypeId(''); setReason('');
    } catch (err) {
      toast.error('Failed to apply leave');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-8">
        <ul className="nav nav-tabs">
          <li className="nav-item">
            <a className={`nav-link ${activeTab === 'apply' ? 'active' : ''}`} onClick={() => setActiveTab('apply')}>Apply Leave</a>
          </li>
          <li className="nav-item">
            <a className={`nav-link ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}>Leave Requests</a>
          </li>
        </ul>
        <div className="tab-content mt-3">
          {activeTab === 'apply' && (
            <div>
              <form onSubmit={onSubmit}>
                <div className="mb-3">
                  <label className="form-label">Leave Type</label>
                  <select className="form-select" value={typeId} onChange={(e) => setTypeId(e.target.value)} required>
                    <option value="">Select</option>
                    {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="row g-2">
                  <div className="col">
                    <label className="form-label">Start Date</label>
                    <input type="date" className="form-control" value={start} onChange={(e) => setStart(e.target.value)} required />
                  </div>
                  <div className="col">
                    <label className="form-label">End Date</label>
                    <input type="date" className="form-control" value={end} onChange={(e) => setEnd(e.target.value)} required />
                  </div>
                </div>
                <div className="mb-3 mt-2">
                  <label className="form-label">Reason</label>
                  <textarea className="form-control" value={reason} onChange={(e) => setReason(e.target.value)} />
                </div>
                <button className="btn btn-primary" type="submit" disabled={loading}>
                  {loading && <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>}
                  {loading ? 'Applying...' : 'Apply'}
                </button>
              </form>
            </div>
          )}
          {activeTab === 'requests' && (
            <div>
              <div className="card">
                <div className="card-header">My Leave Requests</div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-striped mb-0">
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>Start</th>
                          <th>End</th>
                          <th>Status</th>
                          <th>Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaves.map(l => (
                          <tr key={l.id}>
                            <td>{l.leave_type}</td>
                            <td>{formatDate(l.start_date)}</td>
                            <td>{formatDate(l.end_date)}</td>
                            <td><span className={`badge bg-${l.status === 'approved' ? 'success' : l.status === 'rejected' ? 'danger' : 'secondary'}`}>{l.status}</span></td>
                            <td>{l.reason || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


