// app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { TOKEN_NAME } from "../../utils";

export async function POST() {
  const response = NextResponse.json(
    { success: true, message: "Logout successful!" },
    { status: 200 }
  );

  // Cookie delete koro
  response.cookies.set(TOKEN_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });

  return response;
}