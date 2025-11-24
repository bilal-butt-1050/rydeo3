"use client";

import { useRouter } from "next/navigation";
import { authAPI } from "@/lib/api";
import { useState } from "react";
import styles from "./logoutButton.module.css";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await authAPI.logout();
      router.push("/login"); // redirect to login page
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className={styles.logoutBtn}
      onClick={handleLogout}
      disabled={loading}
    >
      {loading ? "Logging out..." : "Logout"}
    </button>
  );
}
