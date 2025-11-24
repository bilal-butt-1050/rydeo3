"use client";

import { useState, useEffect } from "react";
import { authAPI } from "@/lib/api";
import styles from "./page.module.css";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [data, setData] = useState({ loginID: "", password: "" });
  const [error, setError] = useState("");
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await authAPI.getMe();
        if (res.success && res.data && res.data.role) {
          const role = res.data.role;
          if (role === "admin") router.push("/admin");
          else if (role === "driver") router.push("/driver");
          else router.push("/student");
        }
      } catch (err) {
        // Not logged in, continue
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await authAPI.login(data);

      if (!res.success || !res.data) {
        setError(res.error || "Invalid response from server");
        return;
      }

      const role = res.data.role;
      if (role === "admin") router.push("/admin");
      else if (role === "driver") router.push("/driver");
      else router.push("/student");
    } catch (err) {
      setError(err.message || "Login failed");
    }
  };

  if (loading)
    return <p className={styles.loading}>Checking authentication...</p>;

  return (
    <div className={styles.wrapper}>
      <form onSubmit={handleLogin} className={styles.box}>
        <h2>Login</h2>

        <input
          placeholder="Login ID"
          value={data.loginID}
          onChange={(e) => setData({ ...data, loginID: e.target.value })}
        />

        <input
          placeholder="Password"
          type="password"
          value={data.password}
          onChange={(e) => setData({ ...data, password: e.target.value })}
        />

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit">Login</button>
      </form>
    </div>
  );
}
