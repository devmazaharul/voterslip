import { connectDB } from "@/lib/db";
import VoterUser from "@/lib/model/voters";
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

    // system দিয়ে যোগ হলে এডিট করা যাবে না
    const voter = await VoterUser.findById(id);
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
          message: "System দ্বারা যোগ করা ভোটার এডিট করা যাবে না",
        },
        { status: 403 }
      );
    }

    const {
      name,
      dateOfBirth,
      serialNumber,
      villageName,
      mother,
      husband_father,
    } = body;

    const updated = await VoterUser.findByIdAndUpdate(
      id,
      {
        name,
        dateOfBirth: new Date(dateOfBirth),
        serialNumber,
        villageName,
        mother,
        husband_father,
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

// ─── DELETE: Delete Voter ───
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const voter = await VoterUser.findById(id);
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
          message: "System দ্বারা যোগ করা ভোটার ডিলিট করা যাবে না",
        },
        { status: 403 }
      );
    }

    await VoterUser.findByIdAndDelete(id);

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