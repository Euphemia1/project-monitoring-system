import { NextResponse, type NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
    request,
  });

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/auth/login", "/auth/sign-up", "/auth/sign-up-success", "/auth/error"];
  const isPublicRoute = publicRoutes.some((route) => request.nextUrl.pathname.startsWith(route));

  // Check for auth token in cookies
  const token = request.cookies.get("auth-token")?.value;

  // If no token and not on a public route, redirect to login
  if (!token && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // If we have a token, verify it
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      // Token is valid, we can attach user info to headers if needed
      response.headers.set("x-user-id", (decoded as any).userId);
    } catch (error) {
      // Token is invalid, clear it and redirect to login if not on public route
      if (!isPublicRoute) {
        const url = request.nextUrl.clone();
        url.pathname = "/auth/login";
        const redirectResponse = NextResponse.redirect(url);
        redirectResponse.cookies.delete("auth-token");
        return redirectResponse;
      }
    }
  }

  return response;
}