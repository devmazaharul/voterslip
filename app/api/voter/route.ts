import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
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

// ক্লায়েন্টের IP বের করার ছোট হেল্পার
function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const ip = xff.split(',')[0].trim();
    if (ip) return ip;
  }

  const xReal = req.headers.get('x-real-ip');
  if (xReal) return xReal;

  // NextRequest.ip কিছু রানটাইমে থাকবে, কিছুতে নাও থাকতে পারে
  // @ts-ignore
  return req.ip || '::1';
}


// উপরে হেল্পার ফাংশন যোগ করো
function parseUserAgent(ua: string) {
  const lower = ua.toLowerCase();

  let browser = "Unknown";
  let os = "Unknown";
  let deviceType: "Mobile" | "Tablet" | "Desktop" = "Desktop";

  // Browser detect
  if (lower.includes("edg/")) {
    browser = "Edge";
  } else if (lower.includes("opr/") || lower.includes("opera")) {
    browser = "Opera";
  } else if (lower.includes("chrome/")) {
    browser = "Chrome";
  } else if (lower.includes("safari/") && !lower.includes("chrome/")) {
    browser = "Safari";
  } else if (lower.includes("firefox/")) {
    browser = "Firefox";
  }

  // OS detect
  if (lower.includes("windows nt")) {
    os = "Windows";
  } else if (lower.includes("android")) {
    os = "Android";
  } else if (lower.includes("iphone") || lower.includes("ipad") || lower.includes("ipod")) {
    os = "iOS";
  } else if (lower.includes("mac os x")) {
    os = "macOS";
  } else if (lower.includes("linux")) {
    os = "Linux";
  }

  // Device type
  if (/mobile|iphone|ipod|android.*mobile/i.test(ua)) {
    deviceType = "Mobile";
  } else if (/ipad|tablet/i.test(ua)) {
    deviceType = "Tablet";
  } else {
    deviceType = "Desktop";
  }

  return {
    browser,
    os,
    deviceType,
    vendor: "",
    model: "",
  };
}

// লোকাল / প্রাইভেট IP কিনা চেক
function isPrivateIp(ip: string): boolean {
  return (
    ip === '::1' ||
    ip === '127.0.0.1' ||
    ip === '0.0.0.0' ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    ip.startsWith('172.16.') ||
    ip.startsWith('172.17.') ||
    ip.startsWith('172.18.') ||
    ip.startsWith('172.19.') ||
    ip.startsWith('172.2') // খুব ডিটেল না, শুধু প্রাইভেট রেঞ্জ মোটামুটি কাভার
  );
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

    // ১) প্রথমে external voter API কল (আগের মতোই vapi.aesysit.com)
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

    // ৩) Simple device info (ua-parser-js ছাড়া)
    const userAgent = req.headers.get('user-agent') || '';

    const deviceInfo = parseUserAgent(userAgent)
    // ৪) IP বের করা
    let ip = getClientIp(req).trim();

    // ৫) Geo info (ip-api.com থেকে)
    let network = {
      ip,
      city: '',
      region: '',
      country: '',
      isp: '',
      timezone: '',
    };

    try {
      if (ip && !isPrivateIp(ip)) {
        // ip-api.com থেকে নেটওয়ার্ক/লোকেশন ডাটা
        // ফ্রি ভ্যারিয়েন্টে সাধারণত http ইউজ করা হয়
        const geoRes = await axios.get(`http://ip-api.com/json/${ip}`);
        const g = geoRes.data;

        if (g.status === 'success') {
          network = {
            ip,
            city: g.city || '',
            region: g.regionName || '',
            country: g.country || '',
            isp: g.isp || '',
            timezone: g.timezone || '',
          };
        }
      } else {
        // লোকাল / প্রাইভেট IP হলে শুধু ip রাখব, বাকি ফিল্ড ফাঁকা
        if (ip === '::1') {
          ip = '127.0.0.1';
        }
        network.ip = ip;
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

    // ৭) external API এর ডাটা 그대로 ক্লায়েন্টে ফেরত
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