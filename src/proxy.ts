import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;

  // Public routes
  const publicRoutes = ["/", "/auth/signin", "/auth/signup"];
  const isPublicRoute = publicRoutes.some((route) => pathname === route);
  const isJoinRoute = pathname.startsWith("/join/");
  const isApiRoute = pathname.startsWith("/api/");

  if (!isAuthenticated && !isPublicRoute && !isJoinRoute && !isApiRoute) {
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

