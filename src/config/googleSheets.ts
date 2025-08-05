// 구글 스프레드시트 설정

// 구글 스프레드시트 설정을 위한 상수들
export const GOOGLE_SHEETS_CONFIG = {
  // 스프레드시트 ID - URL에서 /d/ 다음과 /edit 이전 부분
  // 예: https://docs.google.com/spreadsheets/d/1ABC123XYZ/edit
  // 에서 1ABC123XYZ 부분
  SPREADSHEET_ID: "1yA5iBM8V2gQX8mGZJKJLcx4X4qPqGzCVrPqWJLcx4X4", // 실제 ID로 교체 필요
  
  // 시트 GID (기본값: 0)
  SHEET_GID: 0,
  
  // 사용할 범위 (비어있으면 전체)
  RANGE: "", // 예: "A1:F100"
};

// 스프레드시트 공개 설정 확인을 위한 헬퍼 함수
export function getPublicCSVUrl(spreadsheetId: string, gid: number = 0): string {
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
}

// 스프레드시트 공개 설정 테스트 함수
export async function testSpreadsheetAccess(spreadsheetId: string): Promise<boolean> {
  try {
    const url = getPublicCSVUrl(spreadsheetId);
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}