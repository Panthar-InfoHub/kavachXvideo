import type { Metadata } from 'next';
import './globals.css';
import SidebarNav from '@/components/SidebarNav';

export const metadata: Metadata = {
  title: 'Kavach | CCTV Incident Search',
  description: 'AI-driven natural language search for long-form CCTV footage.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="app-layout">
          {/* Responsive Navigation */}
          <SidebarNav />

          {/* Main Content Area */}
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

const navItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.75rem 1rem',
  borderRadius: '8px',
  color: 'var(--text-secondary)',
  fontWeight: 500,
  transition: 'all 0.2s ease',
};
