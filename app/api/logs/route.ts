import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import SearchLog from '@/lib/model/user';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const sort = searchParams.get('sort') || 'desc'; // 'desc' | 'asc'
    const sortOrder = sort === 'asc' ? 1 : -1;

    const logs = await SearchLog.find({})
      .sort({ createdAt: sortOrder })
      .limit(limit)
      .lean();

    return NextResponse.json({ logs }, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/logs error:', error?.message || error);
    return NextResponse.json(
      { message: 'লগ লোড করতে সমস্যা হয়েছে।' },
      { status: 500 }
    );
  }
}