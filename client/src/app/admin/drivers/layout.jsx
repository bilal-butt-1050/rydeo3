"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, UserPlus } from "lucide-react";
import styles from "./layout.module.css";

export default function DriverLayout({ children }) {
  const pathname = usePathname();

  const tabs = [
    { label: "Manage Drivers", href: "/admin/drivers", icon: Users },
    { label: "Create Driver", href: "/admin/drivers/create", icon: UserPlus },
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1>Drivers</h1>
          <p>Personnel Management</p>
        </div>
        <nav className={styles.subTabs}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === tab.href;
            return (
              <Link key={tab.href} href={tab.href} className={`${styles.tab} ${isActive ? styles.activeTab : ""}`}>
                <Icon size={18} />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>
      </header>
      <div className={styles.content}>{children}</div>
    </div>
  );
}