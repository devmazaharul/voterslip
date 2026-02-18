import { connectDB } from "@/lib/db";
import Voter from "@/lib/model/user";
import { NextRequest, NextResponse } from "next/server";

// ─── PUT: Update voter ───
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const voter = await Voter.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!voter) {
      return NextResponse.json(
        { success: false, message: "Voter not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: voter,
      message: "Voter updated!",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// ─── DELETE: Delete voter ───
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const voter = await Voter.findByIdAndDelete(id);

    if (!voter) {
      return NextResponse.json(
        { success: false, message: "Voter not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Voter deleted!",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}