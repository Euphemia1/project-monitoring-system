import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
    request,
  })

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/auth/login", "/auth/sign-up", "/auth/sign-up-success", "/auth/error", "/auth/callback"]
  const isPublicRoute = publicRoutes.some((route) => request.nextUrl.pathname === route)

  // Check for auth token in cookies
  const accessToken = request.cookies.get("sb-access-token")?.value

  if (!accessToken && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  return response
}
