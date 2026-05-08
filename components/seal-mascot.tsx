"use client"

import { cn } from "@/lib/utils"

interface SealMascotProps {
  className?: string
  size?: "sm" | "md" | "lg"
  animated?: boolean
}

export function SealMascot({ className, size = "md", animated = true }: SealMascotProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16"
  }

  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("w-full h-full", animated && "animate-bounce")}
        style={{ animationDuration: "3s" }}
      >
        {/* Body */}
        <ellipse cx="50" cy="60" rx="35" ry="30" className="fill-sidebar" />
        
        {/* Belly */}
        <ellipse cx="50" cy="65" rx="22" ry="18" className="fill-sidebar-accent" />
        
        {/* Head */}
        <circle cx="50" cy="32" r="24" className="fill-sidebar" />
        
        {/* Face lighter area */}
        <ellipse cx="50" cy="38" rx="16" ry="14" className="fill-sidebar-accent" />
        
        {/* Eyes */}
        <circle cx="42" cy="30" r="5" fill="white" />
        <circle cx="58" cy="30" r="5" fill="white" />
        <circle cx="43" cy="31" r="2.5" className="fill-primary" />
        <circle cx="59" cy="31" r="2.5" className="fill-primary" />
        {/* Eye shine */}
        <circle cx="44" cy="29" r="1" fill="white" />
        <circle cx="60" cy="29" r="1" fill="white" />
        
        {/* Nose */}
        <ellipse cx="50" cy="40" rx="6" ry="4" className="fill-primary" />
        
        {/* Whiskers */}
        <line x1="30" y1="38" x2="42" y2="40" stroke="currentColor" strokeWidth="1" className="text-sidebar-muted" />
        <line x1="30" y1="42" x2="42" y2="42" stroke="currentColor" strokeWidth="1" className="text-sidebar-muted" />
        <line x1="30" y1="46" x2="42" y2="44" stroke="currentColor" strokeWidth="1" className="text-sidebar-muted" />
        <line x1="70" y1="38" x2="58" y2="40" stroke="currentColor" strokeWidth="1" className="text-sidebar-muted" />
        <line x1="70" y1="42" x2="58" y2="42" stroke="currentColor" strokeWidth="1" className="text-sidebar-muted" />
        <line x1="70" y1="46" x2="58" y2="44" stroke="currentColor" strokeWidth="1" className="text-sidebar-muted" />
        
        {/* Mouth */}
        <path d="M 44 46 Q 50 50, 56 46" stroke="currentColor" strokeWidth="1.5" fill="none" className="text-sidebar-muted" />
        
        {/* Flippers */}
        <ellipse cx="22" cy="55" rx="10" ry="18" className="fill-sidebar" transform="rotate(-20 22 55)" />
        <ellipse cx="78" cy="55" rx="10" ry="18" className="fill-sidebar" transform="rotate(20 78 55)" />
        
        {/* Tail */}
        <ellipse cx="50" cy="92" rx="12" ry="6" className="fill-sidebar" />
      </svg>
    </div>
  )
}

export function SealLoader({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <SealMascot size="lg" animated />
      <span className="text-xs text-sidebar-muted animate-pulse">Loading...</span>
    </div>
  )
}
