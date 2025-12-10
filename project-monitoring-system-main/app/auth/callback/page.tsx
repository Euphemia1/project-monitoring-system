"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const supabase = createClient()
      
      // Check for error parameters
      const error = searchParams.get('error')
      const errorDescription = searchParams.get('error_description')
      
      if (error) {
        console.error('Auth error:', error, errorDescription)
        router.push('/auth/login?error=auth_failed')
        return
      }
      
      // Check for access token in URL (magic link or OAuth)
      const accessToken = searchParams.get('access_token')
      const refreshToken = searchParams.get('refresh_token')
      const tokenType = searchParams.get('token_type')
      
      if (accessToken && refreshToken && tokenType) {
        // Set the session for magic link or OAuth
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          router.push('/auth/login?error=session_failed')
          return
        }
        
        // Redirect to dashboard
        router.push('/dashboard')
        return
      }
      
      // Handle email confirmation
      // After email confirmation, Supabase should automatically sign in the user
      // Let's check if there's a session now
      const { data: { session }, error: sessionCheckError } = await supabase.auth.getSession()
      
      if (sessionCheckError) {
        console.error('Session check error:', sessionCheckError)
        router.push('/auth/login?error=confirmation_failed')
        return
      }
      
      // Even if no session, redirect to login with success message
      // because the email confirmation was successful
      router.push('/auth/login?message=email_confirmed')
    }

    handleAuthCallback()
  }, [router, searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#E87A1E] border-t-transparent mx-auto"></div>
        <p className="text-muted-foreground">Processing authentication...</p>
      </div>
    </div>
  )
}