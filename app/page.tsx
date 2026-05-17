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
          const workbook = XLSX.read(data, { type: 'binary', cellDates: false });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          // raw: true → 숫자/날짜 원본값 유지, dateNF 미적용
          const json = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: true, dateNF: 'yyyy-mm-dd' }) as any[][];
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
          const standardized = normalizeData(rawData, zoneConfig.platform, zoneConfig.type, zoneConfig.key);
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

    // 1-1. 파워링크 일일 기입
    const powerlinkSheet = getWorksheetRobust('네이버파워링크_일일');
    if (powerlinkSheet) {
      // 디버그: 전체 naver daily 데이터 확인
      const allNaverDaily = parsedData.filter(d => d.platform === 'naver' && d.dataType === 'daily');
      console.log('[파워링크] 전체 네이버 일별 데이터:', allNaverDaily.length, '건');
      console.log('[파워링크] campaignType 목록:', [...new Set(allNaverDaily.map(d => d.campaignType))]);
      console.log('[파워링크] sourceZone 목록:', [...new Set(allNaverDaily.map(d => d.sourceZone))]);
      console.log('[파워링크] 샘플 date 형식:', allNaverDaily.slice(0, 3).map(d => d.date));

      const naverPowerlinkDaily = parsedData.filter(d => {
        if (d.platform !== 'naver' || d.dataType !== 'daily') return false;
        
        // 사용자의 요청: 캠페인유형 컬럼의 '파워링크' 항목만 가져옴
        if (d.campaignType?.includes('파워링크')) return true;
        
        // naver_daily 존에서 업로드되었고, 쇼핑이 아닌 경우 파워링크로 간주 (백업 로직)
        if (d.sourceZone === 'naver_daily') {
          const isShopping = d.campaignType?.includes('쇼핑') || d.campaignName?.includes('쇼핑');
          return !isShopping;
        }
        
        return false;
      });

      console.log('[파워링크] 필터 후 데이터:', naverPowerlinkDaily.length, '건');

      const powerlinkDateMap: Record<string, any> = {};
      naverPowerlinkDaily.forEach(d => {
        if (!powerlinkDateMap[d.date]) {
          powerlinkDateMap[d.date] = { impressions: 0, clicks: 0, cost: 0, conversions: 0, conversionRevenue: 0 };
        }
        powerlinkDateMap[d.date].impressions += (d.impressions || 0);
        powerlinkDateMap[d.date].clicks += (d.clicks || 0);
        powerlinkDateMap[d.date].cost += (d.cost || 0);
        powerlinkDateMap[d.date].conversions += (d.conversions || 0);
        powerlinkDateMap[d.date].conversionRevenue += (d.conversionRevenue || 0);
      });

      console.log('[파워링크] 날짜맵 키:', Object.keys(powerlinkDateMap));

      // B21부터 B51까지 순회하며 날짜 매칭
      let matchCount = 0;
      for (let rowIdx = 21; rowIdx <= 51; rowIdx++) {
        const dateCell = powerlinkSheet.getCell(rowIdx, 2);
        if (dateCell.value) {
          let targetDate = "";
          if (dateCell.value instanceof Date) {
            const d = dateCell.value;
            targetDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          } else if (typeof dateCell.value === 'number') {
            // ExcelJS가 날짜를 시리얼 넘버로 반환하는 경우
            const excelEpoch = new Date(1899, 11, 30);
            const d = new Date(excelEpoch.getTime() + dateCell.value * 86400000);
            targetDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          } else {
            const parts = String(dateCell.value).split(/[^0-9]+/).filter(p => p.length > 0);
            if (parts.length >= 3) targetDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
          }

          if (rowIdx <= 23) {
            console.log(`[파워링크] B${rowIdx} 셀값:`, dateCell.value, `(타입: ${typeof dateCell.value})`, '→ 변환:', targetDate, '매칭:', !!powerlinkDateMap[targetDate]);
          }

          if (targetDate && powerlinkDateMap[targetDate]) {
            const data = powerlinkDateMap[targetDate];
            writeCell(powerlinkSheet, rowIdx, 4, data.impressions);
            writeCell(powerlinkSheet, rowIdx, 5, data.clicks);
            writeCell(powerlinkSheet, rowIdx, 8, data.cost);
            writeCell(powerlinkSheet, rowIdx, 9, data.conversions);
            writeCell(powerlinkSheet, rowIdx, 12, data.conversionRevenue);
            matchCount++;
          }
        }
      }
      console.log(`[파워링크] 총 ${matchCount}건 매칭 완료`);
    }

    // 1-2. 쇼핑검색 일일 기입
    const shoppingDailySheet = getWorksheetRobust('네이버쇼핑_일일');
    if (shoppingDailySheet) {
      const naverShoppingDaily = parsedData.filter(d => 
        d.platform === 'naver' && 
        d.dataType === 'daily' && 
        (d.sourceZone === 'naver_daily' && (d.campaignType?.includes('쇼핑') || d.campaignName?.includes('쇼핑')))
      );

      const shoppingDateMap: Record<string, any> = {};
      naverShoppingDaily.forEach(d => {
        if (!shoppingDateMap[d.date]) {
          shoppingDateMap[d.date] = { impressions: 0, clicks: 0, cost: 0, conversions: 0, conversionRevenue: 0 };
        }
        shoppingDateMap[d.date].impressions += (d.impressions || 0);
        shoppingDateMap[d.date].clicks += (d.clicks || 0);
        shoppingDateMap[d.date].cost += (d.cost || 0);
        shoppingDateMap[d.date].conversions += (d.conversions || 0);
        shoppingDateMap[d.date].conversionRevenue += (d.conversionRevenue || 0);
      });

      for (let rowIdx = 21; rowIdx <= 51; rowIdx++) {
        const dateCell = shoppingDailySheet.getCell(rowIdx, 2);
        if (dateCell.value) {
          let targetDate = "";
          if (dateCell.value instanceof Date) {
            const d = dateCell.value;
            targetDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          } else {
            const parts = String(dateCell.value).split(/[^0-9]+/).filter(p => p.length > 0);
            if (parts.length >= 3) targetDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
          }
          if (targetDate && shoppingDateMap[targetDate]) {
            const data = shoppingDateMap[targetDate];
            writeCell(shoppingDailySheet, rowIdx, 4, data.impressions);
            writeCell(shoppingDailySheet, rowIdx, 5, data.clicks);
            writeCell(shoppingDailySheet, rowIdx, 8, data.cost);
            writeCell(shoppingDailySheet, rowIdx, 9, data.conversions);
            writeCell(shoppingDailySheet, rowIdx, 12, data.conversionRevenue);
          }
        }
      }
    }

    // -- 2. 네이버 키워드 처리 --
    const keywordSheet = getWorksheetRobust('네이버쇼핑_누적');
    if (keywordSheet) {
      const naverKeyword = parsedData.filter(d => 
        d.platform === 'naver' && 
        d.dataType === 'keyword' && 
        d.campaignType === '쇼핑검색'
      );

      // 정렬: 1순위 전환수 내림차순, 2순위 총비용 내림차순
      naverKeyword.sort((a, b) => {
        if ((b.conversions || 0) !== (a.conversions || 0)) return (b.conversions || 0) - (a.conversions || 0);
        return (b.cost || 0) - (a.cost || 0);
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

    // -- 3. GFA 일별 처리 --
    const gfaDailySheet = getWorksheetRobust('네이버GFA_일일');
    if (gfaDailySheet) {
      const gfaDaily = parsedData.filter(d => d.platform === 'gfa' && d.dataType === 'daily');

      const gfaDateMap: Record<string, any> = {};
      gfaDaily.forEach(d => {
        if (!gfaDateMap[d.date]) {
          gfaDateMap[d.date] = { impressions: 0, clicks: 0, cost: 0, conversions: 0, conversionRevenue: 0 };
        }
        gfaDateMap[d.date].impressions += (d.impressions || 0);
        gfaDateMap[d.date].clicks += (d.clicks || 0);
        gfaDateMap[d.date].cost += (d.cost || 0);
        gfaDateMap[d.date].conversions += (d.conversions || 0);
        gfaDateMap[d.date].conversionRevenue += (d.conversionRevenue || 0);
      });

      let matchCount = 0;
      for (let rowIdx = 21; rowIdx <= 51; rowIdx++) {
        const dateCell = gfaDailySheet.getCell(rowIdx, 2);
        if (dateCell.value) {
          let targetDate = "";
          if (dateCell.value instanceof Date) {
            const d = dateCell.value;
            targetDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          } else if (typeof dateCell.value === 'number') {
            const excelEpoch = new Date(1899, 11, 30);
            const d = new Date(excelEpoch.getTime() + dateCell.value * 86400000);
            targetDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          } else {
            const parts = String(dateCell.value).split(/[^0-9]+/).filter(p => p.length > 0);
            if (parts.length >= 3) targetDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
          }
          
          if (targetDate && gfaDateMap[targetDate]) {
            const data = gfaDateMap[targetDate];
            writeCell(gfaDailySheet, rowIdx, 4, data.impressions);
            writeCell(gfaDailySheet, rowIdx, 5, data.clicks);
            writeCell(gfaDailySheet, rowIdx, 8, data.cost);
            writeCell(gfaDailySheet, rowIdx, 9, data.conversions);
            writeCell(gfaDailySheet, rowIdx, 12, data.conversionRevenue);
            matchCount++;
          }
        }
      }
      console.log(`[GFA 일별] 네이버GFA_일일 시트 업데이트 완료: ${matchCount}건 매칭됨`);
    }

    // -- 4. 쿠팡 일별 처리 --
    const coupangDailySheet = getWorksheetRobust('쿠팡_일일');
    if (coupangDailySheet) {
      const coupangDaily = parsedData.filter(d => d.platform === 'coupang' && d.dataType === 'daily');

      const coupangDateMap: Record<string, any> = {};
      coupangDaily.forEach(d => {
        if (!coupangDateMap[d.date]) {
          coupangDateMap[d.date] = { impressions: 0, clicks: 0, cost: 0, conversions: 0, conversionRevenue: 0 };
        }
        coupangDateMap[d.date].impressions += (d.impressions || 0);
        coupangDateMap[d.date].clicks += (d.clicks || 0);
        coupangDateMap[d.date].cost += (d.cost || 0);
        coupangDateMap[d.date].conversions += (d.conversions || 0);
        coupangDateMap[d.date].conversionRevenue += (d.conversionRevenue || 0);
      });

      let matchCount = 0;
      for (let rowIdx = 21; rowIdx <= 51; rowIdx++) {
        const dateCell = coupangDailySheet.getCell(rowIdx, 2);
        if (dateCell.value) {
          let targetDate = "";
          if (dateCell.value instanceof Date) {
            const d = dateCell.value;
            targetDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          } else if (typeof dateCell.value === 'number') {
            const excelEpoch = new Date(1899, 11, 30);
            const d = new Date(excelEpoch.getTime() + dateCell.value * 86400000);
            targetDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          } else {
            const rawVal = String(dateCell.value).trim().replace(/\s+/g, '');
            if (/^\d{8}$/.test(rawVal)) {
              targetDate = `${rawVal.slice(0, 4)}-${rawVal.slice(4, 6)}-${rawVal.slice(6, 8)}`;
            } else if (/^\d{6}$/.test(rawVal)) {
              targetDate = `20${rawVal.slice(0, 2)}-${rawVal.slice(2, 4)}-${rawVal.slice(4, 6)}`;
            } else {
              const parts = rawVal.split(/[^0-9]+/).filter(p => p.length > 0);
              if (parts.length >= 3) {
                let yyyy = parts[0];
                if (yyyy.length === 2) yyyy = `20${yyyy}`;
                targetDate = `${yyyy}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
              }
            }
          }
          
          if (targetDate && coupangDateMap[targetDate]) {
            const data = coupangDateMap[targetDate];
            writeCell(coupangDailySheet, rowIdx, 4, data.impressions);
            writeCell(coupangDailySheet, rowIdx, 5, data.clicks);
            writeCell(coupangDailySheet, rowIdx, 8, Math.round(data.cost * 1.1));
            writeCell(coupangDailySheet, rowIdx, 9, data.conversions);
            writeCell(coupangDailySheet, rowIdx, 12, data.conversionRevenue);
            matchCount++;
          }
        }
      }
      console.log(`[쿠팡 일별] 쿠팡_일일 시트 업데이트 완료: ${matchCount}건 매칭됨`);
    }

    // -- 5. 쿠팡 키워드 처리 --
    const coupangKeywordSheet = getWorksheetRobust('쿠팡_누적');
    if (coupangKeywordSheet) {
      const coupangKeyword = parsedData.filter(d => 
        d.platform === 'coupang' && 
        d.dataType === 'keyword'
      );

      // 5-1. 상품명 기준 중복 합산 (9행부터 아래로 기입)
      const productGroups: Record<string, {
        productName: string;
        impressions: number;
        clicks: number;
        cost: number;
        conversions: number;
        conversionRevenue: number;
      }> = {};

      coupangKeyword.forEach(d => {
        const prod = (d.adGroupName || '-').trim();
        if (!productGroups[prod]) {
          productGroups[prod] = {
            productName: prod,
            impressions: 0,
            clicks: 0,
            cost: 0,
            conversions: 0,
            conversionRevenue: 0
          };
        }
        productGroups[prod].impressions += (d.impressions || 0);
        productGroups[prod].clicks += (d.clicks || 0);
        productGroups[prod].cost += (d.cost || 0);
        productGroups[prod].conversions += (d.conversions || 0);
        productGroups[prod].conversionRevenue += (d.conversionRevenue || 0);
      });

      const aggregatedProducts = Object.values(productGroups);

      // 다중 정렬 적용: 1순위 conversions 내림차순, 2순위 cost 내림차순
      aggregatedProducts.sort((a, b) => {
        if (b.conversions !== a.conversions) {
          return b.conversions - a.conversions;
        }
        return b.cost - a.cost;
      });

      // 9행부터 순차 기입
      let productRow = 9;
      aggregatedProducts.forEach(d => {
        writeCell(coupangKeywordSheet, productRow, 3, d.productName);
        writeCell(coupangKeywordSheet, productRow, 4, d.impressions);
        writeCell(coupangKeywordSheet, productRow, 5, d.clicks);
        writeCell(coupangKeywordSheet, productRow, 8, Math.round(d.cost * 1.1));
        writeCell(coupangKeywordSheet, productRow, 9, d.conversions);
        writeCell(coupangKeywordSheet, productRow, 12, d.conversionRevenue);
        productRow++;
      });
      console.log(`[쿠팡 키워드] 쿠팡_누적 시트 상품별 요약 완료: ${aggregatedProducts.length}개 상품 입력됨`);

      // 5-2. 키워드별 그룹화 및 합산 (36행부터 아래로 기입)
      const keywordGroups: Record<string, {
        keyword: string;
        impressions: number;
        clicks: number;
        cost: number;
        conversions: number;
        conversionRevenue: number;
      }> = {};

      coupangKeyword.forEach(d => {
        const kw = (d.keyword || '-').trim();
        if (!keywordGroups[kw]) {
          keywordGroups[kw] = {
            keyword: kw,
            impressions: 0,
            clicks: 0,
            cost: 0,
            conversions: 0,
            conversionRevenue: 0
          };
        }
        keywordGroups[kw].impressions += (d.impressions || 0);
        keywordGroups[kw].clicks += (d.clicks || 0);
        keywordGroups[kw].cost += (d.cost || 0);
        keywordGroups[kw].conversions += (d.conversions || 0);
        keywordGroups[kw].conversionRevenue += (d.conversionRevenue || 0);
      });

      // 객체를 배열로 변환
      const aggregatedKeywords = Object.values(keywordGroups);

      // 다중 정렬 적용:
      // 1순위: 총 판매수량(14일)(conversions) 내림차순
      // 2순위: 광고비(cost) 내림차순
      aggregatedKeywords.sort((a, b) => {
        if (b.conversions !== a.conversions) {
          return b.conversions - a.conversions;
        }
        return b.cost - a.cost;
      });

      // 36행부터 아래로 순차 기입
      let currentRow = 36;
      aggregatedKeywords.forEach(d => {
        // C(3): 키워드, D(4): 노출수, E(5): 클릭수, H(8): 광고비, I(9): 총 판매수량(14일), L(12): 총 전환매출액(14일)
        writeCell(coupangKeywordSheet, currentRow, 3, d.keyword);
        writeCell(coupangKeywordSheet, currentRow, 4, d.impressions);
        writeCell(coupangKeywordSheet, currentRow, 5, d.clicks);
        // 최종 합산된 광고비에 1.1 곱하고 반올림
        writeCell(coupangKeywordSheet, currentRow, 8, Math.round(d.cost * 1.1));
        writeCell(coupangKeywordSheet, currentRow, 9, d.conversions);
        writeCell(coupangKeywordSheet, currentRow, 12, d.conversionRevenue);
        currentRow++;
      });
      console.log(`[쿠팡 키워드] 쿠팡_누적 시트 업데이트 완료: ${aggregatedKeywords.length}개 키워드(중복 합산 및 정렬 적용) 입력됨`);
    }

    // -- 6. 요약 시트 기준 날짜 기입 --
    const summarySheet = getWorksheetRobust('요약');
    if (summarySheet) {
      // 한국 표준시(KST)를 준수하는 어제 날짜 구하기
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const yy = String(yesterday.getFullYear()).slice(-2);
      const mm = String(yesterday.getMonth() + 1).padStart(2, '0');
      const dd = String(yesterday.getDate()).padStart(2, '0');
      const formattedDate = `${yy}-${mm}-${dd}`;

      writeCell(summarySheet, 35, 3, formattedDate); // C35 셀
      console.log(`[요약] C35 셀 기준 날짜 입력 완료: ${formattedDate}`);
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
              ref={el => { fileInputRefs.current[zone.key] = el; }}
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
