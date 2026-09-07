import { NextRequest, NextResponse } from 'next/server';
import { TwelveLabs } from 'twelvelabs-js';
import connectToDatabase from '@/lib/db';
import { Video } from '@/models/Video';

export async function POST(request: NextRequest) {
  try {
    const { query, videoId } = await request.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required.' }, { status: 400 });
    }

    const indexId = process.env.TWELVE_LABS_INDEX_ID;
    if (!indexId || indexId === 'your_index_id_here') {
      throw new Error('TWELVE_LABS_INDEX_ID is not configured');
    }

    const apiKey = process.env.TWELVE_LABS_API_KEY;
    if (!apiKey) {
      throw new Error('TWELVE_LABS_API_KEY is not configured');
    }

    // Always create a fresh client so env changes are picked up
    const client = new TwelveLabs({ apiKey });

    await connectToDatabase();

    // If a specific video is requested, look up its Twelve Labs ID for filtering
    let filterStr: string | undefined;
    if (videoId) {
      const video = await Video.findById(videoId).lean();
      if (video?.twelvelabs_video_id) {
        filterStr = JSON.stringify({ id: [video.twelvelabs_video_id] });
        console.log(`[Search] Filtering to TL video: ${video.twelvelabs_video_id}`);
      } else {
        console.warn(`[Search] Video ${videoId} has no twelvelabs_video_id — not indexed yet`);
        return NextResponse.json({
          results: [],
          warning: 'This video is not fully indexed yet. Please wait for processing to complete.',
        });
      }
    }

    console.log(`[Search] Query: "${query}" | Filter: ${filterStr || 'none'}`);

    // Search Twelve Labs
    const searchResults = await client.search.create({
      indexId,
      queryText: query,
      searchOptions: ['visual'],
      groupBy: 'clip',
      pageLimit: 10,
      filter: filterStr,
    });

    console.log(`[Search] Got ${searchResults.data?.length || 0} results`);

    if (!searchResults.data || searchResults.data.length === 0) {
      return NextResponse.json({ results: [] });
    }

    // Extract unique Twelve Labs Video IDs from results
    const tlVideoIds = [...new Set(searchResults.data.map(clip => clip.videoId))];

    // Fetch Metadata from MongoDB based on Twelve Labs Video IDs
    const videos = await Video.find({ twelvelabs_video_id: { $in: tlVideoIds } }).lean();

    // Format Results
    const formattedResults = searchResults.data.map(clip => {
      const video = videos.find(v => v.twelvelabs_video_id === clip.videoId);
      if (!video) return null;

      return {
        score: 1 - ((clip.rank as unknown as number) || 0) * 0.05,
        video_id: video._id,
        filename: video.filename,
        storage_path: video.storage_path,
        start_seconds: clip.start ?? 0,
        end_seconds: clip.end ?? 0,
        description: `Match at ${clip.start}s – ${clip.end}s`,
      };
    }).filter(Boolean);

    return NextResponse.json({ results: formattedResults });

  } catch (error: unknown) {
    console.error('Search Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
