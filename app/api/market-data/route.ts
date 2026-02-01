import { NextResponse } from 'next/server';
import { fetchTrendingTokens, fetchYieldOpportunities } from '@/warden-bot/tools';

export async function GET() {
  try {
    // Parallelize requests for speed
    const [trendingData, yieldsData] = await Promise.all([
      fetchTrendingTokens("base"),
      fetchYieldOpportunities("base")
    ]);

    return NextResponse.json({
      trending: trendingData.tokens || [],
      yields: yieldsData || []
    });
  } catch (error) {
    console.error('Market Data API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch market data' }, { status: 500 });
  }
}
