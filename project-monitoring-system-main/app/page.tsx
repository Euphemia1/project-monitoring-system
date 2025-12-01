import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

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

function ClipboardCheckIcon({ className }: { className?: string }) {
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
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="m9 14 2 2 4-4" />
    </svg>
  )
}

function FileTextIcon({ className }: { className?: string }) {
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
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </svg>
  )
}

function ShieldIcon({ className }: { className?: string }) {
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
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  )
}

function UsersIcon({ className }: { className?: string }) {
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
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function BarChart3Icon({ className }: { className?: string }) {
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
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-gray-300 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E87A1E]">
              <Building2Icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">PMS</h1>
              <p className="text-xs text-gray-600">Project Monitoring</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-gray-800 hover:text-[#E87A1E]">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button className="bg-[#E87A1E] text-white hover:bg-[#D16A0E]">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gray-800 py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2">
              <span className="h-2 w-2 rounded-full bg-[#E87A1E] animate-pulse" />
              <span className="text-sm font-medium text-amber-800">Trusted by Construction Companies in Zambia</span>
            </div>
            <h2 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl text-balance">
              Project Monitoring System
            </h2>
            <p className="mb-8 text-lg text-gray-200 leading-relaxed text-pretty">
              Streamline your construction project management with our comprehensive digital solution. Track progress,
              manage documents, and automate approvals - all in one place.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href="/auth/sign-up">
                <Button size="lg" className="w-full bg-[#E87A1E] text-white hover:bg-[#D16A0E] sm:w-auto">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-gray-400 text-white hover:bg-gray-700 sm:w-auto bg-transparent"
                >
                  Sign In to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h3 className="mb-4 text-3xl font-bold text-gray-800">Comprehensive Project Management</h3>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              Everything you need to monitor construction projects across all districts in Zambia
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<ClipboardCheckIcon className="h-8 w-8 text-[#E87A1E]" />}
              title="Progress Tracking"
              description="Monitor trade-by-trade progress with percentage completion and financial tracking"
            />
            <FeatureCard
              icon={<FileTextIcon className="h-8 w-8 text-[#E87A1E]" />}
              title="Document Management"
              description="Centralized storage for contracts, drawings, site instructions, and correspondence"
            />
            <FeatureCard
              icon={<UsersIcon className="h-8 w-8 text-[#E87A1E]" />}
              title="Role-Based Access"
              description="Directors, Project Engineers, Project Managers - each with appropriate permissions"
            />
            <FeatureCard
              icon={<ShieldIcon className="h-8 w-8 text-[#E87A1E]" />}
              title="Approval Workflows"
              description="Digital approval process for new projects with complete audit trails"
            />
            <FeatureCard
              icon={<BarChart3Icon className="h-8 w-8 text-[#E87A1E]" />}
              title="Comprehensive Reports"
              description="Generate summary reports, progress reports, and payment certificates"
            />
            <FeatureCard
              icon={<Building2Icon className="h-8 w-8 text-[#E87A1E]" />}
              title="Multi-District Support"
              description="Manage projects across 10 Zambian districts from a single dashboard"
            />
          </div>
        </div>
      </section>

      {/* Districts Section */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h3 className="mb-4 text-3xl font-bold text-gray-800">Serving Major Districts in Zambia</h3>
            <p className="text-gray-600">Active project monitoring across key regions</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              "Lusaka",
              "Ndola",
              "Kitwe",
              "Kabwe",
              "Chingola",
              "Livingstone",
              "Mufulira",
              "Luanshya",
              "Chipata",
              "Kasama",
            ].map((district) => (
              <div key={district} className="rounded-lg bg-gray-50 px-6 py-3 shadow-sm border border-gray-200">
                <span className="font-medium text-gray-800">{district}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-[#E87A1E]">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h3 className="mb-4 text-3xl font-bold text-white">Ready to Digitize Your Project Management?</h3>
          <p className="mb-8 text-lg text-white/90">
            Join construction companies already using PMS to streamline their operations
          </p>
          <Link href="/auth/sign-up">
            <Button size="lg" className="bg-white text-[#E87A1E] hover:bg-gray-100">
              Get Started Today
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-300 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E87A1E]">
                <Building2Icon className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-gray-800">Project Monitoring System</span>
            </div>
            <p className="text-sm text-gray-600">
              © {new Date().getFullYear()} PMS. Built for Construction Companies in Zambia.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-lg">
      <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-lg bg-amber-50 text-[#E87A1E]">
        {icon}
      </div>
      <h4 className="mb-2 text-xl font-semibold text-gray-800">{title}</h4>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}
