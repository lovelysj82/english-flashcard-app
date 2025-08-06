import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Volume2, CheckCircle, XCircle, ArrowLeft, Edit3 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Sentence {
  id: string;
  level: number;
  category: string;
  koreanSentence: string;
  englishSentence: string;
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
        // 음성 인식 오류 처리 (팝업 제거됨)
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    } else {
      console.error('음성 인식 지원되지 않음');
    }
  }, []);

  const startListening = () => {
    if (recognition) {
      setSpokenText("");
      setShowResult(false);
      setIsEditing(false);
      setIsListening(true);
      recognition.start();
    }
  };

  const stopListening = () => {
    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
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

  // 첫 글자 대문자로 변환하는 함수
  const capitalizeFirst = (str: string): string => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // 문장부호 제거 함수 (어퍼스트로피, 하이픈 포함)
  const removePunctuation = (text: string): string => {
    return text.replace(/[.,!?;:'"'-]/g, '').trim();
  };

  // 영어 문장을 단어별로 파싱하는 함수 (어퍼스트로피가 있는 단어 처리)
  const parseEnglishSentence = (sentence: string): string[] => {
    // 문장부호 제거 후 공백으로 분리
    const cleanSentence = removePunctuation(sentence);
    return cleanSentence.split(/\s+/).filter(word => word.length > 0);
  };

  // 음성인식 정확도 향상을 위한 스마트 매칭 함수
  const improveRecognition = (spokenText: string, correctAnswer: string): string => {
    let improvedText = spokenText;
    
    // 한국어 발음으로 인식된 것들을 영어로 변환
    const koreanToEnglish: { [key: string]: string } = {
      // 기본 단어들
      '아임': 'I am',
      '아이 앰': 'I am',
      '아이앰': 'I am',
      '어': 'a',
      '에이': 'a',
      '안': 'an',
      '스튜던트': 'student',
      '스투던트': 'student',
      '헬로': 'hello',
      '헬로우': 'hello',
      '하이': 'hi',
      '굿바이': 'goodbye',
      '시유': 'see you',
      '땡큐': 'thank you',
      '예스': 'yes',
      '노': 'no',
      '소리': 'sorry',
      '플리즈': 'please',
      '익스큐즈미': 'excuse me'
    };
    
    // 한국어 → 영어 변환
    for (const [korean, english] of Object.entries(koreanToEnglish)) {
      const regex = new RegExp(korean, 'gi');
      improvedText = improvedText.replace(regex, english);
    }
    
    console.log(`🔄 음성인식 개선: "${spokenText}" → "${improvedText}"`);
    return improvedText;
  };

  const handleCheck = () => {
    if (!spokenText.trim()) return;
    
    // 첫 글자 대문자로 변환
    const processedSpokenText = capitalizeFirst(spokenText.trim());
    
    // 음성인식 개선 적용
    const improvedSpokenText = improveRecognition(processedSpokenText, currentSentence.englishSentence);
    
    // 개선된 텍스트로 업데이트
    setSpokenText(improvedSpokenText);
    
    // 정답과 비교 (문장부호 제거 후 소문자로 변환하여 비교)
    const userAnswer = removePunctuation(improvedSpokenText).toLowerCase();
    const correctAnswer = removePunctuation(currentSentence.englishSentence).toLowerCase();
    
    console.log(`🎯 말하기 모드 정답 비교:`);
    console.log(`원본 인식: "${spokenText}"`);
    console.log(`개선된 인식: "${improvedSpokenText}"`);
    console.log(`사용자 답: "${improvedSpokenText}" → 처리됨: "${userAnswer}"`);
    console.log(`정답: "${currentSentence.englishSentence}" → 처리됨: "${correctAnswer}"`);
    
    // 정확한 일치 우선 체크 (100% 정확도)
    const correct = userAnswer === correctAnswer;
    
    console.log(`✅ 비교 결과: ${correct ? '정답' : '오답'}`);
    
    setIsCorrect(correct);
    setShowResult(true);
    
    if (!correct) {
      setWrongAnswers(prev => {
        const newSet = new Set([...prev, currentSentence.id]);
        console.log(`틀린 문제 추가 후 wrongAnswers:`, Array.from(newSet));
        return newSet;
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
          if (currentSentenceIndex >= newReviewSentences.length) {
            setCurrentSentenceIndex(0);
          }
        }
        
        return newSet;
      });
    }
  };

  // 학습 진도 저장 함수
  const saveProgress = useCallback(() => {
    const key = 'learning-progress-speaking';
    
    // 현재 레벨의 총 문장 수와 정답 수 계산
    const totalSentences = levelSentences.length;
    const correctAnswers = totalSentences - wrongAnswers.size;
    const completed = wrongAnswers.size === 0; // 틀린 문제가 없으면 완료
    
    console.log(`말하기 모드 진도 저장: 레벨 ${currentLevel}, 총 ${totalSentences}개, 정답 ${correctAnswers}개, 완료: ${completed}`);
    
    // 기존 진도 불러오기
    const existingData = localStorage.getItem(key);
    let progressData = existingData ? JSON.parse(existingData) : [];
    
    // 현재 레벨의 진도 업데이트
    const levelIndex = progressData.findIndex((p: any) => p.level === currentLevel);
    const levelProgress = {
      level: currentLevel,
      completed,
      totalSentences,
      correctAnswers,
      unlocked: true
    };
    
    if (levelIndex >= 0) {
      progressData[levelIndex] = levelProgress;
    } else {
      progressData.push(levelProgress);
    }
    
    localStorage.setItem(key, JSON.stringify(progressData));
    console.log(`말하기 모드 진도 저장 완료:`, levelProgress);
  }, [currentLevel, levelSentences.length, wrongAnswers.size]);

  // 복습 모드에서 모든 문제를 맞춘 경우 자동으로 레벨 완료 처리
  useEffect(() => {
    if (isReviewMode && wrongAnswers.size === 0 && reviewSentences.length > 0) {
      console.log(`=== 말하기 모드 자동 레벨 완료 판정 ===`);
      console.log(`복습 모드: ${isReviewMode}`);
      console.log(`틀린 문제 수: ${wrongAnswers.size}`);
      console.log(`복습 문장 수: ${reviewSentences.length}`);
      
      setLevelCompleted(true);
      saveProgress(); // 진도 저장
      
      // 다음 레벨이 존재하는지 확인
      const nextLevel = currentLevel + 1;
      const nextLevelSentences = sentences.filter(s => s.level === nextLevel);
      const hasNextLevel = nextLevelSentences.length > 0;
      const allLevels = [...new Set(sentences.map(s => s.level))].sort();
      const maxLevel = Math.max(...allLevels);
      
      console.log(`현재 레벨: ${currentLevel}`);
      console.log(`다음 레벨: ${nextLevel}`);
      console.log(`다음 레벨 문장 개수: ${nextLevelSentences.length}`);
      console.log(`hasNextLevel: ${hasNextLevel}`);
      console.log(`=== 디버깅 끝 ===`);
      
      if (hasNextLevel) {
        // 레벨 완료 처리
      } else {
        // 모든 레벨 완료 처리
      }
    }
  }, [isReviewMode, wrongAnswers.size, reviewSentences.length, currentLevel, sentences, saveProgress]);

  const handleNext = () => {
    const currentSentenceList = isReviewMode ? reviewSentences : levelSentences;
    
    console.log(`handleNext 호출 - wrongAnswers 개수: ${wrongAnswers.size}, 틀린 문제들:`, Array.from(wrongAnswers));
    console.log(`현재 모드: ${isReviewMode ? '복습' : '첫 패스'}, 현재 인덱스: ${currentSentenceIndex}, 총 문장 수: ${currentSentenceList.length}`);
    
    if (wrongAnswers.size > 0 && !isReviewMode) {
      // Start review mode for wrong answers
      console.log(`>>> 조건 1 실행: 복습 모드 시작`);
      setIsReviewMode(true);
      setCurrentSentenceIndex(0); // 복습 시 첫 번째 틀린 문제부터 시작
    } else if (isReviewMode && wrongAnswers.size === 0) {
      // 복습 모드에서 모든 문제 완료
      console.log(`>>> 조건 2 실행: 복습 모드에서 모든 문제 완료`);
      setLevelCompleted(true);
      saveProgress(); // 진도 저장
      
      // 다음 레벨이 존재하는지 확인
      const nextLevel = currentLevel + 1;
      const nextLevelSentences = sentences.filter(s => s.level === nextLevel);
      const hasNextLevel = nextLevelSentences.length > 0;
      const allLevels = [...new Set(sentences.map(s => s.level))].sort();
      const maxLevel = Math.max(...allLevels);
      
      console.log(`=== 복습 완료 판정 디버깅 ===`);
      console.log(`현재 레벨: ${currentLevel}`);
      console.log(`다음 레벨: ${nextLevel}`);
      console.log(`다음 레벨 문장 개수: ${nextLevelSentences.length}`);
      console.log(`hasNextLevel: ${hasNextLevel}`);
      console.log(`=== 복습 디버깅 끝 ===`);
      
      if (hasNextLevel) {
        // 레벨 완료 처리
      } else {
        // 모든 레벨 완료 처리
      }
    } else {
      // 복습 모드에서 마지막 문제까지 완료했을 때
      console.log(`>>> 조건 4 실행: 복습 모드에서 마지막 문제까지 완료했을 때`);
      console.log(`복습 모드 라운드 완료 - wrongAnswers 개수: ${wrongAnswers.size}`);
      
      if (wrongAnswers.size === 0) {
        console.log("복습 모드에서 모든 문제 완료 - 이 블록은 실행되지 않아야 함");
      } else {
        // 아직 틀린 문제가 있음 - 복습 모드를 처음부터 다시 시작
        console.log(`복습 모드 재시작 - 틀린 문제 ${wrongAnswers.size}개`);
        setCurrentSentenceIndex(0);
        // 복습 계속 처리
      }
    }
    
    if (wrongAnswers.size === 0) {
      // 첫 번째 학습 완료 (복습 모드가 아닌 경우)
      console.log(`>>> 조건 3 실행: 첫 번째 학습 완료 (복습 모드가 아닌 경우)`);
      setLevelCompleted(true);
      saveProgress(); // 진도 저장
      
      // 다음 레벨이 존재하는지 확인
      const nextLevel = currentLevel + 1;
      const nextLevelSentences = sentences.filter(s => s.level === nextLevel);
      const hasNextLevel = nextLevelSentences.length > 0;
      const allLevels = [...new Set(sentences.map(s => s.level))].sort();
      const maxLevel = Math.max(...allLevels);
      
      console.log(`=== 자동 디버깅 ===`);
      console.log(`현재 레벨: ${currentLevel}`);
      console.log(`최대 레벨: ${maxLevel}`);
      console.log(`사용 가능한 레벨들:`, allLevels);
      console.log(`다음 레벨 문장 개수: ${nextLevelSentences.length}`);
      console.log(`다음 레벨 문장들:`, nextLevelSentences.map(s => s.id));
      console.log(`hasNextLevel: ${hasNextLevel}`);
      console.log(`=== 자동 디버깅 끝 ===`);
      
      if (hasNextLevel) {
        // 레벨 완료 처리
      } else {
        // 모든 레벨 완료 처리
      }
    } else if (currentSentenceIndex + 1 < currentSentenceList.length) {
      // 같은 모드(첫 패스 또는 복습)에서 다음 문제로 이동
      console.log(`>>> 조건 5 실행: 같은 모드에서 다음 문제로 이동`);
      setCurrentSentenceIndex(currentSentenceIndex + 1);
    }
    
    // 상태 초기화
    setSpokenText("");
    setShowResult(false);
    setIsEditing(false);
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

  // TTS 발음 개선을 위한 텍스트 전처리 함수
  const preprocessForTTS = (text: string): string => {
    let processedText = text;
    
    // 1. "I'm a" → "I'm an" (모음 앞에서 자연스러운 부정관사)
    processedText = processedText.replace(/\ba\s+(?=[aeiouAEIOU])/g, 'an ');
    
    // 2. "the" 발음 개선 (모음 앞에서 "디" 발음)
    // the apple → thee apple (TTS가 "디" 발음하도록)
    processedText = processedText.replace(/\bthe\s+(?=[aeiouAEIOU])/gi, 'thee ');
    
    // 3. 자주 틀리는 발음 교정
    processedText = processedText.replace(/\bI'm a student\b/gi, 'I\'m uh student');
    
    return processedText;
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      // 안드로이드 갤럭시 완벽 호환을 위한 최종 수정
      speechSynthesis.cancel();
      
      // voices가 로딩될 때까지 기다리기 (갤럭시 필수)
      const waitForVoices = () => {
        return new Promise<void>((resolve) => {
          const voices = speechSynthesis.getVoices();
          if (voices.length > 0) {
            resolve();
          } else {
            speechSynthesis.onvoiceschanged = () => {
              resolve();
            };
            // 최대 2초 대기
            setTimeout(resolve, 2000);
          }
        });
      };
      
      const attemptSpeak = async (retryCount = 0) => {
        const maxRetries = 5; // 재시도 횟수 증가
        
        try {
          // 갤럭시에서 voices 로딩 대기
          await waitForVoices();
          
          setTimeout(() => {
            const processedText = preprocessForTTS(text);
            console.log(`[갤럭시 TTS] 시도 ${retryCount + 1}: "${text}" → "${processedText}"`);
            
            const utterance = new SpeechSynthesisUtterance(processedText);
            
            // 갤럭시 최적화 설정
            const voices = speechSynthesis.getVoices();
            const englishVoice = voices.find(voice => 
              voice.lang.includes('en') && !voice.localService
            ) || voices.find(voice => voice.lang.includes('en'));
            
            if (englishVoice) {
              utterance.voice = englishVoice;
              console.log(`[갤럭시 TTS] 사용 음성: ${englishVoice.name}`);
            }
            
            utterance.lang = 'en-US';
            utterance.rate = 0.7; // 갤럭시에서 더 안정적인 속도
            utterance.pitch = 1.0;
            utterance.volume = 1.0;
            
            utterance.onstart = () => {
              console.log(`[갤럭시 TTS] ✅ 성공 (시도 ${retryCount + 1})`);
            };
            
            utterance.onend = () => {
              console.log(`[갤럭시 TTS] 완료 (시도 ${retryCount + 1})`);
            };
            
            utterance.onerror = (event) => {
              console.error(`[갤럭시 TTS] ❌ 오류 (시도 ${retryCount + 1}):`, event.error);
              
              if (retryCount < maxRetries) {
                console.log(`[갤럭시 TTS] 🔄 재시도... (${retryCount + 1}/${maxRetries})`);
                setTimeout(() => attemptSpeak(retryCount + 1), 200);
              } else {
                console.error('[갤럭시 TTS] 💥 최종 실패');
              }
            };
            
            speechSynthesis.speak(utterance);
            console.log('[갤럭시 TTS] speak() 호출 완료');
            
          }, 100 + (retryCount * 50));
          
        } catch (error) {
          console.error(`[갤럭시 TTS] Exception (시도 ${retryCount + 1}):`, error);
          if (retryCount < maxRetries) {
            setTimeout(() => attemptSpeak(retryCount + 1), 200);
          }
        }
      };
      
      attemptSpeak();
    } else {
      console.error('[TTS] speechSynthesis 지원되지 않음');
    }
  };

  // 단어별 밑줄 생성 함수
  const generateWordUnderlines = (sentence: string) => {
    const words = parseEnglishSentence(sentence);
    return words.map((word, index) => (
      <span 
        key={index}
        className="inline-block mx-1"
        style={{ 
          borderBottom: '2px solid #6b7280',
          width: `${Math.max(word.length * 10, 30)}px`,
          height: '24px',
          marginBottom: '4px'
        }}
      />
    ));
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
    ? (currentSentenceIndex / currentSentenceList.length) * 100 
    : 0;

  return (
    <div className="h-screen bg-background flex flex-col" style={{ maxHeight: '100vh', minHeight: '100vh' }}>
      {/* Header - SentenceCompletionMode와 동일한 스타일 */}
      <div className="flex items-center justify-between p-2 border-b flex-shrink-0">
        <Button variant="ghost" size="icon" onClick={() => {
          console.log('SpeakingMode: 뒤로가기 버튼 클릭');
          onBack();
        }}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 mx-3">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <span className="text-xs font-medium text-gray-600">
          {currentSentenceIndex + 1}/{currentSentenceList.length}
        </span>
      </div>

      {/* Main Content - SentenceCompletionMode와 동일한 스타일 */}
      <div className="flex-1 flex flex-col p-2 max-w-sm mx-auto w-full overflow-auto" style={{ minHeight: '0' }}>
        {/* Korean Sentence */}
        <div className="text-center mb-6">
          <p className="text-xl font-semibold text-gray-800">
            {currentSentence.koreanSentence}
          </p>
        </div>

        {/* English Underlines - 단어별 밑줄 */}
        <div className="text-center mb-6">
          <div className="text-lg leading-relaxed">
            {spokenText ? (
              <div className="flex items-center justify-center gap-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => speakText(spokenText)}
                  className="h-8 w-8"
                >
                  <Volume2 className="w-5 h-5" />
                </Button>
                <span 
                  className="text-lg font-medium text-blue-700 cursor-pointer"
                  onClick={() => setIsEditing(true)}
                >
                  {spokenText}
                </span>
              </div>
            ) : (
              <div className="flex flex-wrap justify-center items-end gap-1">
                {generateWordUnderlines(currentSentence.englishSentence)}
              </div>
            )}
          </div>
        </div>

        {/* 텍스트 편집 모드 */}
        {isEditing && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <Input
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="mb-3"
              placeholder="텍스트를 수정하세요"
            />
            <div className="flex gap-2">
              <Button onClick={handleEditSave} className="flex-1">
                저장
              </Button>
              <Button onClick={handleEditCancel} variant="outline" className="flex-1">
                취소
              </Button>
            </div>
          </div>
        )}

        {/* Voice Recognition Button */}
        <div className="text-center mb-6">
          <Button
            onClick={isListening ? stopListening : startListening}
            className={`w-20 h-20 rounded-full ${
              isListening 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white`}
            disabled={showResult}
          >
            {isListening ? (
              <MicOff className="w-8 h-8" />
            ) : (
              <Mic className="w-8 h-8" />
            )}
          </Button>
        </div>

        {/* Result Display - 슬라이드 애니메이션으로 표시 */}
        {showResult && (
          <div 
            className={`mb-4 p-4 rounded-lg border-2 transition-all duration-300 ${
              isCorrect 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}
            style={{
              maxHeight: showResult ? '200px' : '0px',
              opacity: showResult ? 1 : 0,
              overflow: 'hidden'
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              {isCorrect ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <span className={`font-medium ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
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
                    className="h-8 w-8"
                  >
                    <Volume2 className="w-5 h-5" />
                  </Button>
                  <p className="text-lg font-semibold text-gray-800">{currentSentence.englishSentence}</p>
                </div>
              </div>
            )}

            {isCorrect && (
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => speakText(currentSentence.englishSentence)}
                  className="h-8 w-8"
                >
                  <Volume2 className="w-5 h-5" />
                </Button>
                <p className="text-lg font-semibold text-green-800">{currentSentence.englishSentence}</p>
              </div>
            )}
          </div>
        )}
        
        {/* 최소 여백만 유지 */}
        <div className="h-4"></div>
      </div>

      {/* Bottom Button - SentenceCompletionMode와 동일한 스타일 */}
      <div 
        className="flex-shrink-0 bg-background border-t border-gray-200"
        style={{ 
          paddingLeft: '16px', 
          paddingRight: '16px', 
          paddingTop: '8px',
          paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
          minHeight: '60px'
        }}
      >
        {!showResult ? (
          <Button 
            onClick={handleCheck} 
            disabled={!spokenText.trim()}
            className={`w-full max-w-xs mx-auto py-3 text-base font-bold transition-all ${
              !spokenText.trim()
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            확인
          </Button>
        ) : (
          <Button 
            onClick={levelCompleted ? onBack : handleNext} 
            className="w-full max-w-xs mx-auto py-3 text-base font-bold bg-green-500 hover:bg-green-600 text-white"
          >
            {levelCompleted ? '완료' : '계속'}
          </Button>
        )}
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