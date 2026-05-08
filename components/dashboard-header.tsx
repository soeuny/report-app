"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Bell, Search, Plus, Calendar } from "lucide-react"

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">대시보드</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            광고 성과 지표를 추적하고 분석하세요
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="검색..."
              className="pl-9 w-[200px] h-9 bg-secondary border-border"
            />
          </div>

          {/* Date Range Selector */}
          <Select defaultValue="30d">
            <SelectTrigger className="w-[140px] h-9 bg-secondary border-border">
              <Calendar size={14} className="mr-2 text-muted-foreground" />
              <SelectValue placeholder="기간 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">최근 7일</SelectItem>
              <SelectItem value="30d">최근 30일</SelectItem>
              <SelectItem value="90d">최근 90일</SelectItem>
              <SelectItem value="ytd">올해</SelectItem>
              <SelectItem value="custom">직접 설정</SelectItem>
            </SelectContent>
          </Select>

          {/* New Report Button */}
          <Button className="h-9 gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus size={16} />
            <span className="hidden sm:inline">새 보고서</span>
          </Button>

          {/* Notifications */}
          <Button variant="outline" size="icon" className="h-9 w-9 relative border-border">
            <Bell size={16} />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-accent-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
              3
            </span>
          </Button>
        </div>
      </div>
    </header>
  )
}
