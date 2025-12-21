"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import {
  Building2Icon,
  LayoutDashboardIcon,
  FolderKanbanIcon,
  FileTextIcon,
  BarChart3Icon,
  SettingsIcon,
  LogOutIcon,
  ChevronLeftIcon,
  MenuIcon,
  PlusIcon,
  ClipboardListIcon,
} from "@/components/icons"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import type { Profile } from "@/lib/types"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon },
  { name: "Projects", href: "/dashboard/projects", icon: FolderKanbanIcon },
  { name: "Progress", href: "/dashboard/progress", icon: ClipboardListIcon },
  { name: "Documents", href: "/dashboard/documents", icon: FileTextIcon },
  { name: "Reports", href: "/dashboard/reports", icon: BarChart3Icon },
]

interface SidebarProps {
  profile: Profile
}

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  const handleSignOut = async () => {
    // Clear user data from localStorage
    localStorage.removeItem('user')
    // Clear auth token
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    // Redirect to login
    router.push('/auth/login')
    router.refresh()
  }

  const canCreateProject = profile.role === "director" || profile.role === "project_engineer"

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setCollapsed(!collapsed)}
      >
        <MenuIcon className="h-5 w-5" />
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col bg-[#1E293B] transition-all duration-300",
          collapsed ? "w-16" : "w-64",
          "lg:translate-x-0",
          collapsed ? "-translate-x-full lg:translate-x-0" : "translate-x-0",
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-gray-700 px-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#E87A1E]">
            <Building2Icon className="h-6 w-6 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold text-white">PMS</h1>
              <p className="text-xs text-gray-400">Project Monitoring</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto hidden text-gray-400 hover:text-white lg:flex"
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronLeftIcon className={cn("h-5 w-5 transition-transform", collapsed && "rotate-180")} />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2">
          <div className="space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center rounded-md px-3 py-2 text-sm font-medium",
                  pathname === item.href
                    ? "bg-gray-800 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white",
                  collapsed ? "justify-center" : "justify-start"
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 flex-shrink-0",
                    collapsed ? "mr-0" : "mr-3"
                  )}
                  aria-hidden="true"
                />
                {!collapsed && item.name}
              </Link>
            ))}
          </div>
        </nav>

        {/* User section */}
        <div className="border-t border-gray-700 p-4">
          <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between")}>
            {!collapsed && (
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center text-white">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">{profile.name}</p>
                  <p className="text-xs text-gray-400">{profile.role}</p>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white"
              onClick={handleSignOut}
              title="Sign out"
            >
              <LogOutIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}