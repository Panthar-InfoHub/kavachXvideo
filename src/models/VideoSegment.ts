import mongoose, { Schema, Document } from 'mongoose';

export interface IVideoSegment extends Document {
  video_id: mongoose.Types.ObjectId;
  start_seconds: number;
  end_seconds: number;
  storage_path?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  analysis?: any;
  activity_level?: 'high' | 'medium' | 'low' | 'empty';
  vector_id?: string;
  indexed_at?: Date;
  created_at: Date;
}

const VideoSegmentSchema: Schema = new Schema({
  video_id: { type: Schema.Types.ObjectId, ref: 'Video', index: true },
  start_seconds: { type: Number, required: true },
  end_seconds: { type: Number, required: true },
  storage_path: { type: String },
  analysis: { type: Schema.Types.Mixed },
  activity_level: { 
    type: String,
    enum: ['high', 'medium', 'low', 'empty'],
    index: true 
  },
  vector_id: { type: String },
  indexed_at: { type: Date },
  created_at: { type: Date, default: Date.now }
});

VideoSegmentSchema.index({ 'analysis.people.actions': 1, 'analysis.objects.name': 1 });

export const VideoSegment = mongoose.models.VideoSegment || mongoose.model<IVideoSegment>('VideoSegment', VideoSegmentSchema);
