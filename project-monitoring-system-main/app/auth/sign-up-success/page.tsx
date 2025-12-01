import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

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

function CheckCircleIcon({ className }: { className?: string }) {
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
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function MailIcon({ className }: { className?: string }) {
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
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

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