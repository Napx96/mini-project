import React, { useState, useEffect } from 'react';
import api from '../services/api';

const EmployeeForm = ({ userId, onClose, onSuccess, isEdit = false, initialData = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee',
    shift: '1',
    employee_code: '',
    department: '',
    designation: '',
    join_date: '',
    phone: '',
    address: '',
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEdit && initialData) {
      setFormData({
        ...initialData,
        password: '', // Don't prefill password
        is_active: initialData.is_active !== undefined ? initialData.is_active : true
      });
    }
  }, [isEdit, initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!isEdit && !formData.password) newErrors.password = 'Password is required';
    if (formData.role === 'employee') {
      if (!formData.employee_code.trim()) newErrors.employee_code = 'Employee code is required';
      if (!formData.department.trim()) newErrors.department = 'Department is required';
      if (!formData.designation.trim()) newErrors.designation = 'Designation is required';
      if (!formData.join_date) newErrors.join_date = 'Join date is required';
      if (formData.phone && !/^\d{10}$/.test(formData.phone)) newErrors.phone = 'Phone must be 10 digits';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (!validate()) {
      setLoading(false);
      return;
    }
    try {
      let result;
      if (isEdit && userId) {
        // Update user and profile
        const userUpdate = { name: formData.name, email: formData.email, role: formData.role, shift: formData.shift, is_active: formData.is_active };
        if (formData.password) userUpdate.password = formData.password;
        await api.put(`/users.php?id=${userId}`, userUpdate);

        // Update profile if employee
        if (formData.role === 'employee') {
          await api.put(`/employees.php?id=${initialData.profile?.id || userId}`, {
            employee_code: formData.employee_code,
            department: formData.department,
            designation: formData.designation,
            join_date: formData.join_date,
            phone: formData.phone,
            address: formData.address
          });
        }
        result = { message: 'User updated successfully' };
      } else {
        // Create new
        const newUser = await api.post('/users.php', formData);
        result = newUser.data;
      }
      onSuccess(result);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{isEdit ? 'Edit User' : 'Add New Employee'}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && <div className="alert alert-danger">{error}</div>}
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Name</label>
                  <input type="text" className="form-control" name="name" value={formData.name} onChange={handleChange} required />
                  {errors.name && <div className="text-danger">{errors.name}</div>}
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-control" name="email" value={formData.email} onChange={handleChange} required />
                  {errors.email && <div className="text-danger">{errors.email}</div>}
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Password {isEdit && '(Leave blank to keep current)'}</label>
                  <input type="password" className="form-control" name="password" value={formData.password} onChange={handleChange} required={!isEdit} />
                  {errors.password && <div className="text-danger">{errors.password}</div>}
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Role</label>
                  <select className="form-select" name="role" value={formData.role} onChange={handleChange}>
                    <option value="employee">Employee</option>
                    <option value="hr">HR</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Shift</label>
                  <select className="form-select" name="shift" value={formData.shift} onChange={handleChange}>
                    <option value="1">1st Shift (07:00 - 16:00)</option>
                    <option value="2">2nd Shift (15:00 - 00:00)</option>
                    <option value="3">3rd Shift (22:00 - 07:00)</option>
                  </select>
                </div>
                {formData.role === 'employee' && (
                  <>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Employee Code</label>
                      <input type="text" className="form-control" name="employee_code" value={formData.employee_code} onChange={handleChange} />
                      {errors.employee_code && <div className="text-danger">{errors.employee_code}</div>}
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Department</label>
                      <input type="text" className="form-control" name="department" value={formData.department} onChange={handleChange} />
                      {errors.department && <div className="text-danger">{errors.department}</div>}
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Designation</label>
                      <input type="text" className="form-control" name="designation" value={formData.designation} onChange={handleChange} />
                      {errors.designation && <div className="text-danger">{errors.designation}</div>}
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Join Date</label>
                      <input type="date" className="form-control" name="join_date" value={formData.join_date} onChange={handleChange} />
                      {errors.join_date && <div className="text-danger">{errors.join_date}</div>}
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Phone</label>
                      <input type="tel" className="form-control" name="phone" value={formData.phone} onChange={handleChange} />
                      {errors.phone && <div className="text-danger">{errors.phone}</div>}
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Address</label>
                      <input type="text" className="form-control" name="address" value={formData.address} onChange={handleChange} />
                    </div>
                  </>
                )}
                {isEdit && (
                  <div className="col-12 mb-3">
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} />
                      <label className="form-check-label">Active</label>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : (isEdit ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmployeeForm;
