// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { TOKEN_NAME, verifyToken } from "./app/api/utils";


// Kon kon route protect korte hobe
const protectedRoutes = ["/console"];
const authRoutes = ["/access",'/record'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(TOKEN_NAME)?.value;

  // Token verify koro
  let isAuthenticated = false;
  if (token) {
    const payload = await verifyToken(token);
    isAuthenticated = !!payload;
  }

  // Jodi login na thake tahole /access e pathao
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (isProtectedRoute && !isAuthenticated) {
    const url = new URL("/access", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // AUTH ROUTES: /access
  // Jodi already login thake tahole /admin e pathao
  const isAuthRoute = authRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/consoled", request.url));
  }

  return NextResponse.next();
}

// Middleware kon route e cholbe
export const config = {
  matcher: ["/console/:path*", "/access/:path*"],
};