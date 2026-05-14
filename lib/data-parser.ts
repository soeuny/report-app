export interface StandardAdData {
  id: string; // 고유 ID
  platform: string; // 네이버 쇼핑, 파워링크, GFA, 쿠팡 등
  dataType: 'daily' | 'keyword'; // 데이터 종류 (일별/키워드)
  campaignName: string; // 캠페인명
  adGroupName: string; // 광고그룹명
  keyword: string; // 키워드 (해당하는 경우)
  date: string; // 날짜 (YYYY-MM-DD)
  impressions: number; // 노출수
  clicks: number; // 클릭수
  ctr: number; // 클릭률 (%)
  cpc: number; // 평균 CPC (원)
  cost: number; // 총 광고비 (원)
  conversions: number; // 전환수
  cpa: number; // 전환당 비용 (원)
  cvr: number; // 전환율 (%)
  roas: number; // 광고수익률 (%)
  campaignType?: string; // 캠페인유형 (파워링크, 쇼핑검색 등)
  conversionRevenue?: number; // 구매완료 전환매출액(원)
  sourceZone?: string; // 데이터 소스 존 (naver_daily 등)
}

// 공통 컬럼 매핑 사전 (매체 구분 없이 유연하게 탐색)
const COMMON_MAPPINGS = {
  campaignName: ['캠페인', 'campaign'],
  adGroupName: ['광고그룹', '그룹명', 'adgroup'],
  keyword: ['키워드', 'keyword', '검색어', '확장검색어'],
  date: ['날짜', '일자', '일별', '기간', 'date'],
  impressions: ['노출', 'impression'],
  clicks: ['클릭', 'click'],
  cost: ['비용', '광고비', '지출액', '총비용', '소진', 'cost'],
  conversions: ['구매완료전환수', '전환', '결제수', '구매수', '구매건수', 'conversion'],
  roas: ['roas', '수익률'],
  campaignType: ['캠페인유형', 'campaigntype', '유형'],
  conversionRevenue: ['구매완료전환매출액(원)', '구매완료전환매출액', '전환매출', '전환매출액', '매출액', 'revenue'],
};

/**
 * 엑셀 헤더 문자열을 정규화하여 표준 지표 키를 찾습니다.
 */
function findStandardKey(rawHeader: string): string | null {
  if (!rawHeader || typeof rawHeader !== 'string') return null;
  const normalizedHeader = rawHeader.replace(/\s+/g, '').toLowerCase();
  
  let bestMatch: { key: string; length: number } | null = null;

  for (const [standardKey, possibleNames] of Object.entries(COMMON_MAPPINGS)) {
    for (const name of possibleNames) {
      const normalizedName = name.replace(/\s+/g, '').toLowerCase();
      // "전환"이 "전환매출액"에 포함되는 문제를 방지하기 위해 
      // 더 긴(상세한) 키워드가 매칭되면 그것을 우선함
      if (normalizedHeader.includes(normalizedName)) {
        if (!bestMatch || normalizedName.length > bestMatch.length) {
          bestMatch = { key: standardKey, length: normalizedName.length };
        }
      }
    }
  }
  return bestMatch ? bestMatch.key : null;
}

/**
 * 값을 숫자로 안전하게 변환합니다.
 */
