'use client';

import { useState } from 'react';
import { Search, Play, Loader2 } from 'lucide-react';
import VideoPlayer from '@/components/VideoPlayer';

interface SearchResult {
  score: number;
  video_id: string;
  filename: string;
  storage_path: string;
  start_seconds: number;
  end_seconds: number;
  description: string;
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeVideo, setActiveVideo] = useState<{ src: string; start: number } | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    setActiveVideo(null);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      setResults(data.results || []);
    } catch (error) {
      console.error(error);
    } finally {
      setSearching(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '0.5rem' }}>Global Search</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Describe an incident to find matching CCTV footage.</p>
      </header>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', marginBottom: '3rem' }}>
        <div style={{ flexGrow: 1, position: 'relative' }}>
          <Search size={20} color="var(--text-secondary)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Someone wearing a red jacket entered the building..."
            style={{
              width: '100%',
              padding: '1rem 1rem 1rem 3rem',
              borderRadius: '8px',
              border: '1px solid var(--panel-border)',
              backgroundColor: 'var(--panel-bg)',
              color: 'var(--text-primary)',
              fontSize: '1rem',
              outline: 'none',
            }}
          />
        </div>
        <button type="submit" className="btn-primary" disabled={searching || !query.trim()}>
          {searching ? <Loader2 size={18} className="spin" /> : 'Search'}
        </button>
      </form>

      {/* Video Player Modal/Section */}
      {activeVideo && (
        <div style={{ marginBottom: '3rem', padding: '1rem', background: 'var(--panel-bg)', borderRadius: '12px', border: '1px solid var(--panel-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontWeight: 600 }}>Video Playback</h3>
            <button onClick={() => setActiveVideo(null)} style={{ color: 'var(--text-secondary)' }}>Close</button>
          </div>
          <VideoPlayer src={activeVideo.src} startSeconds={activeVideo.start} autoPlay={true} />
        </div>
      )}

      {/* Results Grid */}
      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {!searching && results.length === 0 && query && (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '2rem' }}>No matches found.</p>
        )}

        {results.map((res, idx) => (
          <div key={idx} className="glass-panel hover-lift" style={{ padding: '1.5rem', display: 'flex', gap: '1.5rem' }}>
            <div style={{ flexGrow: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{res.filename}</h3>
                <span style={{
                  backgroundColor: 'rgba(0, 230, 118, 0.1)',
                  color: 'var(--accent-color)',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}>
                  {Math.round(res.score * 100)}% Match
                </span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  {formatTime(res.start_seconds)} - {formatTime(res.end_seconds)}
                </span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                {res.description}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button
                className="btn-primary"
                onClick={() => setActiveVideo({ src: res.storage_path, start: res.start_seconds })}
                style={{ padding: '0.5rem 1rem' }}
              >
                <Play size={16} /> Play Clip
              </button>
            </div>
          </div>
        ))}
      </div>
      <style dangerouslySetInnerHTML={{
        __html: `
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
