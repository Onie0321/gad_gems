import { NextResponse } from "next/server";

export function middleware(request) {
  const path = request.nextUrl.pathname;

  // Define public paths that don't require authentication
  const isPublicPath =
    path == "/" ||
    path === "/sign-in" ||
    path === "/sign-up" ||
    path === "/forgot-password";

  // Get the token from the cookies
  const token = request.cookies.get("authToken")?.value;

  // Allow access to admin and officer routes without redirection
  if (path.startsWith("/admin") || path.startsWith("/officer")) {
    return NextResponse.next();
  }

  // Redirect authenticated users away from auth pages
  if (isPublicPath && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Redirect unauthenticated users to sign-in
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

// Configure the paths that should be handled by the middleware
export const config = {
  matcher: [
    "/",
    "/sign-in",
    "/sign-up",
    "/forgot-password",
    "/admin/:path*",
    "/officer/:path*",
  ],
};
