import { connectDB } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { banglaDOBToDate, banglaSerialToNumber, banglaToEnglishDigits, generateUserId } from "./utils";
import Voter from "@/lib/model/voters";

// ─── External API Types ───
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

// ════════════════════════════════════════
// POST /api/voters
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

    await connectDB();

    // ╔═══════════════════════════════════════════════╗
    // ║ STEP 1: আগে Database এ খোঁজো               ║
    // ║ dateOfBirth + village দিয়ে চেক করো            ║
    // ╚═══════════════════════════════════════════════╝
    const searchDate = banglaDOBToDate(DOB);

    // Date range — same day match
    const dayStart = new Date(searchDate);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(searchDate);
    dayEnd.setUTCHours(23, 59, 59, 999);

    const dbResults = await Voter.find({
      village: Ward,
      dateOfBirth: { $gte: dayStart, $lte: dayEnd },
    }).lean();

    // ╔═══════════════════════════════════════════╗
    // ║ DB তে পাওয়া গেলে → সরাসরি return করো    ║
    // ╚═══════════════════════════════════════════╝
    if (dbResults.length > 0) {
      return NextResponse.json({
        statusCode: 200,
        success: true,
        message: `ডাটাবেস থেকে ${dbResults.length} জন ভোটার পাওয়া গেছে`,
        data: dbResults,
        source: "database",
        timestamp: new Date().toISOString(),
      });
    }

    // ╔═══════════════════════════════════════════════╗
    // ║ STEP 2: DB তে নেই → External API কল করো     ║
    // ╚═══════════════════════════════════════════════╝
    const externalRes = await fetch(EXTERNAL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        DOB,
        Ward,
        Identification: Identification || DEFAULT_ID,
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

    // ╔══════════════════════════════════════════════════╗
    // ║ STEP 3: External data → DB তে save করো         ║
    // ║ serialNumber + village দিয়ে ডুপ্লিকেট চেক      ║
    // ║ userId = hash(serialNumber + village)            ║
    // ╚══════════════════════════════════════════════════╝
    const savedVoters = [];

    for (const v of voters) {
      const serialNumber = banglaSerialToNumber(v.Serial);
      const village = v.AreaName;
      const usId = generateUserId(serialNumber, village);

      // ডুপ্লিকেট skip
      const exists = await Voter.findOne({ userId: usId });
      if (exists) {
        savedVoters.push(exists);
        continue;
      }

      try {
        const newVoter = await Voter.create({
          userId: usId,
          name: v.Name,
          dateOfBirth: banglaDOBToDate(v.DOB_Bangla),
          serialNumber,
          voterNumber: banglaToEnglishDigits(v.Voter_No),
          village,
          motherName: v.Mother || "Unknown",
          fatherOrHusbandName: v.Husband_Father || "Unknown",
          pollingCenter: v.CenterName || "Unknown",
          addedBy: "system",
        });
        savedVoters.push(newVoter);
      } catch (err) {
        // ডুপ্লিকেট key error হলে skip
        console.warn("Duplicate skip:", err);
        const existing = await Voter.findOne({
          serialNumber,
          village,
        });
        if (existing) savedVoters.push(existing);
      }
    }

    // ╔════════════════════════════════════╗
    // ║ STEP 4: Response return করো       ║
    // ╚════════════════════════════════════╝
    return NextResponse.json({
      statusCode: 200,
      success: true,
      message: `${savedVoters.length} জন ভোটার পাওয়া গেছে (API থেকে)`,
      data: savedVoters,
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