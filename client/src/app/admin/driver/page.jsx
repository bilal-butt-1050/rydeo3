'use client';
import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import styles from './page.module.css';

export default function DriversPage() {
  const [formData, setFormData] = useState({
    name: '',
    loginID: '',
    password: '',
    phone: '',
    route: '',
  });
  const [drivers, setDrivers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchDrivers();
    fetchRoutes();
  }, []);

  const fetchDrivers = async () => {
    try {
      const data = await adminAPI.listDrivers();
      setDrivers(data);
    } catch (err) {
      console.error(err.message);
    }
  };

  const fetchRoutes = async () => {
    try {
      const data = await adminAPI.listRoutes();
      setRoutes(data);
    } catch (err) {
      console.error(err.message);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (editingId && !payload.password) delete payload.password;

      if (editingId) {
        await adminAPI.updateDriver(editingId, payload);
        setSuccessMsg('Driver updated successfully!');
      } else {
        await adminAPI.createDriver(payload);
        setSuccessMsg('Driver created successfully!');
      }

      setFormData({ name: '', loginID: '', password: '', phone: '', route: '' });
      setEditingId(null);
      fetchDrivers();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEdit = (driver) => {
    setFormData({
      name: driver.name,
      loginID: driver.loginID,
      password: '',
      phone: driver.phone || '',
      route: driver.route?._id || '',
    });
    setEditingId(driver._id);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this driver?')) return;
    try {
      await adminAPI.deleteDriver(id);
      fetchDrivers();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className={styles.container}>
      <h1>{editingId ? 'Edit Driver' : 'Create Driver'}</h1>
      {successMsg && <p className={styles.success}>{successMsg}</p>}

      <form className={styles.form} onSubmit={handleSubmit}>
        <label>Name</label>
        <input name="name" value={formData.name} onChange={handleChange} required />

        <label>Login ID</label>
        <input name="loginID" value={formData.loginID} onChange={handleChange} required />

        <label>Password</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder={editingId ? 'Leave blank to keep current password' : ''}
          required={!editingId}
        />

        <label>Phone</label>
        <input name="phone" value={formData.phone} onChange={handleChange} />

        <label>Route</label>
        <select name="route" value={formData.route} onChange={handleChange}>
          <option value="">Select route</option>
          {routes.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
        </select>

        <button type="submit">{editingId ? 'Update Driver' : 'Create Driver'}</button>
      </form>

      <h2>Existing Drivers</h2>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Login ID</th>
            <th>Phone</th>
            <th>Route</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {drivers.map(d => (
            <tr key={d._id}>
              <td>{d.name}</td>
              <td>{d.loginID}</td>
              <td>{d.phone || '-'}</td>
              <td>{d.route?.name || '-'}</td>
              <td>
                <button onClick={() => handleEdit(d)}>Edit</button>
                <button onClick={() => handleDelete(d._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
