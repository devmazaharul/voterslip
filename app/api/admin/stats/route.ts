import { connectDB } from "@/lib/db";
import Voter from "@/lib/model/voters";
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
        Voter.countDocuments(),
        Voter.countDocuments({
          createdAt: { $gte: todayStart },
        }),
        Voter.countDocuments({
          createdAt: { $gte: monthStart },
        }),
        Voter.findOne()
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