'use client';

import { useState, useEffect } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, Loader2, Play } from 'lucide-react';
import Link from 'next/link';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'processing'>('idle');
  const [message, setMessage] = useState('');
  const [uploadedVideoId, setUploadedVideoId] = useState<string | null>(null);
  
  // Job polling states
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState(0);
  const [jobStatus, setJobStatus] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus('idle');
      setJobId(null);
      setJobProgress(0);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    setStatus('idle');

    try {
      // Upload to our own API (server proxies to Cloudinary — no CORS issues)
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('processing');
        setMessage('Video uploaded successfully. Processing started...');
        setUploadedVideoId(data.videoId);
        setJobId(data.jobId);
      } else {
        setStatus('error');
        setMessage(data.error || 'Upload failed.');
        setUploading(false);
      }
    } catch (err: unknown) {
      console.error(err);
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'An error occurred during upload.');
      setUploading(false);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (status === 'processing' && jobId) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/job/${jobId}`);
          const data = await res.json();
          
          if (data.success && data.job) {
            setJobProgress(data.job.progress);
            setJobStatus(data.job.status);

            if (data.job.status === 'done') {
              clearInterval(interval);
              setStatus('success');
              setMessage('Video indexed and ready for search!');
              setFile(null);
              setUploading(false);
            } else if (data.job.status === 'failed') {
              clearInterval(interval);
              setStatus('error');
              setMessage(data.job.error || 'Processing failed.');
              setUploading(false);
            }
          }
        } catch (err) {
          console.error('Failed to poll job status:', err);
        }
      }, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status, jobId]);

  const getProgressLabel = () => {
    if (jobProgress < 10) return "Queued — waiting for worker...";
    if (jobProgress < 30) return "Uploading to Twelve Labs...";
    if (jobProgress < 50) return "Processing asset...";
    if (jobProgress < 70) return "Indexing video...";
    if (jobProgress < 100) return "Finalizing...";
    return "✅ Indexed & ready for search!";
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '0.5rem' }}>Upload CCTV Footage</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Upload a video file to begin AI processing and indexing.</p>
      </header>

      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
        <input 
          type="file" 
          accept="video/*" 
          onChange={handleFileChange} 
          style={{ display: 'none' }} 
          id="video-upload" 
          disabled={status === 'processing' || uploading}
        />
        <label htmlFor="video-upload" style={{ cursor: status === 'processing' || uploading ? 'not-allowed' : 'pointer', display: 'block' }}>
          <div style={{ 
            border: '2px dashed var(--panel-border)', 
            borderRadius: '12px', 
            padding: '4rem 2rem',
            transition: 'border-color 0.2s',
            borderColor: file ? 'var(--accent-color)' : 'var(--panel-border)',
            backgroundColor: file ? 'rgba(0, 230, 118, 0.05)' : 'transparent',
            opacity: status === 'processing' || uploading ? 0.7 : 1
          }}>
            <UploadCloud size={48} color={file ? 'var(--accent-color)' : 'var(--text-secondary)'} style={{ margin: '0 auto 1rem' }} />
            {file ? (
              <div>
                <p style={{ fontSize: '1.25rem', fontWeight: 500, color: 'var(--accent-color)' }}>{file.name}</p>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '1.25rem', fontWeight: 500, marginBottom: '0.5rem' }}>Click to select a video file</p>
                <p style={{ color: 'var(--text-secondary)' }}>MP4, AVI, MKV, or MOV</p>
              </div>
            )}
          </div>
        </label>

        {uploading && status === 'idle' && (
          <div style={{ marginTop: '2rem', textAlign: 'left', backgroundColor: 'var(--panel-bg)', border: '1px solid var(--panel-border)', padding: '1.5rem', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Loader2 size={14} className="spin" />
                Uploading video to cloud storage...
              </span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>This may take a moment</span>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
              <div style={{ 
                height: '100%', 
                backgroundColor: 'var(--accent-color)', 
                width: '30%',
                position: 'absolute',
                animation: 'indeterminate 1.5s infinite linear'
              }}></div>
            </div>
          </div>
        )}

        {status === 'processing' && (
          <div style={{ marginTop: '2rem', textAlign: 'left', backgroundColor: 'var(--panel-bg)', border: '1px solid var(--panel-border)', padding: '1.5rem', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Loader2 size={14} className="spin" />
                {getProgressLabel()}
              </span>
              <span style={{ color: 'var(--accent-color)', fontWeight: 600 }}>{jobProgress}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ 
                height: '100%', 
                backgroundColor: 'var(--accent-color)', 
                width: `${jobProgress}%`,
                transition: 'width 0.5s ease-in-out'
              }}></div>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'rgba(0, 230, 118, 0.1)', borderRadius: '8px', color: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <CheckCircle size={20} />
            {message}
          </div>
        )}

        {status === 'error' && (
          <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'rgba(255, 82, 82, 0.1)', borderRadius: '8px', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <AlertCircle size={20} />
            {message}
          </div>
        )}

        <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ color: 'var(--text-secondary)' }}>← Back to Dashboard</Link>
          
          {status === 'success' && uploadedVideoId ? (
            <Link href={`/video/${uploadedVideoId}`} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Play size={18} />
              Go to Video
            </Link>
          ) : (
            <button 
              className="btn-primary" 
              onClick={handleUpload} 
              disabled={!file || uploading || status === 'processing'}
              style={{ opacity: (!file || uploading || status === 'processing') ? 0.5 : 1, cursor: (!file || uploading || status === 'processing') ? 'not-allowed' : 'pointer' }}
            >
              {uploading || status === 'processing' ? (
                <>
                  <Loader2 size={18} className="spin" />
                  {status === 'processing' ? 'Processing...' : 'Uploading...'}
                </>
              ) : (
                <>
                  <UploadCloud size={18} />
                  Process Video
                </>
              )}
            </button>
          )}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes indeterminate {
          0% { left: -30%; right: 100%; }
          100% { left: 100%; right: -30%; }
        }
      `}} />
    </div>
  );
}
