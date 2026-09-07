'use client';

import { useRef, useEffect } from 'react';

interface VideoPlayerProps {
  src: string;
  startSeconds?: number;
  autoPlay?: boolean;
}

export default function VideoPlayer({ src, startSeconds = 0, autoPlay = true }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && startSeconds >= 0) {
      videoRef.current.currentTime = startSeconds;
      if (autoPlay) {
        videoRef.current.play().catch(e => console.error("Playback failed:", e));
      }
    }
  }, [src, startSeconds, autoPlay]);

  return (
    <div style={{ borderRadius: '12px', overflow: 'hidden', background: '#000' }}>
      <video
        ref={videoRef}
        src={src}
        controls
        style={{ width: '100%', display: 'block', maxHeight: '500px' }}
      />
    </div>
  );
}
