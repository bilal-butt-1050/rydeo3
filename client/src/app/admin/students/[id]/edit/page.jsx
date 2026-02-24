"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { adminAPI } from "@/lib/api";
import styles from "../../../drivers/page.module.css";

export default function EditStudent({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [routes, setRoutes] = useState([]);
  const [availableStops, setAvailableStops] = useState([]);
  const [formData, setFormData] = useState({ name: "", loginID: "", route: "", preferredStop: "" });

  useEffect(() => {
    const init = async () => {
      const [sRes, rRes] = await Promise.all([adminAPI.getStudent(id), adminAPI.getRoutes()]);
      setRoutes(rRes.data);
      setFormData({
        name: sRes.data.name,
        loginID: sRes.data.loginID,
        route: sRes.data.route?._id || sRes.data.route || "",
        preferredStop: sRes.data.preferredStop?._id || sRes.data.preferredStop || ""
      });
      
      // Pre-populate stops for the existing route
      const currentRoute = rRes.data.find(r => r._id === (sRes.data.route?._id || sRes.data.route));
      setAvailableStops(currentRoute?.stops || []);
    };
    init();
  }, [id]);

  const handleRouteChange = (e) => {
    const routeId = e.target.value;
    const selectedRoute = routes.find(r => r._id === routeId);
    setFormData({ ...formData, route: routeId, preferredStop: "" });
    setAvailableStops(selectedRoute?.stops || []);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.updateStudent(id, formData);
      router.push("/admin/students");
    } catch (err) { alert("Update failed"); }
  };

  return (
    <div className={styles.formCard}>
      <h3>Edit Student Profile</h3>
      <form onSubmit={handleUpdate} className={styles.form}>
        <div className={styles.formGrid}>
          <div className={styles.inputGroup}>
            <label>Full Name</label>
            <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className={styles.inputGroup}>
            <label>Roll No</label>
            <input type="text" value={formData.loginID} onChange={e => setFormData({...formData, loginID: e.target.value})} />
          </div>
          <div className={styles.inputGroup}>
            <label>Route</label>
            <select value={formData.route} onChange={handleRouteChange}>
              {routes.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
            </select>
          </div>
          <div className={styles.inputGroup}>
            <label>Preferred Stop</label>
            <select value={formData.preferredStop} onChange={e => setFormData({...formData, preferredStop: e.target.value})}>
              <option value="">Select Stop</option>
              {availableStops.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>
        </div>
        <button type="submit" className={styles.submitBtn}>Update Records</button>
      </form>
    </div>
  );
}