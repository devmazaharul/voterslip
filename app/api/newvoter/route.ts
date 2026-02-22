import { connectDB } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import {
  banglaDOBToDate,
  banglaSerialToNumber,
  banglaToEnglishDigits,
  banglaVoterNoToNumber,
} from "./utils";
import VoterData from "@/lib/model/votersData";

// ═══════════════════════════════════════════
//  Types — External API
// ═══════════════════════════════════════════

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

// ═══════════════════════════════════════════
//  Cleaned Voter — DB তে যা save হবে
//  ❌ userId নেই
//  ✅ voterNumber = number (unique)
//  ✅ সব digit ইংরেজিতে
// ═══════════════════════════════════════════

interface CleanedVoter {
  name: string;
  dateOfBirth: string;        // response এ string
  serialNumber: number;
  voterNumber: number;
  village: string;
  motherName: string;
  fatherOrHusbandName: string;
  pollingCenter: string;
  addedBy: string;
}

function cleanVoter(v: ExternalVoter): CleanedVoter {
  return {
    name: v.Name,
    dateOfBirth: banglaToEnglishDigits(v.DOB_Bangla),  // "01/01/1990"
    serialNumber: banglaSerialToNumber(v.Serial),       // 123
    voterNumber: banglaVoterNoToNumber(v.Voter_No),     // 123456789
    village: v.AreaName,
    motherName: v.Mother || "Unknown",
    fatherOrHusbandName: v.Husband_Father || "Unknown",
    pollingCenter: v.CenterName || "Unknown",
    addedBy: "system",
  };
}

// ═══════════════════════════════════════════
//  Config
// ═══════════════════════════════════════════

const EXTERNAL_URL =
  "https://vapi.aesysit.com/api/Data/GetVoterInfoListByNameDOBWard";

const DEFAULT_ID =
  process.env.VOTER_API_IDENTIFICATION ||
  "kFdQLyS4tZM6ZzrbP4qlpg==:cVnDB/htIYd0eMY6OExRyg==";

// ═══════════════════════════════════════════
//  JSON Response Builder
// ═══════════════════════════════════════════

function apiResponse(
  statusCode: number,
  success: boolean,
  message: string,
  data: CleanedVoter[] = [],
  extra: Record<string, unknown> = {}
) {
  return NextResponse.json(
    {
      statusCode,
      success,
      message,
      total: data.length,
      data,
      timestamp: new Date().toISOString(),
      ...extra,
    },
    { status: statusCode >= 500 ? statusCode : 200 }
  );
}

// ═══════════════════════════════════════════
//  POST /api/newvoter
// ═══════════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json();
    const { DOB, Ward, Identification } = body;

    // ── Validation ──
    if (!DOB || !Ward) {
      return apiResponse(400, false, "DOB এবং Ward দিতে হবে");
    }

    // ╔══════════════════════════════════════╗
    // ║  STEP 1 → External API Call         ║
    // ╚══════════════════════════════════════╝

    let externalRes: Response;

    try {
      externalRes = await fetch(EXTERNAL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          DOB,
          Ward,
          Identification: Identification || DEFAULT_ID,
          isArea: Ward !== "নরেন্দ্রপুর",
        }),
        signal: AbortSignal.timeout(15000),
      });
    } catch (fetchErr) {
      console.error("❌ External API fetch failed:", fetchErr);
      return apiResponse(
        502,
        false,
        "External API তে সংযোগ করা যায়নি",
        [],
        { source: "api_timeout" }
      );
    }

    if (!externalRes.ok) {
      return apiResponse(
        502,
        false,
        `External API error: ${externalRes.status} ${externalRes.statusText}`,
        [],
        { source: "api_error" }
      );
    }

    const externalData: ExternalAPIResponse = await externalRes.json();

    if (!externalData.IsSuccess) {
      return apiResponse(
        400,
        false,
        externalData.Message || "External API ব্যর্থ হয়েছে",
        [],
        { source: "api_error" }
      );
    }

    const rawVoters: ExternalVoter[] = externalData.Data?.data ?? [];

    if (rawVoters.length === 0) {
      return apiResponse(200, true, "কোনো ভোটার পাওয়া যায়নি", [], {
        source: "api",
      });
    }

    // ╔══════════════════════════════════════╗
    // ║  STEP 2 → Clean + Convert           ║
    // ║  সব ইংরেজিতে, null বাদ              ║
    // ║  voterNumber = number               ║
    // ╚══════════════════════════════════════╝

    const cleanedVoters = rawVoters.map(cleanVoter);

    // ╔══════════════════════════════════════════════╗
    // ║  STEP 3 → DB Save                           ║
    // ║  ❌ userId নেই                                ║
    // ║  ✅ voterNumber দিয়ে duplicate check          ║
    // ║  ✅ dateOfBirth → Date object                 ║
    // ╚══════════════════════════════════════════════╝

    let dbStats = { total: 0, newSaved: 0, existing: 0 };

    try {
      await connectDB();

      // DB তে save করার জন্য docs তৈরি
      const voterDocs = cleanedVoters.map((cv) => ({
        name: cv.name,
        dateOfBirth: banglaDOBToDate(cv.dateOfBirth),  // Date object
        serialNumber: cv.serialNumber,
        voterNumber: cv.voterNumber,                    // Number (unique)
        village: cv.village,
        motherName: cv.motherName,
        fatherOrHusbandName: cv.fatherOrHusbandName,
        pollingCenter: cv.pollingCenter,
        addedBy: "system" as const,
      }));

      // ── voterNumber দিয়ে duplicate check ──
      const allVoterNumbers = voterDocs.map((d) => d.voterNumber);

      const existingVoters = await VoterData.find(
        { voterNumber: { $in: allVoterNumbers } },
        { voterNumber: 1 }
      ).lean();

      const existingSet = new Set(
        existingVoters.map((e) => e.voterNumber as number)
      );

      const newVoters = voterDocs.filter(
        (d) => !existingSet.has(d.voterNumber)
      );

      // ── নতুনগুলো insert ──
      if (newVoters.length > 0) {
        await VoterData.insertMany(newVoters, { ordered: false });
      }

      dbStats = {
        total: voterDocs.length,
        newSaved: newVoters.length,
        existing: existingSet.size,
      };

      console.log(
        `📊 Total: ${dbStats.total} | New: ${dbStats.newSaved} | Exists: ${dbStats.existing}`
      );
    } catch (dbErr: unknown) {
      // duplicate key error ignore, বাকি log
      if (
        dbErr instanceof Error &&
        "code" in dbErr &&
        (dbErr as { code: number }).code === 11000
      ) {
        console.log("ℹ️ Duplicate voters skipped (11000)");
      } else {
        console.error("⚠️ DB save error:", dbErr);
      }
    }

    // ╔══════════════════════════════════════╗
    // ║  STEP 4 → Response                  ║
    // ╚══════════════════════════════════════╝

    return apiResponse(
      200,
      true,
      `${cleanedVoters.length} জন ভোটার পাওয়া গেছে`,
      cleanedVoters,
      {
        source: "api",
        db: dbStats,
      }
    );
  } catch (error: unknown) {
    console.error("❌ Voter API Error:", error);
    return apiResponse(500, false, "সার্ভার এরর হয়েছে");
  }
}