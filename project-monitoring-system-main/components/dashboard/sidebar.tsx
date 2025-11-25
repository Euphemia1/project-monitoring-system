"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
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
    const supabase = createClient()
    await supabase.auth.signOut()
    // Clear cookies
    document.cookie = "sb-access-token=; path=/; max-age=0"
    document.cookie = "sb-refresh-token=; path=/; max-age=0"
    router.push("/auth/login")
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

        {/* Quick Action */}
        {canCreateProject && (
          <div className="p-4 border-b border-gray-700">
            <Link href="/dashboard/projects/new">
              <Button
                className={cn("bg-[#E87A1E] text-white hover:bg-[#D16A0E]", collapsed ? "w-10 h-10 p-0" : "w-full")}
              >
                <PlusIcon className={cn("h-5 w-5", !collapsed && "mr-2")} />
                {!collapsed && "New Project"}
              </Button>
            </Link>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive ? "bg-[#E87A1E] text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && item.name}
              </Link>
            )
          })}
        </nav>

        {/* User Section */}
        <div className="border-t border-gray-700 p-4">
          {!collapsed && (
            <div className="mb-3 rounded-lg bg-gray-800 p-3">
              <p className="text-sm font-medium text-white truncate">{profile.full_name}</p>
              <p className="text-xs text-gray-400 capitalize">{profile.role.replace("_", " ")}</p>
            </div>
          )}
          <div className={cn("flex", collapsed ? "flex-col gap-2" : "gap-2")}>
            <Link href="/dashboard/settings" className={collapsed ? "" : "flex-1"}>
              <Button
                variant="ghost"
                size={collapsed ? "icon" : "sm"}
                className="text-gray-400 hover:text-white w-full"
              >
                <SettingsIcon className="h-4 w-4" />
                {!collapsed && <span className="ml-2">Settings</span>}
              </Button>
            </Link>
            <Button
              variant="ghost"
              size={collapsed ? "icon" : "sm"}
              className="text-gray-400 hover:text-white"
              onClick={handleSignOut}
            >
              <LogOutIcon className="h-4 w-4" />
              {!collapsed && <span className="ml-2">Sign Out</span>}
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {!collapsed && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setCollapsed(true)} />}
    </>
  )
}
