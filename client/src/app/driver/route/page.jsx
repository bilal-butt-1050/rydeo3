"use client";
import { useEffect, useState } from "react";
import { driverAPI } from "@/lib/api";
import styles from "./page.module.css";

export default function AssignedRoutePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRouteData = async () => {
      try {
        const res = await driverAPI.getAssignedRoute();
        setData(res.data.data);
      } catch (err) {
        console.error("Failed to load manifest", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRouteData();
  }, []);

  if (loading) return <div className={styles.loader}>Loading Manifest...</div>;
  if (!data?.route) return <div className={styles.error}>No route assigned yet.</div>;

  const { route, students } = data;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>{route.name} <span className={styles.code}>{route.code}</span></h1>
        <p>Trip Manifest & Stop Sequence</p>
      </header>

      <section className={styles.section}>
        <h2>Stop Sequence</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Order</th>
              <th>Stop Name</th>
              <th>Enrolled Students</th>
            </tr>
          </thead>
          <tbody>
            {route.stops.map((stop, index) => {
              // Filter students who get on/off at this stop
              const stopStudents = students.filter(
                (s) => s.preferredStop?._id === stop._id
              );

              return (
                <tr key={stop._id}>
                  <td>{index + 1}</td>
                  <td className={styles.stopName}>{stop.name}</td>
                  <td>
                    {stopStudents.length > 0 ? (
                      <div className={styles.studentPills}>
                        {stopStudents.map(s => (
                          <span key={s._id} className={styles.pill}>{s.name}</span>
                        ))}
                      </div>
                    ) : (
                      <span className={styles.empty}>No pickups</span>
                    )}
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