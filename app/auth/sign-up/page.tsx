"use client"

import type React from "react"
import { registerUser } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Building2Icon, Loader2Icon } from "@/components/icons"
import type { District, UserRole } from "@/lib/types"

const USER_ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: "director", label: "Director", description: "Full access - approve projects, view all reports" },
  { value: "project_engineer", label: "Project Engineer", description: "Create and manage projects" },
  { value: "project_manager", label: "Project Manager", description: "Add progress reports and documents" },
  { value: "viewer", label: "Viewer", description: "Read-only access to reports" },
]

// Static districts for demo purposes
const DEMO_DISTRICTS: District[] = [
  { id: "1", name: "Lusaka", code: "LSK", created_at: "" },
  { id: "2", name: "Ndola", code: "NDL", created_at: "" },
  { id: "3", name: "Kitwe", code: "KTW", created_at: "" },
  { id: "4", name: "Kabwe", code: "KBW", created_at: "" },
  { id: "5", name: "Chingola", code: "CNC", created_at: "" },
  { id: "6", name: "Livingstone", code: "LVS", created_at: "" },
  { id: "7", name: "Mufulira", code: "MFL", created_at: "" },
  { id: "8", name: "Luanshya", code: "LNS", created_at: "" },
  { id: "9", name: "Chipata", code: "CPT", created_at: "" },
  { id: "10", name: "Kasama", code: "KSM", created_at: "" },
]

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [role, setRole] = useState<UserRole>("viewer")
  const [districtId, setDistrictId] = useState("")
  const [phone, setPhone] = useState("")
  const [districts, setDistricts] = useState<District[]>(DEMO_DISTRICTS)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const { getDistricts } = await import('./actions')
        const result = await getDistricts()
        if (result.success && result.data && result.data.length > 0) setDistricts(result.data)
      } catch {
        // Use demo districts if fetch fails
      }
    }
    fetchDistricts()
  }, [])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setIsLoading(false)
      return
    }

    try {
      const result = await registerUser(
        email,
        password,
        fullName,
        role,
        districtId || null,
        phone || null
      )

      if (result) {
        router.push("/auth/sign-up-success")
      } else {
        throw new Error("Failed to register user")
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full">
      {/* Left Side - Branding */}
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
          <h2 className="text-4xl font-bold text-white mb-4 text-balance">Join the Digital Construction Revolution</h2>
          <p className="text-gray-400 text-lg leading-relaxed mb-8">
            Request access to streamline your project monitoring workflow. Our team will review and approve your
            account.
          </p>

          <div className="space-y-4">
            {USER_ROLES.map((r) => (
              <div key={r.value} className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E87A1E]/20 mt-0.5">
                  <div className="h-2 w-2 rounded-full bg-[#E87A1E]" />
                </div>
                <div>
                  <p className="font-medium text-white">{r.label}</p>
                  <p className="text-sm text-gray-400">{r.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm text-gray-500">
          © {new Date().getFullYear()} Project Monitoring System. Built for Zambia.
        </p>
      </div>

      {/* Right Side - Sign Up Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 bg-background overflow-y-auto">
        <div className="w-full max-w-md py-8">
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
              <CardTitle className="text-2xl font-bold text-foreground">Create Account</CardTitle>
              <CardDescription className="text-muted-foreground">
                Fill in your details to request access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-foreground">
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Mwansa"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-11"
                  />
                </div>

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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-foreground">
                      Role
                    </Label>
                    <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {USER_ROLES.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="district" className="text-foreground">
                      District
                    </Label>
                    <Select value={districtId} onValueChange={setDistrictId}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select district" />
                      </SelectTrigger>
                      <SelectContent>
                        {districts.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-foreground">
                    Phone Number (Optional)
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+260 XXX XXX XXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-11"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-foreground">
                      Confirm Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-11"
                    />
                  </div>
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
                      Creating Account...
                    </>
                  ) : (
                    "Request Access"
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/auth/login" className="font-medium text-[#E87A1E] hover:underline">
                  Sign In
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
