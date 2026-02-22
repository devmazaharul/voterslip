import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import AdminUser from "@/lib/model/adminUser";
import { getAdmin } from "../../auth/verify/route";

// ─── GET Profile ───
export async function GET() {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const user = await AdminUser.findById(admin.id).select("-password -passwordResetToken -passwordResetExpires");
  if (!user) {
    return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    profile: {
      _id: user._id,
      name: user.name,
      phoneNumber: user.phoneNumber,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });
}

// ─── PUT Update Profile ───
export async function PUT(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const { name, phoneNumber } = await req.json();

  // Check if phone already taken by another admin
  if (phoneNumber) {
    const existing = await AdminUser.findOne({
      phoneNumber,
      _id: { $ne: admin.id },
    });
    if (existing) {
      return NextResponse.json({
        success: false,
        message: "Phone number already in use",
      }, { status: 400 });
    }
  }

  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (phoneNumber) updateData.phoneNumber = phoneNumber;

  const user = await AdminUser.findByIdAndUpdate(admin.id, updateData, { new: true })
    .select("-password -passwordResetToken -passwordResetExpires");

  return NextResponse.json({
    success: true,
    message: "Profile updated successfully",
    profile: {
      name: user.name,
      phoneNumber: user.phoneNumber,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
    },
  });
}