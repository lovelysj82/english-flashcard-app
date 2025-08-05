// Google Sheets 데이터를 가져오는 유틸리티 함수들

interface GoogleSheetsData {
  id: string;
  level: number;
  category: string;
  koreanSentence: string;
  englishSentence: string;
  notes: string;
}

// 구글 스프레드시트 공개 CSV URL에서 데이터를 가져오는 함수
export async function fetchGoogleSheetsData(spreadsheetId: string): Promise<GoogleSheetsData[]> {
  try {
    // 공개 CSV 형태로 구글 스프레드시트 데이터 가져오기
    const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=0`;
    
    console.log('구글 스프레드시트에서 데이터 가져오는 중...', csvUrl);
    
    // 타임아웃 설정 (10초)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(csvUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'text/csv',
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }
    
    const csvText = await response.text();
    console.log('CSV 데이터 받음:', csvText.substring(0, 200) + '...');
    
    // CSV 파싱
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));
    
    console.log('CSV 헤더:', headers);
    
    const data: GoogleSheetsData[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim() === '') continue; // 빈 줄 스킵
      
      // CSV 파싱 (따옴표 처리 포함)
      const values = parseCSVLine(line);
      
      if (values.length >= 6) {
        const item: GoogleSheetsData = {
          id: values[1]?.trim() || `item-${i}`, // ID 컬럼 (B열)
          level: parseInt(values[0]?.trim() || '1'), // Level 컬럼 (A열)  
          category: values[2]?.trim() || '', // Category 컬럼 (C열)
          koreanSentence: values[3]?.trim() || '', // Korean Sentence 컬럼 (D열)
          englishSentence: values[4]?.trim() || '', // English Sentence 컬럼 (E열)
          notes: values[5]?.trim() || '' // Notes 컬럼 (F열)
        };
        
        // 유효한 데이터만 추가
        if (item.koreanSentence && item.englishSentence) {
          data.push(item);
        }
      }
    }
    
    console.log(`파싱된 데이터 ${data.length}개:`, data.slice(0, 3));
    return data;
    
  } catch (error) {
    console.error('구글 스프레드시트 데이터 가져오기 실패:', error);
    throw error;
  }
}

// CSV 라인을 파싱하는 헬퍼 함수 (따옴표와 쉼표 처리)
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current); // 마지막 값 추가
  return result.map(val => val.replace(/"/g, '')); // 따옴표 제거
}

// 로컬 스토리지에 캐시된 데이터 저장/불러오기
const CACHE_KEY = 'google-sheets-cache';
const CACHE_EXPIRY_KEY = 'google-sheets-cache-expiry';
const CACHE_DURATION = 5 * 60 * 1000; // 5분

export function getCachedData(): GoogleSheetsData[] | null {
  try {
    const cachedData = localStorage.getItem(CACHE_KEY);
    const cacheExpiry = localStorage.getItem(CACHE_EXPIRY_KEY);
    
    if (cachedData && cacheExpiry) {
      const expiryTime = parseInt(cacheExpiry);
      if (Date.now() < expiryTime) {
        console.log('캐시된 데이터 사용');
        return JSON.parse(cachedData);
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

export function setCachedData(data: GoogleSheetsData[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(CACHE_EXPIRY_KEY, (Date.now() + CACHE_DURATION).toString());
    console.log('데이터 캐시 저장됨');
  } catch (error) {
    console.warn('캐시 저장 실패:', error);
  }
}

// 폴백 데이터 (네트워크 오류 시 사용)
export function getFallbackData(): GoogleSheetsData[] {
  // sampleSentences 형식으로 변환하여 반환
  const fallbackData: GoogleSheetsData[] = [
    {
      id: "1-1",
      level: 1,
      category: "기본 인사",
      koreanSentence: "안녕하세요.",
      englishSentence: "Hello.",
      notes: "기본 인사 표현"
    },
    {
      id: "1-2", 
      level: 1,
      category: "기본 인사",
      koreanSentence: "반갑습니다.",
      englishSentence: "Nice to meet you.",
      notes: "처음 만났을 때 인사"
    },
    {
      id: "1-3",
      level: 1, 
      category: "일상 표현",
      koreanSentence: "오늘은 좋은 날이에요.",
      englishSentence: "It's a good day.",
      notes: "긍정적인 하루 표현"
    }
  ];
  
  console.log('폴백 데이터 사용:', fallbackData.length, '개');
  return fallbackData;
}