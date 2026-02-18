import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcrypt";
import { connectDB } from "@/lib/db";
import AdminUser from "@/lib/model/adminUser";
import { TOKEN_NAME } from "../../utils";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

async function getAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload;
  } catch {
    return null;
  }
}

export async function PUT(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const { currentPassword, newPassword } = await req.json();

  if (!currentPassword || !newPassword) {
    return NextResponse.json({
      success: false,
      message: "All fields are required",
    }, { status: 400 });
  }

  if (newPassword.length < 6) {
    return NextResponse.json({
      success: false,
      message: "Password must be at least 6 characters",
    }, { status: 400 });
  }

  const user = await AdminUser.findById(admin.id);
  if (!user) {
    return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
  }

  // Verify current password
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return NextResponse.json({
      success: false,
      message: "Current password is incorrect",
    }, { status: 400 });
  }

  // Hash new password
  const salt = await bcrypt.genSalt(12);
  user.password = await bcrypt.hash(newPassword, salt);
  await user.save();

  return NextResponse.json({
    success: true,
    message: "Password changed successfully",
  });
}