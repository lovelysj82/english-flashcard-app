import { Button } from "@/components/ui/button";
import { MessageCircle, Mic } from "lucide-react";

export type LearningMode = 'sentence-completion' | 'speaking';

interface LearningModeSelectorProps {
  onSelectMode: (mode: LearningMode) => void;
}

export function LearningModeSelector({ onSelectMode }: LearningModeSelectorProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center p-4">
      <div className="w-full max-w-sm mx-auto">
        {/* 앱 제목 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Blabla EN
          </h1>
        </div>

        {/* 학습 모드 선택 */}
        <div className="space-y-4">
          {/* 문장 완성 모드 */}
          <Button 
            variant="outline" 
            size="lg" 
            className="w-full h-16 flex items-center justify-start gap-4 text-left bg-blue-50 hover:bg-blue-100 border-blue-200"
            onClick={() => {
              console.log('문장완성 버튼 클릭됨');
              onSelectMode('sentence-completion');
            }}
          >
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-blue-900">문장 완성</div>
              <div className="text-sm text-blue-600">단어를 조합해서 문장 만들기</div>
            </div>
          </Button>

          {/* 말하기 모드 */}
          <Button 
            variant="outline" 
            size="lg" 
            className="w-full h-16 flex items-center justify-start gap-4 text-left bg-green-50 hover:bg-green-100 border-green-200"
            onClick={() => {
              console.log('말하기 버튼 클릭됨');
              onSelectMode('speaking');
            }}
          >
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-green-900">말하기 연습</div>
              <div className="text-sm text-green-600">마이크로 발음 연습하기</div>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}