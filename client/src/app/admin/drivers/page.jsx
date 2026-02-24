"use client";
import { useState, useEffect } from "react";
import { adminAPI } from "@/lib/api";
import { Eye, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import styles from "./page.module.css";

export default function ListDrivers() {
  const [drivers, setDrivers] = useState([]);

  useEffect(() => { fetchDrivers(); }, []);

  const fetchDrivers = async () => {
    try {
      const res = await adminAPI.getDrivers();
      setDrivers(res.data);
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this driver?")) {
      try {
        await adminAPI.deleteDriver(id);
        fetchDrivers();
      } catch (err) { alert("Error deleting driver"); }
    }
  };

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Login ID</th>
            <th>Route</th>
            <th>Phone</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {drivers.map(d => (
            <tr key={d._id}>
              <td>{d.name}</td>
              <td>{d.loginID}</td>
              <td><span className={styles.routeBadge}>{d.route?.name || "Unassigned"}</span></td>
              <td>{d.phone}</td>
              <td className={styles.actions}>
                <Link href={`/admin/drivers/${d._id}`} className={styles.viewBtn} title="View"><Eye size={16}/></Link>
                <Link href={`/admin/drivers/${d._id}/edit`} className={styles.editBtn} title="Edit"><Edit size={16}/></Link>
                <button onClick={() => handleDelete(d._id)} className={styles.deleteBtn} title="Delete"><Trash2 size={16}/></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}