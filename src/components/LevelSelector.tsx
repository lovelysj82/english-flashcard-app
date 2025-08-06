import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle, Lock, RotateCcw, BookOpen, Volume2 } from "lucide-react";
import { Sentence } from "@/data/sampleSentences";

export type LearningMode = 'sentence-completion' | 'speaking';

interface LevelProgress {
  level: number;
  completed: boolean;
  totalSentences: number;
  correctAnswers: number;
  unlocked: boolean;
}

interface LevelSelectorProps {
  sentences: Sentence[];
  selectedMode: LearningMode;
  onSelectLevel: (level: number) => void;
  onBack: () => void;
}

export function LevelSelector({ sentences, selectedMode, onSelectLevel, onBack }: LevelSelectorProps) {
  const [levelProgress, setLevelProgress] = useState<LevelProgress[]>([]);

  // 로컬 스토리지에서 진행 상태 불러오기 (두 모드의 진행률을 합쳐서 표시)
  useEffect(() => {
    const loadProgress = () => {
      // 두 모드의 진행률을 모두 가져옴
      const sentenceProgressData = localStorage.getItem('learning-progress-sentence-completion');
      const speakingProgressData = localStorage.getItem('learning-progress-speaking');
      
      let sentenceProgress: LevelProgress[] = [];
      let speakingProgress: LevelProgress[] = [];
      
      if (sentenceProgressData) {
        sentenceProgress = JSON.parse(sentenceProgressData);
      }
      if (speakingProgressData) {
        speakingProgress = JSON.parse(speakingProgressData);
      }
      
      console.log('문장완성 모드 진행률:', sentenceProgress);
      console.log('말하기 모드 진행률:', speakingProgress);
      
      let progress: LevelProgress[] = [];

      // 레벨별 문장 수 계산
      const levelStats = sentences.reduce((acc, sentence) => {
        if (!acc[sentence.level]) {
          acc[sentence.level] = { total: 0, categories: new Set() };
        }
        acc[sentence.level].total++;
        acc[sentence.level].categories.add(sentence.category);
        return acc;
      }, {} as Record<number, { total: number; categories: Set<string> }>);

      // 진행 상태 초기화 또는 업데이트 (두 모드의 진행률을 합침)
      const levels = Object.keys(levelStats).map(Number).sort((a, b) => a - b);
      const newProgress = levels.map((level, index) => {
        // 두 모드에서 해당 레벨의 진행률을 찾음
        const sentenceLevel = sentenceProgress.find(p => p.level === level);
        const speakingLevel = speakingProgress.find(p => p.level === level);
        
        // 두 모드 중 하나라도 완료되면 completed: true
        const completed = (sentenceLevel?.completed || false) || (speakingLevel?.completed || false);
        
        // 정답 수는 두 모드의 합
        const correctAnswers = (sentenceLevel?.correctAnswers || 0) + (speakingLevel?.correctAnswers || 0);
        
        console.log(`레벨 ${level} 진행률 계산:`, {
          sentenceCompleted: sentenceLevel?.completed || false,
          speakingCompleted: speakingLevel?.completed || false,
          finalCompleted: completed,
          sentenceCorrect: sentenceLevel?.correctAnswers || 0,
          speakingCorrect: speakingLevel?.correctAnswers || 0,
          totalCorrect: correctAnswers
        });
        
        return {
          level,
          completed,
          totalSentences: levelStats[level].total,
          correctAnswers,
          unlocked: true // 모든 레벨 잠금 해제 (테스트용)
        };
      });

      setLevelProgress(newProgress);
      console.log('최종 levelProgress:', newProgress);
    };

    loadProgress();
  }, [sentences, selectedMode]);

  // 진도 저장 함수 (선택된 모드에 따라 다른 키를 사용)
  const saveProgress = () => {
    const key = `learning-progress-${selectedMode}`;
    localStorage.setItem(key, JSON.stringify(levelProgress));
  };

  const resetLevel = (level: number) => {
    const newProgress = levelProgress.map(progress => 
      progress.level === level 
        ? { ...progress, completed: false, correctAnswers: 0 }
        : progress
    );
    setLevelProgress(newProgress);
    
    // 해당 레벨의 진도를 리셋
    const key = `learning-progress-${selectedMode}`;
    localStorage.setItem(key, JSON.stringify(newProgress));
  };

  const getLevelCategories = (level: number): string[] => {
    const levelSentences = sentences.filter(s => s.level === level);
    const categories = [...new Set(levelSentences.map(s => s.category))];
    return categories;
  };

  const getModeDescription = () => {
    return selectedMode === 'sentence-completion' 
      ? '한국어 문장을 보고 영어 단어를 조합하여 문장을 완성하는 학습 모드입니다.'
      : '한국어 문장을 보고 영어로 말하기 연습을 하는 학습 모드입니다.';
  };

  const getModeIcon = () => {
    return selectedMode === 'sentence-completion' ? '🧩' : '🎤';
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-sm mx-auto">
        {/* 단순한 헤더 */}
        <div className="flex items-center mb-8">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold ml-4">
            {selectedMode === 'sentence-completion' ? '문장 완성 모드' : '말하기 모드'}
          </h1>
        </div>

        {/* 단순한 레벨 리스트 */}
        <div className="space-y-4">
          {levelProgress.map((progress) => (
            <div key={progress.level} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">
                  레벨 {progress.level}
                </h2>
                <Button 
                  onClick={() => {
                    console.log(`레벨 ${progress.level} 시작`);
                    onSelectLevel(progress.level);
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2"
                >
                  학습 시작
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}