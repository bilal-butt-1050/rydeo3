"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminAPI } from "@/lib/api";
import styles from "../../drivers/page.module.css";

export default function CreateStudent() {
  const router = useRouter();
  const [routes, setRoutes] = useState([]);
  const [availableStops, setAvailableStops] = useState([]);
  const [formData, setFormData] = useState({ name: "", loginID: "", password: "", route: "", preferredStop: "" });

  useEffect(() => {
    adminAPI.getRoutes().then(res => setRoutes(res.data));
  }, []);

  const handleRouteChange = (e) => {
    const routeId = e.target.value;
    const selectedRoute = routes.find(r => r._id === routeId);
    setFormData({ ...formData, route: routeId, preferredStop: "" });
    setAvailableStops(selectedRoute?.stops || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createStudent(formData);
      router.push("/admin/students");
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className={styles.formCard}>
      <h3>Register New Student</h3>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
          <input type="text" placeholder="Student Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
          <input type="text" placeholder="Roll No / Login ID" value={formData.loginID} onChange={e => setFormData({...formData, loginID: e.target.value})} required />
          <input type="password" placeholder="Account Password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
          
          <select value={formData.route} onChange={handleRouteChange} required>
            <option value="">Select Route</option>
            {routes.map(r => (
              <option key={r._id} value={r._id}>{r.name} ({r.code})</option>
            ))}
          </select>

          <select value={formData.preferredStop} onChange={e => setFormData({...formData, preferredStop: e.target.value})} disabled={!formData.route} required>
            <option value="">Select Preferred Stop</option>
            {availableStops.map(s => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
        </div>
        <button type="submit" className={styles.submitBtn}>Register Student</button>
      </form>
    </div>
  );
}