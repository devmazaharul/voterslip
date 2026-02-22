import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import VoterData from "@/lib/model/votersData";
import { getAdmin } from "../password-change/route";


// ─── GET: List Voters ───
export async function GET(req: NextRequest) {
    const admin = await getAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
  try {
    await connectDB();

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const search = url.searchParams.get("search") || "";
    const sortBy = url.searchParams.get("sortBy") || "createdAt";
    const sortOrder = url.searchParams.get("sortOrder") || "desc";
    const fromDate = url.searchParams.get("fromDate") || "";
    const toDate = url.searchParams.get("toDate") || "";
    const village = url.searchParams.get("village") || "";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {};

    // ── Village exact match ──
    if (village) {
      filter.village = village;
    }

    // ── Search ──
    if (search) {
      const searchTrimmed = search.trim();
      const searchAsNum = parseInt(searchTrimmed, 10);
      const isNumericSearch = !isNaN(searchAsNum) && searchAsNum > 0;

      if (isNumericSearch) {
        // ✅ নম্বর দিয়ে সার্চ → serialNumber বা voterNumber
        filter.$or = [
          { serialNumber: searchAsNum },
          { voterNumber: searchAsNum },
        ];
      } else {
        // ✅ টেক্সট দিয়ে সার্চ → name, village, etc.
        filter.$or = [
          { name: { $regex: searchTrimmed, $options: "i" } },
          { motherName: { $regex: searchTrimmed, $options: "i" } },
          { fatherOrHusbandName: { $regex: searchTrimmed, $options: "i" } },
          { village: { $regex: searchTrimmed, $options: "i" } },
          { pollingCenter: { $regex: searchTrimmed, $options: "i" } },
        ];
      }
    }

    // ── Date filter ──
    if (fromDate || toDate) {
      filter.dateOfBirth = {};
      if (fromDate) filter.dateOfBirth.$gte = new Date(fromDate);
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        filter.dateOfBirth.$lte = to;
      }
    }

    const total = await VoterData.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;
    const sortObj: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === "asc" ? 1 : -1,
    };

    const data = await VoterData.find(filter)
      .select("-__v")                                   // ✅ __v বাদ
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("GET voters error:", error);
    return NextResponse.json(
      { success: false, message: "সার্ভারে সমস্যা হয়েছে" },
      { status: 500 }
    );
  }
}

// ─── POST: Add Voter (addedBy = "self") ───
export async function POST(req: NextRequest) {
    const admin = await getAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
  try {
    await connectDB();

    const body = await req.json();
    const {
      name,
      dateOfBirth,
      serialNumber,
      voterNumber,
      village,
      motherName,
      fatherOrHusbandName,
      pollingCenter,
    } = body;

    // ── Validation ──
    if (
      !name ||
      !dateOfBirth ||
      !serialNumber ||
      !voterNumber ||
      !village ||
      !pollingCenter
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "name, dateOfBirth, serialNumber, voterNumber, village, pollingCenter — সব দিতে হবে",
        },
        { status: 400 }
      );
    }

    // ✅ voterNumber → Number parse
    const voterNum = parseInt(String(voterNumber).trim(), 10);
    if (isNaN(voterNum) || voterNum <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "সঠিক ভোটার নম্বর দিন",
        },
        { status: 400 }
      );
    }

    // ✅ serialNumber → Number parse
    const serialNum = parseInt(String(serialNumber).trim(), 10);
    if (isNaN(serialNum) || serialNum <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "সঠিক ক্রমিক নম্বর দিন",
        },
        { status: 400 }
      );
    }

    // ── Duplicate check by voterNumber ──
    const exists = await VoterData.findOne({ voterNumber: voterNum });
    if (exists) {
      return NextResponse.json(
        {
          success: false,
          message: `ভোটার নম্বর ${voterNum} ইতিমধ্যে আছে`,
        },
        { status: 409 }
      );
    }

    // ── Create voter ──
    const voter = await VoterData.create({
      name: name.trim(),
      dateOfBirth: new Date(dateOfBirth),
      serialNumber: serialNum,                  // ✅ Number
      voterNumber: voterNum,                    // ✅ Number
      village: village.trim(),
      motherName: motherName?.trim() || "Unknown",
      fatherOrHusbandName: fatherOrHusbandName?.trim() || "Unknown",
      pollingCenter: pollingCenter.trim(),
      addedBy: "self",
    });

    return NextResponse.json(
      {
        success: true,
        message: "ভোটার সফলভাবে যোগ হয়েছে",
        data: voter,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST voter error:", error);
    return NextResponse.json(
      { success: false, message: "সার্ভারে সমস্যা হয়েছে" },
      { status: 500 }
    );
  }
}