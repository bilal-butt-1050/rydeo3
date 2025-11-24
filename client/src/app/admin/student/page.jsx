'use client';
import { useEffect, useState } from "react";
import { adminAPI } from "@/lib/api";

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [stops, setStops] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    loginID: "",
    password: "",
    route: "",
    preferredStop: "",
  });

  useEffect(() => {
    loadRoutes();
    loadStudents();
  }, []);

  const loadRoutes = async () => {
    try {
      const data = await adminAPI.listRoutes();
      setRoutes(data);
    } catch (err) { console.error(err.message); }
  };

  const loadStudents = async () => {
    try {
      const data = await adminAPI.listStudents();
      setStudents(data);
    } catch (err) { console.error(err.message); }
  };

  const handleChange = async (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === "route") {
      if (value) {
        const stopsData = await adminAPI.getStops(value);
        setStops(stopsData);
      } else {
        setStops([]);
      }
      setFormData(prev => ({ ...prev, preferredStop: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createStudent(formData);
      loadStudents();
      setFormData({ name: "", loginID: "", password: "", route: "", preferredStop: "" });
      setStops([]);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="container">
      <h1>Students</h1>
      <form onSubmit={handleSubmit}>
        <label>Name</label>
        <input name="name" value={formData.name} onChange={handleChange} required />

        <label>Login ID</label>
        <input name="loginID" value={formData.loginID} onChange={handleChange} required />

        <label>Password</label>
        <input name="password" type="password" value={formData.password} onChange={handleChange} required />

        <label>Route</label>
        <select name="route" value={formData.route} onChange={handleChange} required>
          <option value="">Select route</option>
          {routes.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
        </select>

        <label>Preferred Stop</label>
        <select name="preferredStop" value={formData.preferredStop} onChange={handleChange} disabled={!stops.length}>
          <option value="">Select stop</option>
          {stops.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>

        <button type="submit">Add Student</button>
      </form>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Login ID</th>
            <th>Route</th>
            <th>Preferred Stop</th>
          </tr>
        </thead>
        <tbody>
          {students.map(s => (
            <tr key={s._id}>
              <td>{s.name}</td>
              <td>{s.loginID}</td>
              <td>{s.route?.name || '-'}</td>
              <td>{s.preferredStop?.name || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
