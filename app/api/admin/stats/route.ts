// app/api/voters/stats/route.ts
import { connectDB } from "@/lib/db";
import Voter from "@/lib/model/user";
import { NextResponse } from "next/server";
import { getAdmin } from "../password-change/route";

export async function GET() {
   const admin = await getAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

  try {
    await connectDB();

    const totalVoters = await Voter.countDocuments();

    // Today added
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayAdded = await Voter.countDocuments({
      createdAt: { $gte: today },
    });

    // This month added
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const thisMonthAdded = await Voter.countDocuments({
      createdAt: { $gte: monthStart },
    });

    // Latest serial number
    const latestVoter = await Voter.findOne().sort({ serialNumber: -1 });
    const latestSerial = latestVoter?.serialNumber || 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalVoters,
        todayAdded,
        thisMonthAdded,
        latestSerial,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}