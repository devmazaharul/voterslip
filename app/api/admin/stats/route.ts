import { connectDB } from "@/lib/db";
import VoterData from "@/lib/model/votersData";

import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();

    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const monthStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    const [totalVoters, todayAdded, thisMonthAdded, latestVoter] =
      await Promise.all([
        VoterData.countDocuments(),
        VoterData.countDocuments({
          createdAt: { $gte: todayStart },
        }),
        VoterData.countDocuments({
          createdAt: { $gte: monthStart },
        }),
        VoterData.findOne()
          .sort({ serialNumber: -1 })
          .select("serialNumber")
          .lean(),
      ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalVoters,
        todayAdded,
        thisMonthAdded,
        latestSerial: latestVoter?.serialNumber || 0,
      },
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}