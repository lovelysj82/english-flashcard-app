import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Mic, BookOpen, Volume2 } from "lucide-react";

export type LearningMode = 'sentence-completion' | 'speaking';

interface LearningModeSelectorProps {
  onSelectMode: (mode: LearningMode) => void;
}

export function LearningModeSelector({ onSelectMode }: LearningModeSelectorProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-learning-primary to-primary-glow rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-learning-primary to-primary-glow bg-clip-text text-transparent">
              Phrase Builder Pro
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            레벨별 영어 표현 학습 시스템으로 체계적인 영어 문장 완성과 말하기 연습을 해보세요
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/30 cursor-pointer overflow-hidden">
            <CardHeader className="pb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-learning-primary to-primary-glow rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl">문장 완성 모드</CardTitle>
              <CardDescription className="text-base">
                단어 버튼을 클릭하여 올바른 순서로 영어 문장을 완성하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-learning-secondary rounded-full"></div>
                <span>한국어 문장을 보고 영어로 조합</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-learning-secondary rounded-full"></div>
                <span>단어 버튼 클릭으로 직관적 학습</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Volume2 className="w-4 h-4" />
                <span>TTS 발음 기능 제공</span>
              </div>
              <Button 
                variant="default" 
                size="lg" 
                className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => {
                  console.log('문장완성 버튼 클릭됨');
                  onSelectMode('sentence-completion');
                }}
              >
                문장 완성 시작하기
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/30 cursor-pointer overflow-hidden">
            <CardHeader className="pb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-learning-secondary to-success rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Mic className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl">말하기 모드</CardTitle>
              <CardDescription className="text-base">
                마이크를 사용하여 영어 문장을 직접 말해보고 연습하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-learning-secondary rounded-full"></div>
                <span>실제 발음 연습으로 스피킹 향상</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-learning-secondary rounded-full"></div>
                <span>STT 음성 인식 기술 활용</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Volume2 className="w-4 h-4" />
                <span>원어민 발음 피드백</span>
              </div>
              <Button 
                variant="default" 
                size="lg" 
                className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => {
                  console.log('말하기 버튼 클릭됨');
                  onSelectMode('speaking');
                }}
              >
                말하기 연습 시작하기
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            💡 각 레벨의 모든 문장을 정답으로 맞춰야 다음 레벨로 진행됩니다
          </p>
        </div>
      </div>
    </div>
  );
}