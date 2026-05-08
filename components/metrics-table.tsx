"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Search, ArrowUpDown, ChevronLeft, ChevronRight, Download } from "lucide-react"

interface CampaignData {
  id: string
  campaign: string
  platform: string
  impressions: number
  clicks: number
  ctr: number
  spend: number
  conversions: number
  roas: number
  status: "active" | "paused" | "completed"
}

const mockData: CampaignData[] = [
  {
    id: "1",
    campaign: "여름 세일 2024",
    platform: "Google Ads",
    impressions: 542300,
    clicks: 12450,
    ctr: 2.3,
    spend: 4520000,
    conversions: 324,
    roas: 4.8,
    status: "active",
  },
  {
    id: "2",
    campaign: "브랜드 인지도 Q2",
    platform: "Facebook",
    impressions: 890200,
    clicks: 18920,
    ctr: 2.1,
    spend: 6800000,
    conversions: 456,
    roas: 3.9,
    status: "active",
  },
  {
    id: "3",
    campaign: "신제품 출시 - Pro",
    platform: "Instagram",
    impressions: 321500,
    clicks: 8240,
    ctr: 2.6,
    spend: 3200000,
    conversions: 198,
    roas: 5.2,
    status: "active",
  },
  {
    id: "4",
    campaign: "리타겟팅 - 장바구니",
    platform: "Google Ads",
    impressions: 156800,
    clicks: 4560,
    ctr: 2.9,
    spend: 1800000,
    conversions: 142,
    roas: 6.1,
    status: "completed",
  },
  {
    id: "5",
    campaign: "뉴스레터 가입",
    platform: "LinkedIn",
    impressions: 234100,
    clicks: 3890,
    ctr: 1.7,
    spend: 2400000,
    conversions: 89,
    roas: 2.8,
    status: "paused",
  },
  {
    id: "6",
    campaign: "연말 프로모션 2024",
    platform: "TikTok",
    impressions: 678900,
    clicks: 21340,
    ctr: 3.1,
    spend: 5600000,
    conversions: 512,
    roas: 5.8,
    status: "active",
  },
]

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

function formatCurrency(num: number): string {
  return `${num.toLocaleString()}원`
}

function StatusBadge({ status }: { status: CampaignData["status"] }) {
  const variants = {
    active: "bg-accent/20 text-accent border-accent/30",
    paused: "bg-muted text-muted-foreground border-border",
    completed: "bg-primary/10 text-primary border-primary/20",
  }

  const statusLabels = {
    active: "처리 중",
    paused: "일시정지",
    completed: "완료",
  }

  return (
    <Badge variant="outline" className={cn("font-medium", variants[status])}>
      {statusLabels[status]}
    </Badge>
  )
}

export function MetricsTable() {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const filteredData = mockData.filter(
    (item) =>
      item.campaign.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.platform.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-lg font-semibold text-foreground">
            캠페인 성과
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="캠페인 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-[200px] h-9 bg-secondary border-border"
              />
            </div>
            <Button variant="outline" size="sm" className="h-9 gap-2">
              <Download size={14} />
              엑셀 다운로드
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                <TableHead className="font-semibold text-foreground">
                  <button className="flex items-center gap-1 hover:text-accent transition-colors">
                    캠페인 <ArrowUpDown size={14} />
                  </button>
                </TableHead>
                <TableHead className="font-semibold text-foreground">매체</TableHead>
                <TableHead className="font-semibold text-foreground text-right">노출수</TableHead>
                <TableHead className="font-semibold text-foreground text-right">클릭수</TableHead>
                <TableHead className="font-semibold text-foreground text-right">클릭률(CTR)</TableHead>
                <TableHead className="font-semibold text-foreground text-right">광고비</TableHead>
                <TableHead className="font-semibold text-foreground text-right">전환수</TableHead>
                <TableHead className="font-semibold text-foreground text-right">광고수익률(ROAS)</TableHead>
                <TableHead className="font-semibold text-foreground">상태</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((row) => (
                <TableRow
                  key={row.id}
                  className="hover:bg-secondary/30 transition-colors cursor-pointer"
                >
                  <TableCell className="font-medium text-foreground">{row.campaign}</TableCell>
                  <TableCell className="text-muted-foreground">{row.platform}</TableCell>
                  <TableCell className="text-right font-mono text-foreground">
                    {formatNumber(row.impressions)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-foreground">
                    {formatNumber(row.clicks)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-foreground">
                    {row.ctr.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right font-mono text-foreground">
                    {formatCurrency(row.spend)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-foreground">
                    {row.conversions}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={cn(
                        "font-mono font-semibold",
                        row.roas >= 4 ? "text-accent" : row.roas >= 3 ? "text-foreground" : "text-destructive"
                      )}
                    >
                      {row.roas.toFixed(1)}x
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={row.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            전체 {filteredData.length}개 캠페인 중 {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredData.length)}개 표시
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft size={16} />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className={cn(
                  "h-8 w-8 p-0",
                  currentPage === page && "bg-primary text-primary-foreground"
                )}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
