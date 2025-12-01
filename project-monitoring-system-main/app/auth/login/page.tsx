"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

function Building2Icon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
      <path d="M10 6h4" />
      <path d="M10 10h4" />
      <path d="M10 14h4" />
      <path d="M10 18h4" />
    </svg>
  )
}

function Loader2Icon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Login attempt with email:", email)
    
    // Validate inputs
    if (!email || !password) {
      setError("Please enter both email and password")
      return
    }
    
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      console.log("Attempting to sign in with Supabase...")
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      console.log("Supabase response:", { data, error })
      
      if (error) {
        console.error("Supabase login error:", error)
        throw error
      }

      console.log("Login successful, session data:", data)
      // Small delay to ensure session is properly set
      setTimeout(() => {
        console.log("Redirecting to dashboard...")
        router.push("/dashboard")
        router.refresh()
      }, 500)
    } catch (error: unknown) {
      console.error("Login error:", error)
      const errorMessage = error instanceof Error ? error.message : "An error occurred during login"
      setError(errorMessage)
      console.log("Login error message:", errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-800 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#E87A1E]">
            <Building2Icon className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">PMS</h1>
            <p className="text-sm text-gray-400">Project Monitoring System</p>
          </div>
        </div>

        <div>
          <h2 className="text-4xl font-bold text-white mb-4 text-balance">
            Monitor Your Construction Projects with Confidence
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            Track progress, manage documents, and streamline approvals across all your projects in Zambia.
          </p>
        </div>

        <div className="flex items-center gap-8">
          <div>
            <p className="text-3xl font-bold text-[#E87A1E]">10+</p>
            <p className="text-sm text-gray-400">Districts Covered</p>
          </div>
          <div className="h-12 w-px bg-gray-700" />
          <div>
            <p className="text-3xl font-bold text-[#E87A1E]">100%</p>
            <p className="text-sm text-gray-400">Digital Workflow</p>
          </div>
          <div className="h-12 w-px bg-gray-700" />
          <div>
            <p className="text-3xl font-bold text-[#E87A1E]">24/7</p>
            <p className="text-sm text-gray-400">Access Anywhere</p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex items-center justify-center gap-3 mb-8 lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#E87A1E]">
              <Building2Icon className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">PMS</h1>
              <p className="text-sm text-muted-foreground">Project Monitoring</p>
            </div>
          </div>

          <Card className="border-border shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-foreground">Welcome back</CardTitle>
              <CardDescription className="text-muted-foreground">
                Enter your credentials to access your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11"
                  />
                </div>

                {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

                <Button
                  type="submit"
                  className="w-full h-11 bg-[#E87A1E] text-white hover:bg-[#D16A0E]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                {"Don't have an account? "}
                <Link href="/auth/sign-up" className="font-medium text-[#E87A1E] hover:underline">
                  Request Access
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}