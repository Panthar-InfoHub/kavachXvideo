import connectToDatabase from './src/lib/db';
import { Video } from './src/models/Video';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
async function run() {
  await connectToDatabase();
  const videos = await Video.find({}).sort({ created_at: -1 }).limit(5).lean();
  videos.forEach(v => {
    console.log(`http://localhost:3000/video/${v._id} | ${v.status} | ${v.twelvelabs_video_id ? 'INDEXED ✓' : 'NOT INDEXED ✗'}`);
  });
  process.exit(0);
}
run();
