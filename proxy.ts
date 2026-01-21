import { updateSession } from "@/lib/auth-middleware"
import type { NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
    return await updateSession(request)
}

export const config = {
    runtime: 'nodejs',
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
}
