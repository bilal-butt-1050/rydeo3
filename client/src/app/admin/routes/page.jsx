"use client";
import { useState, useEffect } from "react";
import { adminAPI } from "@/lib/api";
import { Eye, Edit, Trash2, Bus, MapPin } from "lucide-react";
import Link from "next/link";
import styles from "../drivers/page.module.css";

export default function ManageRoutes() {
  const [routes, setRoutes] = useState([]);

  useEffect(() => { fetchRoutes(); }, []);

  const fetchRoutes = async () => {
    try {
      const res = await adminAPI.getRoutes();
      setRoutes(res.data);
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (confirm("Delete route? This will also remove all associated stops.")) {
      try {
        await adminAPI.deleteRoute(id);
        fetchRoutes();
      } catch (err) { 
        alert(err.response?.data?.message || "Error deleting route"); 
      }
    }
  };

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Route Name</th>
            <th>Code</th>
            <th>Stops</th>
            <th>Assigned Driver</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {routes.map(r => (
            <tr key={r._id}>
              <td><strong>{r.name}</strong></td>
              <td><code>{r.code || 'N/A'}</code></td>
              <td>
                <div className={styles.stopBadge}>
                   <MapPin size={14} /> {r.stops?.length || 0} Stops
                </div>
              </td>
              <td>
                <div className={styles.driverInfo}>
                  <Bus size={14} /> {r.assignedDriver?.name || "Unassigned"}
                </div>
              </td>
              <td className={styles.actions}>
                <Link href={`/admin/routes/${r._id}`} className={styles.viewBtn} title="View Map"><Eye size={16}/></Link>
                <Link href={`/admin/routes/${r._id}/edit`} className={styles.editBtn} title="Edit Route"><Edit size={16}/></Link>
                <button onClick={() => handleDelete(r._id)} className={styles.deleteBtn} title="Delete"><Trash2 size={16}/></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}