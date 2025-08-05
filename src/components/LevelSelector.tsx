import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Lock, CheckCircle, Play, RotateCcw } from "lucide-react";
import { LearningMode } from "./LearningModeSelector";

interface Sentence {
  id: string;
  level: number;
  category: string;
  koreanSentence: string;
  englishSentence: string;
  notes: string;
}

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
        const sentenceProgressForLevel = sentenceProgress.find(p => p.level === level);
        const speakingProgressForLevel = speakingProgress.find(p => p.level === level);
        
        // 두 모드 중 하나라도 완료되었으면 완료로 표시
        const completed = (sentenceProgressForLevel?.completed || false) || (speakingProgressForLevel?.completed || false);
        
        // 두 모드의 정답 수를 합산 (최대값은 해당 레벨의 총 문장 수)
        const sentenceCorrect = sentenceProgressForLevel?.correctAnswers || 0;
        const speakingCorrect = speakingProgressForLevel?.correctAnswers || 0;
        const totalCorrect = Math.min(sentenceCorrect + speakingCorrect, levelStats[level].total);
        
        console.log(`레벨 ${level} 진행률 계산:`);
        console.log(`- 문장완성: ${sentenceCorrect}/${levelStats[level].total} (완료: ${sentenceProgressForLevel?.completed})`);
        console.log(`- 말하기: ${speakingCorrect}/${levelStats[level].total} (완료: ${speakingProgressForLevel?.completed})`);
        console.log(`- 합계: ${totalCorrect}/${levelStats[level].total} (완료: ${completed})`);
        
        // 이전 레벨 완료 여부는 나중에 계산하도록 일단 제거
        
        return {
          level,
          completed,
          totalSentences: levelStats[level].total,
          correctAnswers: totalCorrect,
          unlocked: true // 테스트를 위해 모든 레벨 잠금 해제
        };
      });

      // 첫 번째 레벨은 항상 잠금 해제
      if (newProgress.length > 0) {
        newProgress[0].unlocked = true;
      }

      setLevelProgress(newProgress);
    };

    loadProgress();
  }, [sentences, selectedMode]);

  // 진행 상태를 로컬 스토리지에 저장 (현재 선택된 모드에 맞게)
  const saveProgress = (progress: LevelProgress[]) => {
    // 현재 선택된 모드의 진행률만 업데이트
    localStorage.setItem(`learning-progress-${selectedMode}`, JSON.stringify(progress));
    console.log(`${selectedMode} 모드 진행률 저장됨:`, progress);
  };

  // 레벨 리셋 기능
  const resetLevel = (level: number, event: React.MouseEvent) => {
    event.stopPropagation();
    const updatedProgress = levelProgress.map(p => 
      p.level === level 
        ? { ...p, completed: false, correctAnswers: 0 }
        : p
    );
    setLevelProgress(updatedProgress);
    saveProgress(updatedProgress);
  };

  // 레벨별 카테고리 정보 가져오기
  const getLevelCategories = (level: number) => {
    const categories = [...new Set(sentences.filter(s => s.level === level).map(s => s.category))];
    return categories;
  };

  const getModeDescription = () => {
    return selectedMode === 'sentence-completion' 
      ? '단어 버튼을 클릭하여 올바른 순서로 영어 문장을 완성하세요'
      : '마이크를 사용하여 영어 문장을 직접 말해보고 연습하세요';
  };

  const getModeIcon = () => {
    return selectedMode === 'sentence-completion' ? '🧩' : '🎤';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={onBack} className="text-lg">
            <ArrowLeft className="w-5 h-5 mr-2" />
            모드 선택으로 돌아가기
          </Button>
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">
              {getModeIcon()} {selectedMode === 'sentence-completion' ? '문장 완성' : '말하기'} 모드
            </h1>
            <p className="text-muted-foreground">{getModeDescription()}</p>
          </div>
          <div className="w-[200px]"></div> {/* 공간 균형을 위한 빈 div */}
        </div>

        {/* 레벨 그리드 */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {levelProgress.map((progress) => {
            const categories = getLevelCategories(progress.level);
            const completionRate = progress.totalSentences > 0 
              ? (progress.correctAnswers / progress.totalSentences) * 100 
              : 0;

            return (
              <Card 
                key={progress.level}
                className={`
                  group transition-all duration-300 cursor-pointer
                  ${progress.unlocked 
                    ? 'hover:shadow-xl hover:border-primary/30 border-2' 
                    : 'opacity-60 cursor-not-allowed border-muted'
                  }
                  ${progress.completed 
                    ? 'bg-success-light border-success' 
                    : progress.unlocked 
                      ? 'hover:bg-primary/5' 
                      : ''
                  }
                `}
                onClick={() => {
                  console.log(`카드 클릭: 레벨 ${progress.level}, 잠금해제: ${progress.unlocked}`);
                  if (progress.unlocked) {
                    onSelectLevel(progress.level);
                  }
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl
                        ${progress.completed 
                          ? 'bg-success text-white' 
                          : progress.unlocked 
                            ? 'bg-gradient-to-r from-learning-primary to-primary-glow text-white'
                            : 'bg-muted text-muted-foreground'
                        }
                      `}>
                        {progress.completed ? (
                          <CheckCircle className="w-6 h-6" />
                        ) : progress.unlocked ? (
                          progress.level
                        ) : (
                          <Lock className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-xl">
                          레벨 {progress.level}
                        </CardTitle>
                        <CardDescription>
                          {progress.totalSentences}개 문장
                        </CardDescription>
                      </div>
                    </div>
                    
                    {/* 상태 배지 */}
                    {progress.completed ? (
                      <Badge variant="default" className="bg-success">완료</Badge>
                    ) : progress.unlocked ? (
                      <Badge variant="outline">학습 가능</Badge>
                    ) : (
                      <Badge variant="secondary">잠금</Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* 진행률 */}
                  {progress.unlocked && (
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>진행률</span>
                        <span>{Math.round(completionRate)}%</span>
                      </div>
                      <Progress 
                        value={completionRate} 
                        className="h-2"
                      />
                    </div>
                  )}

                  {/* 카테고리 */}
                  <div>
                    <p className="text-sm font-medium mb-2">주요 주제:</p>
                    <div className="flex flex-wrap gap-1">
                      {categories.slice(0, 2).map((category, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {category}
                        </Badge>
                      ))}
                      {categories.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{categories.length - 2}개
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="pt-2">
                    {progress.unlocked ? (
                      <div className="flex gap-2">
                        <Button 
                          variant={progress.completed ? "outline" : "hero"}
                          className="flex-1"
                          onClick={() => {
                            console.log(`버튼 클릭: 레벨 ${progress.level}`);
                            onSelectLevel(progress.level);
                          }}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          {progress.completed ? '다시 학습' : '학습 시작'}
                        </Button>
                        {progress.completed && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={(e) => resetLevel(progress.level, e)}
                            title="진행률 리셋"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ) : (
                      <Button variant="ghost" disabled className="w-full">
                        <Lock className="w-4 h-4 mr-2" />
                        이전 레벨을 먼저 완료하세요
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* 하단 안내 */}
        <div className="text-center mt-12 space-y-2">
          <p className="text-sm text-muted-foreground">
            💡 각 레벨의 모든 문장을 정답으로 맞춰야 다음 레벨이 잠금 해제됩니다
          </p>
          <p className="text-xs text-muted-foreground">
            학습 진행 상태는 브라우저에 자동으로 저장됩니다
          </p>
        </div>
      </div>
    </div>
  );
}