import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Video } from '@/models/Video';
import { ProcessingJob } from '@/models/ProcessingJob';
import { videoProcessingQueue } from '@/lib/queue';
import cloudinary from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    // Convert File to buffer for Cloudinary upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary via server-side SDK (bypasses browser CORS)
    const cloudinaryResult = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'video',
          folder: 'kavach',
          upload_preset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    // Connect DB
    await connectToDatabase();

    // Create Video record
    const video = await Video.create({
      filename: file.name,
      storage_path: cloudinaryResult.secure_url,
      cloudinary_public_id: cloudinaryResult.public_id,
      file_size_bytes: cloudinaryResult.bytes || file.size,
      duration_seconds: cloudinaryResult.duration || 0,
      status: 'processing'
    });

    // Create a Processing Job record
    const job = await ProcessingJob.create({
      video_id: video._id,
      status: 'queued',
      progress: 0
    });

    // Add to BullMQ queue
    await videoProcessingQueue.add('process-video', {
      videoId: video._id.toString(),
      jobId: job._id.toString(),
      cloudinaryUrl: cloudinaryResult.secure_url
    });

    return NextResponse.json({ success: true, videoId: video._id, jobId: job._id });
  } catch (error: unknown) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
