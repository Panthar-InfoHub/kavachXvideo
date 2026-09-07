import mongoose, { Schema, Document } from 'mongoose';

export interface IProcessingJob extends Document {
  video_id: mongoose.Types.ObjectId;
  status: 'queued' | 'running' | 'done' | 'failed';
  progress: number;
  error?: string;
  created_at: Date;
  updated_at: Date;
}

const ProcessingJobSchema: Schema = new Schema({
  video_id: { type: Schema.Types.ObjectId, ref: 'Video' },
  status: { 
    type: String, 
    enum: ['queued', 'running', 'done', 'failed'],
    default: 'queued' 
  },
  progress: { type: Number, default: 0 },
  error: { type: String }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export const ProcessingJob = mongoose.models.ProcessingJob || mongoose.model<IProcessingJob>('ProcessingJob', ProcessingJobSchema);
