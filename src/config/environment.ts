// 환경 설정 및 구글 스프레드시트 연동 설정

export const config = {
  // 구글 스프레드시트 설정
  googleSheets: {
    // ===== 여기에 실제 스프레드시트 ID를 입력하세요! =====
    // 스프레드시트 URL: https://docs.google.com/spreadsheets/d/레벨별영어표현2025-08-04/edit#gid=0
    // 에서 ID 부분을 찾아서 아래에 붙여넣으세요
    // 
    // 🔧 설정 방법:
    // 1. 구글 스프레드시트를 "링크가 있는 모든 사용자"로 공개 설정
    // 2. URL에서 /d/ 다음과 /edit 이전 부분이 ID입니다
    // 3. 아래 spreadsheetId에 실제 ID를 입력하세요
    spreadsheetId: "1z0Bc0gM7dCph8KwLcSOFWind8rUSm4qnNa8nuayY1CY", // 테스트용 공개 시트
    
    // 시트 GID (일반적으로 첫 번째 시트는 0)
    sheetGid: 0,
    
    // 캐시 설정
    cacheEnabled: true,
    cacheDuration: 5 * 60 * 1000, // 5분
  },
  
  // 개발 모드 설정
  development: {
    // 개발 중에는 로컬 데이터 우선 사용
    useLocalDataFirst: false,
    
    // 디버그 로그 활성화
    enableDebugLogs: true,
  }
};

// 스프레드시트 ID 유효성 검사
export function validateSpreadsheetId(id: string): boolean {
  // Google Sheets ID는 보통 44자의 알파벳+숫자+특수문자 조합
  const pattern = /^[a-zA-Z0-9-_]{40,50}$/;
  return pattern.test(id);
}

// 스프레드시트 URL에서 ID 추출
export function extractSpreadsheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

// 공개 CSV URL 생성
export function getPublicCSVUrl(spreadsheetId?: string, gid: number = 0): string {
  const id = spreadsheetId || config.googleSheets.spreadsheetId;
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
}