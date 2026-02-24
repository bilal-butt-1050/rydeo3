import SharedLayout from "@/components/SharedLayout/page";

export default function AdminLayout({ children }) {
  const adminLinks = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/routes", label: "Route Builder" },
    { href: "/admin/drivers", label: "Drivers" },
    { href: "/admin/students", label: "Students" },
  ];

  return (
    <SharedLayout role="admin" brandSubtitle="Admin Control" navLinks={adminLinks}>
      {children}
    </SharedLayout>
  );
}