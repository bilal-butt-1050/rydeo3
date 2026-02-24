import { NextResponse } from "next/server";

// Paths that require authentication
const protectedRoutes = ["/admin", "/driver", "/student"];

export function middleware(req) {
  const { pathname } = req.nextUrl;

  // Get token from cookie
  const token = req.cookies.get("token")?.value;

  // 1️⃣ Redirect root "/" to "/login"
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 2️⃣ Protect dashboard routes
  const isProtected = protectedRoutes.some((path) => pathname.startsWith(path));
  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 3️⃣ Prevent logged-in users from visiting login page
  if (pathname === "/login" && token) {
    // We don’t know role here; let login page redirect after hydration
    return NextResponse.next();
  }

  // 4️⃣ Allow everything else
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/admin/:path*", "/driver/:path*", "/student/:path*"],
};
