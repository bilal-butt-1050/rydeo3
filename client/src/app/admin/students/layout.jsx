"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, GraduationCap, UserPlus } from "lucide-react";
import styles from "../drivers/layout.module.css";

export default function StudentLayout({ children }) {
  const pathname = usePathname();

  const tabs = [
    { label: "Manage Students", href: "/admin/students", icon: Users },
    { label: "Register Student", href: "/admin/students/create", icon: UserPlus },
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1>Students</h1>
          <p>Academic Year Transport Enrollment</p>
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