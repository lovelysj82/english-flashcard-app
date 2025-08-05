// 데이터 서비스 - 구글 시트와 로컬 데이터를 통합 관리

import { Sentence } from "@/data/sampleSentences";
import { fetchGoogleSheetsData, getCachedData, setCachedData, getFallbackData } from "@/lib/googleSheets";
import { sampleSentences } from "@/data/sampleSentences";
import { config } from "@/config/environment";

export class DataService {
  private static instance: DataService;
  private data: Sentence[] = [];
  private isLoading = false;
  private hasError = false;

  private constructor() {}

  public static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  // 데이터 가져오기 (캐시 -> 구글 시트 -> 폴백 순서)
  public async getSentences(): Promise<Sentence[]> {
    // 이미 데이터가 있으면 반환
    if (this.data.length > 0) {
      return this.data;
    }

    // 로딩 중이면 대기
    if (this.isLoading) {
      await this.waitForLoading();
      return this.data;
    }

    this.isLoading = true;
    console.log('📊 데이터 로딩 시작...');

    try {
      // 1단계: 캐시된 데이터 확인
      const cachedData = getCachedData();
      if (cachedData && cachedData.length > 0) {
        console.log('✅ 캐시된 데이터 사용');
        this.data = this.convertToSentenceFormat(cachedData);
        this.isLoading = false;
        return this.data;
      }

      // 2단계: 구글 시트에서 데이터 가져오기 (타임아웃 5초)
      console.log('🌐 구글 시트에서 데이터 가져오는 중...');
      
      // 빠른 폴백을 위한 타임아웃 설정
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: 5초 내에 응답 없음')), 5000)
      );
      
      const googleSheetsData = await Promise.race([
        fetchGoogleSheetsData(config.googleSheets.spreadsheetId),
        timeoutPromise
      ]);
      
      if (googleSheetsData && googleSheetsData.length > 0) {
        console.log('✅ 구글 시트 데이터 로드 성공');
        this.data = this.convertToSentenceFormat(googleSheetsData);
        setCachedData(googleSheetsData); // 캐시 저장
        this.hasError = false;
      } else {
        throw new Error('구글 시트에서 유효한 데이터를 가져올 수 없습니다');
      }

    } catch (error) {
      console.error('❌ 구글 시트 데이터 로드 실패:', error);
      this.hasError = true;

      // 에러 원인 분석 및 가이드 제공
      if (config.googleSheets.spreadsheetId === "YOUR_SPREADSHEET_ID_HERE") {
        console.warn('⚠️ 스프레드시트 ID가 설정되지 않았습니다. src/config/environment.ts 파일에서 실제 ID를 설정하세요.');
      }

      // 3단계: 폴백 데이터 사용 (기존 샘플 데이터)
      console.log('🔄 폴백 데이터 사용 (로컬 샘플 데이터)');
      this.data = sampleSentences;
    } finally {
      this.isLoading = false;
    }

    console.log(`📈 총 ${this.data.length}개의 문장 로드됨`);
    return this.data;
  }

  // 구글 시트 데이터 형식을 Sentence 형식으로 변환
  private convertToSentenceFormat(googleData: any[]): Sentence[] {
    return googleData.map((item, index) => ({
      id: item.id || `gs-${index + 1}`,
      level: item.level || 1,
      category: item.category || '기본',
      koreanSentence: item.koreanSentence || '',
      englishSentence: item.englishSentence || '',
      notes: item.notes || ''
    }));
  }

  // 로딩 완료까지 대기
  private async waitForLoading(): Promise<void> {
    while (this.isLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // 데이터 새로고침 (캐시 무시하고 구글 시트에서 다시 가져오기)
  public async refreshData(): Promise<Sentence[]> {
    console.log('🔄 데이터 새로고침...');
    
    // 캐시 클리어
    localStorage.removeItem('google-sheets-cache');
    localStorage.removeItem('google-sheets-cache-expiry');
    
    // 데이터 초기화
    this.data = [];
    
    // 다시 가져오기
    return await this.getSentences();
  }

  // 데이터 상태 확인
  public getDataStatus() {
    return {
      isLoading: this.isLoading,
      hasError: this.hasError,
      dataCount: this.data.length,
      source: this.hasError ? 'local' : 'google-sheets'
    };
  }

  // 특정 레벨의 문장들 가져오기
  public async getSentencesByLevel(level: number): Promise<Sentence[]> {
    const allSentences = await this.getSentences();
    return allSentences.filter(sentence => sentence.level === level);
  }

  // 사용 가능한 레벨 목록 가져오기
  public async getAvailableLevels(): Promise<number[]> {
    const allSentences = await this.getSentences();
    const levels = [...new Set(allSentences.map(s => s.level))];
    return levels.sort((a, b) => a - b);
  }
}

// 싱글톤 인스턴스 내보내기
export const dataService = DataService.getInstance();