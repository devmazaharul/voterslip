// app/api/search/route.ts
import { connectDB } from "@/lib/db";
import { generateUserId, VILLAGES_NAME_NEW } from "@/app/api/newvoter/utils";
import { VILLAGES_NAME } from "@/app/api/utils";
import Voter from "@/lib/model/voters";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serialNumber = searchParams.get("serialNumber");
    const village = searchParams.get("village");

    // ─── Validation ───
    if (!serialNumber || !village) {
      return NextResponse.json(
        {
          success: false,
          message: "ক্রমিক নম্বর এবং গ্রামের নাম দুটোই দরকার",
          data: null,
        },
        { status: 400 }
      );
    }

    const serial = parseInt(serialNumber);
    if (isNaN(serial) || serial <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "সঠিক ক্রমিক নম্বর দিন",
          data: null,
        },
        { status: 400 }
      );
    }

    // ─── Village Validation ───
    if (!VILLAGES_NAME_NEW.includes(village)) {
      return NextResponse.json(
        {
          success: false,
          message: "সঠিক গ্রামের নাম নির্বাচন করুন",
          data: null,
        },
        { status: 400 }
      );
    }

    // ─── Generate userId (same hash as save time) ───
    const userId = generateUserId(serial, village);
 

    // ─── Database Query ───
    await connectDB();

    const voter = await Voter.findOne({ userId }).lean();

    if (!voter) {
      return NextResponse.json(
        {
          success: false,
          message: "কোনো ভোটার পাওয়া যায়নি",
          data: null,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "ভোটার পাওয়া গেছে",
      data: {
        _id: voter._id,
        userId: voter.userId,
        name: voter.name,
        dateOfBirth: voter.dateOfBirth,
        serialNumber: voter.serialNumber,
        voterNumber: voter.voterNumber,
        village: voter.village,
        motherName: voter.motherName,
        fatherOrHusbandName: voter.fatherOrHusbandName,
        pollingCenter: voter.pollingCenter,
        addedBy: voter.addedBy,
        createdAt: voter.createdAt,
      },
    });
  } catch (error: unknown) {
    console.error("Search error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "সার্ভারে সমস্যা হয়েছে",
        data: null,
      },
      { status: 500 }
    );
  }
}