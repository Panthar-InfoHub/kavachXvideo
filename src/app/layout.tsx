import type { Metadata } from 'next';
import './globals.css';
import { LayoutDashboard, Video, Search, Settings } from 'lucide-react';
import Link from 'next/link';

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
          {/* Sidebar Navigation */}
          <aside style={{
            width: 'var(--sidebar-width)',
            backgroundColor: 'var(--panel-bg)',
            borderRight: '1px solid var(--panel-border)',
            position: 'fixed',
            top: 0,
            bottom: 0,
            left: 0,
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ marginBottom: '3rem' }}>
              <h1 style={{ 
                fontSize: '1.5rem', 
                fontWeight: 700,
                letterSpacing: '-0.05em',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{ color: 'var(--accent-color)' }}>◉</span> KAVACH
              </h1>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Link href="/" className="nav-item" style={navItemStyle}>
                <LayoutDashboard size={20} />
                Dashboard
              </Link>
              <Link href="/upload" className="nav-item" style={navItemStyle}>
                <Video size={20} />
                Upload Footage
              </Link>
              <Link href="/search" className="nav-item" style={navItemStyle}>
                <Search size={20} />
                Global Search
              </Link>
            </nav>

            <div style={{ marginTop: 'auto' }}>
              <Link href="/settings" className="nav-item" style={navItemStyle}>
                <Settings size={20} />
                Settings
              </Link>
            </div>
          </aside>

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
