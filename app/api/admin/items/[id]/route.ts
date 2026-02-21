import { generateUserId } from "@/app/api/newvoter/utils";
import { connectDB } from "@/lib/db";
import Voter from "@/lib/model/voters";
import { NextRequest, NextResponse } from "next/server";

// ─── PUT: Edit Voter ───
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const voter = await Voter.findById(id);
    if (!voter) {
      return NextResponse.json(
        { success: false, message: "Voter not found" },
        { status: 404 }
      );
    }

    // system → edit blocked
    if (voter.addedBy === "system") {
      return NextResponse.json(
        {
          success: false,
          message: "System দ্বারা যোগ করা ভোটার এডিট করা যাবে না",
        },
        { status: 403 }
      );
    }

    const {
      name,
      dateOfBirth,
      serialNumber,
      voterNumber,
      village,
      motherName,
      fatherOrHusbandName,
      pollingCenter,
    } = body;

    // userId recalculate if serial or village changed
    const newSerial = parseInt(serialNumber) || voter.serialNumber;
    const newVillage = village || voter.village;
    const newUserId = generateUserId(newSerial, newVillage);

    const updated = await Voter.findByIdAndUpdate(
      id,
      {
        userId: newUserId,
        name,
        dateOfBirth: new Date(dateOfBirth),
        serialNumber: newSerial,
        voterNumber,
        village: newVillage,
        motherName: motherName || "Unknown",
        fatherOrHusbandName: fatherOrHusbandName || "Unknown",
        pollingCenter,
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      message: "Voter updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("PUT error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

// ─── DELETE ───

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const voter = await Voter.findById(id);
    if (!voter) {
      return NextResponse.json(
        { success: false, message: "Voter not found" },
        { status: 404 }
      );
    }

    if (voter.addedBy === "system") {
      return NextResponse.json(
        {
          success: false,
          message: "System ভোটার ডিলিট করা যাবে না",
        },
        { status: 403 }
      );
    }

    await Voter.findByIdAndDelete(id);
    return NextResponse.json({
      success: true,
      message: "Voter deleted successfully",
    });
  } catch (error) {
    console.error("DELETE error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}



