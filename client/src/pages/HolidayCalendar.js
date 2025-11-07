import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function HolidayCalendar() {
  const { user } = useAuth();
  const [holidays, setHolidays] = useState([]);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [desc, setDesc] = useState('');

  const formatDate = (date) => {
    if (!date) return '-';
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  const isAdminOrHR = ['admin', 'hr'].includes(user?.role);

  const load = async () => {
    try {
      const res = await api.get('/holidays.php');
      if (Array.isArray(res.data)) {
        setHolidays(res.data);
      } else {
        setHolidays([]);
      }
    } catch (err) {
      setHolidays([]);
    }
  };

  useEffect(() => { load(); }, []);

  const addHoliday = async (e) => {
    e.preventDefault();
    try {
      await api.post('/holidays.php', { name: name, date: date, description: desc });
      setName(''); setDate(''); setDesc('');
      await load();
    } catch (err) {
      // Handle error, perhaps show alert or set error state
      alert('Failed to add holiday');
    }
  };

  const removeHoliday = async (id) => {
    try {
      await api.delete(`/holidays.php?id=${id}`);
      await load();
    } catch (err) {
      alert('Failed to delete holiday');
    }
  };

  return (
    <div className="row g-3">
      {isAdminOrHR && (
        <div className="col-md-5">
          <div className="card">
            <div className="card-header">Add Holiday (Admin)</div>
            <div className="card-body">
              <form onSubmit={addHoliday}>
                <div className="mb-2">
                  <label className="form-label">Name</label>
                  <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="mb-2">
                  <label className="form-label">Date</label>
                  <input type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>
                <div className="mb-2">
                  <label className="form-label">Description</label>
                  <input className="form-control" value={desc} onChange={(e) => setDesc(e.target.value)} />
                </div>
                <button className="btn btn-primary" type="submit">Add</button>
              </form>
            </div>
          </div>
        </div>
      )}
      <div className={isAdminOrHR ? "col-md-7" : "col-md-12"}>
        <div className="card">
          <div className="card-header">Holiday Calendar</div>
          <div className="card-body p-0">
            <table className="table table-striped mb-0">
              <thead>
                <tr>
                  <th>Sr. No.</th>
                  <th>Name</th>
                  <th>Date</th>
                  <th>Description</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {holidays.map((h, index) => (
                  <tr key={h.id}>
                    <td>{index + 1}</td>
                    <td>{h.name}</td>
                    <td>{formatDate(h.date)}</td>
                    <td>{h.description || '-'}</td>
                    <td>
                      {isAdminOrHR && (
                        <button className="btn btn-sm btn-outline-danger" onClick={() => removeHoliday(h.id)}>Delete</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
