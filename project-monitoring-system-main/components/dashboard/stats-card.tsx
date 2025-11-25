import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export function StatsCard({ title, value, subtitle, icon, trend, className }: StatsCardProps) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-6", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          {trend && (
            <p className={cn("mt-2 text-sm font-medium", trend.isPositive ? "text-[#16A34A]" : "text-destructive")}>
              {trend.isPositive ? "+" : ""}
              {trend.value}% from last month
            </p>
          )}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#E87A1E]/10 text-[#E87A1E]">
          {icon}
        </div>
      </div>
    </div>
  )
}
