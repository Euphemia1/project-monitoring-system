"use client"

import { loginAction } from "../actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Building2Icon, Loader2Icon } from "@/components/icons"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (user) {
      router.push('/dashboard')
    }
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await loginAction(email, password)

      if (!result.success) {
        throw new Error(result.error || "Invalid email or password")
      }

      document.cookie = `auth-token=${result.token}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`

      if (result.user) {
        localStorage.setItem('user', JSON.stringify(result.user))
      }

      router.push('/dashboard')
    } catch (err: unknown) {
      console.error('Login error:', err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full">
      <div className="hidden lg:flex lg:w-1/2 bg-[#1E293B] flex-col justify-between p-12">
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
          <h2 className="text-4xl font-bold text-white mb-4">Monitor Your Construction Projects</h2>
          <p className="text-gray-400">Track progress, manage documents, and streamline approvals.</p>
        </div>

        <div className="flex items-center gap-8">
          <div>
            <p className="text-3xl font-bold text-[#E87A1E]">10+</p>
            <p className="text-sm text-gray-400">Districts</p>
          </div>
          <div className="h-12 w-px bg-gray-700" />
          <div>
            <p className="text-3xl font-bold text-[#E87A1E]">100%</p>
            <p className="text-sm text-gray-400">Digital</p>
          </div>
        </div>
      </div>

      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-none">
            <CardHeader>
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <CardDescription>Enter your credentials to access your account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link href="/forgot-password" className="text-sm text-[#E87A1E] hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                {error && (
                  <div className="text-sm text-red-500 p-2 bg-red-50 rounded-md">
                    {error}
                  </div>
                )}
                <Button type="submit" className="w-full bg-[#E87A1E] hover:bg-[#d46e1a]" disabled={isLoading}>
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