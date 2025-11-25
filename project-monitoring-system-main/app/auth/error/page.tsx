import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2Icon, AlertTriangleIcon } from "@/components/icons"

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#E87A1E]">
            <Building2Icon className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">PMS</h1>
            <p className="text-sm text-muted-foreground">Project Monitoring</p>
          </div>
        </div>

        <Card className="border-border shadow-lg text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangleIcon className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">Authentication Error</CardTitle>
            <CardDescription className="text-muted-foreground">
              Something went wrong during authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-muted-foreground">
              This could happen if your verification link has expired or was already used. Please try signing in or
              request a new verification email.
            </p>

            <div className="space-y-3">
              <Link href="/auth/login" className="block">
                <Button className="w-full h-11 bg-[#E87A1E] text-white hover:bg-[#D16A0E]">Try Sign In</Button>
              </Link>
              <Link href="/auth/sign-up" className="block">
                <Button variant="outline" className="w-full h-11 bg-transparent">
                  Create New Account
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
