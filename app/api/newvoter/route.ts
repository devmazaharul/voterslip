// app/api/newvoter/route.ts
import { connectDB } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import {
  banglaDOBToDate,
  banglaSerialToNumber,
  banglaToEnglishDigits,
  generateUserId,
} from "./utils";
import Voter from "@/lib/model/voters";

// ─── Types ───
interface ExternalVoter {
  Id: number;
  Serial: string;
  Serial_Int: number | null;
  Gender: string | null;
  CenterName: string;
  Name: string;
  Voter_No: string;
  Husband_Father: string;
  Mother: string;
  Occupation: string | null;
  DOB_Bangla: string;
  AreaName: string;
  Address: string | null;
  Is_Father: boolean | null;
  Is_Migrated: boolean | null;
  Pdf_Information_Id: number;
  addedBy:string
}

interface ExternalAPIResponse {
  Data: {
    draw: number;
    recordsFiltered: number;
    recordsTotal: number;
    data: ExternalVoter[];
  };
  IsSuccess: boolean;
  Message: string;
}

interface RequestBody {
  DOB: string;
  Ward: string;
  Identification?: string;
}

const EXTERNAL_URL =
  "https://vapi.aesysit.com/api/Data/GetVoterInfoListByNameDOBWard";

const DEFAULT_ID =
  process.env.VOTER_API_IDENTIFICATION ||
  "kFdQLyS4tZM6ZzrbP4qlpg==:cVnDB/htIYd0eMY6OExRyg==";

// ─── Bangla DOB → English formatted date ───
// "০১/০১/২০০০" → "01/01/2000"
const banglaDateToEnglish = (banglaDob: string): string => {
  return banglaToEnglishDigits(banglaDob);
};

// ════════════════════════════════════════
// POST /api/newvoter
// ════════════════════════════════════════
export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json();
    const { DOB, Ward, Identification } = body;

    if (!DOB || !Ward) {
      return NextResponse.json(
        {
          statusCode: 400,
          success: false,
          message: "DOB এবং Ward দিতে হবে",
          data: [],
          source: null,
        },
        { status: 400 }
      );
    }

    // ╔══════════════════════════════════════════╗
    // ║ STEP 1: External API কল                  ║
    // ╚══════════════════════════════════════════╝
    const externalRes = await fetch(EXTERNAL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        DOB,
        Ward,
        Identification: Identification || DEFAULT_ID,
        isArea: Ward === "নরেন্দ্রপুর" ? false : true,
      }),
    });

    if (!externalRes.ok) {
      return NextResponse.json(
        {
          statusCode: 502,
          success: false,
          message: `External API error: ${externalRes.status}`,
          data: [],
          source: "api_error",
        },
        { status: 502 }
      );
    }

    const externalData: ExternalAPIResponse = await externalRes.json();

    if (!externalData.IsSuccess) {
      return NextResponse.json(
        {
          statusCode: 400,
          success: false,
          message: externalData.Message || "External API ব্যর্থ",
          data: [],
          source: "api_error",
        },
        { status: 400 }
      );
    }

    const voters: ExternalVoter[] = externalData.Data?.data || [];

    if (voters.length === 0) {
      return NextResponse.json({
        statusCode: 200,
        success: true,
        message: "কোনো ভোটার পাওয়া যায়নি",
        data: [],
        source: "api",
        timestamp: new Date().toISOString(),
      });
    }

    // ╔══════════════════════════════════════════╗
    // ║ STEP 2: সব English এ convert করো         ║
    // ╚══════════════════════════════════════════╝
    const responseData = voters.map((v) => ({
      name: v.Name,
      dateOfBirth: banglaDateToEnglish(v.DOB_Bangla),
      serialNumber: banglaSerialToNumber(v.Serial),
      voterNumber: banglaToEnglishDigits(v.Voter_No),
      village: v.AreaName,
      motherName: v.Mother || "Unknown",
      fatherOrHusbandName: v.Husband_Father || "Unknown",
      pollingCenter: v.CenterName || "Unknown",
      addedBy:"system"
    }));

    // ╔══════════════════════════════════════════╗
    // ║ STEP 3: DB তে save (নতুন হলে insert)     ║
    // ╚══════════════════════════════════════════╝
    try {
      await connectDB();

      const voterDocs = voters.map((v) => {
        const serialNumber = banglaSerialToNumber(v.Serial);
        const village = v.AreaName;
        return {
          userId: generateUserId(serialNumber, village),
          name: v.Name,
          dateOfBirth: banglaDOBToDate(v.DOB_Bangla),
          serialNumber,
          voterNumber: banglaToEnglishDigits(v.Voter_No),
          village,
          motherName: v.Mother || "Unknown",
          fatherOrHusbandName: v.Husband_Father || "Unknown",
          pollingCenter: v.CenterName || "Unknown",
          addedBy: "system" as const,
        };
      });

      const allUserIds = voterDocs.map((d) => d.userId);
      const existing = await Voter.find(
        { userId: { $in: allUserIds } },
        { userId: 1 }
      ).lean();
      const existingIds = new Set(existing.map((e) => e.userId));

      const newVoters = voterDocs.filter((d) => !existingIds.has(d.userId));

      if (newVoters.length > 0) {
        await Voter.insertMany(newVoters, { ordered: false });
      }

      // console.log(
      //   `✅ API: ${voters.length} | New: ${newVoters.length} | Skipped: ${existingIds.size}`
      // );
    } catch (dbErr) {
      console.warn("⚠️ DB save error:", dbErr);
    }

    // ╔══════════════════════════════════════════╗
    // ║ STEP 4: English data return               ║
    // ╚══════════════════════════════════════════╝
    return NextResponse.json({
      statusCode: 200,
      success: true,
      message: `${responseData.length} জন ভোটার পাওয়া গেছে`,
      data: responseData,
      source: "api",
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("Voter API Error:", error);
    return NextResponse.json(
      {
        statusCode: 500,
        success: false,
        message: "সার্ভার এরর হয়েছে",
        data: [],
        source: null,
      },
      { status: 500 }
    );
  }
}