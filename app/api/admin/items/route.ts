import { NextRequest, NextResponse } from "next/server";
import { generateUserId } from "../../newvoter/utils";
import Voter from "@/lib/model/voters";
import { connectDB } from "@/lib/db";

// ─── GET: List Voters ───
export async function GET(req: NextRequest) {
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
    // ★ নতুন — village filter param
    const village = url.searchParams.get("village") || "";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {};

    // ★ Village exact match filter
    if (village) {
      filter.village = village;
    }

    if (search) {
      const serialNum = parseInt(search);
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { motherName: { $regex: search, $options: "i" } },
        { fatherOrHusbandName: { $regex: search, $options: "i" } },
        { village: { $regex: search, $options: "i" } },
        { serialNumber: { $regex: search, $options: "i" } },
        { pollingCenter: { $regex: search, $options: "i" } },
        { userId: { $regex: search, $options: "i" } },
        ...(isNaN(serialNum) ? [] : [{ serialNumber: serialNum }]),
      ];
    }

    if (fromDate || toDate) {
      filter.dateOfBirth = {};
      if (fromDate) filter.dateOfBirth.$gte = new Date(fromDate);
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        filter.dateOfBirth.$lte = to;
      }
    }

    const total = await Voter.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;
    const sortObj: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === "asc" ? 1 : -1,
    };

    const data = await Voter.find(filter)
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
    console.error("GET items error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

// ─── POST: Add Voter (addedBy = "self") ───
export async function POST(req: NextRequest) {
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

    // Validation
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

    // userId generate
    const userId = generateUserId(parseInt(serialNumber), village);

    // Duplicate check
    const exists = await Voter.findOne({ userId });
    if (exists) {
      return NextResponse.json(
        {
          success: false,
          message: `Serial #${serialNumber} ইতিমধ্যে "${village}" তে আছে`,
        },
        { status: 400 }
      );
    }

    const voter = await Voter.create({
      userId,
      name,
      dateOfBirth: new Date(dateOfBirth),
      serialNumber: parseInt(serialNumber),
      voterNumber,
      village,
      motherName: motherName || "Unknown",
      fatherOrHusbandName: fatherOrHusbandName || "Unknown",
      pollingCenter,
      addedBy: "self",
    });

    return NextResponse.json({
      success: true,
      message: "Voter added successfully",
      data: voter,
    });
  } catch (error) {
    console.error("POST items error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}