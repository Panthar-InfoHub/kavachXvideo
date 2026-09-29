'use client';

import { useState, useRef } from 'react';
import { Search, Loader2, Clock, Download, Scissors, Video as VideoIcon } from 'lucide-react';

interface SearchResult {
  score: number;
  video_id: string;
  filename: string;
  storage_path: string;
  start_seconds: number;
  end_seconds: number;
  description: string;
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

interface SingleVideoSearchProps {
  videoId: string;
  filename: string;
  storagePath: string;
}

export default function SingleVideoSearch({ videoId, filename, storagePath }: SingleVideoSearchProps) {
  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [warning, setWarning] = useState('');

  // Active playing source (full video vs cut clip)
  const [currentVideoSrc, setCurrentVideoSrc] = useState(storagePath);
  const [activeClipInfo, setActiveClipInfo] = useState<{ start: number; end: number; isCut: boolean } | null>(null);
  const [cuttingClipIdx, setCuttingClipIdx] = useState<number | null>(null);
  const [isLooping, setIsLooping] = useState(true);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSearched(false);
    setResults([]);
    setWarning('');
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, videoId }),
      });
      const data = await res.json();
      const searchResults = data.results || [];
      setResults(searchResults);
      if (data.warning) setWarning(data.warning);
      setSearched(true);

      // Auto-cut and play the #1 best matching clip immediately!
      if (searchResults.length > 0) {
        await handlePlayCutClip(searchResults[0], 0);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSearching(false);
    }
  };

  // Cut and play ONLY the specific clip
  const handlePlayCutClip = async (res: SearchResult, idx: number) => {
    try {
      setCuttingClipIdx(idx);
      const clipRes = await fetch('/api/clip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId,
          start: res.start_seconds,
          end: res.end_seconds,
        }),
      });

      const clipData = await clipRes.json();
      if (clipData.clipUrl) {
        setCurrentVideoSrc(clipData.clipUrl);
        setActiveClipInfo({
          start: res.start_seconds,
          end: res.end_seconds,
          isCut: true,
        });

        setTimeout(() => {
          if (mainVideoRef.current) {
            mainVideoRef.current.currentTime = 0;
            mainVideoRef.current.play().catch(() => { });
            mainVideoRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    } catch (err) {
      console.error('Failed to cut clip:', err);
    } finally {
      setCuttingClipIdx(null);
    }
  };

  const handleSwitchToFullVideo = () => {
    setCurrentVideoSrc(storagePath);
    setActiveClipInfo(null);
    setTimeout(() => {
      if (mainVideoRef.current) {
        mainVideoRef.current.currentTime = 0;
        mainVideoRef.current.play().catch(() => { });
      }
    }, 100);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.25rem', wordBreak: 'break-all' }}>{filename}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>AI-Powered Incident Detection & Clip Extraction</p>
        </div>
        {activeClipInfo?.isCut && (
          <button
            onClick={handleSwitchToFullVideo}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.5rem 1rem',
              background: 'var(--panel-bg)',
              border: '1px solid var(--panel-border)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            <VideoIcon size={16} /> Show Full Video
          </button>
        )}
      </header>

      {/* Active Mode Indicator */}
      {activeClipInfo?.isCut && (
        <div style={{
          padding: '0.75rem 1.25rem',
          background: 'rgba(0, 230, 118, 0.1)',
          border: '1px solid var(--accent-color)',
          borderRadius: '8px',
          color: 'var(--accent-color)',
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          fontSize: '0.875rem',
          fontWeight: 600,
        }}>
          <span>✂️ Playing Isolated Cut Clip ({formatTime(activeClipInfo.start)} – {formatTime(activeClipInfo.end)})</span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => setIsLooping(!isLooping)}
              style={{
                background: isLooping ? 'rgba(0,230,118,0.2)' : 'rgba(255,255,255,0.1)',
                border: '1px solid var(--accent-color)',
                color: 'var(--accent-color)',
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
            >
              {isLooping ? '🔁 Loop: ON' : '⏹ Stop at End'}
            </button>
            <a
              href={currentVideoSrc}
              download={`clip_${Math.floor(activeClipInfo.start)}_${Math.ceil(activeClipInfo.end)}.mp4`}
              style={{
                color: '#000',
                background: 'var(--accent-color)',
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Download size={14} /> Download Clip
            </a>
          </div>
        </div>
      )}

      {/* Video Player */}
      <div style={{ marginBottom: '1.5rem', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--panel-border)', background: '#000' }}>
        <video
          key={currentVideoSrc}
          ref={mainVideoRef}
          src={currentVideoSrc}
          controls
          loop={activeClipInfo?.isCut ? isLooping : false}
          autoPlay={activeClipInfo?.isCut}
          style={{ width: '100%', display: 'block', maxHeight: '480px' }}
        />
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div style={{ flexGrow: 1, position: 'relative' }}>
          <Search size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            type="text"
            id="search-query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. red car, pedestrian, walking, cars..."
            style={{
              width: '100%',
              padding: '0.875rem 1rem 0.875rem 2.75rem',
              borderRadius: '8px',
              border: '1px solid var(--panel-border)',
              backgroundColor: 'var(--panel-bg)',
              color: 'var(--text-primary)',
              fontSize: '1rem',
              outline: 'none',
            }}
          />
        </div>
        <button id="search-btn" type="submit" className="btn-primary" disabled={searching || !query.trim()}
          style={{ opacity: (searching || !query.trim()) ? 0.6 : 1, minWidth: '160px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
          {searching ? <><Loader2 size={16} className="spin" /> Finding & Cutting...</> : <><Scissors size={16} /> Auto-Cut & Search</>}
        </button>
      </form>

      {/* Warning */}
      {warning && (
        <div style={{ padding: '0.875rem 1.25rem', background: 'rgba(255,200,0,0.1)', border: '1px solid rgba(255,200,0,0.3)', borderRadius: '8px', color: '#ffc800', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          ⚠️ {warning}
        </div>
      )}

      {/* No results */}
      {searched && results.length === 0 && !warning && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', background: 'var(--panel-bg)', borderRadius: '12px', border: '1px solid var(--panel-border)' }}>
          <Search size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
          <p style={{ fontWeight: 500 }}>No matching clips found</p>
          <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>Try searching &ldquo;red car&rdquo;, &ldquo;walking&rdquo;, or &ldquo;pedestrian&rdquo;</p>
        </div>
      )}

      {/* Clip Grid */}
      {results.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontWeight: 600, fontSize: '1.1rem' }}>
              ✂️ {results.length} Extracted Clip{results.length > 1 ? 's' : ''}
            </h2>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Click &ldquo;Cut & Play Clip&rdquo; to isolate that exact segment</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {results.map((res, idx) => {
              const isCutting = cuttingClipIdx === idx;
              const duration = (res.end_seconds - res.start_seconds).toFixed(1);
              return (
                <div
                  key={idx}
                  className="clip-card"
                  style={{
                    background: 'var(--panel-bg)',
                    border: '1px solid var(--panel-border)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    transition: 'transform 0.2s, border-color 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* Thumbnail */}
                  <div style={{ position: 'relative', aspectRatio: '16/9', background: '#000' }}>
                    <video
                      src={res.storage_path}
                      muted playsInline preload="metadata"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      onLoadedMetadata={(e) => {
                        (e.target as HTMLVideoElement).currentTime = res.start_seconds;
                      }}
                    />
                    <div style={{
                      position: 'absolute', top: '8px', right: '8px',
                      background: 'rgba(0,230,118,0.95)',
                      color: '#000', fontWeight: 700, fontSize: '0.7rem',
                      padding: '3px 8px', borderRadius: '20px',
                    }}>
                      {Math.round(res.score * 100)}% Match
                    </div>
                  </div>

                  {/* Info & Action Buttons */}
                  <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', flexGrow: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                        <Clock size={14} color="var(--accent-color)" />
                        {formatTime(res.start_seconds)} – {formatTime(res.end_seconds)}
                      </span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        {duration}s clip
                      </span>
                    </div>

                    <button
                      onClick={() => handlePlayCutClip(res, idx)}
                      disabled={isCutting}
                      style={{
                        width: '100%',
                        padding: '0.65rem 1rem',
                        background: 'var(--accent-color)',
                        color: '#000',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: isCutting ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        marginTop: 'auto',
                      }}
                    >
                      {isCutting ? (
                        <><Loader2 size={16} className="spin" /> Cutting Clip with FFmpeg...</>
                      ) : (
                        <><Scissors size={16} /> Play Cut Clip Only</>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .clip-card:hover { transform: translateY(-3px) !important; border-color: var(--accent-color) !important; }
      `}} />
    </div>
  );
}
