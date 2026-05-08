"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

const data = [
  { date: "1월 1일", impressions: 120000, clicks: 2400, conversions: 180 },
  { date: "1월 8일", impressions: 145000, clicks: 3100, conversions: 220 },
  { date: "1월 15일", impressions: 168000, clicks: 3800, conversions: 290 },
  { date: "1월 22일", impressions: 192000, clicks: 4200, conversions: 340 },
  { date: "1월 29일", impressions: 210000, clicks: 4800, conversions: 380 },
  { date: "2월 5일", impressions: 235000, clicks: 5200, conversions: 420 },
  { date: "2월 12일", impressions: 258000, clicks: 5800, conversions: 480 },
  { date: "2월 19일", impressions: 280000, clicks: 6100, conversions: 520 },
  { date: "2월 26일", impressions: 310000, clicks: 6800, conversions: 590 },
  { date: "3월 4일", impressions: 342000, clicks: 7400, conversions: 640 },
  { date: "3월 11일", impressions: 378000, clicks: 8100, conversions: 710 },
  { date: "3월 18일", impressions: 405000, clicks: 8600, conversions: 780 },
]

const nameLabels: Record<string, string> = {
  impressions: "노출수",
  clicks: "클릭수",
  conversions: "전환수",
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-foreground mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{nameLabels[entry.name] || entry.name}:</span>
            <span className="font-mono font-medium text-foreground">
              {entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export function PerformanceChart() {
  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">
            성과 추이
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[hsl(175,60%,50%)]" />
              <span className="text-xs text-muted-foreground">노출수</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[hsl(220,60%,25%)]" />
              <span className="text-xs text-muted-foreground">클릭수</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[hsl(180,50%,45%)]" />
              <span className="text-xs text-muted-foreground">전환수</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="impressionsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(175, 60%, 50%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(175, 60%, 50%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(220, 60%, 25%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(220, 60%, 25%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="conversionsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(180, 50%, 45%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(180, 50%, 45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 90%)" vertical={false} />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(220, 15%, 55%)", fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(220, 15%, 55%)", fontSize: 12 }}
                tickFormatter={(value) =>
                  value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value
                }
                dx={-10}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="impressions"
                stroke="hsl(175, 60%, 50%)"
                strokeWidth={2}
                fill="url(#impressionsGradient)"
                name="impressions"
              />
              <Area
                type="monotone"
                dataKey="clicks"
                stroke="hsl(220, 60%, 25%)"
                strokeWidth={2}
                fill="url(#clicksGradient)"
                name="clicks"
              />
              <Area
                type="monotone"
                dataKey="conversions"
                stroke="hsl(180, 50%, 45%)"
                strokeWidth={2}
                fill="url(#conversionsGradient)"
                name="conversions"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
