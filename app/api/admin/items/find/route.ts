import { getAdmin } from "@/app/api/auth/verify/route";
import { VILLAGES_NAME_NEW } from "@/app/api/newvoter/utils";

import { connectDB } from "@/lib/db";
import VoterData from "@/lib/model/votersData";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const admin = await getAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
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

    const serial = parseInt(serialNumber, 10);       // ✅ Fix: parse
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

    // ─── Database Query ───
    await connectDB();

    // ✅ Fix: find() → একই serial+village এ ২ জন থাকতে পারে
    // ✅ Fix: serial (Number) পাঠাচ্ছি, string না
    const voters = await VoterData.find({
      serialNumber: serial,
      village: village,
    })
      .select("-__v")
      .lean();

    if (!voters || voters.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "কোনো ভোটার পাওয়া যায়নি",
          data: null,
        },
        { status: 404 }
      );
    }

    // ✅ response data clean
    const cleanData = voters.map((voter) => ({
      _id: voter._id,
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
    }));

    return NextResponse.json({
      success: true,
      message: `${cleanData.length} জন ভোটার পাওয়া গেছে`,
      total: cleanData.length,
      data: cleanData,
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