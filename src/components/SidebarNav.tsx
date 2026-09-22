'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Video, Search, Settings, Menu, X } from 'lucide-react';
import KavachLogo from '@/components/KavachLogo';
import ThemeToggle from '@/components/ThemeToggle';

export default function SidebarNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* Mobile Top Header */}
      <div className="mobile-header">
        <Link href="/" onClick={closeSidebar} style={{ textDecoration: 'none' }}>
          <KavachLogo height={28} />
        </Link>
        <button
          onClick={toggleSidebar}
          aria-label="Toggle navigation menu"
          style={{
            padding: '0.5rem',
            color: 'var(--text-primary)',
            borderRadius: '6px',
            border: '1px solid var(--panel-border)',
            backgroundColor: 'var(--panel-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Backdrop overlay for mobile drawer */}
      {isOpen && (
        <div
          onClick={closeSidebar}
          className="mobile-overlay"
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`sidebar-nav ${isOpen ? 'mobile-open' : ''}`}>
        <div style={{ marginTop: '0.45rem', marginBottom: '2.5rem' }}>
          <Link href="/" onClick={closeSidebar} style={{ textDecoration: 'none' }}>
            <KavachLogo />
          </Link>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link
            href="/"
            onClick={closeSidebar}
            className="nav-item"
            style={getNavItemStyle(isActive('/'))}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </Link>
          <Link
            href="/upload"
            onClick={closeSidebar}
            className="nav-item"
            style={getNavItemStyle(isActive('/upload'))}
          >
            <Video size={20} />
            Upload Footage
          </Link>
          <Link
            href="/search"
            onClick={closeSidebar}
            className="nav-item"
            style={getNavItemStyle(isActive('/search'))}
          >
            <Search size={20} />
            Global Search
          </Link>
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--panel-border)', paddingTop: '1rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Theme Mode</span>
            <ThemeToggle />
          </div>
          <Link
            href="/settings"
            onClick={closeSidebar}
            className="nav-item"
            style={getNavItemStyle(isActive('/settings'))}
          >
            <Settings size={20} />
            Settings
          </Link>
        </div>
      </aside>
    </>
  );
}

function getNavItemStyle(active: boolean) {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
    backgroundColor: active ? 'var(--panel-border)' : 'transparent',
    fontWeight: active ? 600 : 500,
    transition: 'all 0.2s ease',
  };
}
