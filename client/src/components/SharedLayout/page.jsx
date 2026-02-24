"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ChevronLeft, ChevronRight, LogOut, Settings } from "lucide-react"; // npm install lucide-react
import styles from "./page.module.css";

export default function SharedLayout({ children, role, navLinks, brandSubtitle }) {
  const { logout, user, loading } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== role) {
        router.replace("/login");
      }
    }
  }, [user, loading, router, role]);

  if (loading || !user || user.role !== role) {
    return (
      <div className={styles.loadingWrapper}>
        <div className={styles.spinner}></div>
        <p>Verifying Permissions...</p>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ""}`}>
        {/* Toggle Button */}
        <button 
          className={styles.toggleBtn} 
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Expand" : "Collapse"}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>

        <div className={styles.brand}>
          <h1>{isCollapsed ? "R" : "RYDEO"}</h1>
          {!isCollapsed && <p>{brandSubtitle}</p>}
        </div>

        <nav className={styles.nav}>
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon; // Assuming you pass an icon component in navLinks

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.navItem} ${isActive ? styles.activeNavItem : ""}`}
                title={isCollapsed ? link.label : ""}
              >
                <span className={styles.icon}>{Icon && <Icon size={20} />}</span>
                {!isCollapsed && <span className={styles.label}>{link.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className={styles.footer}>
          <div className={styles.userBadge}>
            <div className={styles.avatar}>{user?.name?.charAt(0) || "U"}</div>
            {!isCollapsed && <span>{user?.name || "User"}</span>}
          </div>
          
          <Link href={`/${role}/settings`} className={styles.settingsBtn} title="Settings">
            <Settings size={18} />
            {!isCollapsed && <span style={{marginLeft: '10px'}}>Settings</span>}
          </Link>
          
          <button onClick={logout} className={styles.logoutBtn} title="Sign Out">
            <LogOut size={18} />
            {!isCollapsed && <span style={{marginLeft: '10px'}}>Sign Out</span>}
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}