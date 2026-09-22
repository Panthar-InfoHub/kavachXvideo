'use client';

import { useEffect, useState } from 'react';
import { UploadCloud, Activity, Clock, Video, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  totalVideos: number;
  hoursProcessed: string;
  activeJobs: number;
}

interface VideoRecord {
  _id: string;
  filename: string;
  storage_path: string;
  status: 'uploaded' | 'processing' | 'indexed' | 'failed';
  file_size_bytes: number;
  created_at: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({ totalVideos: 0, hoursProcessed: '0.0', activeJobs: 0 });
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/videos')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats(data.stats);
          setVideos(data.videos);
        }
      })
      .catch((err) => console.error('Failed to fetch dashboard data:', err))
      .finally(() => setLoading(false));
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'indexed': return 'var(--accent-color)';
      case 'processing': return '#ffc107'; // amber
      case 'failed': return 'var(--danger)';
      default: return 'var(--text-secondary)';
    }
  };

  const getStatusBadge = (status: string) => {
    const isProcessing = status === 'processing';
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '0.25rem 0.5rem',
        borderRadius: '4px',
        fontSize: '0.75rem',
        fontWeight: 600,
        backgroundColor: `color-mix(in srgb, ${getStatusColor(status)} 15%, transparent)`,
        color: getStatusColor(status),
        textTransform: 'uppercase'
      }}>
        {isProcessing && <Loader2 size={12} className="spin" />}
        {status}
      </span>
    );
  };

  const formatTimeAgo = (dateStr: string) => {
    // eslint-disable-next-line react-hooks/purity
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: '0.35rem' }}>Operations Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Monitor and search across all processed CCTV footage.</p>
        </div>
        <Link href="/upload" className="btn-primary">
          <UploadCloud size={18} />
          Upload Footage
        </Link>
      </header>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <StatCard title="Total Videos" value={stats.totalVideos.toString()} icon={<Activity size={24} color="var(--accent-color)" />} loading={loading} />
        <StatCard title="Hours Processed" value={stats.hoursProcessed} icon={<Clock size={24} color="var(--text-secondary)" />} loading={loading} />
        <StatCard title="Active Jobs" value={stats.activeJobs.toString()} icon={<Activity size={24} color="var(--accent-color)" />} loading={loading} />
      </div>

      {/* Recent Activity */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Recent Footage</h2>
          {loading && <Loader2 size={18} className="spin" style={{ color: 'var(--text-secondary)' }} />}
        </div>

        {!loading && videos.length === 0 ? (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Video size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
            <p>No footage uploaded yet.</p>
            <Link href="/upload" style={{ color: 'var(--accent-color)', marginTop: '1rem', display: 'inline-block' }}>
              Upload your first video
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {videos.map(video => (
              <Link href={`/video/${video._id}`} key={video._id} className="glass-panel hover-lift" style={{ overflow: 'hidden', display: 'block' }}>
                <div style={{ position: 'relative', aspectRatio: '16/9', background: '#000' }}>
                  <video
                    src={video.storage_path}
                    muted playsInline preload="metadata"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    onLoadedMetadata={(e) => {
                      const v = e.target as HTMLVideoElement;
                      v.currentTime = Math.min(1, v.duration || 0); // seek to 1s for thumbnail
                    }}
                  />
                  <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                    {getStatusBadge(video.status)}
                  </div>
                </div>
                <div style={{ padding: '1.25rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {video.filename}
                  </h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    <span>{video.file_size_bytes ? (video.file_size_bytes / (1024 * 1024)).toFixed(1) + ' MB' : 'Unknown size'}</span>
                    <span>{formatTimeAgo(video.created_at)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <style dangerouslySetInnerHTML={{ __html: `
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}

function StatCard({ title, value, icon, loading }: { title: string, value: string, icon: React.ReactNode, loading: boolean }) {
  return (
    <div className="glass-panel hover-lift" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
      <div style={{
        width: '48px', height: '48px',
        borderRadius: '12px',
        backgroundColor: 'rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        {icon}
      </div>
      <div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>{title}</p>
        <p style={{ fontSize: '1.75rem', fontWeight: 600 }}>
          {loading ? <Loader2 size={24} className="spin" style={{ color: 'var(--text-secondary)' }} /> : value}
        </p>
      </div>
    </div>
  );
}
