"use client"

import { BellIcon, SearchIcon } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

        <Button variant="ghost" size="icon" className="relative">
          <BellIcon className="h-5 w-5 text-muted-foreground" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#E87A1E] text-[10px] font-bold text-white">
            3
          </span>
        </Button>
      </div>
    </header>
  )
}
