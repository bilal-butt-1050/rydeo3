'use client';
import Link from 'next/link';
import styles from './Sidebar.module.css';

const Sidebar = () => {
  return (
    <aside className={styles.sidebar}>
      <h2 className={styles.title}>Admin Panel</h2>
      <ul className={styles.menu}>
        <li>
          <Link href="/admin/student">Students</Link>
        </li>
        <li>
          <Link href="/admin/driver">Drivers</Link>
        </li>
        <li>
          <Link href="/admin/route">Routes</Link>
        </li>
      </ul>
    </aside>
  );
};

export default Sidebar;
