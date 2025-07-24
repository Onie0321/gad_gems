import { NextResponse } from "next/server";

export function middleware(request) {
  const path = request.nextUrl.pathname;
  console.log("=== Middleware Processing ===");
  console.log("Current path:", path);

  // Define public paths that don't require authentication
  const isPublicPath =
    path === "/" ||
    path === "/sign-in" ||
    path === "/sign-up" ||
    path === "/forgot-password" ||
    path === "/auth-callback";

  // Handle auth callback path
  if (path === "/auth-callback") {
    console.log("Handling auth callback path");
    return NextResponse.next();
  }

  // For public paths, allow access
  if (isPublicPath) {
    console.log("Public path, allowing access");
    return NextResponse.next();
  }

  // For protected paths, let the client-side handle auth check
  console.log("Protected path, proceeding with request");
  return NextResponse.next();
}

// Configure the paths that should be handled by the middleware
export const config = {
  matcher: [
    "/",
    "/sign-in",
    "/sign-up",
    "/forgot-password",
    "/auth-callback",
    "/admin/:path*",
    "/officer/:path*",
  ],
};
