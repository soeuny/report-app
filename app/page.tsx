'use client';

import { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, Download, DollarSign, TrendingUp, MousePointerClick, Activity, Play, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { normalizeData, StandardAdData } from '@/lib/data-parser';

type ZoneKey = 'naver_daily' | 'naver_keyword' | 'gfa_daily' | 'coupang_daily' | 'coupang_keyword' | 'report_form';

const ZONES: { key: ZoneKey; label: string; desc: string }[] = [
  { key: 'naver_daily', label: '네이버 일별', desc: '네이버(쇼핑/파워링크) 일별' },
  { key: 'naver_keyword', label: '네이버 키워드', desc: '네이버(쇼핑/파워링크) 키워드' },
  { key: 'gfa_daily', label: 'GFA 일별', desc: 'GFA 일별 성과' },
  { key: 'coupang_daily', label: '쿠팡 일별', desc: '쿠팡 일별 성과' },
  { key: 'coupang_keyword', label: '쿠팡 키워드', desc: '쿠팡 키워드 성과' },
  { key: 'report_form', label: '보고서 폼', desc: '데이터를 병합할 양식' },
];

export default function DashboardPage() {
  const [files, setFiles] = useState<Record<ZoneKey, File[]>>({
    naver_daily: [],
    naver_keyword: [],
    gfa_daily: [],
    coupang_daily: [],
    coupang_keyword: [],
    report_form: []
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [parsedData, setParsedData] = useState<StandardAdData[]>([]);
  const [reportFormFiles, setReportFormFiles] = useState<File[]>([]);
  
  const fileInputRefs = useRef<Record<ZoneKey, HTMLInputElement | null>>({
    naver_daily: null, naver_keyword: null, gfa_daily: null, coupang_daily: null, coupang_keyword: null, report_form: null
  });

  // Summary Metrics
  const totalCost = parsedData.reduce((acc, curr) => acc + (curr.cost || 0), 0);
  const totalConversions = parsedData.reduce((acc, curr) => acc + (curr.conversions || 0), 0);
  const totalClicks = parsedData.reduce((acc, curr) => acc + (curr.clicks || 0), 0);
  const totalImpressions = parsedData.reduce((acc, curr) => acc + (curr.impressions || 0), 0);
  
  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const avgRoas = parsedData.length > 0 
    ? parsedData.reduce((acc, curr) => acc + (curr.roas || 0), 0) / parsedData.filter(d => d.roas).length || 0 
    : 0;

  const handleDrop = (e: React.DragEvent, zone: ZoneKey) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles(prev => ({
        ...prev,
        [zone]: [...prev[zone], ...Array.from(e.dataTransfer.files)]
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, zone: ZoneKey) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(prev => ({
        ...prev,
        [zone]: [...prev[zone], ...Array.from(e.target.files!)]
      }));
    }
  };

  const removeFile = (zone: ZoneKey, index: number) => {
    setFiles(prev => ({
      ...prev,
      [zone]: prev[zone].filter((_, i) => i !== index)
    }));
  };

  const readExcel = (file: File): Promise<any[][]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false }) as any[][];
          resolve(json);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsBinaryString(file);
    });
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    let allData: StandardAdData[] = [];
    
    // 보고서 폼 파일 별도 저장
    setReportFormFiles(files.report_form);

    await new Promise(resolve => setTimeout(resolve, 1500)); // 시각적 로딩 딜레이

    try {
      const zonesToProcess: { key: ZoneKey; platform: string; type: 'daily' | 'keyword' }[] = [
        { key: 'naver_daily', platform: 'naver', type: 'daily' },
        { key: 'naver_keyword', platform: 'naver', type: 'keyword' },
        { key: 'gfa_daily', platform: 'gfa', type: 'daily' },
        { key: 'coupang_daily', platform: 'coupang', type: 'daily' },
        { key: 'coupang_keyword', platform: 'coupang', type: 'keyword' },
      ];

      for (const zoneConfig of zonesToProcess) {
        const zoneFiles = files[zoneConfig.key];
        for (const file of zoneFiles) {
          const rawData = await readExcel(file);
          const standardized = normalizeData(rawData, zoneConfig.platform, zoneConfig.type);
          allData = [...allData, ...standardized];
        }
      }
      
      setParsedData(allData);
    } catch (error) {
      console.error('분석 오류:', error);
      alert('오류가 발생했습니다. 올바른 엑셀 파일인지 확인하세요.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownloadExcel = async () => {
    if (reportFormFiles.length === 0) {
      alert("보고서 폼 파일을 먼저 업로드해주세요.");
      return;
    }

    const file = reportFormFiles[0];
    const workbook = new ExcelJS.Workbook();
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      await workbook.xlsx.load(arrayBuffer);
    } catch (err) {
      console.error("보고서 폼 읽기 오류:", err);
      alert("보고서 폼을 읽는 중 오류가 발생했습니다.");
      return;
    }

    // 좀 더 유연한 날짜 추출 (e.g. "2026. 05. 07.", "2026-05-07")
    const extractDay = (dateStr: string) => {
      if (!dateStr || dateStr === '-') return null;
      const parts = dateStr.trim().split(/[^0-9]+/);
      if (parts.length >= 3) {
        return parseInt(parts[2], 10);
      }
      return null;
    };

    const getWorksheetRobust = (nameStr: string) => {
      let foundSheet: ExcelJS.Worksheet | undefined;
      workbook.worksheets.forEach(ws => {
        const normalizedWsName = ws.name.replace(/\s+/g, '');
        if (normalizedWsName.includes(nameStr)) {
          foundSheet = ws;
        }
      });
      return foundSheet;
    };

    // -- 1. 네이버 일별 처리 --
    const naverDaily = parsedData.filter(d => d.platform === 'naver' && d.dataType === 'daily');
    const dailyGrouped: Record<string, Record<number, any>> = {
      '파워링크': {},
      '쇼핑검색': {}
    };

    naverDaily.forEach(d => {
      // 캠페인유형이 빈칸이면 캠페인명에서 유추
      const typeStr = (d.campaignType && d.campaignType !== '-') ? d.campaignType : (d.campaignName || '');
      const type = typeStr.includes('쇼핑') ? '쇼핑검색' : '파워링크';
      const day = extractDay(d.date);
      
      if (day !== null) {
        if (!dailyGrouped[type][day]) {
          dailyGrouped[type][day] = { impressions: 0, clicks: 0, cost: 0, conversions: 0, conversionRevenue: 0 };
        }
        dailyGrouped[type][day].impressions += (d.impressions || 0);
        dailyGrouped[type][day].clicks += (d.clicks || 0);
        dailyGrouped[type][day].cost += (d.cost || 0);
        dailyGrouped[type][day].conversions += (d.conversions || 0);
        dailyGrouped[type][day].conversionRevenue += (d.conversionRevenue || 0);
      }
    });

    const writeCell = (ws: ExcelJS.Worksheet, rowIndex: number, colIndex: number, value: any) => {
      const cell = ws.getCell(rowIndex, colIndex);
      cell.value = value;
    };

    // 파워링크 기입
    const powerlinkSheet = getWorksheetRobust('파워링크_일일');
    if (powerlinkSheet) {
      Object.entries(dailyGrouped['파워링크']).forEach(([dayStr, data]) => {
        const day = parseInt(dayStr, 10);
        const rowIndex = 20 + day; // 1일 -> 21행
        if (day >= 1 && day <= 31) {
          writeCell(powerlinkSheet, rowIndex, 4, data.impressions); // D (4)
          writeCell(powerlinkSheet, rowIndex, 5, data.clicks);      // E (5)
          writeCell(powerlinkSheet, rowIndex, 8, data.cost);        // H (8)
          writeCell(powerlinkSheet, rowIndex, 9, data.conversions); // I (9)
          writeCell(powerlinkSheet, rowIndex, 12, data.conversionRevenue); // L (12)
        }
      });
    }

    // 쇼핑검색 기입
    const shoppingDailySheet = getWorksheetRobust('네이버쇼핑_일일');
    if (shoppingDailySheet) {
      Object.entries(dailyGrouped['쇼핑검색']).forEach(([dayStr, data]) => {
        const day = parseInt(dayStr, 10);
        const rowIndex = 20 + day; // 1일 -> 21행
        if (day >= 1 && day <= 31) {
          writeCell(shoppingDailySheet, rowIndex, 4, data.impressions); // D
          writeCell(shoppingDailySheet, rowIndex, 5, data.clicks);      // E
          writeCell(shoppingDailySheet, rowIndex, 8, data.cost);        // H
          writeCell(shoppingDailySheet, rowIndex, 9, data.conversions); // I
          writeCell(shoppingDailySheet, rowIndex, 12, data.conversionRevenue); // L
        }
      });
    }

    // -- 2. 네이버 키워드 처리 --
    const keywordSheet = getWorksheetRobust('네이버쇼핑_누적');
    if (keywordSheet) {
      const naverKeyword = parsedData.filter(d => {
        if (d.platform !== 'naver' || d.dataType !== 'keyword') return false;
        const typeStr = (d.campaignType && d.campaignType !== '-') ? d.campaignType : (d.campaignName || '');
        return typeStr.includes('쇼핑');
      });

      // 정렬: 1순위 총비용 내림차순, 2순위 전환수 내림차순
      naverKeyword.sort((a, b) => {
        if ((b.cost || 0) !== (a.cost || 0)) return (b.cost || 0) - (a.cost || 0);
        return (b.conversions || 0) - (a.conversions || 0);
      });

      // 24행부터 작성
      let currentRow = 24;
      naverKeyword.forEach(d => {
        // C(3): 키워드, D(4): 노출수, E(5): 클릭수, H(8): 광고비, I(9): 전환수, L(12): 전환매출액
        writeCell(keywordSheet, currentRow, 3, d.keyword || '-');
        writeCell(keywordSheet, currentRow, 4, d.impressions || 0);
        writeCell(keywordSheet, currentRow, 5, d.clicks || 0);
        writeCell(keywordSheet, currentRow, 8, d.cost || 0);
        writeCell(keywordSheet, currentRow, 9, d.conversions || 0);
        writeCell(keywordSheet, currentRow, 12, d.conversionRevenue || 0);
        currentRow++;
      });
      console.log(`네이버쇼핑_누적 시트 업데이트 완료: ${naverKeyword.length}행 입력됨`);
    }

    // 파일 저장
    const dateObj = new Date();
    const yy = String(dateObj.getFullYear()).slice(-2);
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const fileName = `${yy}${mm}${dd}_라르츠 거리측정기_보고서(네이버 쿠팡).xlsx`;

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), fileName);
  };

  const hasFilesToProcess = Object.values(files).some(fileArr => fileArr.length > 0);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">데이터 업로드 및 분석</h2>
          <p className="text-muted-foreground mt-1">각 영역에 맞는 파일을 드래그하여 업로드하고 분석을 시작하세요.</p>
        </div>
        {(parsedData.length > 0 || reportFormFiles.length > 0) && (
          <button 
            onClick={handleDownloadExcel}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg font-medium shadow-sm hover:bg-accent/90 transition-all"
          >
            <Download className="w-4 h-4" />
            엑셀 다운로드
          </button>
        )}
      </div>

      {/* Grid of Dropzones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ZONES.map((zone) => (
          <div 
            key={zone.key}
            className={`relative flex flex-col border-2 border-dashed rounded-xl p-6 transition-all duration-200 
              ${files[zone.key].length > 0 ? 'border-primary/50 bg-primary/5' : 'border-border bg-card hover:bg-secondary/30'}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, zone.key)}
            onClick={(e) => {
              if ((e.target as HTMLElement).closest('.file-pill')) return;
              fileInputRefs.current[zone.key]?.click();
            }}
          >
            <input 
              type="file" 
              ref={el => fileInputRefs.current[zone.key] = el}
              onChange={(e) => handleFileChange(e, zone.key)} 
              className="hidden" 
              multiple 
              accept=".xlsx, .xls, .csv"
            />
            
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-secondary rounded-lg">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">{zone.label}</h3>
                <p className="text-xs text-muted-foreground">{zone.desc}</p>
              </div>
            </div>

            <div className="flex-1 mt-2">
              {files[zone.key].length === 0 ? (
                <div className="h-full flex items-center justify-center border border-dashed border-border/50 rounded-lg py-4 bg-background/50">
                  <p className="text-xs text-muted-foreground">클릭 또는 드래그</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {files[zone.key].map((file, idx) => (
                    <div key={idx} className="file-pill flex items-center justify-between bg-background border border-border px-3 py-1.5 rounded-md text-xs shadow-sm">
                      <span className="truncate flex-1 max-w-[150px]">{file.name}</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeFile(zone.key, idx); }}
                        className="text-muted-foreground hover:text-destructive p-1 rounded-md"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Start Button & Loading */}
      <div className="flex flex-col items-center justify-center py-6 border-t border-border mt-8">
        {!isAnalyzing ? (
          <button 
            onClick={handleAnalyze}
            disabled={!hasFilesToProcess}
            className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-full font-bold shadow-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg"
          >
            <Play className="w-5 h-5" />
            데이터 분석 시작
          </button>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center w-full max-w-md space-y-4"
          >
            <div className="flex items-center gap-3">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                <UploadCloud className="w-6 h-6 text-primary" />
              </motion.div>
              <h3 className="text-lg font-semibold text-foreground">데이터 분석 및 표준화 중...</h3>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-primary"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* 4 Cards Section */}
      {(parsedData.length > 0 || isAnalyzing) && (
        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-8 border-t border-border"
          >
            <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
              <div className="flex items-center justify-between pb-2">
                <h3 className="text-sm font-medium text-muted-foreground">총 광고비</h3>
                <div className="p-2 bg-primary/10 rounded-md"><DollarSign className="w-4 h-4 text-primary" /></div>
              </div>
              <div className="text-2xl font-bold">{totalCost.toLocaleString()} 원</div>
            </div>
            <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
              <div className="flex items-center justify-between pb-2">
                <h3 className="text-sm font-medium text-muted-foreground">평균 ROAS</h3>
                <div className="p-2 bg-accent/20 rounded-md"><TrendingUp className="w-4 h-4 text-accent" /></div>
              </div>
              <div className="text-2xl font-bold">{avgRoas.toFixed(2)} %</div>
            </div>
            <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
              <div className="flex items-center justify-between pb-2">
                <h3 className="text-sm font-medium text-muted-foreground">총 전환수</h3>
                <div className="p-2 bg-primary/10 rounded-md"><Activity className="w-4 h-4 text-primary" /></div>
              </div>
              <div className="text-2xl font-bold">{totalConversions.toLocaleString()} 건</div>
            </div>
            <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
              <div className="flex items-center justify-between pb-2">
                <h3 className="text-sm font-medium text-muted-foreground">평균 클릭률(CTR)</h3>
                <div className="p-2 bg-accent/20 rounded-md"><MousePointerClick className="w-4 h-4 text-accent" /></div>
              </div>
              <div className="text-2xl font-bold">{avgCtr.toFixed(2)} %</div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Data Table Preview */}
      {(parsedData.length > 0) && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl shadow-sm border border-border overflow-hidden mt-8"
        >
          <div className="px-6 py-4 border-b border-border bg-secondary/30 flex items-center justify-between">
            <h3 className="font-semibold text-foreground">데이터 미리보기</h3>
            <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-1 rounded-md">총 {parsedData.length}개의 행 발견됨</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-secondary/50 uppercase">
                <tr>
                  <th className="px-6 py-3">분류</th>
                  <th className="px-6 py-3">매체</th>
                  <th className="px-6 py-3">일자/기간</th>
                  <th className="px-6 py-3">캠페인명 / 키워드</th>
                  <th className="px-6 py-3">노출수</th>
                  <th className="px-6 py-3">클릭수</th>
                  <th className="px-6 py-3">광고비</th>
                  <th className="px-6 py-3">전환수</th>
                  <th className="px-6 py-3">ROAS</th>
                </tr>
              </thead>
              <tbody>
                {parsedData.slice(0, 10).map((row, idx) => (
                  <tr key={row.id} className="border-b border-border hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${row.dataType === 'daily' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                        {row.dataType === 'daily' ? '일별' : '키워드'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-primary">
                      {row.platform === 'naver' ? '네이버' : row.platform === 'gfa' ? 'GFA' : '쿠팡'}
                    </td>
                    <td className="px-6 py-4">{row.date || '-'}</td>
                    <td className="px-6 py-4 truncate max-w-[200px]">
                      <div className="font-medium">{row.dataType === 'keyword' ? (row.keyword || '-') : (row.campaignName || '-')}</div>
                      {row.dataType === 'daily' && row.adGroupName && <div className="text-xs text-muted-foreground truncate">{row.adGroupName}</div>}
                    </td>
                    <td className="px-6 py-4">{(row.impressions || 0).toLocaleString()}</td>
                    <td className="px-6 py-4">{(row.clicks || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 font-medium text-foreground">{(row.cost || 0).toLocaleString()}</td>
                    <td className="px-6 py-4">{(row.conversions || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-accent font-medium">{(row.roas || 0).toLocaleString()}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {parsedData.length > 10 && (
            <div className="px-6 py-3 border-t border-border bg-secondary/30 text-center text-sm text-muted-foreground">
              외 {parsedData.length - 10}개의 행이 더 있습니다. 전체 데이터는 엑셀 다운로드를 통해 확인하세요.
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
