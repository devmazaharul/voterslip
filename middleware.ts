import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isLoggedIn = req.cookies.get("admin_logged_in")?.value === "true";

  const isAuthRoute =
    pathname === "/verify" || pathname.startsWith("/api/auth");
  const isDashboardRoute = pathname.startsWith("/admin");
  const isProtectedApi =
    pathname.startsWith("/api/logs") 

  if (isLoggedIn && pathname === "/verify") {
    const url = new URL("/admin", req.url);
    return NextResponse.redirect(url);
  }

  // প্রটেক্টেড রুট: লগইন না থাকলে /login এ পাঠাও
  if ((isDashboardRoute || isProtectedApi) && !isLoggedIn) {
    const loginUrl = new URL("/verify", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // /login এবং /api/auth গুলো সবসময় allow
  if (isAuthRoute) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/verify",
    "/admin/:path*", // সব ড্যাশবোর্ড রুট
    "/api/logs",
    "/api/voter",
  ],
};