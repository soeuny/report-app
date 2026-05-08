"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { SealMascot } from "@/components/seal-mascot"
import {
  LayoutDashboard,
  Upload,
  BarChart3,
  FileText,
  Settings,
  HelpCircle,
  TrendingUp,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

interface NavItemProps {
  icon: React.ReactNode
  label: string
  active?: boolean
  collapsed?: boolean
  onClick?: () => void
}

function NavItem({ icon, label, active, collapsed, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
        "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
        active && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary",
        collapsed && "justify-center px-2"
      )}
    >
      <span className="flex-shrink-0">{icon}</span>
      {!collapsed && <span className="text-sm font-medium">{label}</span>}
    </button>
  )
}

export function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [activeItem, setActiveItem] = useState("dashboard")

  const navItems = [
    { id: "dashboard", icon: <LayoutDashboard size={20} />, label: "대시보드" },
    { id: "upload", icon: <Upload size={20} />, label: "파일 업로드" },
    { id: "reports", icon: <BarChart3 size={20} />, label: "보고서" },
    { id: "campaigns", icon: <TrendingUp size={20} />, label: "캠페인" },
    { id: "audience", icon: <Users size={20} />, label: "타겟 오디언스" },
    { id: "exports", icon: <FileText size={20} />, label: "내보내기" },
  ]

  const bottomItems = [
    { id: "settings", icon: <Settings size={20} />, label: "설정" },
    { id: "help", icon: <HelpCircle size={20} />, label: "고객센터" },
  ]

  return (
    <aside
      className={cn(
        "h-screen bg-sidebar flex flex-col transition-all duration-300 border-r border-sidebar-border",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center w-full")}>
          <SealMascot size="sm" animated={false} />
          {!collapsed && (
            <div>
              <h1 className="text-sidebar-foreground font-bold text-lg leading-tight">광고분석</h1>
              <span className="text-sidebar-primary text-xs font-medium">PRO</span>
            </div>
          )}
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-sidebar-accent border border-sidebar-border rounded-full flex items-center justify-center text-sidebar-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground transition-colors"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Main Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {!collapsed && (
          <p className="px-3 py-2 text-xs font-semibold text-sidebar-muted uppercase tracking-wider">
            메인 메뉴
          </p>
        )}
        {navItems.map((item) => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            active={activeItem === item.id}
            collapsed={collapsed}
            onClick={() => setActiveItem(item.id)}
          />
        ))}
      </nav>

      {/* Bottom Navigation */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        {bottomItems.map((item) => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            active={activeItem === item.id}
            collapsed={collapsed}
            onClick={() => setActiveItem(item.id)}
          />
        ))}
      </div>

      {/* User Section */}
      <div className="p-3 border-t border-sidebar-border">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground text-sm font-bold">
            김
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">김민수</p>
              <p className="text-xs text-sidebar-muted truncate">마케팅 팀장</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
