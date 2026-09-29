'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  if (!mounted) {
    return (
      <div
        style={{
          width: '42px',
          height: '42px',
          borderRadius: '8px',
          border: '1px solid var(--panel-border)',
          backgroundColor: 'var(--panel-bg)',
        }}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
      aria-label="Toggle theme"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '42px',
        height: '42px',
        borderRadius: '8px',
        border: '1px solid var(--panel-border)',
        backgroundColor: 'var(--panel-bg)',
        color: 'var(--text-primary)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
      className="hover-lift"
    >
      {theme === 'dark' ? (
        <Sun size={20} color="#ffc107" />
      ) : (
        <Moon size={20} color="#4f46e5" />
      )}
    </button>
  );
}