function parseNumber(value: any): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  
  const cleaned = String(value).replace(/,/g, '').replace(/%/g, '').replace(/원/g, '').trim();
  const parsed = Number(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * 날짜 형식을 YYYY-MM-DD로 정규화합니다.
 * '2026.05.01.' -> '2026-05-01'
 * 엑셀 시리얼 넘버(예: 46143)도 지원합니다.
 */
function normalizeDateStr(value: any): string {
  if (value === null || value === undefined || value === '' || value === '-') return '-';

  // 1) 엑셀 시리얼 넘버 (숫자인 경우)
  if (typeof value === 'number') {
    const excelEpoch = new Date(1899, 11, 30);
    const d = new Date(excelEpoch.getTime() + value * 86400000);
    if (!isNaN(d.getTime())) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    return '-';
  }

  // 2) Date 객체인 경우
  if (value instanceof Date) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  }

  // 3) 문자열인 경우: 숫자만 추출 (e.g. "2026.05.01." -> ["2026", "05", "01"])
  const dateStr = String(value);
  const parts = dateStr.split(/[^0-9]+/).filter(p => p.length > 0);
  
  if (parts.length >= 3) {
    const yyyy = parts[0];
    const mm = parts[1].padStart(2, '0');
    const dd = parts[2].padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  
  return dateStr;
}

/**
 * 엑셀 2차원 배열 데이터를 표준 포맷(StandardAdData)으로 파싱합니다.
 * @param rawData XLSX.utils.sheet_to_json(ws, { header: 1 }) 결과값
 * @param platform 매체명
 * @param dataType 데이터 종류
 * @param zone 데이터 소스 존
 */
export function normalizeData(rawData: any[][], platform: string, dataType: 'daily' | 'keyword', zone?: string): StandardAdData[] {
  if (!rawData || !Array.isArray(rawData) || rawData.length === 0) return [];

  // 1. 헤더 행(Row) 찾기
  // 가장 많은 매핑 키워드가 발견된 행을 헤더 행으로 간주
  let headerRowIndex = 0;
  let maxMatchCount = 0;
  let bestHeaderMap: Record<number, string> = {}; // { 열인덱스: '표준키' }

  // 처음 20줄 이내에서 헤더를 탐색 (보통 상단에 위치)
  for (let i = 0; i < Math.min(rawData.length, 20); i++) {
    const row = rawData[i];
    if (!Array.isArray(row)) continue;

    let matchCount = 0;
    const currentHeaderMap: Record<number, string> = {};

    row.forEach((cellValue, colIndex) => {
      const standardKey = findStandardKey(String(cellValue));
      if (standardKey) {
        matchCount++;
        currentHeaderMap[colIndex] = standardKey;
      }
    });

    if (matchCount > maxMatchCount) {
      maxMatchCount = matchCount;
      headerRowIndex = i;
      bestHeaderMap = currentHeaderMap;
    }
  }

  // 인식된 헤더가 2개 미만이면 실패로 간주
  if (maxMatchCount < 2) {
    console.warn('데이터 열을 인식하지 못했습니다. (매핑 실패)');
    return [];
  }

  // 2. 실제 데이터 파싱
  const results: StandardAdData[] = [];
  
  // 헤더 다음 줄부터 읽기
  for (let i = headerRowIndex + 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (!Array.isArray(row) || row.length === 0) continue;
    
    // 빈 행(모든 값이 undefined/빈문자열) 건너뛰기
    const isEmpty = row.every(cell => cell === null || cell === undefined || cell === '');
    if (isEmpty) continue;

    const mappedRow: Partial<StandardAdData> = {
      id: `${platform}-${i}-${Date.now()}`,
      platform: platform,
      dataType: dataType,
      sourceZone: zone,
    };

    // 추출된 헤더 맵을 기반으로 열 값 매핑
    Object.entries(bestHeaderMap).forEach(([colIndexStr, standardKey]) => {
      const colIndex = parseInt(colIndexStr, 10);
      const value = row[colIndex];
      
      if (['impressions', 'clicks', 'cost', 'conversions', 'conversionRevenue'].includes(standardKey)) {
        mappedRow[standardKey as keyof StandardAdData] = parseNumber(value) as never;
      } else if (standardKey === 'roas') {
        mappedRow[standardKey as keyof StandardAdData] = parseNumber(value) as never;
      } else if (standardKey === 'date') {
        mappedRow.date = normalizeDateStr(value);
      } else {
        mappedRow[standardKey as keyof StandardAdData] = (value !== undefined && value !== null) ? String(value) : '-' as never;
      }
    });

    // [네이버 키워드] 특수 규칙: 사용자 요청에 따라 F열(5)과 G열(6)을 각각 전환수와 전환매출액으로 강제 매핑
    if (platform === 'naver' && dataType === 'keyword') {
      if (row[5] !== undefined) mappedRow.conversions = parseNumber(row[5]);
      if (row[6] !== undefined) mappedRow.conversionRevenue = parseNumber(row[6]);
    }

    // 노출수나 클릭수 등 핵심 지표가 아예 없으면 유효하지 않은 데이터로 간주하고 무시 (합계(총계) 행 등 제외용)
    if (mappedRow.impressions === undefined && mappedRow.clicks === undefined && mappedRow.cost === undefined) {
      continue;
    }

    // 3. 파생 지표 자동 계산
    const imp = (mappedRow.impressions as number) || 0;
    const clk = (mappedRow.clicks as number) || 0;
    const cost = (mappedRow.cost as number) || 0;
    const conv = (mappedRow.conversions as number) || 0;

    mappedRow.ctr = imp > 0 ? (clk / imp) * 100 : 0;
    mappedRow.cpc = clk > 0 ? cost / clk : 0;
    mappedRow.cpa = conv > 0 ? cost / conv : 0;
    mappedRow.cvr = clk > 0 ? (conv / clk) * 100 : 0;
    
    results.push(mappedRow as StandardAdData);
  }

  return results;
}
