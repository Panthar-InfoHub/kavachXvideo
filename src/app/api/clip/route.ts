import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Video } from '@/models/Video';
import { getClipUrl } from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  try {
    const { videoId, start, end } = await request.json();

    if (!videoId || start === undefined || end === undefined) {
      return NextResponse.json({ error: 'Missing required parameters (videoId, start, end)' }, { status: 400 });
    }

    await connectToDatabase();
    const video = await Video.findById(videoId).lean();

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }
    
    if (!video.cloudinary_public_id) {
       return NextResponse.json({ error: 'Video not stored in Cloudinary' }, { status: 400 });
    }

    const safeStart = Math.max(0, Number(start));
    const safeEnd = Math.max(safeStart + 0.5, Number(end));
    const duration = safeEnd - safeStart;

    // Use Cloudinary transformation URL to automatically extract clip
    const clipUrl = getClipUrl(video.cloudinary_public_id, safeStart, safeEnd);

    // Provide a generic filename since this is a dynamic URL
    const clipFilename = `clip_${videoId}_${Math.floor(safeStart)}_${Math.ceil(safeEnd)}.mp4`;

    return NextResponse.json({ clipUrl, filename: clipFilename, start: safeStart, end: safeEnd, duration });
  } catch (error: unknown) {
    console.error('Clip Cutting Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to cut clip' }, { status: 500 });
  }
}
