"use client"
import { useState } from "react";
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
  UserIcon,
  UsersIcon
} from "@/components/icons"
import { Button } from "@/components/ui/button"
import { useUser } from "@/app/dashboard/layout"

interface NavigationItem {
  name: string
  href: string
  icon: any
  permission?: string
  isSection?: boolean
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const { user, hasPermission } = useUser()

  const navigation: NavigationItem[] = [
    { 
      name: "Dashboard", 
      href: "/dashboard", 
      icon: LayoutDashboardIcon,
      permission: 'view_dashboard'
    },
    { 
      name: "Projects", 
      href: "/dashboard/projects", 
      icon: FolderKanbanIcon,
      permission: 'view_projects'
    },
    { 
      name: "Progress", 
      href: "/dashboard/progress", 
      icon: FileTextIcon,
      permission: 'view_progress'
    },
    { 
      name: "Documents", 
      href: "/dashboard/documents", 
      icon: FileTextIcon,
      permission: 'view_documents'
    },
    { 
      name: "Reports", 
      href: "/dashboard/reports", 
      icon: BarChart3Icon,
      permission: 'view_reports'
    }
  ]

  const adminNavigation: NavigationItem[] = [
    { 
      name: "User Management", 
      href: "/dashboard/users", 
      icon: UsersIcon,
      permission: 'manage_users'
    },
    { 
      name: "System Settings", 
      href: "/dashboard/settings", 
      icon: SettingsIcon,
      permission: 'manage_settings'
    }
  ]

  const filteredNavigation = navigation.filter(item => 
    !item.permission || hasPermission(item.permission)
  )

  const filteredAdminNavigation = adminNavigation.filter(item => 
    hasPermission(item.permission!)
  )

  const handleSignOut = async () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        // Clear the auth token from the database
        await fetch('/api/auth/revoke-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: user.id })
        });
      }

      // Clear all auth-related data
      localStorage.removeItem('user');
      document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      
      // Redirect to login page
      window.location.href = '/auth/login';
    } catch (error) {
      console.error('Error during sign out:', error);
      window.location.href = '/auth/login';
    }
  }

  if (!user) return null

  return (
    <div className={cn(
      "flex flex-col h-screen bg-white border-r border-gray-200 transition-all duration-300",
      collapsed ? "w-20" : "w-64"
    )}>
      {/* Sidebar header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <Building2Icon className="h-8 w-8 text-[#E87A1E]" />
              <span className="text-xl font-bold">PMS</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto"
          >
            {collapsed ? <MenuIcon className="h-5 w-5" /> : <ChevronLeftIcon className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {filteredNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                "hover:bg-gray-100",
                pathname === item.href 
                  ? "bg-gray-100 text-[#E87A1E]" 
                  : "text-gray-700 hover:text-[#E87A1E]"
              )}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {!collapsed && item.name}
            </Link>
          ))}
        </div>

        {filteredAdminNavigation.length > 0 && (
          <div className="mt-8">
            {!collapsed && (
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Administration
              </h3>
            )}
            <div className="mt-1 space-y-1">
              {filteredAdminNavigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                    "hover:bg-gray-100",
                    pathname === item.href
                      ? "bg-gray-100 text-[#E87A1E]"
                      : "text-gray-700 hover:text-[#E87A1E]"
                  )}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {!collapsed && item.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* User profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
            <UserIcon className="h-5 w-5 text-gray-500" />
          </div>
          {!collapsed && (
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">{user?.name}</p>
              <p className="text-xs text-gray-500">
                {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1).replace('_', ' ') : ''}
              </p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto"
            onClick={handleSignOut}
            title="Sign out"
          >
            <LogOutIcon className="h-5 w-5 text-gray-500 hover:text-red-500" />
          </Button>
        </div>
      </div>
    </div>
  )
}