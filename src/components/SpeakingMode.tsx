import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Volume2, CheckCircle, XCircle, ArrowLeft, Edit3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface Sentence {
  id: string;
  level: number;
  category: string;
  koreanSentence: string;
  englishSentence: string;
  notes: string;
}

interface SpeakingModeProps {
  sentences: Sentence[];
  selectedLevel: number;
  onBack: () => void;
}

export function SpeakingMode({ sentences, selectedLevel, onBack }: SpeakingModeProps) {
  const [currentLevel, setCurrentLevel] = useState(selectedLevel);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  
  // currentLevel 상태 변화 디버깅
  useEffect(() => {
    console.log(`말하기모드 - currentLevel 변경됨: ${currentLevel}, selectedLevel: ${selectedLevel}`);
  }, [currentLevel, selectedLevel]);
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [wrongAnswers, setWrongAnswers] = useState<Set<string>>(new Set());
  const [levelCompleted, setLevelCompleted] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState("");
  const { toast } = useToast();

  // Get sentences for current level
  const levelSentences = sentences.filter(s => s.level === currentLevel);
  
  // 복습 모드일 때는 틀린 문제만 필터링 (wrongAnswers가 변경될 때마다 다시 계산됨)
  const reviewSentences = useMemo(() => {
    if (!isReviewMode) return levelSentences;
    const filtered = levelSentences.filter(s => wrongAnswers.has(s.id));
    console.log(`말하기 모드 reviewSentences 업데이트 - wrongAnswers:`, Array.from(wrongAnswers), `필터된 문장들:`, filtered.map(s => s.id));
    return filtered;
  }, [isReviewMode, levelSentences, wrongAnswers]);
  
  const currentSentence = isReviewMode 
    ? reviewSentences[currentSentenceIndex]
    : levelSentences[currentSentenceIndex];

  // Speech Recognition setup
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSpokenText(transcript);
        setIsListening(false);
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast({
          title: "음성 인식 오류",
          description: "마이크를 확인하고 다시 시도해주세요.",
          variant: "destructive",
        });
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    } else {
      toast({
        title: "음성 인식 지원 안됨",
        description: "이 브라우저는 음성 인식을 지원하지 않습니다.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const startListening = () => {
    if (recognition) {
      setSpokenText("");
      setShowResult(false);
      setIsListening(true);
      setIsEditing(false);
      recognition.start();
    }
  };

  const handleEditStart = () => {
    setEditedText(spokenText);
    setIsEditing(true);
  };

  const handleEditSave = () => {
    const processedText = capitalizeFirst(editedText.trim());
    setSpokenText(processedText);
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditedText("");
  };

  const stopListening = () => {
    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
    }
  };

  // 문장부호 제거 함수 (어퍼스트로피, 하이픈 포함)
  const removePunctuation = (text: string) => {
    return text.replace(/[.,!?;:"'()[\]{}\-]/g, '').trim();
  };

  // 첫 글자 대문자로 변환
  const capitalizeFirst = (text: string) => {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  const handleCheck = () => {
    if (!spokenText) {
      toast({
        title: "음성을 먼저 입력해주세요",
        description: "마이크 버튼을 클릭하고 영어로 말해보세요.",
        variant: "destructive",
      });
      return;
    }

    // 인식된 음성을 첫 글자 대문자로 변환
    const processedSpokenText = capitalizeFirst(spokenText.trim());
    setSpokenText(processedSpokenText);

    // 영어 문장을 단어로 분리하는 함수 (어퍼스트로피 처리 포함)
    const parseEnglishSentence = (sentence: string): string[] => {
      const words = sentence.split(' ');
      const processedWords: string[] = [];
      
      words.forEach(word => {
        const cleanWord = removePunctuation(word);
        
        if (cleanWord.includes("'")) {
          if (cleanWord.endsWith("'s") || cleanWord.endsWith("'t") || cleanWord.endsWith("'re") || 
              cleanWord.endsWith("'ve") || cleanWord.endsWith("'ll") || cleanWord.endsWith("'d")) {
            const parts = cleanWord.split("'");
            if (parts.length === 2 && parts[0] && parts[1]) {
              processedWords.push(parts[0]);
              processedWords.push("'" + parts[1]);
            } else {
              processedWords.push(cleanWord);
            }
          } else {
            processedWords.push(cleanWord);
          }
        } else {
          processedWords.push(cleanWord);
        }
      });
      
      return processedWords.filter(word => word.trim() !== '');
    };

    // 문장부호 제거 후 대소문자 구분 없이 비교
    const userAnswer = removePunctuation(processedSpokenText).toLowerCase();
    const correctAnswer = removePunctuation(currentSentence.englishSentence).toLowerCase();
    
    console.log(`=== 정답 비교 디버깅 (문장부호 및 하이픈 제거) ===`);
    console.log(`사용자 입력 (원본): "${spokenText}"`);
    console.log(`사용자 입력 (처리후): "${processedSpokenText}"`);
    console.log(`사용자 답안 (문장부호 제거): "${userAnswer}"`);
    console.log(`정답 (원본): "${currentSentence.englishSentence}"`);
    console.log(`정답 (문장부호 제거): "${correctAnswer}"`);
    console.log(`=== 디버깅 끝 ===`);
    
    // 문장부호 제거 후 완전 일치하면 100% 정확도, 아니면 유사도 계산
    let correct = false;
    let similarity = 0;
    
    if (userAnswer === correctAnswer) {
      // 완전 일치하면 100% 정확도
      correct = true;
      similarity = 1.0;
      console.log(`✅ 완전 일치 (문장부호 및 하이픈 제거): "${userAnswer}" === "${correctAnswer}"`);
    } else {
      // 유사도 계산
      similarity = calculateSimilarity(userAnswer, correctAnswer);
      correct = similarity > 0.8; // 80% similarity threshold
      console.log(`📊 유사도 계산: ${Math.round(similarity * 100)}%`);
    }
    
    setIsCorrect(correct);
    setShowResult(true);

    if (!correct) {
      setWrongAnswers(prev => new Set([...prev, currentSentence.id]));
      toast({
        title: "다시 시도해보세요",
        description: `유사도: ${Math.round(similarity * 100)}%`,
        variant: "destructive",
      });
    } else {
      // 정답일 때 wrongAnswers에서 제거
      setWrongAnswers(prev => {
        const newSet = new Set(prev);
        newSet.delete(currentSentence.id);
        console.log(`말하기 모드 정답으로 문제 제거 후 wrongAnswers:`, Array.from(newSet));
        
        // 복습 모드에서 현재 문제를 맞춘 경우 인덱스 조정 필요
        if (isReviewMode && newSet.size > 0) {
          const newReviewSentences = levelSentences.filter(s => newSet.has(s.id));
          console.log(`말하기 모드 복습에서 정답 후 - 새로운 리뷰 문장들:`, newReviewSentences.map(s => s.id));
          
          // 현재 인덱스가 새로운 배열 크기를 초과하면 조정
          if (currentSentenceIndex >= newReviewSentences.length) {
            console.log(`말하기 모드 인덱스 조정: ${currentSentenceIndex} -> ${Math.max(0, newReviewSentences.length - 1)}`);
            setCurrentSentenceIndex(Math.max(0, newReviewSentences.length - 1));
          }
        }
        
        return newSet;
      });
      toast({
        title: "훌륭합니다!",
        description: `유사도: ${Math.round(similarity * 100)}%`,
      });
    }
  };

  const calculateSimilarity = (str1: string, str2: string): number => {
    const words1 = str1.split(' ').filter(w => w.length > 0);
    const words2 = str2.split(' ').filter(w => w.length > 0);
    
    if (words1.length === 0 && words2.length === 0) return 1;
    if (words1.length === 0 || words2.length === 0) return 0;
    
    let matches = 0;
    for (const word1 of words1) {
      for (const word2 of words2) {
        if (word1 === word2) {
          matches++;
          break;
        }
      }
    }
    
    return matches / Math.max(words1.length, words2.length);
  };

  // 학습 진도 저장 함수
  const saveProgress = useCallback(() => {
    const progressKey = `learning-progress-speaking`;
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
      console.log('🎉 말하기 모드 - 복습 모드에서 모든 문제 완료, 자동 레벨 완료 처리');
      setLevelCompleted(true);
      saveProgress();
      
      const nextLevel = currentLevel + 1;
      const hasNextLevel = sentences.some(s => s.level === nextLevel);
      
      console.log(`=== 말하기 모드 자동 레벨 완료 판정 디버깅 ===`);
      console.log(`현재 레벨: ${currentLevel}`);
      console.log(`다음 레벨: ${nextLevel}`);
      console.log(`hasNextLevel: ${hasNextLevel}`);
      console.log(`=== 말하기 모드 자동 디버깅 끝 ===`);
      
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
    
    console.log(`말하기 모드 handleNext 호출 - wrongAnswers 개수: ${wrongAnswers.size}, 틀린 문제들:`, Array.from(wrongAnswers));
    console.log(`현재 인덱스: ${currentSentenceIndex}, 전체 문장 수: ${currentSentenceList.length}`);
    console.log(`복습 모드: ${isReviewMode}`);
    
    if (currentSentenceIndex < currentSentenceList.length - 1) {
      setCurrentSentenceIndex(currentSentenceIndex + 1);
      setSpokenText("");
      setShowResult(false);
    } else {
      // 현재 단계 완료
      console.log(`=== 말하기모드 handleNext: 현재 단계 완료 ===`);
      console.log(`wrongAnswers.size: ${wrongAnswers.size}, isReviewMode: ${isReviewMode}`);
      console.log(`조건 1 (복습 모드 시작): wrongAnswers.size > 0 && !isReviewMode = ${wrongAnswers.size > 0 && !isReviewMode}`);
      console.log(`조건 2 (첫 번째 학습 완료): wrongAnswers.size === 0 = ${wrongAnswers.size === 0}`);
      console.log(`조건 3 (복습 모드 완료): isReviewMode && wrongAnswers.size === 0 = ${isReviewMode && wrongAnswers.size === 0}`);
      
      if (wrongAnswers.size > 0 && !isReviewMode) {
        console.log(`>>> 말하기모드 조건 1 실행: 복습 모드 시작`);
        setIsReviewMode(true);
        setCurrentSentenceIndex(0); // 복습 시 첫 번째 틀린 문제부터 시작
        setSpokenText("");
        setShowResult(false);
        toast({
          title: "복습 모드",
          description: `틀린 문제 ${wrongAnswers.size}개를 다시 풀어보세요.`,
        });
      } else if (isReviewMode && wrongAnswers.size === 0) {
        // 복습 모드에서 모든 문제 완료
        console.log(`>>> 말하기모드 조건 2 실행: 복습 모드에서 모든 문제 완료`);
        // 첫 번째 학습 완료
        setLevelCompleted(true);
        saveProgress(); // 진도 저장
        
        // 다음 레벨이 존재하는지 확인
        const nextLevel = currentLevel + 1;
        const hasNextLevel = sentences.some(s => s.level === nextLevel);
        const allLevels = [...new Set(sentences.map(s => s.level))].sort();
        const maxLevel = Math.max(...allLevels);
        const nextLevelSentences = sentences.filter(s => s.level === nextLevel);
        
        console.log(`=== 말하기모드 복습 모드 완료 판정 디버깅 ===`);
        console.log(`현재 레벨: ${currentLevel}`);
        console.log(`다음 레벨: ${nextLevel}`);
        console.log(`최대 레벨: ${maxLevel}`);
        console.log(`사용 가능한 레벨들:`, allLevels);
        console.log(`다음 레벨 문장 개수: ${nextLevelSentences.length}`);
        console.log(`다음 레벨 문장들:`, nextLevelSentences.map(s => s.id));
        console.log(`hasNextLevel: ${hasNextLevel}`);
        console.log(`=== 말하기모드 복습 모드 디버깅 끝 ===`);
        
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
        console.log(`>>> 말하기모드 조건 3 실행: 첫 번째 학습 완료 (복습 모드가 아닌 경우)`);
        setLevelCompleted(true);
        saveProgress(); // 진도 저장
        
        // 다음 레벨이 존재하는지 확인
        const nextLevel = currentLevel + 1;
        const hasNextLevel = sentences.some(s => s.level === nextLevel);
        const allLevels = [...new Set(sentences.map(s => s.level))].sort();
        const maxLevel = Math.max(...allLevels);
        const nextLevelSentences = sentences.filter(s => s.level === nextLevel);
        
        console.log(`=== 말하기모드 첫 번째 학습 완료 판정 디버깅 ===`);
        console.log(`현재 레벨: ${currentLevel}`);
        console.log(`다음 레벨: ${nextLevel}`);
        console.log(`최대 레벨: ${maxLevel}`);
        console.log(`사용 가능한 레벨들:`, allLevels);
        console.log(`다음 레벨 문장 개수: ${nextLevelSentences.length}`);
        console.log(`다음 레벨 문장들:`, nextLevelSentences.map(s => s.id));
        console.log(`hasNextLevel: ${hasNextLevel}`);
        console.log(`=== 말하기모드 첫 번째 학습 디버깅 끝 ===`);
        
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
        console.log(`>>> 말하기모드 조건 4 실행: 복습 모드에서 마지막 문제까지 완료했을 때`);
        console.log(`복습 모드 라운드 완료 - wrongAnswers 개수: ${wrongAnswers.size}`);
        
        if (wrongAnswers.size === 0) {
          // 모든 문제를 맞춤 - 레벨 완료 (이미 위에서 처리했으므로 이 블록은 실행되지 않아야 함)
          console.log("복습 모드에서 모든 문제 완료 - 이 블록은 실행되지 않아야 함");
        } else {
          // 아직 틀린 문제가 있음 - 복습 모드를 처음부터 다시 시작
          console.log(`복습 모드 재시작 - 틀린 문제 ${wrongAnswers.size}개`);
          setCurrentSentenceIndex(0);
          setSpokenText("");
          setShowResult(false);
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
    setSpokenText("");
    setShowResult(false);
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  // Generate placeholder underscores based on word lengths
  const generatePlaceholder = (sentence: string) => {
    return sentence.split(' ').map(word => '_'.repeat(word.length)).join(' ');
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            뒤로가기
          </Button>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-lg px-4 py-2">
              레벨 {currentLevel}
            </Badge>
            {isReviewMode && (
              <Badge variant="destructive">복습 모드</Badge>
            )}
          </div>
        </div>

        {/* Progress */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">진행률</span>
              <span className="text-sm text-muted-foreground">
                {currentSentenceIndex + 1} / {currentSentenceList.length}
                {isReviewMode && <span className="text-red-600 ml-2">(복습)</span>}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        {/* Main Learning Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">말하기 연습</CardTitle>
              <Badge variant="outline">{currentSentence.category}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Korean Sentence */}
            <div className="text-center p-6 bg-muted/50 rounded-lg">
              <p className="text-xl font-medium text-foreground">
                {currentSentence.koreanSentence}
              </p>
            </div>

            {/* English Input Area */}
            <div className="p-6 bg-primary/5 rounded-lg border-2 border-primary/20">
              {spokenText ? (
                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => speakText(spokenText)}
                    className="h-12 w-12"
                  >
                    <Volume2 className="w-6 h-6" />
                  </Button>
                  
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editedText}
                        onChange={(e) => setEditedText(e.target.value)}
                        className="text-2xl font-semibold text-primary h-auto py-2 px-3"
                        placeholder="텍스트를 수정하세요"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleEditSave();
                          } else if (e.key === 'Escape') {
                            handleEditCancel();
                          }
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEditSave}
                      >
                        저장
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleEditCancel}
                      >
                        취소
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-semibold text-primary tracking-wide">
                        {spokenText}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleEditStart}
                        className="h-8 w-8"
                        title="텍스트 수정"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-2xl font-mono text-muted-foreground tracking-widest">
                    {generatePlaceholder(currentSentence.englishSentence)}
                  </p>
                </div>
              )}
            </div>

            {/* Speech Input */}
            <div className="text-center space-y-4">
              <Button
                variant={isListening ? "destructive" : "hero"}
                size="iconLg"
                onClick={isListening ? stopListening : startListening}
                disabled={!recognition}
                className="w-20 h-20 rounded-full"
              >
                {isListening ? (
                  <MicOff className="w-8 h-8" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </Button>
              
              <p className="text-sm text-muted-foreground">
                {isListening ? "듣고 있습니다... 영어로 말해보세요" : "마이크 버튼을 클릭하고 말해보세요"}
              </p>
            </div>

            {/* Check/Next Button */}
            <div className="text-center">
              {!showResult ? (
                <Button 
                  onClick={handleCheck} 
                  disabled={!spokenText}
                  variant="hero"
                  size="lg"
                >
                  확인
                </Button>
              ) : (
                <Button 
                  onClick={levelCompleted ? onBack : handleNext} 
                  variant="hero"
                  size="lg"
                >
                  {levelCompleted ? '레벨 선택으로 돌아가기' : '다음 문제'}
                </Button>
              )}
            </div>

            {/* Result */}
            {showResult && (
              <div className={`p-4 rounded-lg border-2 ${
                isCorrect 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {isCorrect ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className="font-medium text-gray-800">
                    {isCorrect ? '훌륭합니다!' : '다시 시도해보세요'}
                  </span>
                </div>
                
                {!isCorrect && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 mb-1">정답:</p>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => speakText(currentSentence.englishSentence)}
                        className="h-12 w-12"
                      >
                        <Volume2 className="w-6 h-6" />
                      </Button>
                      <p className="text-2xl font-semibold text-gray-800">{currentSentence.englishSentence}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Basic types for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}