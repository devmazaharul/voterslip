// app/api/voters/route.ts (or wherever your route is)
import { connectDB } from "@/lib/db";
import Voter from "@/lib/model/user";
import { NextRequest, NextResponse } from "next/server";

const API_BASE =
  "https://voterinfoapi.amarvoterslip.com/api/v1/voters/filter";

export async function GET(request: NextRequest) {
  try {
    // ─── Query Params নাও ───
    const { searchParams } = new URL(request.url);
    const wardId = searchParams.get("wardId");
    const centerId = searchParams.get("centerId");
    const dateOfBirth = searchParams.get("dateOfBirth");

    // ─── Validation ───
    if (!wardId || !centerId || !dateOfBirth) {
      return NextResponse.json(
        {
          statusCode: 400,
          success: false,
          message:
            "কিছু তথ্য দেওয়া হয়নি। অনুগ্রহ করে ওয়ার্ড, কেন্দ্র নম্বর এবং জন্মতারিখ সব ঘর ঠিকভাবে পূরণ করে আবার চেষ্টা করুন।",
          data: [],
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // ─── Date format check (YYYY-MM-DD) ───
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateOfBirth)) {
      return NextResponse.json(
        {
          statusCode: 400,
          success: false,
          message:
            "জন্মতারিখ সঠিকভাবে দেওয়া হয়নি। উদাহরণ: 01/01/2001 (DD-MM-YYYY ফরম্যাট)। অনুগ্রহ করে এই ফরম্যাটে লিখে আবার চেষ্টা করুন।",
          data: [],
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // ─── External API Call ───
    const url = new URL(API_BASE);
    url.searchParams.set("wardId", wardId);
    url.searchParams.set("centerId", centerId);
    url.searchParams.set("dateOfBirth", dateOfBirth);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      next: { revalidate: 60 },
    });

    // ─── Handle external API errors ───
    if (!response.ok) {
      const errorText = await response.text();
      console.error("External API Error:", response.status, errorText);

      return NextResponse.json(
        {
          statusCode: response.status,
          success: false,
          message:
            "দুঃখিত, এই মুহূর্তে ভোটার তথ্যের সার্ভার থেকে ডাটা আনা যাচ্ছে না। আপনার ইন্টারনেট সংযোগ ঠিক আছে কি না দেখে, কিছুক্ষণ পরে আবার চেষ্টা করুন।",
          data: [],
          timestamp: new Date().toISOString(),
        },
        { status: response.status }
      );
    }

    // ─── Parse response ───
    const data = await response.json();

    // ─── No voter found case ───
    if (!data || !Array.isArray(data.data) || data.data.length === 0) {
      return NextResponse.json(
        {
          statusCode: 404,
          success: false,
          message:
            "দুঃখিত, আপনার দেওয়া তথ্য দিয়ে কোনো ভোটার খুঁজে পাওয়া যায়নি। অনুগ্রহ করে ওয়ার্ড এবং জন্মতারিখ ঠিক আছে কি না যাচাই করে আবার চেষ্টা করুন।",
          data: [],
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    // ══════════════════════════════════════════════
    // ─── DATABASE SAVE: Duplicate Check + Bulk ───
    // ══════════════════════════════════════════════

    await connectDB();

    // ① External API theke je shob voter ashlo, shob gulor serial number collect koro
    const allVoters = data.data;
    const allSerialNumbers = allVoters.map((v: any) => Number(v.serialNo));

    // ② Database e check koro kon kon serial already ache
    const existingVoters = await Voter.find({
      serialNumber: { $in: allSerialNumbers },
    }).select("serialNumber");

    // ③ Already existing serial number er ekta Set banao (fast lookup)
    const existingSerials = new Set(
      existingVoters.map((v) => v.serialNumber)
    );

    // ④ Filter koro - je gula database e NAI, shudhu shei gula rakh
    const newVoters = allVoters
      .filter((v: any) => !existingSerials.has(Number(v.serialNo)))
      .map((v: any) => ({
        name: v.voterName,
        dateOfBirth: new Date(v.dob),
        serialNumber: Number(v.serialNo),
      }));

    // ⑤ Jodi new voter thake tahole bulk insert koro
    if (newVoters.length > 0) {
      await Voter.insertMany(newVoters, {
        ordered: false, // ekta fail korleo baki gula insert hobe
      });
    }

    // ─── Success response ───
    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    console.error("API Route Error:", error);

    return NextResponse.json(
      {
        statusCode: 500,
        success: false,
        message:
          "দুঃখিত, আমাদের সার্ভারে একটি সমস্যা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পরে আবার চেষ্টা করুন।",
        data: [],
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}