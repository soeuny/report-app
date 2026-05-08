"use client"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Eye, MousePointer, DollarSign, Target, TrendingUp, TrendingDown } from "lucide-react"

interface StatCardProps {
  title: string
  value: string
  change: number
  icon: React.ReactNode
  trend: "up" | "down"
  className?: string
}

function StatCard({ title, value, change, icon, trend, className }: StatCardProps) {
  return (
    <Card className={cn("bg-card border-border shadow-sm hover:shadow-md transition-shadow", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
            <div className="flex items-center gap-1">
              {trend === "up" ? (
                <TrendingUp size={14} className="text-accent" />
              ) : (
                <TrendingDown size={14} className="text-destructive" />
              )}
              <span
                className={cn(
                  "text-xs font-medium",
                  trend === "up" ? "text-accent" : "text-destructive"
                )}
              >
                {change > 0 ? "+" : ""}{change}%
              </span>
              <span className="text-xs text-muted-foreground">전월 대비</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function StatsCards() {
  const stats = [
    {
      title: "총 노출수",
      value: "240만",
      change: 12.5,
      icon: <Eye size={20} className="text-accent" />,
      trend: "up" as const,
    },
    {
      title: "총 클릭수",
      value: "4.82만",
      change: 8.3,
      icon: <MousePointer size={20} className="text-accent" />,
      trend: "up" as const,
    },
    {
      title: "총 광고수익률(ROAS)",
      value: "4.2배",
      change: 15.7,
      icon: <DollarSign size={20} className="text-accent" />,
      trend: "up" as const,
    },
    {
      title: "전환율",
      value: "3.8%",
      change: -2.1,
      icon: <Target size={20} className="text-accent" />,
      trend: "down" as const,
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <StatCard key={stat.title} {...stat} />
      ))}
    </div>
  )
}
