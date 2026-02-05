import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { UAParser } from 'ua-parser-js';
import SearchLog from '@/lib/model/user';
import { connectDB } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface VoterInfo {
  Id: number;
  Serial: string;
  CenterName: string;
  Name: string;
  Voter_No: string;
  Husband_Father: string;
  Mother: string;
  DOB_Bangla: string;
  AreaName: string;
  Occupation: string | null;
  Address: string | null;
}

interface ExternalApiResponse {
  Data: {
    draw: number;
    recordsFiltered: number;
    recordsTotal: number;
    data: VoterInfo[];
  };
  IsSuccess: boolean;
  Message: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { DOB, Ward } = body as { DOB?: string; Ward?: string };

    if (!DOB || !Ward) {
      return NextResponse.json(
        {
          IsSuccess: false,
          Message: 'DOB এবং Ward দুইটাই প্রয়োজন।',
          Data: { draw: 0, recordsFiltered: 0, recordsTotal: 0, data: [] },
        },
        { status: 400 }
      );
    }

    // ১) প্রথমে external voter API কল
    const externalRes = await axios.post<ExternalApiResponse>(
      'https://vapi.aesysit.com/api/Data/GetVoterInfoListByNameDOBWard',
      {
        DOB,
        Ward,
        Identification: 'kFdQLyS4tZM6ZzrbP4qlpg==:cVnDB/htIYd0eMY6OExRyg==',
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const apiData = externalRes.data;

    // ২) রেসপন্স থেকে প্রথম ভোটারের ডাটা নিয়ে resultForLog বানানো
    let resultForLog:
      | {
          name: string;
          father_name: string;
          sereal_no: string;
        }
      | null = null;

    if (apiData.IsSuccess && apiData.Data?.data?.length > 0) {
      const first = apiData.Data.data[0];
      resultForLog = {
        name: first.Name || '',
        father_name: first.Husband_Father || '',
        sereal_no: first.Serial || '',
      };
    }

    // ৩) User-Agent থেকে ডিভাইস ইনফো (ua-parser-js)
    const uaString = req.headers.get('user-agent') || '';
    const uaResult = UAParser(uaString); // এখানে সরাসরি result অবজেক্ট রিটার্ন হয়

    const deviceInfo = {
      browser: uaResult.browser.name || '',
      os: uaResult.os.name || '',
      deviceType: uaResult.device.type || 'Desktop',
      vendor: uaResult.device.vendor || '',
      model: uaResult.device.model || '',
    };

    // ৪) IP বের করা
    const ipHeader = req.headers.get('x-forwarded-for') || '';
    const ip =
      ipHeader.split(',')[0]?.trim() ||
      '0.0.0.0';

    // ৫) Geo info (optional)
    let network = {
      ip,
      city: '',
      region: '',
      country: '',
      isp: '',
      timezone: '',
    };

    try {
      if (
        ip &&
        ip !== '0.0.0.0' &&
        !ip.startsWith('127.') &&
        !ip.startsWith('::1')
      ) {
        const geoRes = await axios.get(`https://ipapi.co/${ip}/json/`);
        const g = geoRes.data;
        network = {
          ip,
          city: g.city || '',
          region: g.region || '',
          country: g.country_name || '',
          isp: g.org || '',
          timezone: g.timezone || '',
        };
      }
    } catch (geoErr) {
      console.warn('Geo lookup failed:', (geoErr as any)?.message || geoErr);
    }

    // ৬) Mongo তে লগ সেভ (result সহ)
    await connectDB();

    await SearchLog.create({
      searchCriteria: {
        dob: DOB,
        ward: Ward,
      },
      deviceInfo,
      network,
      result: resultForLog || undefined,
    });


    return NextResponse.json(apiData, { status: 200 });
  } catch (error: any) {
    console.error('Internal /api/voter error:', error?.message || error);
    return NextResponse.json(
      {
        IsSuccess: false,
        Message: 'ইন্টারনাল সার্ভার এরর হয়েছে।',
        Data: { draw: 0, recordsFiltered: 0, recordsTotal: 0, data: [] },
      },
      { status: 500 }
    );
  }
}