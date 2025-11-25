import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2Icon, CheckCircleIcon, MailIcon } from "@/components/icons"

export default function SignUpSuccessPage() {
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
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#16A34A]/10">
              <CheckCircleIcon className="h-8 w-8 text-[#16A34A]" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">Account Created!</CardTitle>
            <CardDescription className="text-muted-foreground">
              Your account has been successfully created
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <MailIcon className="h-5 w-5 text-[#E87A1E]" />
                <span className="font-medium text-foreground">Check Your Email</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {
                  "We've sent a confirmation link to your email address. Please click the link to verify your account before signing in."
                }
              </p>
            </div>

            <div className="space-y-3">
              <Link href="/auth/login" className="block">
                <Button className="w-full h-11 bg-[#E87A1E] text-white hover:bg-[#D16A0E]">Go to Sign In</Button>
              </Link>
              <Link href="/" className="block">
                <Button variant="outline" className="w-full h-11 bg-transparent">
                  Return to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
