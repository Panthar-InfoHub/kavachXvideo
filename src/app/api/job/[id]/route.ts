import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { ProcessingJob } from '@/models/ProcessingJob';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const job = await ProcessingJob.findById(id).lean();

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      job: {
        status: job.status,
        progress: job.progress,
        error: job.error,
      }
    });
  } catch (error: unknown) {
    console.error('Job Fetch Error:', error);
    return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 });
  }
}
