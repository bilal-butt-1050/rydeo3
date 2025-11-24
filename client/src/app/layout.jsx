import './globals.css';
import Navbar from '@/components/Navbar';


export const metadata = {
  title: 'MyApp',
  description: 'Simple Next.js App',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
