import { NextRequest, NextResponse } from "next/server";
import { banglaDOBToDate, banglaSerialToNumber, banglaToEnglishDigits } from "./utils";
import { connectDB } from "@/lib/db";
import VoterUser from "@/lib/model/voters";

// ─── External API থেকে আসা টাইপ ───
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

// ─── Frontend এ পাঠানোর টাইপ ───
interface MappedVoter {
  id: number;
  voterAreaName: string;
  voterName: string;
  voterMother: string;
  voterFather: string;
  gender: string;
  dob: string;
  address: string;
  serialNo: string;
  nid: string;
  centerName: string | null;
}

// ─── Request Body টাইপ ───
interface RequestBody {
  DOB: string;            // "০১/০১/২০০১"
  Ward: string;         
  Identification?: string;
}

const EXTERNAL_URL =
  "https://vapi.aesysit.com/api/Data/GetVoterInfoListByNameDOBWard";

const DEFAULT_IDENTIFICATION =
  process.env.VOTER_API_IDENTIFICATION ||
  "kFdQLyS4tZM6ZzrbP4qlpg==:cVnDB/htIYd0eMY6OExRyg==";

// ─── Helper: Bangla DOB → ISO string ───
function banglaDOBToISO(banglaDOB: string): string {
  const eng = banglaToEnglishDigits(banglaDOB); // "01/01/2001"
  const [dd, mm, yyyy] = eng.split("/");
  return `${yyyy}-${mm}-${dd}`; // "2001-01-01"
}

// ════════════════════════════════════════
// POST /api/voters
// ════════════════════════════════════════
export async function POST(req: NextRequest) {
  try {
    // ── ১. Body পার্স ──
    const body: RequestBody = await req.json();
    const { DOB, Ward, Identification } = body;

    if (!DOB || !Ward) {
      return NextResponse.json(
        {
          statusCode: 400,
          success: false,
          message: "DOB এবং Ward দিতে হবে",
          data: [],
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // ── ২. External API কল ──
    const externalRes = await fetch(EXTERNAL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        DOB,
        Ward,
        Identification: Identification || DEFAULT_IDENTIFICATION,
        isArea:Ward=="নরেন্দ্রপুর"?false:true
      }),
    });

    if (!externalRes.ok) {
      return NextResponse.json(
        {
          statusCode: 502,
          success: false,
          message: `External API error: ${externalRes.status}`,
          data: [],
          timestamp: new Date().toISOString(),
        },
        { status: 502 }
      );
    }

    const externalData: ExternalAPIResponse = await externalRes.json();

    // ── ৩. সাকসেস চেক ──
    if (!externalData.IsSuccess) {
      return NextResponse.json(
        {
          statusCode: 400,
          success: false,
          message: externalData.Message || "External API ব্যর্থ",
          data: [],
          timestamp: new Date().toISOString(),
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
        timestamp: new Date().toISOString(),
      });
    }

    // ── ৪. MongoDB কানেক্ট + ডুপ্লিকেট চেক করে সেভ ──
    await connectDB();

    let insertedCount = 0;
    let skippedCount = 0;

    for (const voter of voters) {
      const serialNumber = banglaSerialToNumber(voter.Serial);
      const villageName = voter.AreaName;

      const exists = await VoterUser.findOne({ serialNumber, villageName });

      if (!exists) {
        await VoterUser.create({
          name: voter.Name,
          dateOfBirth: banglaDOBToDate(voter.DOB_Bangla),
          serialNumber,
          villageName,
          mother: voter.Mother,
          husband_father: voter.Husband_Father,
          addedBy: "system"
        });
        insertedCount++;
      } else {
        skippedCount++;
      }
    }

    // ── ৫. Frontend ফরম্যাটে ম্যাপ ──
    const mappedVoters: MappedVoter[] = voters.map((v) => ({
      id: v.Id,
      voterAreaName: v.AreaName,
      voterName: v.Name,
      voterMother: v.Mother,
      voterFather: v.Husband_Father,
      gender: v.Gender || "",
      dob: banglaDOBToISO(v.DOB_Bangla),
      address: v.Address || "",
      serialNo: banglaToEnglishDigits(v.Serial),
      nid: banglaToEnglishDigits(v.Voter_No),
      centerName: v.CenterName || null,
    }));

    // ── ৬. রেসপন্স ──
    return NextResponse.json({
      statusCode: 200,
      success: true,
      message: `${voters.length} জন ভোটার পাওয়া গেছে (নতুন: ${insertedCount}, আগে ছিল: ${skippedCount})`,
      data: mappedVoters,
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
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}


