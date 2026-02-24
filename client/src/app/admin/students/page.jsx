"use client";
import { useState, useEffect } from "react";
import { adminAPI } from "@/lib/api";
import { Eye, Edit, Trash2, MapPin } from "lucide-react";
import Link from "next/link";
import styles from "../drivers/page.module.css"; // Reuse driver styles for consistency

export default function ListStudents() {
  const [students, setStudents] = useState([]);

  useEffect(() => { fetchStudents(); }, []);

  const fetchStudents = async () => {
    try {
      const res = await adminAPI.getStudents();
      setStudents(res.data);
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (confirm("Permanently delete this student account?")) {
      try {
        await adminAPI.deleteStudent(id);
        fetchStudents();
      } catch (err) { alert("Error deleting student"); }
    }
  };

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Roll No / ID</th>
            <th>Assigned Route</th>
            <th>Preferred Stop</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map(s => (
            <tr key={s._id}>
              <td><strong>{s.name}</strong></td>
              <td>{s.loginID}</td>
              <td><span className={styles.routeBadge}>{s.route?.name || "N/A"}</span></td>
              <td>
                <div className={styles.stopInfo}>
                  <MapPin size={14} /> {s.preferredStop?.name || "Unset"}
                </div>
              </td>
              <td className={styles.actions}>
                <Link href={`/admin/students/${s._id}`} className={styles.viewBtn} title="View Profile"><Eye size={16}/></Link>
                <Link href={`/admin/students/${s._id}/edit`} className={styles.editBtn} title="Edit"><Edit size={16}/></Link>
                <button onClick={() => handleDelete(s._id)} className={styles.deleteBtn} title="Delete"><Trash2 size={16}/></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}