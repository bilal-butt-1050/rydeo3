"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { adminAPI } from "@/lib/api";
import { ArrowLeft, User, Hash, MapPin, Bus, Calendar, CheckCircle } from "lucide-react";
import styles from "../../drivers/page.module.css"; // Reusing the profile styles

export default function ViewStudent({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const res = await adminAPI.getStudent(id);
        setStudent(res.data);
      } catch (err) {
        console.error("Failed to fetch student");
        router.push("/admin/students");
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [id, router]);

  if (loading) return <div className={styles.loading}>Loading Student Profile...</div>;
  if (!student) return null;

  return (
    <div className={styles.profileContainer}>
      <button onClick={() => router.back()} className={styles.backBtn}>
        <ArrowLeft size={18} /> Back to List
      </button>

      <div className={styles.profileHeader}>
        <div className={styles.avatarLarge} style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
          {student.name.charAt(0)}
        </div>
        <div className={styles.headerInfo}>
          <div className={styles.titleRow}>
            <h2>{student.name}</h2>
            {student.isActive && <span className={styles.statusBadge}><CheckCircle size={14}/> Active</span>}
          </div>
          <span className={styles.roleTag}>STUDENT</span>
        </div>
      </div>

      <div className={styles.detailsGrid}>
        <div className={styles.detailItem}>
          <Hash size={20} className={styles.detailIcon} />
          <div>
            <label>Roll No / Login ID</label>
            <p>{student.loginID}</p>
          </div>
        </div>

        <div className={styles.detailItem}>
          <Bus size={20} className={styles.detailIcon} />
          <div>
            <label>Assigned Route</label>
            <p>{student.route?.name || "No Route Assigned"}</p>
          </div>
        </div>

        <div className={styles.detailItem}>
          <MapPin size={20} className={styles.detailIcon} />
          <div>
            <label>Preferred Stop</label>
            <p>{student.preferredStop?.name || "No Stop Selected"}</p>
          </div>
        </div>

        <div className={styles.detailItem}>
          <Calendar size={20} className={styles.detailIcon} />
          <div>
            <label>Registration Date</label>
            <p>{new Date(student.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}