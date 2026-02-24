"use client";
import styles from "./page.module.css";

export default function AdminDashboard() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Dashboard Overview</h1>
        <p>Welcome back! Here is what's happening with Rydeo today.</p>
      </header>

      <div className={styles.statsGrid}>
        <div className={styles.card}>
          <h3>Total Routes</h3>
          <p className={styles.stat}>12</p>
        </div>
        <div className={styles.card}>
          <h3>Active Drivers</h3>
          <p className={styles.stat}>8</p>
        </div>
        <div className={styles.card}>
          <h3>Students</h3>
          <p className={styles.stat}>145</p>
        </div>
      </div>
    </div>
  );
}