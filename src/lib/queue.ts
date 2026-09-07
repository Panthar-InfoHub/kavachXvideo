import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

const REDIS_URL = process.env.QUEUE_URL || 'redis://localhost:6379';

const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

export const videoProcessingQueue = new Queue('video-processing', { connection });

// Note: Worker should be initialized in a separate worker process or a custom server script,
// not directly in the Next.js edge/serverless functions to avoid connection leaks,
// but we provide a factory function here for when the worker starts.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createWorker = (processor: any) => {
  return new Worker('video-processing', processor, { connection });
};
