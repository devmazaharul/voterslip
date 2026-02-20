import { connectDB } from "@/lib/db";
import VoterUser from "@/lib/model/voters";
import { NextRequest, NextResponse } from "next/server";

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {};

    if (search) {
      const serialNum = parseInt(search);
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { mother: { $regex: search, $options: "i" } },
        { husband_father: { $regex: search, $options: "i" } },
        { villageName: { $regex: search, $options: "i" } },
        ...(isNaN(serialNum) ? [] : [{ serialNumber: serialNum }]),
      ];
    }

    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = to;
      }
    }

    const total = await VoterUser.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    const sortObj: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === "asc" ? 1 : -1,
    };

    const data = await VoterUser.find(filter)
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
      villageName,
      mother,
      husband_father,
    } = body;

    if (
      !name ||
      !dateOfBirth ||
      !serialNumber ||
      !villageName ||
      !mother ||
      !husband_father
    ) {
      return NextResponse.json(
        { success: false, message: "সব ফিল্ড পূরণ করতে হবে" },
        { status: 400 }
      );
    }

    // ডুপ্লিকেট চেক
    const exists = await VoterUser.findOne({ serialNumber, villageName });
    if (exists) {
      return NextResponse.json(
        {
          success: false,
          message: `Serial #${serialNumber} ইতিমধ্যে ${villageName} তে আছে`,
        },
        { status: 400 }
      );
    }

    const voter = await VoterUser.create({
      name,
      dateOfBirth: new Date(dateOfBirth),
      serialNumber,
      villageName,
      mother,
      husband_father,
      addedBy: "self", // ← ম্যানুয়ালি যোগ করা = self
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