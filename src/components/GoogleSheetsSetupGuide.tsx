// 구글 스프레드시트 설정 가이드 컴포넌트

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileSpreadsheet, Settings, CheckCircle } from "lucide-react";

interface GoogleSheetsSetupGuideProps {
  onClose?: () => void;
}

export function GoogleSheetsSetupGuide({ onClose }: GoogleSheetsSetupGuideProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            구글 스프레드시트 연동 설정
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 font-medium mb-2">
              📊 현재 로컬 샘플 데이터를 사용 중입니다
            </p>
            <p className="text-blue-700 text-sm">
              구글 스프레드시트와 연동하여 실제 데이터를 사용하려면 아래 단계를 따라하세요.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">1</Badge>
              <div>
                <h3 className="font-semibold mb-2">구글 스프레드시트 공개 설정</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 구글 스프레드시트에서 <strong>"공유"</strong> 버튼 클릭</li>
                  <li>• <strong>"링크가 있는 모든 사용자"</strong>로 권한 변경</li>
                  <li>• 역할을 <strong>"뷰어"</strong>로 설정</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">2</Badge>
              <div>
                <h3 className="font-semibold mb-2">스프레드시트 ID 복사</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• URL에서 <code>/d/</code> 다음과 <code>/edit</code> 이전 부분이 ID입니다</li>
                  <li>• 예: <code>https://docs.google.com/spreadsheets/d/<strong>ABC123...</strong>/edit</code></li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">3</Badge>
              <div>
                <h3 className="font-semibold mb-2">코드에 ID 설정</h3>
                <div className="bg-gray-100 p-3 rounded-md text-sm font-mono">
                  <p className="text-gray-600">src/config/environment.ts 파일에서:</p>
                  <p className="mt-1">
                    <span className="text-blue-600">spreadsheetId:</span>{" "}
                    <span className="text-green-600">"YOUR_ID_HERE"</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">4</Badge>
              <div>
                <h3 className="font-semibold mb-2">데이터 형식 확인</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  스프레드시트의 첫 번째 시트에 다음 열 순서로 데이터가 있어야 합니다:
                </p>
                <div className="bg-gray-100 p-3 rounded-md text-sm">
                  <div className="grid grid-cols-6 gap-2 font-mono">
                    <div><strong>A:</strong> Level</div>
                    <div><strong>B:</strong> ID</div>
                    <div><strong>C:</strong> Category</div>
                    <div><strong>D:</strong> Korean</div>
                    <div><strong>E:</strong> English</div>
                    <div><strong>F:</strong> Notes</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-800 text-sm">
              설정 완료 후 페이지를 새로고침하면 구글 시트 데이터가 로드됩니다!
            </p>
          </div>

          <div className="flex justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => window.open("https://docs.google.com/spreadsheets", "_blank")}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              구글 시트 열기
            </Button>
            {onClose && (
              <Button onClick={onClose}>
                <Settings className="w-4 h-4 mr-2" />
                설정 완료
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}