import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"

  if (code) {
    const supabase = await createClient()
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.session) {
      // The session should be automatically handled by Supabase
      // Just redirect to the next page
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return to error page if something went wrong
  return NextResponse.redirect(`${origin}/auth/error`)
}