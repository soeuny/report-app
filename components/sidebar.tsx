import Link from 'next/link';
import { LayoutDashboard, FileSpreadsheet, Settings, HelpCircle } from 'lucide-react';

export function Sidebar() {
  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border hidden md:flex flex-col h-screen fixed top-0 left-0">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-sidebar-primary tracking-tight">AdReport Pro</h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 mt-4">
        <Link href="/" className="flex items-center gap-3 px-3 py-2 bg-sidebar-accent text-sidebar-accent-foreground rounded-lg font-medium transition-colors">
          <LayoutDashboard className="w-5 h-5 text-sidebar-primary" />
          통합 대시보드
        </Link>
        <Link href="/reports" className="flex items-center gap-3 px-3 py-2 text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground rounded-lg font-medium transition-colors">
          <FileSpreadsheet className="w-5 h-5" />
          과거 리포트
        </Link>
        <Link href="/settings" className="flex items-center gap-3 px-3 py-2 text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground rounded-lg font-medium transition-colors">
          <Settings className="w-5 h-5" />
          설정
        </Link>
      </nav>

      <div className="p-4 mt-auto">
        <div className="bg-sidebar-accent rounded-xl p-4 flex flex-col items-center justify-center space-y-3 relative overflow-hidden">
          {/* 씰(물개) 마스코트 일러스트 (CSS/SVG로 단순화) */}
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center relative shadow-lg">
            {/* 눈 */}
            <div className="absolute w-2 h-2 bg-white rounded-full top-5 left-4"></div>
            <div className="absolute w-2 h-2 bg-white rounded-full top-5 right-4"></div>
            {/* 코 */}
            <div className="absolute w-3 h-2 bg-white rounded-full top-8"></div>
            {/* 귀여운 수염 */}
            <div className="absolute w-3 h-[1px] bg-white top-9 left-2 rotate-12"></div>
            <div className="absolute w-3 h-[1px] bg-white top-9 right-2 -rotate-12"></div>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-sidebar-foreground">도움이 필요하신가요?</p>
            <p className="text-xs text-sidebar-foreground/70 mt-1">물개 요원에게 물어보세요!</p>
          </div>
          <button className="w-full mt-2 bg-sidebar-primary text-sidebar-primary-foreground py-1.5 rounded-md text-sm font-medium flex items-center justify-center gap-2 hover:bg-sidebar-primary/90 transition-colors">
            <HelpCircle className="w-4 h-4" />
            지원팀 연락하기
          </button>
        </div>
      </div>
    </aside>
  );
}
