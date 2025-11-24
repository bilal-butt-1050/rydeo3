'use client';
import styles from './page.module.css';

export default function Admin() {
  return (
    <div className={styles.adminContainer}>
      <main className={styles.mainContent}>
        <h1>Welcome to Admin Dashboard</h1>
        <p>Select an option from the sidebar to manage your data.</p>
      </main>
    </div>
  );
}
