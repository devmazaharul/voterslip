// app/api/voters/route.ts
import { connectDB } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getAdmin } from "../password-change/route";
import VoterUser from "@/lib/model/voters";

// ─── GET: List voters with search, filter, pagination ───
export async function GET(request: NextRequest) {
   const admin = await getAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    // Query params
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const fromDate = searchParams.get("fromDate") || "";
    const toDate = searchParams.get("toDate") || "";

    // Build query
    const query: any = {};

    // Search by name or serial number
    if (search) {
      const searchNum = parseInt(search);
      if (!isNaN(searchNum)) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { serialNumber: searchNum },
        ];
      } else {
        query.name = { $regex: search, $options: "i" };
      }
    }

    // // Date of birth filter
    // if (fromDate || toDate) {
    //   query.dateOfBirth = {};
    //   if (fromDate) query.dateOfBirth.$gte = new Date(fromDate);
    //   if (toDate) query.dateOfBirth.$lte = new Date(toDate);
    // }


    if (fromDate || toDate) {
      query.updatedAt = {};
      if (fromDate) query.updatedAt.$gte = new Date(fromDate);
      
      if (toDate) {
        // toDate er diner ekdom shesh somoy (23:59:59) set korar jonno
        const endOfDay = new Date(toDate);
        endOfDay.setUTCHours(23, 59, 59, 999); 
        query.updatedAt.$lte = endOfDay;
      }
    }


    // Sort
    const sort: any = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Pagination
    const skip = (page - 1) * limit;
    const total = await VoterUser.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Fetch voters
    const voters = await VoterUser.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      data: voters,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// ─── POST: Create new voter ───
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, dateOfBirth, serialNumber,villageName } = body;

    if (!name || !dateOfBirth || !serialNumber) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    // Check duplicate serial
    const existing = await VoterUser.findOne({ serialNumber,villageName });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "Serial number already exists" },
        { status: 409 }
      );
    }

    const voter = await VoterUser.create({ name, dateOfBirth, serialNumber,villageName });

    return NextResponse.json(
      { success: true, data: voter, message: "Voter created!" },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}