import mongoose, { Schema, Document } from 'mongoose';

export interface IVideo extends Document {
  filename: string;
  storage_path: string;
  duration_seconds?: number;
  file_size_bytes?: number;
  status: 'uploaded' | 'processing' | 'indexed' | 'failed';
  created_at: Date;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: any;
  twelvelabs_video_id?: string;
}

const VideoSchema: Schema = new Schema({
  filename: { type: String, required: true },
  storage_path: { type: String, required: true },
  duration_seconds: { type: Number },
  file_size_bytes: { type: Number },
  status: { 
    type: String, 
    enum: ['uploaded', 'processing', 'indexed', 'failed'],
    default: 'uploaded' 
  },
  twelvelabs_video_id: { type: String },
  cloudinary_public_id: { type: String },
  created_at: { type: Date, default: Date.now },
  metadata: { type: Schema.Types.Mixed }
});

export const Video = mongoose.models.Video || mongoose.model<IVideo>('Video', VideoSchema);
