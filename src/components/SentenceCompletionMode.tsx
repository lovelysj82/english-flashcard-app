import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Volume2, RotateCcw, CheckCircle, XCircle, ArrowLeft } from "lucide-react";


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

  // 선택된 단어를 다시 클릭했을 때 제거하는 함수 (단어 버튼에서)
  const handleSelectedWordRemove = (word: string, originalIndex: number) => {
    console.log(`선택된 단어 제거: ${word}, 원본 인덱스: ${originalIndex}`);
    
    // selectedIndices에서 해당 인덱스를 찾아서 제거
    const indexToRemove = selectedIndices.indexOf(originalIndex);
    if (indexToRemove !== -1) {
      const newSelectedWords = [...selectedWords];
      const newSelectedIndices = [...selectedIndices];
      
      newSelectedWords.splice(indexToRemove, 1);
      newSelectedIndices.splice(indexToRemove, 1);
      
      setSelectedWords(newSelectedWords);
      setSelectedIndices(newSelectedIndices);
      setShowResult(false);
    }
  };

  // 드래그 앤 드롭 및 터치 이벤트 처리
  const [touchStartPos, setTouchStartPos] = useState<{x: number, y: number} | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (index: number) => {
    console.log(`드래그 시작: index=${index}`);
    setDraggedIndex(index);
    setIsDragging(true);
  };

  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    e.stopPropagation();
    const touch = e.touches[0];
    setTouchStartPos({ x: touch.clientX, y: touch.clientY });
    setDraggedIndex(index);
    setIsDragging(false);
    console.log(`터치 시작: index=${index}, 위치: (${touch.clientX}, ${touch.clientY})`);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPos || draggedIndex === null) return;
    
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartPos.x);
    const deltaY = Math.abs(touch.clientY - touchStartPos.y);
    
    // 2px 이상 움직이면 드래그로 판단 (매우 민감하게)
    if (deltaX > 2 || deltaY > 2) {
      e.preventDefault(); // 스크롤 방지
      if (!isDragging) {
        setIsDragging(true);
        console.log(`✨ 부드러운 드래그 시작: index=${draggedIndex}, 이동거리=${Math.max(deltaX, deltaY)}px`);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    
    if (draggedIndex === null) {
      setTouchStartPos(null);
      setIsDragging(false);
      return;
    }

    const touch = e.changedTouches[0];
    console.log(`터치 종료: 위치: (${touch.clientX}, ${touch.clientY}), 드래그 중: ${isDragging}`);
    
    if (!isDragging) {
      // 드래그가 아닌 경우 클릭으로 처리 (단어 제거)
      console.log(`클릭으로 인식: index=${draggedIndex}`);
      handleSelectedWordClick(draggedIndex);
    } else {
      // 드래그인 경우 드롭 처리
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      console.log(`드롭 대상 요소:`, element);
      
      // 드롭 대상 찾기
      let dropTarget = element;
      let targetIndex = -1;
      
      while (dropTarget && targetIndex === -1) {
        const dropIndex = dropTarget.getAttribute('data-drop-index');
        if (dropIndex !== null) {
          targetIndex = parseInt(dropIndex);
          break;
        }
        dropTarget = dropTarget.parentElement;
      }
      
      if (targetIndex !== -1) {
        console.log(`드롭 처리: draggedIndex=${draggedIndex}, targetIndex=${targetIndex}`);
        moveWord(draggedIndex, targetIndex);
      } else {
        console.log('유효한 드롭 대상을 찾지 못함');
      }
    }
    
    // 상태 초기화
    setDraggedIndex(null);
    setTouchStartPos(null);
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const moveWord = (fromIndex: number, targetIndex: number) => {
    const newSelectedWords = [...selectedWords];
    const newSelectedIndices = [...selectedIndices];
    
    // 드래그된 아이템을 타겟 위치로 이동
    const draggedWord = newSelectedWords[fromIndex];
    const draggedOriginalIndex = newSelectedIndices[fromIndex];
    
    // 먼저 드래그된 아이템 제거
    newSelectedWords.splice(fromIndex, 1);
    newSelectedIndices.splice(fromIndex, 1);
    
    // 삽입 위치 조정: 드래그된 아이템이 타겟보다 앞에 있었다면 타겟 인덱스를 1 줄임
    const adjustedTargetIndex = fromIndex < targetIndex ? targetIndex - 1 : targetIndex;
    
    console.log(`조정된 타겟 인덱스: ${adjustedTargetIndex}`);
    
    // 조정된 위치에 삽입
    newSelectedWords.splice(adjustedTargetIndex, 0, draggedWord);
    newSelectedIndices.splice(adjustedTargetIndex, 0, draggedOriginalIndex);
    
    console.log(`결과 배열:`, newSelectedWords);
    
    setSelectedWords(newSelectedWords);
    setSelectedIndices(newSelectedIndices);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedIndex === null) return;
    
    console.log(`마우스 드롭: draggedIndex=${draggedIndex}, targetIndex=${targetIndex}`);
    moveWord(draggedIndex, targetIndex);
    setDraggedIndex(null);
  };

  const handleContainerDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedIndex === null) return;
    
    console.log('컨테이너에 드롭됨 - 마지막 위치로 이동');
    moveWord(draggedIndex, selectedWords.length);
    setDraggedIndex(null);
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

      } else {

      }
    }
  }, [isReviewMode, wrongAnswers.size, reviewSentences.length, currentLevel, sentences, saveProgress]);

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
          // 레벨 완료 처리
        } else {
          // 모든 레벨 완료 처리
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
          // 레벨 완료 처리
        } else {
          // 모든 레벨 완료 처리
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
          // 복습 계속 처리
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

  const speakText = async (text: string) => {
    // 플랫폼/브라우저 환경 완전 감지
    const userAgent = navigator.userAgent.toLowerCase();
    const isKakaoInApp = userAgent.includes('kakaotalk');
    const isSamsungBrowser = userAgent.includes('samsungbrowser');
    const isAndroid = userAgent.includes('android');
    const isIOS = /ipad|iphone|ipod/.test(userAgent);
    const isSafari = userAgent.includes('safari') && !userAgent.includes('chrome');
    const isChrome = userAgent.includes('chrome');
    
    console.log(`🎵 [TTS] 음성 재생 요청: "${text}"`);
    console.log(`📱 [TTS] 플랫폼/브라우저 환경:`, {
      isKakaoInApp,
      isSamsungBrowser,
      isAndroid,
      isIOS,
      isSafari,
      isChrome,
      userAgent: userAgent.substring(0, 100)
    });
    
    // 플랫폼별 오디오 시스템 활성화 전략
    if (isKakaoInApp) {
      console.log('📱 [카카오톡] 인앱 브라우저 감지 - 특별 처리 시작');
      
      // 카카오톡 WebView에서 오디오 활성화를 위한 더 강력한 사용자 제스처 생성
      try {
        // 1. 더미 오디오 요소로 오디오 시스템 활성화
        const dummyAudio = new Audio();
        dummyAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAACAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA=='; // 무음 오디오
        dummyAudio.volume = 0.01;
        
        const playPromise = dummyAudio.play();
        if (playPromise) {
          await playPromise.catch(() => {
            console.log('📱 [카카오톡] 더미 오디오 재생 실패 (정상)');
          });
        }
        
        console.log('✅ [카카오톡] 오디오 시스템 활성화 완료');
      } catch (dummyError) {
        console.warn('⚠️ [카카오톡] 더미 오디오 활성화 실패:', dummyError);
      }
      
      // 2. 강제 사용자 상호작용 대기 (카카오톡 필수)
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } else if (isIOS && !isKakaoInApp) {
      console.log('🍎 [iOS] Safari/Chrome 감지 - iOS 전용 오디오 활성화');
      
      // iOS Safari/Chrome에서 Speech Synthesis 활성화를 위한 특별 처리
      try {
        // iOS에서는 사용자 제스처가 더욱 엄격하므로 즉시 speechSynthesis 호출
        if ('speechSynthesis' in window) {
          // iOS speechSynthesis 준비 상태 확인
          speechSynthesis.cancel(); // 이전 음성 정리
          
          // iOS에서는 getVoices()가 비동기적으로 로드되므로 대기
          const voices = speechSynthesis.getVoices();
          if (voices.length === 0) {
            console.log('🍎 [iOS] 음성 엔진 로딩 대기 중...');
            await new Promise(resolve => {
              const checkVoices = () => {
                const newVoices = speechSynthesis.getVoices();
                if (newVoices.length > 0) {
                  resolve(newVoices);
                } else {
                  setTimeout(checkVoices, 100);
                }
              };
              speechSynthesis.onvoiceschanged = () => resolve(speechSynthesis.getVoices());
              checkVoices();
            });
          }
          
          console.log('✅ [iOS] Speech Synthesis 준비 완료');
        }
      } catch (iosError) {
        console.warn('⚠️ [iOS] 음성 시스템 준비 실패:', iosError);
      }
    }
    
    // 안드로이드/갤럭시 오디오 컨텍스트 활성화
    try {
      if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
        const AudioContextClass = AudioContext || webkitAudioContext;
        const audioContext = new AudioContextClass();
        
        if (audioContext.state === 'suspended') {
          console.log(`🔧 [${isKakaoInApp ? '카카오톡' : '갤럭시'}] 오디오 컨텍스트 활성화 중...`);
          await audioContext.resume();
          console.log(`✅ [${isKakaoInApp ? '카카오톡' : '갤럭시'}] 오디오 컨텍스트 활성화 완료: ${audioContext.state}`);
        }
        
        audioContext.close();
      }
    } catch (audioError) {
      console.warn(`⚠️ [${isKakaoInApp ? '카카오톡' : '갤럭시'}] 오디오 컨텍스트 활성화 실패:`, audioError);
    }

    if ('speechSynthesis' in window) {
      // 갤럭시 Chrome/Samsung Internet 호환성 강화
      speechSynthesis.cancel();
      
      // 음성 엔진 준비 대기 (갤럭시 중요)
      const waitForVoices = () => {
        return new Promise<SpeechSynthesisVoice[]>((resolve) => {
          const voices = speechSynthesis.getVoices();
          if (voices.length > 0) {
            resolve(voices);
          } else {
            speechSynthesis.onvoiceschanged = () => {
              const newVoices = speechSynthesis.getVoices();
              resolve(newVoices);
            };
            // 최대 3초 대기
            setTimeout(() => resolve(speechSynthesis.getVoices()), 3000);
          }
        });
      };

      try {
        const voices = await waitForVoices();
        console.log(`🎤 [갤럭시] 사용 가능한 음성: ${voices.length}개`);

        const processedText = preprocessForTTS(text);
        console.log(`🔄 [갤럭시] TTS 전처리: "${text}" → "${processedText}"`);
        
        const utterance = new SpeechSynthesisUtterance(processedText);
        
        // 갤럭시 최적 음성 선택
        const englishVoice = voices.find(voice => 
          voice.lang === 'en-US' && voice.localService === false
        ) || voices.find(voice => 
          voice.lang.startsWith('en-US')
        ) || voices.find(voice => 
          voice.lang.startsWith('en')
        ) || voices[0];
        
        if (englishVoice) {
          utterance.voice = englishVoice;
          console.log(`✅ [갤럭시] 선택된 음성: ${englishVoice.name} (${englishVoice.lang}) - 로컬: ${englishVoice.localService}`);
        } else {
          console.warn('⚠️ [갤럭시] 영어 음성을 찾을 수 없음');
        }
        
        // 갤럭시 최적화 설정
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        // 갤럭시 전용 이벤트 핸들러
        utterance.onstart = () => {
          console.log(`🎯 [갤럭시] TTS 재생 시작 성공!`);
        };
        
        utterance.onend = () => {
          console.log(`✅ [갤럭시] TTS 재생 완료!`);
        };
        
        utterance.onerror = (event) => {
          let browserType = '브라우저';
          if (isKakaoInApp) browserType = '카카오톡';
          else if (isSamsungBrowser) browserType = '삼성브라우저';
          else if (isIOS && isSafari) browserType = 'iOS Safari';
          else if (isIOS && isChrome) browserType = 'iOS Chrome';
          else if (isAndroid) browserType = '안드로이드';
          
          console.error(`❌ [${browserType}] TTS 오류: ${event.error}`);
          
          if (event.error === 'not-allowed') {
            console.error(`🚫 [${browserType}] 오디오 권한이 거부되었습니다.`);
            
            if (isKakaoInApp) {
              if (isIOS) {
                // iOS 카카오톡: 음성 재생 가능하므로 다른 문제일 수 있음
                console.error('🍎 [iOS 카카오톡] 해결방법:');
                console.error('   1. 카카오톡 앱 설정 → 소리/진동 확인');
                console.error('   2. iOS 설정 → 카카오톡 → 권한 확인');
                console.error('   3. 카카오톡 앱 재시작');
                alert('🔊 음성 재생에 문제가 있습니다.\n\n해결방법:\n1. 카카오톡 설정에서 소리/진동 확인\n2. iOS 설정에서 카카오톡 권한 확인\n3. 카카오톡 앱 재시작');
              } else {
                // Android 카카오톡: 외부 브라우저 권장
                console.error('🤖 [안드로이드 카카오톡] 해결방법:');
                console.error('   1. "외부 브라우저에서 열기" 사용');
                console.error('   2. 삼성 인터넷이나 Chrome으로 직접 접속');
                alert('🔊 카카오톡에서 음성이 재생되지 않습니다.\n\n해결방법:\n1. 우상단 ⋯ → "외부 브라우저에서 열기"\n2. 삼성 인터넷이나 Chrome 사용\n\n(안드로이드 카카오톡은 음성 재생 제한이 있습니다)');
              }
            } else if (isIOS) {
              // iOS Safari/Chrome: 설정 안내
              console.error('🍎 [iOS] 해결방법:');
              console.error('   1. iOS 설정 → Safari → 고급 → 웹사이트 데이터');
              console.error('   2. 또는 브라우저 새로고침 후 재시도');
              console.error('   3. 다른 브라우저(Chrome/Edge) 사용');
              alert('🔊 iOS에서 음성 재생 권한이 필요합니다.\n\n해결방법:\n1. 브라우저 새로고침 후 재시도\n2. iOS 설정에서 Safari 권한 확인\n3. Chrome이나 Edge 브라우저 사용');
            } else {
              // Android 브라우저: 일반 권한 안내
              console.error(`📱 [${browserType}] 해결방법:`);
              console.error('   1. 브라우저 주소창 옆 🔒 아이콘 클릭');
              console.error('   2. 소리 권한을 "허용"으로 변경');
              console.error('   3. 페이지 새로고침');
              alert('🔊 음성 재생 권한이 필요합니다.\n\n해결방법:\n1. 주소창 옆 🔒 아이콘 클릭\n2. 소리 권한을 "허용"으로 변경\n3. 페이지 새로고침');
            }
          } else if (event.error === 'network') {
            console.error(`🌐 [${browserType}] 네트워크 오류`);
          } else if (event.error === 'synthesis-failed') {
            console.error(`🔧 [${browserType}] 음성 합성 실패`);
            
            if (isKakaoInApp && isAndroid) {
              console.error('💡 [안드로이드 카카오톡] 인앱 브라우저 제한 - 외부 브라우저 사용 권장');
            } else if (isIOS && !isKakaoInApp) {
              console.error('💡 [iOS] 음성 엔진 초기화 실패 - 재시도 권장');
            }
          }
        };
        
        // 갤럭시에서 사용자 제스처 보장하며 즉시 실행
        speechSynthesis.speak(utterance);
        console.log(`🚀 [갤럭시] speechSynthesis.speak() 호출 완료`);
        
        // 갤럭시 재생 상태 모니터링
        setTimeout(() => {
          if (speechSynthesis.speaking) {
            console.log(`🎵 [갤럭시] 음성 재생 중... (정상)`);
          } else if (speechSynthesis.pending) {
            console.log(`⏳ [갤럭시] 음성 재생 대기 중...`);
          } else {
            console.warn(`⚠️ [갤럭시] 음성 재생 시작되지 않음`);
            console.warn(`📋 [갤럭시] 상태 정보:`);
            console.warn(`   - speaking: ${speechSynthesis.speaking}`);
            console.warn(`   - pending: ${speechSynthesis.pending}`);
            console.warn(`   - paused: ${speechSynthesis.paused}`);
          }
        }, 800);
        
      } catch (error) {
        console.error(`💥 [갤럭시] TTS 초기화 오류:`, error);
      }
      
    } else {
      console.error('❌ [갤럭시] speechSynthesis API가 지원되지 않습니다.');
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
    ? (currentSentenceIndex / currentSentenceList.length) * 100 
    : 0;

  return (
    <div className="h-screen bg-background flex flex-col" style={{ maxHeight: '100vh', minHeight: '100vh' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-1 border-b flex-shrink-0">
        <Button variant="ghost" size="icon" onClick={() => {
          console.log('SentenceCompletionMode: 뒤로가기 버튼 클릭');
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-1 max-w-sm mx-auto w-full" style={{ minHeight: '0', maxHeight: 'calc(100vh - 80px)', overflow: 'auto' }}>
        {/* Korean Sentence */}
        <div className="text-center mb-6">
          <p className="text-xl font-semibold text-gray-800">
            {currentSentence.koreanSentence}
          </p>
        </div>

        {/* English Answer Area with Underlines */}
        <div className="mb-5">
          <div 
            className="flex flex-wrap justify-center min-h-[2.5rem] items-center p-2 rounded-lg border-2 border-dashed border-gray-300"
            onDragOver={handleDragOver}
            onDrop={handleContainerDrop}
          >
            {selectedWords.length > 0 ? (
              selectedWords.map((word, index) => (
                <div key={index} className="flex items-center">
                  {/* 넓은 드롭 영역 */}
                  <div
                    className="w-8 h-10 flex items-center justify-center opacity-0 hover:opacity-30 transition-opacity"
                    data-drop-index={index}
                    onDragOver={handleDragOver}
                    onDrop={(e) => { e.stopPropagation(); handleDrop(e, index); }}
                    style={{ 
                      backgroundColor: draggedIndex !== null ? 'rgba(59, 130, 246, 0.3)' : 'transparent',
                      borderRadius: '6px'
                    }}
                  >
                    <div className="w-1 h-8 bg-blue-400 rounded-full opacity-60"></div>
                  </div>
                  
                  <span 
                    className="text-lg font-medium text-gray-800 px-2 py-1 cursor-move hover:bg-gray-100 rounded border border-gray-200 bg-blue-50 select-none"
                    onClick={() => handleSelectedWordClick(index)}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragEnd={handleDragEnd}
                    onTouchStart={(e) => handleTouchStart(e, index)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    style={{
                      opacity: draggedIndex === index ? 0.5 : 1
                    }}
                  >
                    {word}
                  </span>
                  
                  {/* 뒤쪽 드롭 영역 (마지막 단어인 경우) */}
                  {index === selectedWords.length - 1 && (
                    <div
                      className="w-8 h-10 flex items-center justify-center opacity-0 hover:opacity-30 transition-opacity"
                      data-drop-index={index + 1}
                      onDragOver={handleDragOver}
                      onDrop={(e) => { e.stopPropagation(); handleDrop(e, index + 1); }}
                      style={{ 
                        backgroundColor: draggedIndex !== null ? 'rgba(59, 130, 246, 0.3)' : 'transparent',
                        borderRadius: '6px'
                      }}
                    >
                      <div className="w-1 h-8 bg-blue-400 rounded-full opacity-60"></div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              // Duolingo 스타일 밑줄 표시
              <div className="flex flex-wrap gap-2 justify-center w-full">
                {parseEnglishSentence(currentSentence.englishSentence).map((word, index) => (
                  <div 
                    key={index} 
                    className="border-b-2 border-gray-400 h-6 flex items-end"
                    style={{ width: `${Math.max(word.length * 10, 30)}px` }}
                  >
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Word Selection Buttons */}
        <div className="flex flex-wrap gap-1 justify-center mb-3">
          {allWords.map((word, index) => {
            const isSelected = selectedIndices.includes(index);
            return (
              <Button
                key={index}
                variant={isSelected ? "ghost" : "outline"}
                onClick={() => isSelected ? handleSelectedWordRemove(word, index) : handleWordClick(word, index)}
                className={`text-sm px-3 py-2 min-h-[40px] ${
                  isSelected 
                    ? "bg-gray-100 text-transparent border-gray-200 cursor-pointer" 
                    : "bg-white border-gray-300 hover:bg-gray-50"
                }`}
              >
                {word}
              </Button>
            );
          })}
        </div>

        {/* Result Display - 슬라이드 애니메이션 */}
        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${
          showResult ? 'max-h-32 opacity-100 mb-4' : 'max-h-0 opacity-0'
        }`}>
          {showResult && (
            <div className={`p-3 rounded-lg text-center transform transition-transform duration-300 ${
              isCorrect 
                ? 'bg-green-50 border border-green-200 translate-y-0' 
                : 'bg-red-50 border border-red-200 translate-y-0'
            }`}>
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => speakText(currentSentence.englishSentence)}
                  className="h-8 w-8"
                >
                  <Volume2 className="w-4 h-4" />
                </Button>
                <div>
                  {!isCorrect && (
                    <p className="text-sm font-medium text-gray-800 mb-1">{currentSentence.englishSentence}</p>
                  )}
                  {isCorrect && (
                    <p className="text-sm font-medium text-green-700">정답입니다!</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* 버튼을 화면에 보이도록 여백 제거 */}
      </div>

      {/* Bottom Button - 아이폰 최적화 */}
      <div 
        className="flex-shrink-0 bg-background border-t border-gray-200 flex items-center justify-center"
        style={{ 
          paddingLeft: '16px', 
          paddingRight: '16px', 
          paddingTop: '2px',
          paddingBottom: 'max(2px, env(safe-area-inset-bottom))',
          minHeight: '40px'
        }}
      >
        {!showResult ? (
          <Button 
            onClick={handleCheck} 
            disabled={selectedWords.length === 0}
            className={`w-full max-w-xs mx-auto py-3 text-base font-bold transition-all ${
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
            className="w-full max-w-xs mx-auto py-3 text-base font-bold bg-green-500 hover:bg-green-600 text-white"
          >
            {levelCompleted ? '완료' : '계속'}
          </Button>
        )}
      </div>
    </div>
  );
}