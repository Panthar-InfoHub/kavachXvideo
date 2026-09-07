import { v2 as cloudinary } from 'cloudinary';

// Configure the Cloudinary client
// This is for server-side usage only
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export default cloudinary;

/**
 * Helper to generate a Cloudinary URL for a time-based cut video clip
 */
export function getClipUrl(publicId: string, startSeconds: number, endSeconds: number) {
  return cloudinary.url(`${publicId}.mp4`, {
    resource_type: 'video',
    transformation: [
      { start_offset: startSeconds, end_offset: endSeconds }
    ]
  });
}
