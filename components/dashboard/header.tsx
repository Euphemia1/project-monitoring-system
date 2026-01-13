"use client"

import { useState, useEffect } from "react"
import { BellIcon, SearchIcon, FileTextIcon } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import Link from "next/link"
import type { District } from "@/lib/types"

interface HeaderProps {
  title: string
  subtitle?: string
  districts?: District[]
  selectedDistrict?: string
  onDistrictChange?: (districtId: string) => void
  showDistrictFilter?: boolean
}

export function Header({
  title,
  subtitle,
  districts = [],
  selectedDistrict,
  onDistrictChange,
  showDistrictFilter = false,
}: HeaderProps) {
  const [notifications, setNotifications] = useState<any[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/tasks/pending')
        if (res.ok) {
          const data = await res.json()
          setNotifications(data)
        }
      } catch (err) {
        console.error("Failed to fetch notifications:", err)
      } finally {
        setIsLoaded(true)
      }
    }

    fetchNotifications()
    // Refresh every 60 seconds
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-card px-6">
      <div className="flex-1">
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {showDistrictFilter && districts.length > 0 && (
          <Select value={selectedDistrict || "all"} onValueChange={onDistrictChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Districts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Districts</SelectItem>
              {districts.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="relative hidden md:block">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" placeholder="Search projects..." className="w-64 pl-9" />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <BellIcon className="h-5 w-5 text-muted-foreground" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#E87A1E] text-[10px] font-bold text-white">
                  {notifications.length}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold">Notifications</h3>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <Link
                    key={n.id}
                    href="/dashboard/efiling"
                    className="flex items-start gap-3 p-4 hover:bg-muted/50 border-b border-border last:border-0"
                  >
                    <div className="mt-1 rounded-full p-2 bg-[#E87A1E]/10">
                      <FileTextIcon className="h-4 w-4 text-[#E87A1E]" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">Action Required</p>
                      <p className="text-xs text-muted-foreground">
                        {n.action_required || `Review ${n.title}`}
                      </p>
                      <p className="text-[10px] text-[#E87A1E] font-medium">
                        {n.project_name}
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <BellIcon className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No pending actions</p>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  )
}
