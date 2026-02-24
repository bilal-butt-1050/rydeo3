"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { adminAPI } from "@/lib/api";
import styles from "../../page.module.css";

export default function EditDriver({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "", loginID: "", phone: "", route: ""
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dRes, rRes] = await Promise.all([
          adminAPI.getDriver(id),
          adminAPI.getRoutes()
        ]);
        setFormData({
          name: dRes.data.name,
          loginID: dRes.data.loginID,
          phone: dRes.data.phone,
          route: dRes.data.route || ""
        });
        setRoutes(rRes.data);
      } catch (err) {
        alert("Could not fetch driver data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.updateDriver(id, formData);
      router.push("/admin/drivers");
    } catch (err) {
      alert(err.response?.data?.message || "Error updating driver");
    }
  };

  if (loading) return <div className={styles.loading}>Loading Driver Data...</div>;

  return (
    <div className={styles.formCard}>
      <h3>Edit Driver: {formData.name}</h3>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
          <div className={styles.inputGroup}>
            <label>Full Name</label>
            <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
          </div>
          <div className={styles.inputGroup}>
            <label>Login ID</label>
            <input type="text" value={formData.loginID} onChange={e => setFormData({...formData, loginID: e.target.value})} required />
          </div>
          <div className={styles.inputGroup}>
            <label>Phone Number</label>
            <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
          </div>
          <div className={styles.inputGroup}>
            <label>Assigned Route</label>
            <select value={formData.route} onChange={e => setFormData({...formData, route: e.target.value})} required>
              <option value="">Select Route</option>
              {routes.map(r => (
                <option key={r._id} value={r._id}>{r.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className={styles.buttonGroup}>
          <button type="button" onClick={() => router.back()} className={styles.cancelBtn}>Cancel</button>
          <button type="submit" className={styles.submitBtn}>Update Driver</button>
        </div>
      </form>
    </div>
  );
}