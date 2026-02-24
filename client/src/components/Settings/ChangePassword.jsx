"use client";
import { useState } from "react";
import { authAPI } from "@/lib/api";
import styles from "./ChangePassword.module.css";

export default function ChangePassword() {
  const [formData, setFormData] = useState({ 
    currentPassword: "", 
    newPassword: "", 
    confirmPassword: "" 
  });
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "", message: "" });

    if (formData.newPassword !== formData.confirmPassword) {
      return setStatus({ type: "error", message: "New passwords do not match" });
    }

    setLoading(true);
    try {
      await authAPI.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      setStatus({ type: "success", message: "Password updated successfully!" });
      setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setStatus({ 
        type: "error", 
        message: err.response?.data?.message || "Failed to update password" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2>Account Security</h2>
        <p>Manage your password and protect your account.</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <label>Current Password</label>
          <input 
            type="password" 
            placeholder="••••••••"
            value={formData.currentPassword}
            onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
            required 
          />
        </div>

        <div className={styles.inputGroup}>
          <label>New Password</label>
          <input 
            type="password" 
            placeholder="••••••••"
            value={formData.newPassword}
            onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
            required 
          />
        </div>

        <div className={styles.inputGroup}>
          <label>Confirm New Password</label>
          <input 
            type="password" 
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
            required 
          />
        </div>

        {status.message && (
          <div className={status.type === "success" ? styles.successMsg : styles.errorMsg}>
            {status.message}
          </div>
        )}

        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}