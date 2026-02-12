import { connectDB } from "@/lib/db";
import Voter from "@/lib/model/user";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    const query: any = {};
    if (search.trim()) {
      const num = Number(search);
      if (!isNaN(num)) {
        query.serialNumber = num;
      } else {
        query.name = { $regex: search, $options: "i" };
      }
    }

    const [voters, total] = await Promise.all([
      Voter.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Voter.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: voters,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error", data: [] },
      { status: 500 }
    );
  }
}