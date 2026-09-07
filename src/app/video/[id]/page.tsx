import { notFound } from 'next/navigation';
import connectToDatabase from '@/lib/db';
import { Video } from '@/models/Video';
import SingleVideoSearch from '@/components/SingleVideoSearch';

interface VideoPageProps {
  params: {
    id: string;
  };
}

export default async function VideoPage({ params }: VideoPageProps) {
  // Await params as required by Next.js 15
  const resolvedParams = await params;
  const { id } = resolvedParams;

  await connectToDatabase();

  let video;
  try {
    video = await Video.findById(id).lean();
  } catch (err) {
    // Invalid ObjectId format
    notFound();
  }

  if (!video) {
    notFound();
  }

  return (
    <div style={{ padding: '2rem' }}>
      <SingleVideoSearch 
        videoId={video._id.toString()} 
        filename={video.filename} 
        storagePath={video.storage_path} 
      />
    </div>
  );
}
