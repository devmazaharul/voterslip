import AdminUser from "@/lib/model/adminUser";
import { NextRequest, NextResponse } from "next/server";
import { createToken, MAX_ADMINS_ALLOW, TOKEN_NAME } from "../../utils";
import { connectDB } from "@/lib/db";
import bcrypt from "bcrypt";

// ─── User Agent Parser ───
function parseUserAgent(ua: string) {
  let browser = "Unknown";
  if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("OPR/") || ua.includes("Opera")) browser = "Opera";
  else if (ua.includes("Chrome/") && !ua.includes("Edg/")) browser = "Chrome";
  else if (ua.includes("Firefox/")) browser = "Firefox";
  else if (ua.includes("Safari/") && !ua.includes("Chrome")) browser = "Safari";

  let os = "Unknown";
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS X")) os = "macOS";
  else if (ua.includes("iPhone")) os = "iOS (iPhone)";
  else if (ua.includes("iPad")) os = "iOS (iPad)";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("Linux")) os = "Linux";

  let deviceName = "Desktop";
  if (ua.includes("Mobile") || ua.includes("Android") || ua.includes("iPhone")) {
    deviceName = "Mobile";
  } else if (ua.includes("iPad") || ua.includes("Tablet")) {
    deviceName = "Tablet";
  }
  if (ua.includes("iPhone")) deviceName = "iPhone";
  if (ua.includes("iPad")) deviceName = "iPad";

  return { browser, os, deviceName };
}

// ─── Get Client IP ───
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIP = request.headers.get("x-real-ip");
  if (realIP) return realIP;
  const cfIP = request.headers.get("cf-connecting-ip");
  if (cfIP) return cfIP;
  return "Unknown";
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { name, phoneNumber, password, secretKey } = await request.json();

    // ─── Validation ───
    if (!name || !phoneNumber || !password) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    // ─── Secret Key Check (Optional Security Layer) ───
    // Set ADMIN_SECRET_KEY in your .env file
    const requiredSecret = process.env.ADMIN_SECRET_KEY;
    if (requiredSecret && secretKey !== requiredSecret) {
      return NextResponse.json(
        { success: false, message: "Invalid secret key" },
        { status: 403 }
      );
    }

    // ─── Phone Number Validation ───
    const phoneRegex = /^[0-9]{10,15}$/;
    if (!phoneRegex.test(phoneNumber.replace(/[+\-\s]/g, ""))) {
      return NextResponse.json(
        { success: false, message: "Invalid phone number format" },
        { status: 400 }
      );
    }

    // ─── Password Validation ───
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // ─── Name Validation ───
    if (name.trim().length < 2) {
      return NextResponse.json(
        { success: false, message: "Name must be at least 2 characters" },
        { status: 400 }
      );
    }

    // ─── Check if phone already exists ───
    const existingUser = await AdminUser.findOne({ phoneNumber });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "Phone number already registered" },
        { status: 409 }
      );
    }

    // ─── Optional: Limit total admins ───
    const adminCount = await AdminUser.countDocuments();
    const MAX_ADMINS = MAX_ADMINS_ALLOW
    if (adminCount >= MAX_ADMINS) {
      return NextResponse.json(
        { success: false, message: "Maximum admin limit reached" },
        { status: 403 }
      );
    }

    // ─── Hash Password ───
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // ─── Parse Device Info ───
    const userAgent = request.headers.get("user-agent") || "";
    const { browser, os, deviceName } = parseUserAgent(userAgent);
    const ip = getClientIP(request);

    // ─── Create User ───
    const newUser = await AdminUser.create({
      name: name.trim(),
      phoneNumber,
      password: hashedPassword,
      lastLogin: new Date(),
      deviceLogs: [],
    });

    // ─── Create JWT Token ───
    const token = await createToken({
      userId: newUser._id.toString(),
      phoneNumber: newUser.phoneNumber,
    });

    // ─── Create Device Log ───
    const deviceLog = {
      deviceName,
      browser,
      os,
      ip,
      loginAt: new Date(),
      lastActiveAt: new Date(),
      isActive: true,
      userAgent,
      location: "",
      sessionToken: token,
    };

    // ─── Push Device Log ───
    await AdminUser.findByIdAndUpdate(newUser._id, {
      $push: { deviceLogs: deviceLog },
    });

    // ─── Response ───
    const response = NextResponse.json(
      {
        success: true,
        message: "Account created successfully!",
        user: {
          id: newUser._id,
          name: newUser.name,
          phoneNumber: newUser.phoneNumber,
        },
      },
      { status: 201 }
    );

    // ─── Set Cookie (Auto Login) ───
    response.cookies.set(TOKEN_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Signup error:", error);

    // Duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: "Phone number already registered" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Server error occurred" },
      { status: 500 }
    );
  }
}