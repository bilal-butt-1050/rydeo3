import Sidebar from '@/components/Sidebar';
import LogoutButton from '@/components/logoutButton';


export const metadata = {
  title: 'admin',
  description: 'Simple Next.js App',
};

export default function adminLayout({ children }) {
  return (
    <html lang="en">
      <body>
          <Sidebar />
        <LogoutButton />
        {children}
      </body>
    </html>
  );
}
