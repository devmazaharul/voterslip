import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import {  VILLAGES_NAME } from "../../utils";
import VoterUser from "@/lib/model/voters";



export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serialNumber = searchParams.get("serialNumber");
    const villageName = searchParams.get("villageName");

    // ─── Validation ───
    if (!serialNumber || !villageName) {
      return NextResponse.json(
        {
          success: false,
          message: "ক্রমিক নম্বর এবং গ্রামের নাম দুটোই দরকার",
        },
        { status: 400 }
      );
    }

    const serial = parseInt(serialNumber);
    if (isNaN(serial) || serial <= 0) {
      return NextResponse.json(
        { success: false, message: "সঠিক ক্রমিক নম্বর দিন" },
        { status: 400 }
      );
    }

    // ─── Village Validation ───
    if (!VILLAGES_NAME.includes(villageName as any)) {
      return NextResponse.json(
        { success: false, message: "সঠিক গ্রামের নাম নির্বাচন করুন" },
        { status: 400 }
      );
    }

    // ─── Database Query (exact match) ───
    await connectDB();

    const voter = await VoterUser.findOne({
      serialNumber: serial,
      villageName: villageName,
    }).select("name dateOfBirth serialNumber villageName createdAt");

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
        name: voter.name,
        dateOfBirth: voter.dateOfBirth,
        serialNumber: voter.serialNumber,
        villageName: voter.villageName,
      },
    });
  } catch (error: any) {
    console.error("Search error:", error);
    return NextResponse.json(
      { success: false, message: "সার্ভারে সমস্যা হয়েছে" },
      { status: 500 }
    );
  }
}