"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, Route as RouteIcon, PlusCircle } from "lucide-react";
import styles from "../drivers/layout.module.css"; 

export default function RoutesLayout({ children }) {
  const pathname = usePathname();

  const tabs = [
    { label: "Network Overview", href: "/admin/routes", icon: RouteIcon },
    { label: "Route Architect", href: "/admin/routes/create", icon: Map },
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1>Transport Network</h1>
          <p>Manage routes, stops, and road geometry</p>
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