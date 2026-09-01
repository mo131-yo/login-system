import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const pathname = req.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith("/admin");
  const isProtectedRoute = pathname.startsWith("/dashboard") || isAdminRoute;

  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminRoute && req.auth?.user?.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }
});

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
