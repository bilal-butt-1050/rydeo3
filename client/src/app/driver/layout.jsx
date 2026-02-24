import SharedLayout from "@/components/SharedLayout/page";

export default function DriverLayout({ children }) {
  const driverLinks = [
    { href: "/driver", label: "Duty Console" },
    { href: "/driver/route", label: "Assigned Route" },
  ];

  return (
    <SharedLayout role="driver" brandSubtitle="Driver Console" navLinks={driverLinks}>
      {children}
    </SharedLayout>
  );
}