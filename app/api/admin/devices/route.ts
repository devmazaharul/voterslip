import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
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

// ─── GET Devices ───
export async function GET() {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const user = await AdminUser.findById(admin.id).select("deviceLogs");

  // Get current session token
  const cookieStore = await cookies();
  const currentToken = cookieStore.get(TOKEN_NAME)?.value || "";

  const devices = (user?.deviceLogs || []).map((d: any) => ({
    _id: d._id,
    deviceName: d.deviceName,
    browser: d.browser,
    os: d.os,
    ip: d.ip,
    loginAt: d.loginAt,
    lastActiveAt: d.lastActiveAt,
    isActive: d.isActive,
    location: d.location,
    isCurrent: d.sessionToken === currentToken,
  }));

  // Sort: current first, then by loginAt desc
  devices.sort((a: any, b: any) => {
    if (a.isCurrent) return -1;
    if (b.isCurrent) return 1;
    return new Date(b.loginAt).getTime() - new Date(a.loginAt).getTime();
  });

  return NextResponse.json({ success: true, devices });
}

// ─── DELETE Revoke Device ───
export async function DELETE(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const { searchParams } = new URL(req.url);
  const deviceId = searchParams.get("id");
  const revokeAll = searchParams.get("all") === "true";

  const cookieStore = await cookies();
  const currentToken = cookieStore.get(TOKEN_NAME)?.value || "";

  if (revokeAll) {
    // Revoke all except current
    await AdminUser.findByIdAndUpdate(admin.id, {
      $pull: {
        deviceLogs: { sessionToken: { $ne: currentToken } },
      },
    });

    return NextResponse.json({
      success: true,
      message: "All other sessions revoked",
    });
  }

  if (!deviceId) {
    return NextResponse.json({
      success: false,
      message: "Device ID required",
    }, { status: 400 });
  }

  // Check not revoking current device
  const user = await AdminUser.findById(admin.id);
  const device = user?.deviceLogs?.id(deviceId);

  if (device?.sessionToken === currentToken) {
    return NextResponse.json({
      success: false,
      message: "Cannot revoke current session",
    }, { status: 400 });
  }

  await AdminUser.findByIdAndUpdate(admin.id, {
    $pull: { deviceLogs: { _id: deviceId } },
  });

  return NextResponse.json({
    success: true,
    message: "Session revoked successfully",
  });
}