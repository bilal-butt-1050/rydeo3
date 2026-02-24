"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminAPI } from "@/lib/api";
import styles from "../page.module.css";

export default function CreateDriver() {
  const router = useRouter();
  const [routes, setRoutes] = useState([]);
  const [formData, setFormData] = useState({ name: "", loginID: "", password: "", phone: "", route: "" });

  useEffect(() => {
    adminAPI.getRoutes().then(res => setRoutes(res.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createDriver(formData);
      router.push("/admin/drivers"); // Redirect back to list
    } catch (err) {
      alert(err.response?.data?.message || "Error creating driver");
    }
  };

  return (
    <div className={styles.formCard}>
      <h3>Create New Driver Account</h3>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
          <input type="text" placeholder="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
          <input type="text" placeholder="Login ID" value={formData.loginID} onChange={e => setFormData({...formData, loginID: e.target.value})} required />
          <input type="password" placeholder="Password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
          <input type="text" placeholder="Phone Number" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
          <select value={formData.route} onChange={e => setFormData({...formData, route: e.target.value})} required>
            <option value="">Select Route</option>
            {routes.map(r => (
              <option key={r._id} value={r._id}>{r.name}</option>
            ))}
          </select>
        </div>
        <button type="submit" className={styles.submitBtn}>Save Driver Account</button>
      </form>
    </div>
  );
}