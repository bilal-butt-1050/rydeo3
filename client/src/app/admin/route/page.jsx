'use client';
import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import styles from './page.module.css';

export default function RoutesPage() {
  const [formData, setFormData] = useState({ name: '', code: '', assignedDriver: '', stops: [] });
  const [stopForm, setStopForm] = useState({ name: '', lat: '', lng: '', order: '' });
  const [showStopForm, setShowStopForm] = useState(false);
  const [routes, setRoutes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => { fetchRoutes(); }, []);

  const fetchRoutes = async () => {
    try {
      const data = await adminAPI.listRoutes();
      setRoutes(data);
    } catch (err) { console.error(err.message); }
  };

  const handleMainChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleStopChange = e => setStopForm({ ...stopForm, [e.target.name]: e.target.value });

  const addStop = () => {
    if (!stopForm.name || stopForm.lat === '' || stopForm.lng === '' || stopForm.order === '') return;
    const stopData = { name: stopForm.name, coordinates: { lat: Number(stopForm.lat), lng: Number(stopForm.lng) }, order: Number(stopForm.order) };
    setFormData(prev => ({ ...prev, stops: [...prev.stops, stopData] }));
    setStopForm({ name: '', lat: '', lng: '', order: '' });
    setShowStopForm(false);
  };

  const handleEditStop = (index, key, value) => {
    const updatedStops = [...formData.stops];
    if (key === 'lat' || key === 'lng') updatedStops[index].coordinates[key] = Number(value);
    else updatedStops[index][key] = value;
    setFormData({ ...formData, stops: updatedStops });
  };

  const removeStop = index => setFormData({ ...formData, stops: formData.stops.filter((_, i) => i !== index) });

  const handleSubmit = async e => {
    e.preventDefault();
    if (formData.stops.length < 2) return alert('At least 2 stops are required.');
    try {
      if (editingId) {
        await adminAPI.updateRoute(editingId, formData);
        setSuccessMsg('Route updated successfully!');
      } else {
        await adminAPI.createRoute(formData);
        setSuccessMsg('Route created successfully!');
      }
      setFormData({ name: '', code: '', assignedDriver: '', stops: [] });
      setEditingId(null);
      fetchRoutes();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) { alert(err.message); }
  };

  const handleEdit = route => {
    setFormData({
      name: route.name,
      code: route.code,
      assignedDriver: route.assignedDriver?._id || '',
      stops: route.stops.map(s => ({ _id: s._id, name: s.name, coordinates: { lat: s.coordinates.lat, lng: s.coordinates.lng }, order: s.order })),
    });
    setEditingId(route._id);
  };

  const handleDelete = async id => {
    if (!confirm('Are you sure you want to delete this route?')) return;
    try { await adminAPI.deleteRoute(id); fetchRoutes(); } catch (err) { alert(err.message); }
  };

  return (
    <div className={styles.container}>
      <h1>{editingId ? 'Edit Route' : 'Create Route'}</h1>
      {successMsg && <p className={styles.success}>{successMsg}</p>}

      <form className={styles.form} onSubmit={handleSubmit}>
        <label>Route Name</label>
        <input name="name" value={formData.name} onChange={handleMainChange} required />
        <label>Route Code</label>
        <input name="code" value={formData.code} onChange={handleMainChange} required />
        <label>Assigned Driver</label>
        <input name="assignedDriver" value={formData.assignedDriver} onChange={handleMainChange} placeholder="Driver ID" />

        <div className={styles.stopsHeader}>
          <h3>Stops</h3>
          <button type="button" onClick={() => setShowStopForm(!showStopForm)}>+ Add Stop</button>
        </div>

        {showStopForm && (
          <div className={styles.stopForm}>
            <input name="name" placeholder="Stop name" value={stopForm.name} onChange={handleStopChange} required />
            <input name="lat" type="number" placeholder="Latitude" value={stopForm.lat} onChange={handleStopChange} required />
            <input name="lng" type="number" placeholder="Longitude" value={stopForm.lng} onChange={handleStopChange} required />
            <input name="order" type="number" placeholder="Order" value={stopForm.order} onChange={handleStopChange} required />
            <button type="button" onClick={addStop}>Add Stop</button>
          </div>
        )}

        {formData.stops.length > 0 && (
          <ul>
            {formData.stops.map((stop, index) => (
              <li key={index}>
                <input type="text" value={stop.name} onChange={e => handleEditStop(index, 'name', e.target.value)} />
                <input type="number" value={stop.coordinates.lat} onChange={e => handleEditStop(index, 'lat', e.target.value)} />
                <input type="number" value={stop.coordinates.lng} onChange={e => handleEditStop(index, 'lng', e.target.value)} />
                <input type="number" value={stop.order} onChange={e => handleEditStop(index, 'order', e.target.value)} />
                <button type="button" onClick={() => removeStop(index)}>Remove</button>
              </li>
            ))}
          </ul>
        )}

        <button type="submit">{editingId ? 'Update Route' : 'Create Route'}</button>
      </form>

      <h2>Existing Routes</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Code</th>
            <th>Assigned Driver</th>
            <th>Stops</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {routes.map(r => (
            <tr key={r._id}>
              <td>{r.name}</td>
              <td>{r.code}</td>
              <td>{r.assignedDriver?.name || '-'}</td>
              <td>{r.stops.map(s => s.name).join(', ')}</td>
              <td>
                <button onClick={() => handleEdit(r)}>Edit</button>
                <button onClick={() => handleDelete(r._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
