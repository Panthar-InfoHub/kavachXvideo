import './env';

import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import fs from 'fs';
import https from 'https';
import os from 'os';
import path from 'path';
import { TwelveLabs } from 'twelvelabs-js';
import connectToDatabase from '../src/lib/db';
import { Video } from '../src/models/Video';
import { ProcessingJob } from '../src/models/ProcessingJob';

const REDIS_URL = process.env.QUEUE_URL || 'redis://localhost:6379';
const QUEUE_PREFIX = process.env.QUEUE_PREFIX || 'bull';
const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });

async function processVideo(job: Job) {
  const { videoId, jobId, cloudinaryUrl } = job.data;
  console.log(`Starting Twelve Labs processing for video: ${videoId}`);

  await connectToDatabase();
  let tempFilePath = '';

  try {
    await ProcessingJob.findByIdAndUpdate(jobId, { status: 'running', progress: 10 });

    const indexId = process.env.TWELVE_LABS_INDEX_ID;
    if (!indexId) throw new Error("TWELVE_LABS_INDEX_ID is missing");

    const apiKey = process.env.TWELVE_LABS_API_KEY;
    if (!apiKey) throw new Error('TWELVE_LABS_API_KEY is missing');
    const client = new TwelveLabs({ apiKey });

    // Download video from Cloudinary to a temporary file
    console.log(`Downloading video from Cloudinary: ${cloudinaryUrl}`);
    tempFilePath = path.join(os.tmpdir(), `temp_${videoId}.mp4`);
    
    await new Promise((resolve, reject) => {
      const file = fs.createWriteStream(tempFilePath);
      https.get(cloudinaryUrl, (response) => {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(true);
        });
      }).on('error', (err) => {
        fs.unlink(tempFilePath, () => {});
        reject(err);
      });
    });

    console.log(`Creating asset for ${tempFilePath}...`);
    const asset = await client.assets.create({
      method: "direct",
      file: fs.createReadStream(tempFilePath),
    });
    console.log(`Asset Created: ${asset.id}`);
    
    // Clean up temp file after upload
    fs.unlink(tempFilePath, () => {});
    
    await ProcessingJob.findByIdAndUpdate(jobId, { progress: 30 });

    // 2. Wait for asset to be ready
    console.log(`Waiting for asset ${asset.id} to be ready...`);
    let assetStatus = 'pending';
    while (assetStatus !== 'ready' && assetStatus !== 'failed') {
      await new Promise(r => setTimeout(r, 2000));
      const statusRes = await client.assets.retrieve(asset.id!);
      assetStatus = statusRes.status || 'pending';
      console.log(`Asset ${asset.id} status: ${assetStatus}`);
    }
    if (assetStatus === 'failed') {
      throw new Error(`Twelve Labs asset processing failed for asset ${asset.id}`);
    }
    await ProcessingJob.findByIdAndUpdate(jobId, { progress: 50 });

    // 3. Index the asset
    console.log(`Indexing asset ${asset.id} into index ${indexId}...`);
    const indexedAsset = await client.indexes.indexedAssets.create(indexId, {
      assetId: asset.id!,
    });
    console.log(`Indexed Asset Created: ${indexedAsset.id}`);
    await ProcessingJob.findByIdAndUpdate(jobId, { progress: 70 });

    // 4. Wait for indexing to complete
    console.log(`Waiting for indexing ${indexedAsset.id} to be ready...`);
    let indexStatus = 'pending';
    while (indexStatus !== 'ready' && indexStatus !== 'failed') {
      await new Promise(r => setTimeout(r, 2000));
      const statusRes = await client.indexes.indexedAssets.retrieve(indexId, indexedAsset.id!);
      indexStatus = statusRes.status || 'pending';
      console.log(`Indexed Asset ${indexedAsset.id} status: ${indexStatus}`);
    }
    if (indexStatus === 'failed') {
      throw new Error(`Twelve Labs indexing failed for indexedAsset ${indexedAsset.id}`);
    }

    // 5. Update MongoDB with Twelve Labs Video ID
    await Video.findByIdAndUpdate(videoId, { 
      status: 'indexed',
      twelvelabs_video_id: indexedAsset.id
    });
    
    await ProcessingJob.findByIdAndUpdate(jobId, { status: 'done', progress: 100 });
    console.log(`Finished processing video: ${videoId}. TwelveLabs ID: ${indexedAsset.id}`);

  } catch (error: unknown) {
    console.error(`Error processing video ${videoId}:`, error);
    if (tempFilePath && fs.existsSync(tempFilePath)) {
       fs.unlink(tempFilePath, () => {});
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await ProcessingJob.findByIdAndUpdate(jobId, { status: 'failed', error: errorMessage });
    await Video.findByIdAndUpdate(videoId, { status: 'failed' });
  }
}

const worker = new Worker('video-processing', processVideo, { connection, prefix: QUEUE_PREFIX });

worker.on('completed', job => {
  console.log(`Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.log(`Job ${job?.id} failed with ${err.message}`);
});

console.log('Twelve Labs Worker is running and listening for jobs...');
console.log(`  redis   : ${REDIS_URL.replace(/\/\/[^@]*@/, '//<creds>@')} (prefix "${QUEUE_PREFIX}")`);
console.log(`  mongo   : ${(process.env.DATABASE_URL || 'MISSING').replace(/\/\/[^@]*@/, '//<creds>@')}`);
console.log(`  tl index: ${process.env.TWELVE_LABS_INDEX_ID || 'MISSING'}`);
