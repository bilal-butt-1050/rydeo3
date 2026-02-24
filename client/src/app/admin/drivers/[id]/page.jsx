"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { adminAPI } from "@/lib/api";
import { ArrowLeft, User, Phone, MapPin, Calendar } from "lucide-react";
import styles from "../page.module.css";

export default function ViewDriver({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [driver, setDriver] = useState(null);

  useEffect(() => {
    adminAPI.getDriver(id).then(res => setDriver(res.data)).catch(() => router.push("/admin/drivers"));
  }, [id, router]);

  if (!driver) return <div className={styles.loading}>Fetching Profile...</div>;

  return (
    <div className={styles.profileContainer}>
      <button onClick={() => router.back()} className={styles.backBtn}>
        <ArrowLeft size={18} /> Back to List
      </button>

      <div className={styles.profileHeader}>
        <div className={styles.avatarLarge}>{driver.name.charAt(0)}</div>
        <div className={styles.headerInfo}>
          <h2>{driver.name}</h2>
          <span className={styles.roleTag}>{driver.role.toUpperCase()}</span>
        </div>
      </div>

      <div className={styles.detailsGrid}>
        <div className={styles.detailItem}>
          <User size={20} className={styles.detailIcon} />
          <div>
            <label>Login ID</label>
            <p>{driver.loginID}</p>
          </div>
        </div>
        <div className={styles.detailItem}>
          <Phone size={20} className={styles.detailIcon} />
          <div>
            <label>Phone</label>
            <p>{driver.phone}</p>
          </div>
        </div>
        <div className={styles.detailItem}>
          <MapPin size={20} className={styles.detailIcon} />
          <div>
            <label>Assigned Route</label>
            <p>{driver.route?.name || "No Route Assigned"}</p>
          </div>
        </div>
        <div className={styles.detailItem}>
          <Calendar size={20} className={styles.detailIcon} />
          <div>
            <label>Last Login</label>
            <p>{driver.lastLogin ? new Date(driver.lastLogin).toLocaleString() : "Never"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}