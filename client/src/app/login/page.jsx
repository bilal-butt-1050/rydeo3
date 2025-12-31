"use client";

import { useState } from "react";
import { authAPI } from "@/lib/api";
import styles from "./page.module.css";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [data, setData] = useState({ loginID: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect after login
  const redirectByRole = (role) => {
    if (role === "admin") router.push("/admin");
    else if (role === "driver") router.push("/driver");
    else router.push("/student");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await authAPI.login(data);

      if (!res.success) {
        setError(res.message || "Login failed");
        return;
      }

      const role = res.role;
      if (!role) {
        setError("Invalid server response");
        return;
      }

      redirectByRole(role);
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <h2 className={styles.title}>Login</h2>

        <form className={styles.form} onSubmit={handleLogin}>
          <label>Login ID</label>
          <input
            type="text"
            value={data.loginID}
            onChange={(e) => setData({ ...data, loginID: e.target.value })}
            required
            disabled={loading}
          />

          <label>Password</label>
          <input
            type="password"
            value={data.password}
            onChange={(e) => setData({ ...data, password: e.target.value })}
            required
            disabled={loading}
          />

          {error && <p className={styles.error}>{error}</p>}

          <button
            type="submit"
            className={styles.button}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
