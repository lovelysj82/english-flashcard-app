import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Volume2, RotateCcw, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Sentence {
  id: string;
  level: number;
  category: string;
  koreanSentence: string;
  englishSentence: string;
  notes: string;
}

interface SentenceCompletionModeProps {
  sentences: Sentence[];
  selectedLevel: number;
  onBack: () => void;
}

export function SentenceCompletionMode({ sentences, selectedLevel, onBack }: SentenceCompletionModeProps) {
  const [currentLevel, setCurrentLevel] = useState(selectedLevel);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  
  // currentLevel 상태 변화 디버깅
  useEffect(() => {
    console.log(`문장완성모드 - currentLevel 변경됨: ${currentLevel}, selectedLevel: ${selectedLevel}`);
  }, [currentLevel, selectedLevel]);

  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [allWords, setAllWords] = useState<string[]>([]); // 모든 단어의 원래 순서 유지
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]); // 선택된 단어의 인덱스
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [wrongAnswers, setWrongAnswers] = useState<Set<string>>(new Set());
  const [levelCompleted, setLevelCompleted] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const { toast } = useToast();

  // Get sentences for current level
  const levelSentences = sentences.filter(s => s.level === currentLevel);
  
  // 복습 모드일 때는 틀린 문제만 필터링 (wrongAnswers가 변경될 때마다 다시 계산됨)
  const reviewSentences = useMemo(() => {
    if (!isReviewMode) return levelSentences;
    const filtered = levelSentences.filter(s => wrongAnswers.has(s.id));
    console.log(`reviewSentences 업데이트 - wrongAnswers:`, Array.from(wrongAnswers), `필터된 문장들:`, filtered.map(s => s.id));
    return filtered;
  }, [isReviewMode, levelSentences, wrongAnswers]);
  
  const currentSentence = isReviewMode 
    ? reviewSentences[currentSentenceIndex]
    : levelSentences[currentSentenceIndex];

  // 문장부호 제거 함수 (어퍼스트로피는 유지, 하이픈 제거)
  const removePunctuation = (word: string) => {
    return word.replace(/[.,!?;:"()[\]{}\-]/g, '');
  };

  // 영어 문장을 단어로 분리하는 함수 (어퍼스트로피 처리 포함)
  const parseEnglishSentence = (sentence: string): string[] => {
    // 기본적으로 공백으로 분리
    const words = sentence.split(' ');
    const processedWords: string[] = [];
    
    words.forEach(word => {
      // 문장부호 제거 (어퍼스트로피 제외)
      const cleanWord = removePunctuation(word);
      
      if (cleanWord.includes("'")) {
        // 어퍼스트로피가 포함된 경우 분리 여부 결정
        if (cleanWord.endsWith("'s") || cleanWord.endsWith("'t") || cleanWord.endsWith("'re") || 
            cleanWord.endsWith("'ve") || cleanWord.endsWith("'ll") || cleanWord.endsWith("'d")) {
          // 축약형의 경우 두 개로 분리
          const parts = cleanWord.split("'");
          if (parts.length === 2 && parts[0] && parts[1]) {
            processedWords.push(parts[0]);
            processedWords.push("'" + parts[1]);
          } else {
            processedWords.push(cleanWord);
          }
        } else {
          // 그 외의 경우 (소유격 등) 하나로 유지
          processedWords.push(cleanWord);
        }
      } else {
        processedWords.push(cleanWord);
      }
    });
    
    // 빈 문자열 제거
    return processedWords.filter(word => word.trim() !== '');
  };

  // Initialize words for current sentence
  useEffect(() => {
    if (currentSentence) {
      const words = parseEnglishSentence(currentSentence.englishSentence);
      const shuffledWords = shuffleArray([...words]);
      console.log('원본 문장:', currentSentence.englishSentence);
      console.log('분리된 단어들:', words);
      console.log('셔플된 단어들:', shuffledWords);
      setAllWords(shuffledWords); // 셔플된 순서를 고정으로 유지
      setAvailableWords(shuffledWords);
      setSelectedWords([]);
      setSelectedIndices([]);
      setShowResult(false);
    }
  }, [currentSentence]);

  const shuffleArray = (array: string[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const handleWordClick = (word: string, index: number) => {
    if (selectedIndices.includes(index)) return; // 이미 선택된 단어는 무시
    
    setSelectedWords([...selectedWords, word]);
    setSelectedIndices([...selectedIndices, index]);
  };

  const handleSelectedWordClick = (index: number) => {
    const wordToRemove = selectedWords[index];
    const originalIndexToRemove = selectedIndices[index];
    
    setSelectedWords(selectedWords.filter((_, i) => i !== index));
    setSelectedIndices(selectedIndices.filter((_, i) => i !== index));
  };

  // 드래그 앤 드롭 함수들
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation(); // 이벤트 버블링 중단
    
    if (draggedIndex === null) return;
    
    console.log(`드래그 앤 드롭: draggedIndex=${draggedIndex}, targetIndex=${targetIndex}`);
    
    const newSelectedWords = [...selectedWords];
    const newSelectedIndices = [...selectedIndices];
    
    // 드래그된 아이템을 타겟 위치로 이동
    const draggedWord = newSelectedWords[draggedIndex];
    const draggedOriginalIndex = newSelectedIndices[draggedIndex];
    
    // 먼저 드래그된 아이템 제거
    newSelectedWords.splice(draggedIndex, 1);
    newSelectedIndices.splice(draggedIndex, 1);
    
    // 삽입 위치 조정: 드래그된 아이템이 타겟보다 앞에 있었다면 타겟 인덱스를 1 줄임
    const adjustedTargetIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
    
    console.log(`조정된 타겟 인덱스: ${adjustedTargetIndex}`);
    
    // 조정된 위치에 삽입
    newSelectedWords.splice(adjustedTargetIndex, 0, draggedWord);
    newSelectedIndices.splice(adjustedTargetIndex, 0, draggedOriginalIndex);
    
    console.log(`결과 배열:`, newSelectedWords);
    
    setSelectedWords(newSelectedWords);
    setSelectedIndices(newSelectedIndices);
    setDraggedIndex(null);
  };

  // 컨테이너 영역에서의 드롭 처리 (마지막 위치에 추가)
  const handleContainerDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedIndex === null) return;
    
    console.log('컨테이너에 드롭됨 - 마지막 위치로 이동');
    
    // 마지막 위치로 이동 (배열 길이와 같은 인덱스 = 맨 뒤에 추가)
    handleDrop(e, selectedWords.length);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleCheck = () => {
    const userAnswer = selectedWords.join(' ');
    // 정답도 동일한 분리 로직 적용
    const correctWords = parseEnglishSentence(currentSentence.englishSentence);
    const correctAnswer = correctWords.join(' ');
    const correct = userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
    
    console.log(`문제 체크 - 문장 ID: ${currentSentence.id}, 정답 여부: ${correct}`);
    console.log(`사용자 답: "${userAnswer}", 정답: "${correctAnswer}"`);
    
    setIsCorrect(correct);
    setShowResult(true);

    if (!correct) {
      setWrongAnswers(prev => {
        const newSet = new Set([...prev, currentSentence.id]);
        console.log(`틀린 문제 추가 후 wrongAnswers:`, Array.from(newSet));
        return newSet;
      });
      toast({
        title: "틀렸습니다",
        description: "정답을 확인하고 다시 시도해보세요.",
        variant: "destructive",
      });
    } else {
      // 정답일 때 wrongAnswers에서 제거
      setWrongAnswers(prev => {
        const newSet = new Set(prev);
        newSet.delete(currentSentence.id);
        console.log(`정답으로 문제 제거 후 wrongAnswers:`, Array.from(newSet));
        
        // 복습 모드에서 현재 문제를 맞춘 경우 인덱스 조정 필요
        if (isReviewMode && newSet.size > 0) {
          const newReviewSentences = levelSentences.filter(s => newSet.has(s.id));
          console.log(`복습 모드에서 정답 후 - 새로운 리뷰 문장들:`, newReviewSentences.map(s => s.id));
          
          // 현재 인덱스가 새로운 배열 크기를 초과하면 조정
          if (currentSentenceIndex >= newReviewSentences.length) {
            console.log(`인덱스 조정: ${currentSentenceIndex} -> ${Math.max(0, newReviewSentences.length - 1)}`);
            setCurrentSentenceIndex(Math.max(0, newReviewSentences.length - 1));
          }
        }
        
        return newSet;
      });
      toast({
        title: "정답입니다!",
        description: "잘하셨습니다!",
      });
    }
  };

  // 학습 진도 저장 함수
  const saveProgress = useCallback(() => {
    const progressKey = `learning-progress-sentence-completion`;
    const savedProgress = JSON.parse(localStorage.getItem(progressKey) || '[]');
    
    // 현재 레벨의 진행 상태 업데이트
    const levelIndex = savedProgress.findIndex((p: any) => p.level === currentLevel);
    const correctCount = levelSentences.length - wrongAnswers.size;
    
    if (levelIndex >= 0) {
      savedProgress[levelIndex] = {
        ...savedProgress[levelIndex],
        correctAnswers: correctCount,
        completed: wrongAnswers.size === 0
      };
    } else {
      savedProgress.push({
        level: currentLevel,
        completed: wrongAnswers.size === 0,
        totalSentences: levelSentences.length,
        correctAnswers: correctCount,
        unlocked: true
      });
    }

    // 다음 레벨 잠금 해제
    if (wrongAnswers.size === 0) {
      const nextLevelIndex = savedProgress.findIndex((p: any) => p.level === currentLevel + 1);
      if (nextLevelIndex >= 0) {
        savedProgress[nextLevelIndex].unlocked = true;
      } else {
        // 다음 레벨이 존재하는지 확인
        const hasNextLevel = sentences.some(s => s.level === currentLevel + 1);
        if (hasNextLevel) {
          savedProgress.push({
            level: currentLevel + 1,
            completed: false,
            totalSentences: sentences.filter(s => s.level === currentLevel + 1).length,
            correctAnswers: 0,
            unlocked: true
          });
        }
      }
    }

    localStorage.setItem(progressKey, JSON.stringify(savedProgress));
  }, [currentLevel, levelSentences.length, wrongAnswers.size, sentences]);

  // 복습 모드에서 모든 문제 완료 시 자동 레벨 완료 처리
  useEffect(() => {
    if (isReviewMode && wrongAnswers.size === 0 && reviewSentences.length === 0) {
      console.log('🎉 복습 모드에서 모든 문제 완료 - 자동 레벨 완료 처리');
      setLevelCompleted(true);
      saveProgress();
      
      const nextLevel = currentLevel + 1;
      const hasNextLevel = sentences.some(s => s.level === nextLevel);
      
      console.log(`=== 자동 레벨 완료 판정 디버깅 ===`);
      console.log(`현재 레벨: ${currentLevel}`);
      console.log(`다음 레벨: ${nextLevel}`);
      console.log(`hasNextLevel: ${hasNextLevel}`);
      console.log(`=== 자동 디버깅 끝 ===`);
      
      if (hasNextLevel) {
        toast({
          title: "레벨 완료!",
          description: `레벨 ${currentLevel}을 완료했습니다!`,
        });
      } else {
        toast({
          title: "모든 레벨 완료!",
          description: `축하합니다! 모든 학습을 완료했습니다.`,
        });
      }
    }
  }, [isReviewMode, wrongAnswers.size, reviewSentences.length, currentLevel, sentences, toast, saveProgress]);

  const handleNext = () => {
    const currentSentenceList = isReviewMode ? reviewSentences : levelSentences;
    
    console.log(`handleNext 호출 - wrongAnswers 개수: ${wrongAnswers.size}, 틀린 문제들:`, Array.from(wrongAnswers));
    console.log(`현재 인덱스: ${currentSentenceIndex}, 전체 문장 수: ${currentSentenceList.length}`);
    console.log(`복습 모드: ${isReviewMode}`);
    
    if (currentSentenceIndex < currentSentenceList.length - 1) {
      setCurrentSentenceIndex(currentSentenceIndex + 1);
    } else {
      // 현재 단계 완료
      console.log(`=== handleNext: 현재 단계 완료 ===`);
      console.log(`wrongAnswers.size: ${wrongAnswers.size}, isReviewMode: ${isReviewMode}`);
      console.log(`조건 1 (복습 모드 시작): wrongAnswers.size > 0 && !isReviewMode = ${wrongAnswers.size > 0 && !isReviewMode}`);
      console.log(`조건 2 (첫 번째 학습 완료): wrongAnswers.size === 0 = ${wrongAnswers.size === 0}`);
      console.log(`조건 3 (복습 모드 완료): isReviewMode && wrongAnswers.size === 0 = ${isReviewMode && wrongAnswers.size === 0}`);
      
      if (wrongAnswers.size > 0 && !isReviewMode) {
        // Start review mode for wrong answers
        console.log(`>>> 조건 1 실행: 복습 모드 시작`);
        setIsReviewMode(true);
        setCurrentSentenceIndex(0); // 복습 시 첫 번째 틀린 문제부터 시작
        toast({
          title: "복습 모드",
          description: `틀린 문제 ${wrongAnswers.size}개를 다시 풀어보세요.`,
        });
      } else if (isReviewMode && wrongAnswers.size === 0) {
        // 복습 모드에서 모든 문제 완료
        console.log(`>>> 조건 2 실행: 복습 모드에서 모든 문제 완료`);
        setLevelCompleted(true);
        saveProgress(); // 진도 저장
        
        // 다음 레벨이 존재하는지 확인
        const nextLevel = currentLevel + 1;
        const hasNextLevel = sentences.some(s => s.level === nextLevel);
        const allLevels = [...new Set(sentences.map(s => s.level))].sort();
        const maxLevel = Math.max(...allLevels);
        const nextLevelSentences = sentences.filter(s => s.level === nextLevel);
        
        console.log(`=== 레벨 완료 판정 디버깅 ===`);
        console.log(`현재 레벨: ${currentLevel}`);
        console.log(`다음 레벨: ${nextLevel}`);
        console.log(`최대 레벨: ${maxLevel}`);
        console.log(`사용 가능한 레벨들:`, allLevels);
        console.log(`다음 레벨 문장 개수: ${nextLevelSentences.length}`);
        console.log(`다음 레벨 문장들:`, nextLevelSentences.map(s => s.id));
        console.log(`hasNextLevel: ${hasNextLevel}`);
        console.log(`=== 디버깅 끝 ===`);
        
        if (hasNextLevel) {
          toast({
            title: "레벨 완료!",
            description: `레벨 ${currentLevel}을 완료했습니다!`,
          });
        } else {
          toast({
            title: "모든 레벨 완료!",
            description: `축하합니다! 모든 학습을 완료했습니다.`,
          });
        }
      } else if (wrongAnswers.size === 0) {
        // 첫 번째 학습 완료 (복습 모드가 아닌 경우)
        console.log(`>>> 조건 3 실행: 첫 번째 학습 완료 (복습 모드가 아닌 경우)`);
        setLevelCompleted(true);
        saveProgress(); // 진도 저장
        
        // 다음 레벨이 존재하는지 확인
        const nextLevel = currentLevel + 1;
        const hasNextLevel = sentences.some(s => s.level === nextLevel);
        const nextLevelSentences = sentences.filter(s => s.level === nextLevel);
        
        console.log(`=== 복습 완료 판정 디버깅 ===`);
        console.log(`현재 레벨: ${currentLevel}`);
        console.log(`다음 레벨: ${nextLevel}`);
        console.log(`다음 레벨 문장 개수: ${nextLevelSentences.length}`);
        console.log(`hasNextLevel: ${hasNextLevel}`);
        console.log(`=== 복습 디버깅 끝 ===`);
        
        if (hasNextLevel) {
          toast({
            title: "레벨 완료!",
            description: `레벨 ${currentLevel}을 완료했습니다!`,
          });
        } else {
          toast({
            title: "모든 레벨 완료!",
            description: `축하합니다! 모든 학습을 완료했습니다.`,
          });
        }
      } else {
        // 복습 모드에서 마지막 문제까지 완료했을 때
        console.log(`>>> 조건 4 실행: 복습 모드에서 마지막 문제까지 완료했을 때`);
        console.log(`복습 모드 라운드 완료 - wrongAnswers 개수: ${wrongAnswers.size}`);
        
        if (wrongAnswers.size === 0) {
          // 모든 문제를 맞춤 - 레벨 완료 (이미 위에서 처리했으므로 이 블록은 실행되지 않아야 함)
          console.log("복습 모드에서 모든 문제 완료 - 이 블록은 실행되지 않아야 함");
        } else {
          // 아직 틀린 문제가 있음 - 복습 모드를 처음부터 다시 시작
          console.log(`복습 모드 재시작 - 틀린 문제 ${wrongAnswers.size}개`);
          setCurrentSentenceIndex(0);
          toast({
            title: "복습 계속",
            description: `아직 틀린 문제 ${wrongAnswers.size}개가 있습니다. 다시 풀어보세요.`,
          });
        }
      }
    }
  };

  const handleNextLevel = () => {
    setCurrentLevel(currentLevel + 1);
    setCurrentSentenceIndex(0);
    setWrongAnswers(new Set());
    setLevelCompleted(false);
    setIsReviewMode(false);
  };

  const handleReset = () => {
    if (currentSentence) {
      setSelectedWords([]);
      setSelectedIndices([]);
      setShowResult(false);
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  // 레벨 완료 상태일 때 표시할 화면
  if (levelCompleted) {
    const nextLevel = currentLevel + 1;
    const hasNextLevel = sentences.some(s => s.level === nextLevel);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-2xl font-bold mb-4">레벨 {currentLevel} 완료!</h2>
            <p className="text-muted-foreground mb-6">
              축하합니다! 레벨 {currentLevel}을 완료했습니다.
            </p>
            <div className="space-y-3">
              {hasNextLevel ? (
                <Button 
                  onClick={handleNextLevel} 
                  className="w-full"
                  size="lg"
                >
                  레벨 {nextLevel} 시작
                </Button>
              ) : (
                <div>
                  <p className="text-lg font-semibold mb-3">모든 레벨 완료!</p>
                  <p className="text-muted-foreground mb-4">
                    축하합니다! 모든 학습을 완료했습니다.
                  </p>
                </div>
              )}
              <Button variant="outline" onClick={onBack} className="w-full">
                레벨 선택으로 돌아가기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentSentence) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-2xl font-bold mb-4">모든 레벨 완료!</h2>
            <p className="text-muted-foreground mb-6">
              축하합니다! 모든 학습을 완료했습니다.
            </p>
            <Button onClick={onBack}>처음으로 돌아가기</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentSentenceList = isReviewMode ? reviewSentences : levelSentences;
  const progress = currentSentenceList.length > 0 
    ? ((currentSentenceIndex + 1) / currentSentenceList.length) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 mx-4">
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <span className="text-sm font-medium text-gray-600">
          {currentSentenceIndex + 1}/{currentSentenceList.length}
        </span>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center p-4 max-w-md mx-auto w-full">
        {/* Korean Sentence */}
        <div className="text-center mb-8">
          <p className="text-lg font-medium text-gray-800 mb-4">
            다음 문장을 영어로 번역하세요
          </p>
          <p className="text-xl font-semibold">
            {currentSentence.koreanSentence}
          </p>
        </div>

        {/* English Answer Area with Underlines */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 justify-center min-h-[3rem] items-end">
            {selectedWords.length > 0 ? (
              selectedWords.map((word, index) => (
                <div key={index} className="flex items-center">
                  <span className="text-xl font-medium text-gray-800 px-1">
                    {word}
                  </span>
                  {index < selectedWords.length - 1 && (
                    <span className="text-xl text-gray-800 mx-1"> </span>
                  )}
                </div>
              ))
            ) : (
              // Duolingo 스타일 밑줄 표시
              <div className="flex flex-wrap gap-3 justify-center">
                {Array.from({ length: parseEnglishSentence(currentSentence.englishSentence).length }).map((_, index) => (
                  <div key={index} className="border-b-2 border-gray-400 min-w-[60px] h-8"></div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Word Selection Buttons */}
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          {allWords.map((word, index) => {
            const isSelected = selectedIndices.includes(index);
            return (
              <Button
                key={index}
                variant={isSelected ? "ghost" : "outline"}
                onClick={() => !isSelected && handleWordClick(word, index)}
                className={`text-base px-4 py-2 min-h-[44px] ${
                  isSelected 
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed" 
                    : "bg-white border-gray-300 hover:bg-gray-50"
                }`}
                disabled={isSelected}
              >
                {word}
              </Button>
            );
          })}
        </div>

        {/* Result Display */}
        {showResult && (
          <div className={`mb-6 p-4 rounded-xl text-center ${
            isCorrect 
              ? 'bg-green-100 border-2 border-green-300' 
              : 'bg-red-100 border-2 border-red-300'
          }`}>
            <div className="flex items-center justify-center gap-2 mb-2">
              {isCorrect ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600" />
              )}
              <span className={`font-bold text-lg ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                {isCorrect ? '잘했어요!' : '정답이 아니에요'}
              </span>
            </div>
            
            {!isCorrect && (
              <div className="flex items-center justify-center gap-3 mt-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => speakText(currentSentence.englishSentence)}
                  className="h-10 w-10"
                >
                  <Volume2 className="w-5 h-5" />
                </Button>
                <p className="text-lg font-medium text-gray-800">{currentSentence.englishSentence}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Button */}
      <div className="p-4">
        {!showResult ? (
          <Button 
            onClick={handleCheck} 
            disabled={selectedWords.length === 0}
            className={`w-full py-4 text-lg font-bold transition-all ${
              selectedWords.length === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            확인
          </Button>
        ) : (
          <Button 
            onClick={levelCompleted ? onBack : handleNext} 
            className="w-full py-4 text-lg font-bold bg-green-500 hover:bg-green-600 text-white"
          >
            {levelCompleted ? '완료' : '계속'}
          </Button>
        )}
      </div>
    </div>
  );
}