"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from '@/components/Sidebar';
import LogoutButton from '@/components/logoutButton';
import { authAPI } from "@/lib/api";
import styles from './page.module.css';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    async function checkAdminAuth() {
      try {
        const res = await authAPI.getMe();
        
        if (!res.success || res.role !== "admin") {
          router.push("/login");
          return;
        }

        setAuthorized(true);
      } catch (err) {
        console.error("Auth check failed:", err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
    
    checkAdminAuth();
  }, [router]);

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Verifying admin access...</p>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <div className={styles.adminContainer}>
      <Sidebar />
      <div className={styles.mainContent}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <LogoutButton />
        </div>
        {children}
      </div>
    </div>
  );
}