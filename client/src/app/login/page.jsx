"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function LoginPage() {
  const router = useRouter();
  const { login, user, loading, authActionLoading } = useAuth();

  const [credentials, setCredentials] = useState({ loginID: "", password: "" });
  const [error, setError] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.replace(`/${user.role}`);
    }
  }, [user, loading, router]);

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const data = await login(credentials);
      if (!data?.role) setError("Login successful but role unknown.");
      // No need to manually redirect; AuthContext state will trigger useEffect redirect
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials");
    }
  };

  // Show loading while checking auth
  if (loading) {
    return (
      <div className={styles.container}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <form className={styles.loginCard} onSubmit={handleSubmit}>
        <h2>Login</h2>

        <input
          name="loginID"
          placeholder="Email or ID"
          value={credentials.loginID}
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={credentials.password}
          onChange={handleChange}
          required
        />

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" disabled={authActionLoading}>
          {authActionLoading ? "Verifying..." : "Login"}
        </button>
      </form>
    </div>
  );
}
