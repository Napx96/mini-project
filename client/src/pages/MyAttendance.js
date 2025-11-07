import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Pagination from '../components/Pagination';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

export default function MyAttendance() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageMeta, setPageMeta] = useState({ page: 1, per_page: 20, total: 0, total_pages: 0 });
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [clockState, setClockState] = useState({ clocked_in: false, can_clock_in: false, can_clock_out: false });
  const [clockLoading, setClockLoading] = useState(false);
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('desc');

  const load = async (page = 1, per_page = 20, start_date = '', end_date = '') => {
    try {
      let url = `/attendance.php?page=${page}&per_page=${per_page}`;
      if (start_date) url += `&start_date=${start_date}`;
      if (end_date) url += `&end_date=${end_date}`;
      if (sortBy) url += `&sort_by=${sortBy}`;
      if (sortOrder) url += `&sort_order=${sortOrder}`;
      const res = await api.get(url);
      if (res.data && Array.isArray(res.data.data)) {
        setRecords(res.data.data);
        setPageMeta(res.data.meta || { page, per_page, total: 0, total_pages: 0 });
      } else {
        setRecords([]);
      }
    } catch (error) {
      console.error('Error loading attendance records:', error);
      setRecords([]);
    }
  };

  const loadClockState = async () => {
    try {
      const res = await api.get('/attendance.php?action=state');
      setClockState(res.data);
    } catch (error) {
      console.error('Error loading clock state:', error);
    }
  };

  useEffect(() => {
    load();
    loadClockState();
  }, []);

  const handleSearch = () => {
    load(1, pageMeta.per_page, fromDate, toDate);
  };

  const handleSort = (column) => {
    const newSortOrder = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc';
    const sortKey = column === 'paycode' ? 'status' : column;
    setSortBy(sortKey);
    setSortOrder(newSortOrder);
    load(1, pageMeta.per_page, fromDate, toDate);
  };

  const getPaycodeSortValue = (clockIn, clockOut) => {
    if (clockIn && clockOut) return 'P'; // Present
    return 'WO'; // Weekly Off or Absent
  };

  const handleClockIn = async () => {
    setClockLoading(true);
    try {
      await api.get('/attendance.php?action=clock_in');
      toast.success('Clocked in successfully');
      loadClockState();
      load(); // Refresh records
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to clock in');
    } finally {
      setClockLoading(false);
    }
  };

  const handleClockOut = async () => {
    setClockLoading(true);
    try {
      await api.get('/attendance.php?action=clock_out');
      toast.success('Clocked out successfully');
      loadClockState();
      load(); // Refresh records
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to clock out');
    } finally {
      setClockLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    const d = new Date(date);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate().toString().padStart(2, '0')}/${months[d.getMonth()]}/${d.getFullYear()}`;
  };

  const formatTime12Hour = (datetime) => {
    if (!datetime) return '-';
    const d = new Date(datetime);
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${hours}:${minutes} ${ampm}`;
  };

  const getPlannedShift = () => {
    if (!user || !user.shift) return '07:00 AM to 16:00 PM'; // default
    const shifts = {
      '1': '07:00 AM to 16:00 PM',
      '2': '15:00 PM to 00:00 AM',
      '3': '22:00 PM to 07:00 AM'
    };
    return shifts[user.shift] || '07:00 AM to 16:00 PM';
  };

  const getActualShift = (clockIn, clockOut) => {
    if (!clockIn || !clockOut) return '-';
    const inTime = formatTime12Hour(clockIn);
    const outTime = formatTime12Hour(clockOut);
    return `${inTime} to ${outTime}`;
  };

  const getPunch = (clockIn, clockOut) => {
    if (!clockIn || !clockOut) return 'No Attendance/Punch';
    const inTime = formatTime12Hour(clockIn);
    const outTime = formatTime12Hour(clockOut);
    return `IN: ${inTime} - OUT: ${outTime}`;
  };

  const getPaycode = (clockIn, clockOut) => {
    if (clockIn && clockOut) return 'P'; // Present
    return 'WO'; // Weekly Off or Absent
  };

  const getPaycodeBadge = (paycode) => {
    const badges = {
      'P': 'badge-success', // Green for Present
      'HP': 'badge-warning', // Yellow/Orange for Half Present
      'WO': 'badge-danger', // Red for Weekly Off/Absent
      'COHP': 'badge-info' // Blue for Compensatory Off Half Present
    };
    return badges[paycode] || 'badge-secondary';
  };

  return (
    <div>
      <h1>My Attendance</h1>
      <div className="row mb-3">
        <div className="col-md-3">
          <label htmlFor="fromDate">From Date</label>
          <input id="fromDate" type="date" className="form-control" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </div>
        <div className="col-md-3">
          <label htmlFor="toDate">To Date</label>
          <input id="toDate" type="date" className="form-control" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>
        <div className="col-md-2 d-flex align-items-end">
          <button className="btn btn-primary" onClick={handleSearch}>Search</button>
        </div>
      </div>
      <div className="card mb-3">
        <div className="card-header">Clock In/Out</div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <button
                className="btn btn-success btn-lg w-100"
                onClick={handleClockIn}
                disabled={clockLoading || clockState.clocked_in || !clockState.can_clock_in}
              >
                {clockLoading ? 'Processing...' : 'Clock In'}
              </button>
            </div>
            <div className="col-md-6">
              <button
                className="btn btn-danger btn-lg w-100"
                onClick={handleClockOut}
                disabled={clockLoading || !clockState.clocked_in}
              >
                {clockLoading ? 'Processing...' : 'Clock Out'}
              </button>
            </div>
          </div>
          <div className="mt-3">
            <small className="text-muted">
              Status: {clockState.clocked_in ? 'Clocked In' : 'Not Clocked In'} |
              Shift: {clockState.can_clock_in ? 'Within Shift Hours' : 'Outside Shift Hours'}
            </small>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-header">My Attendance</div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-striped mb-0">
              <thead>
                <tr>
                  <th onClick={() => handleSort('date')} style={{ cursor: 'pointer' }}>
                    Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Planned Shift</th>
                  <th>Actual Shift</th>
                  <th onClick={() => handleSort('clock_in')} style={{ cursor: 'pointer' }}>
                    Punch {sortBy === 'clock_in' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('paycode')} style={{ cursor: 'pointer' }}>
                    Paycode {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id}>
                    <td>{formatDate(r.work_date)}</td>
                    <td>{getPlannedShift()}</td>
                    <td>{getActualShift(r.clock_in, r.clock_out)}</td>
                    <td>{getPunch(r.clock_in, r.clock_out)}</td>
                    <td><span className={`badge ${getPaycodeBadge(getPaycode(r.clock_in, r.clock_out))}`}>{getPaycode(r.clock_in, r.clock_out)}</span></td>
                    <td>-</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="d-flex justify-content-end p-3">
            <Pagination page={pageMeta.page} totalPages={pageMeta.total_pages} onPageChange={(p) => { load(p, pageMeta.per_page, fromDate, toDate); }} />
          </div>
        </div>
      </div>

    </div>
  );
}


