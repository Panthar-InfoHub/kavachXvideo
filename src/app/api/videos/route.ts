import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Video } from '@/models/Video';
import { ProcessingJob } from '@/models/ProcessingJob';

export async function GET() {
  try {
    await connectToDatabase();

    // Fetch all videos, sorted by newest first
    const videos = await Video.find({}).sort({ created_at: -1 }).lean();

    // Count total videos
    const totalVideos = await Video.countDocuments();

    // Calculate total hours processed (only for indexed videos)
    // Assuming duration_seconds is available. If not, we fall back to 0.
    const indexedVideos = await Video.find({ status: 'indexed' }).lean();
    const totalSeconds = indexedVideos.reduce((acc, video) => {
      return acc + (video.duration_seconds || 0);
    }, 0);
    const hoursProcessed = (totalSeconds / 3600).toFixed(1);

    // Count active jobs
    const activeJobs = await ProcessingJob.countDocuments({
      status: { $in: ['queued', 'running'] },
    });

    return NextResponse.json({
      success: true,
      videos,
      stats: {
        totalVideos,
        hoursProcessed,
        activeJobs,
      },
    });
  } catch (error: unknown) {
    console.error('Failed to fetch videos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}
