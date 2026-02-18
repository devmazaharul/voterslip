import AdminUser from "@/lib/model/adminUser";
import { NextRequest, NextResponse } from "next/server";
import { createToken, TOKEN_NAME } from "../../utils";
import { connectDB } from "@/lib/db";
import bcrypt from "bcrypt";

// ─── User Agent Parser ───
function parseUserAgent(ua: string) {
  // Browser detect
  let browser = "Unknown";
  if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("OPR/") || ua.includes("Opera")) browser = "Opera";
  else if (ua.includes("Brave")) browser = "Brave";
  else if (ua.includes("Chrome/") && !ua.includes("Edg/")) browser = "Chrome";
  else if (ua.includes("Firefox/")) browser = "Firefox";
  else if (ua.includes("Safari/") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("MSIE") || ua.includes("Trident/")) browser = "IE";

  // OS detect
  let os = "Unknown";
  if (ua.includes("Windows NT 10")) os = "Windows 10";
  else if (ua.includes("Windows NT 11") || (ua.includes("Windows NT 10") && ua.includes("Win64"))) os = "Windows";
  else if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS X")) os = "macOS";
  else if (ua.includes("iPhone")) os = "iOS (iPhone)";
  else if (ua.includes("iPad")) os = "iOS (iPad)";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("CrOS")) os = "Chrome OS";

  // Device type
  let deviceName = "Desktop";
  if (ua.includes("Mobile") || ua.includes("Android") || ua.includes("iPhone")) {
    deviceName = "Mobile";
  } else if (ua.includes("iPad") || ua.includes("Tablet")) {
    deviceName = "Tablet";
  }

  // Try to get device model
  const androidMatch = ua.match(/Android[^;]*;\s*([^)]+)\)/);
  if (androidMatch) {
    const model = androidMatch[1].split("Build")[0].trim();
    if (model) deviceName = model;
  }

  if (ua.includes("iPhone")) deviceName = "iPhone";
  if (ua.includes("iPad")) deviceName = "iPad";

  return { browser, os, deviceName };
}

// ─── Get Client IP ───
function getClientIP(request: NextRequest): string {
  // Check common headers
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) return realIP;

  const cfIP = request.headers.get("cf-connecting-ip");
  if (cfIP) return cfIP;

  return "Unknown";
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { phoneNumber, password } = await request.json();

    // ─── Validation ───
    if (!phoneNumber || !password) {
      return NextResponse.json(
        { success: false, message: "Phone number & password lagbe" },
        { status: 400 }
      );
    }

    // ─── Find User ───
    const user = await AdminUser.findOne({ phoneNumber });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid phone number or password" },
        { status: 401 }
      );
    }

    // ─── Password Check ───
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: "Invalid phone number or password" },
        { status: 401 }
      );
    }

    // ─── Create JWT Token ───
    const token = await createToken({
      id: user._id.toString(),
      phoneNumber: user.phoneNumber,
    });

    // ─── Parse Device Info ───
    const userAgent = request.headers.get("user-agent") || "";
    const { browser, os, deviceName } = parseUserAgent(userAgent);
    const ip = getClientIP(request);

    // ─── Create Device Log Entry ───
    const deviceLog = {
      deviceName,
      browser,
      os,
      ip,
      loginAt: new Date(),
      lastActiveAt: new Date(),
      isActive: true,
      userAgent,
      location: "", // Can be filled later with IP geolocation
      sessionToken: token,
    };

    // ─── Limit device logs to last 10 (cleanup old ones) ───
    if (user.deviceLogs && user.deviceLogs.length >= 10) {
      // Remove oldest inactive sessions, keep max 10
      user.deviceLogs.sort(
        (a: any, b: any) =>
          new Date(b.loginAt).getTime() - new Date(a.loginAt).getTime()
      );
      user.deviceLogs = user.deviceLogs.slice(0, 9); // Keep 9, add 1 new = 10
    }

    // ─── Update User: lastLogin + push deviceLog ───
    await AdminUser.findByIdAndUpdate(user._id, {
      lastLogin: new Date(),
      $push: {
        deviceLogs: {
          $each: [deviceLog],
          $position: 0, // Add at beginning (newest first)
        },
      },
    });

    // ─── Response ───
    const response = NextResponse.json(
      {
        success: true,
        message: "Login successful!",
        user: {
          id: user._id,
          name: user.name,
          phoneNumber: user.phoneNumber,
        },
      },
      { status: 200 }
    );

    // ─── Set Cookie ───
    response.cookies.set(TOKEN_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, message: "Server error hoyeche" },
      { status: 500 }
    );
  }
}