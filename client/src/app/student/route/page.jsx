"use client";
import { useEffect, useState } from "react";
import { studentAPI } from "@/lib/api"; // Ensure you add this to your API helper
import styles from "./page.module.css";

export default function StudentRoutePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await studentAPI.getMyRoute(); 
        setData(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInfo();
  }, []);

  if (loading) return <div className={styles.loader}>Loading your route...</div>;
  if (!data?.route) return <div className={styles.error}>No route assigned.</div>;

  const { route, driver, preferredStopId } = data;

  return (
    <div className={styles.container}>
      {/* 1. Driver/Bus Info Card */}
      <section className={styles.infoCard}>
        <div className={styles.cardHeader}>
          <h2>Route {route.code}</h2>
          <span className={styles.routeName}>{route.name}</span>
        </div>
        <div className={styles.driverSection}>
          <div className={styles.driverAvatar}>
            {driver?.name?.charAt(0) || "D"}
          </div>
          <div className={styles.driverDetails}>
            <h4>{driver ? driver.name : "No Driver Assigned"}</h4>
            <p>{driver ? driver.phone : "Contact admin for details"}</p>
          </div>
          {driver && (
            <div className={`${styles.status} ${driver.isSharingLocation ? styles.online : styles.offline}`}>
              {driver.isSharingLocation ? "● On Duty" : "○ Offline"}
            </div>
          )}
        </div>
      </section>

      {/* 2. Stops Table */}
      <section className={styles.tableSection}>
        <h3>Route Schedule & Stops</h3>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>Stop Name</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {route.stops.map((stop, index) => {
              const isMyStop = stop._id === preferredStopId;
              return (
                <tr key={stop._id} className={isMyStop ? styles.myStopRow : ""}>
                  <td>{index + 1}</td>
                  <td className={styles.stopName}>
                    {stop.name} 
                    {isMyStop && <span className={styles.myStopBadge}>My Pickup</span>}
                  </td>
                  <td>
                    {index === 0 ? "Start" : index === route.stops.length - 1 ? "End" : "Stop"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}