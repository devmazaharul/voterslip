import { connectDB } from '@/lib/db';
import Voter from '@/lib/model/user';
import { NextRequest, NextResponse } from 'next/server';

const API_BASE =
  'https://voterinfoapi.amarvoterslip.com/api/v1/voters/filter';

export async function GET(request: NextRequest) {
  try {
    // ─── Query Params নাও ───
    const { searchParams } = new URL(request.url);
    const wardId = searchParams.get('wardId');
    const centerId = searchParams.get('centerId');
    const dateOfBirth = searchParams.get('dateOfBirth');

    // ─── Validation ───
    if (!wardId || !centerId || !dateOfBirth) {
      return NextResponse.json(
        {
          statusCode: 400,
          success: false,
          message: 'wardId, centerId এবং dateOfBirth দিতে হবে।',
          data: [],
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // ─── Date format check (YYYY-MM-DD) ───
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateOfBirth)) {
      return NextResponse.json(
        {
          statusCode: 400,
          success: false,
          message: 'dateOfBirth অবশ্যই YYYY-MM-DD ফরম্যাটে হতে হবে।',
          data: [],
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // ─── External API Call (Server-side → No CORS) ───
    const url = new URL(API_BASE);
    url.searchParams.set('wardId', wardId);
    url.searchParams.set('centerId', centerId);
    url.searchParams.set('dateOfBirth', dateOfBirth);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      // ─── Cache 60 seconds (optional) ───
      next: { revalidate: 60 },
    });

    // ─── Handle external API errors ───
    if (!response.ok) {
      const errorText = await response.text();
      console.error('External API Error:', response.status, errorText);

      return NextResponse.json(
        {
          statusCode: response.status,
          success: false,
          message: 'বাহ্যিক সার্ভার থেকে তথ্য পাওয়া যায়নি।',
          data: [],
          timestamp: new Date().toISOString(),
        },
        { status: response.status }
      );
    }

    // ─── Parse & return ───
    const data = await response.json();
    const voterData=data.data[0]
    await connectDB()

    await Voter.create({
      name: voterData.voterName,
       dateOfBirth: new Date(voterData.dob),
      serialNumber: Number(voterData.serialNo),
     });



    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('API Route Error:', error);

    return NextResponse.json(
      {
        statusCode: 500,
        success: false,
        message: 'সার্ভারে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।',
        data: [],
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}