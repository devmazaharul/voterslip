import { connectDB } from '@/lib/db';
import VoterStats from '@/lib/model/voterStats';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await connectDB();

    // সব গ্রামের stats নাও
    const stats = await VoterStats.find({})
      .sort({ totalChecks: -1 })
      .lean();

    // Overall summary বানাও
    const summary = {
      totalVillages: stats.length,
      totalChecks: stats.reduce((sum, s) => sum + s.totalChecks, 0),
      totalResultsServed: stats.reduce(
        (sum, s) => sum + s.totalResultsServed,
        0
      ),
      totalFromDB: stats.reduce((sum, s) => sum + s.fromDB, 0),
      totalFromAPI: stats.reduce((sum, s) => sum + s.fromAPI, 0),
    };

    return NextResponse.json({
      success: true,
      summary,
      stats,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}