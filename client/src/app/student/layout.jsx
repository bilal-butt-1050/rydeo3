import SharedLayout from "@/components/SharedLayout/page";

export default function StudentLayout({ children }) {
  const studentLinks = [
    { href: "/student", label: "Live Tracking" },
    { href: "/student/route", label: "Assigned Route" },
  ];

  return (
    <SharedLayout role="student" brandSubtitle="Student Portal" navLinks={studentLinks}>
      {children}
    </SharedLayout>
  );
}