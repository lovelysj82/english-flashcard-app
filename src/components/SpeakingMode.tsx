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
  const [micPermissionGranted, setMicPermissionGranted] = useState<boolean | null>(null);
  const [permissionChecked, setPermissionChecked] = useState(false);

  useEffect(() => {
    const initializeSpeechRecognition = async () => {
      // 갤럭시 카카오톡 마이크 권한 확인 (한 번만)
      if (!permissionChecked) {
        try {
          console.log('🎤 [갤럭시 카톡] 마이크 권한 확인 중...');
          
          // 브라우저 환경 감지
          const userAgent = navigator.userAgent.toLowerCase();
          const isKakaoInApp = userAgent.includes('kakaotalk');
          const isAndroid = userAgent.includes('android');
          
          if (isKakaoInApp && isAndroid) {
            console.log('🤖 [갤럭시 카톡] 인앱 브라우저 감지 - 권한 캐싱');
            
            // localStorage에서 권한 상태 확인
            const cachedPermission = localStorage.getItem('kakao_mic_permission');
            if (cachedPermission === 'granted') {
              console.log('✅ [갤럭시 카톡] 캐시된 권한 사용');
              setMicPermissionGranted(true);
              setPermissionChecked(true);
              return;
            }
            
            // 권한 상태 직접 확인 (한 번만)
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              stream.getTracks().forEach(track => track.stop());
              setMicPermissionGranted(true);
              localStorage.setItem('kakao_mic_permission', 'granted');
              console.log('✅ [갤럭시 카톡] 마이크 권한 확인 및 캐싱 완료');
            } catch (permError) {
              setMicPermissionGranted(false);
              localStorage.setItem('kakao_mic_permission', 'denied');
              console.error('🚫 [갤럭시 카톡] 마이크 권한 거부:', permError);
            }
          } else {
            // 일반 브라우저 권한 확인
            if (navigator.permissions) {
              const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
              console.log(`🎤 [일반] 마이크 권한 상태: ${permission.state}`);
              setMicPermissionGranted(permission.state === 'granted');
              
              // 권한 상태 변경 감지
              permission.onchange = () => {
                console.log(`🎤 [일반] 마이크 권한 변경: ${permission.state}`);
                setMicPermissionGranted(permission.state === 'granted');
              };
            } else {
              setMicPermissionGranted(null); // 권한 상태를 알 수 없음
            }
          }
          
          setPermissionChecked(true);
        } catch (error) {
          console.error('❌ [권한 확인] 오류:', error);
          setMicPermissionGranted(null);
          setPermissionChecked(true);
        }
      }

      // Speech Recognition 초기화
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
        
        // 갤럭시 최적화 설정
        recognitionInstance.continuous = true;
        recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event) => {
          let finalTranscript = '';
          let interimTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }
          
          const resultText = finalTranscript || interimTranscript;
          
          if (resultText.trim()) {
            setSpokenText(resultText.trim());
            console.log(`🎤 [갤럭시] 음성 인식: "${resultText.trim()}" (최종: ${!!finalTranscript})`);
          }
      };

      recognitionInstance.onerror = (event) => {
          console.error(`🚫 [갤럭시] 음성 인식 오류: ${event.error}`);
          
          if (event.error === 'not-allowed') {
            setMicPermissionGranted(false);
            console.error('🚫 [갤럭시] 마이크 권한이 거부되었습니다.');
            console.error('📱 [갤럭시] 해결: 브라우저 설정 → 사이트 권한 → 마이크 허용');
          }
          
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
          console.log('🔚 [갤럭시] 음성 인식 종료');
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    } else {
        console.error('❌ [갤럭시] Speech Recognition API 지원되지 않음');
      }
    };

    initializeSpeechRecognition();
  }, []);

  // 권한 설정 페이지 자동 열기 함수
  const openPermissionSettings = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isKakaoInApp = userAgent.includes('kakaotalk');
    
    console.log('🔧 [권한 설정] 플랫폼별 설정 페이지 열기 시도');
    
    if (isIOS) {
      // iOS: 설정 앱으로 이동
      if (isKakaoInApp) {
        // 카카오톡에서는 외부 브라우저로 안내
        const message = `🎤 마이크 권한이 필요합니다!

📱 카카오톡에서는 음성 인식이 제한됩니다.

✅ 해결 방법:
1. Safari 브라우저로 열어주세요
2. 설정 → Safari → 마이크 허용

또는

⚙️ 설정 앱 → Safari → 마이크 허용

설정 후 다시 시도해주세요!`;
        alert(message);
      } else {
        // 일반 브라우저에서는 설정 앱으로 직접 이동 시도
        try {
          // iOS 설정 앱으로 이동 (Universal Links 사용)
          window.location.href = 'App-Prefs:root=Privacy&path=MICROPHONE';
        } catch (error) {
          // 실패시 수동 안내
          const message = `🎤 마이크 권한이 필요합니다!

⚙️ 설정 방법:
설정 앱 → 개인정보 보호 및 보안 → 마이크 → 술술영어 허용

✅ 권한 허용 후 다시 시도해주세요!`;
          alert(message);
        }
      }
    } else if (isAndroid) {
      // Android: 브라우저 설정 또는 앱 설정으로 이동
      if (isKakaoInApp) {
        // 카카오톡에서는 외부 브라우저로 안내
        const message = `🎤 마이크 권한이 필요합니다!

📱 카카오톡에서는 음성 인식이 제한됩니다.

✅ 해결 방법:
1. 삼성 인터넷 또는 Chrome으로 열어주세요
2. 브라우저 설정 → 사이트 권한 → 마이크 허용

설정 후 다시 시도해주세요!`;
        alert(message);
      } else {
        // 일반 브라우저에서는 브라우저 설정으로 이동 시도
        try {
          // Chrome 설정 페이지로 이동
          window.open('chrome://settings/content/microphone', '_blank');
        } catch (error) {
          // 실패시 수동 안내
          const message = `🎤 마이크 권한이 필요합니다!

⚙️ 설정 방법:
브라우저 설정 → 사이트 권한 → 마이크 허용

✅ 권한 허용 후 다시 시도해주세요!`;
          alert(message);
        }
      }
    } else {
      // 기타 브라우저
      const message = `🎤 마이크 권한이 필요합니다!

⚙️ 설정 방법:
브라우저 설정 → 사이트 권한 → 마이크 허용

✅ 권한 허용 후 다시 시도해주세요!`;
      alert(message);
    }
  };

  const startListening = async () => {
    // 권한이 거부된 경우
    if (micPermissionGranted === false) {
      console.error('🚫 [권한] 마이크 권한이 거부됨 - 음성 인식 불가');
      
      // 먼저 권한 재요청 시도
      try {
        console.log('🔧 [권한] 마이크 권한 재요청 시도');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        
        // 권한 재요청 성공
        console.log('✅ [권한] 마이크 권한 재요청 성공');
        setMicPermissionGranted(true);
        
        // 권한이 허용되었으므로 음성 인식 시작
        if (recognition) {
          setSpokenText("");
          setShowResult(false);
          setIsEditing(false);
          setIsListening(true);
          
          try {
            console.log('🎤 [권한] 음성 인식 시작');
            recognition.start();
          } catch (error) {
            console.error('❌ [권한] 음성 인식 시작 오류:', error);
            setIsListening(false);
          }
        }
        return;
      } catch (permError) {
        console.log('🚫 [권한] 마이크 권한 재요청 실패:', permError);
        
        // 권한 설정 페이지 자동 열기
        openPermissionSettings();
        return;
      }
    }

    // 권한이 null인 경우 (아직 확인하지 않은 경우)
    if (micPermissionGranted === null) {
      console.log('🔍 [권한] 마이크 권한 상태 확인 중...');
      
      try {
        // 권한 상태 확인
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        
        // 권한 허용됨
        console.log('✅ [권한] 마이크 권한 확인됨 - 허용');
        setMicPermissionGranted(true);
        
        // 음성 인식 시작
        if (recognition) {
          setSpokenText("");
          setShowResult(false);
          setIsEditing(false);
          setIsListening(true);
          
          try {
            console.log('🎤 [권한] 음성 인식 시작');
            recognition.start();
          } catch (error) {
            console.error('❌ [권한] 음성 인식 시작 오류:', error);
            setIsListening(false);
          }
        }
        return;
      } catch (permError) {
        console.log('🚫 [권한] 마이크 권한 확인 실패:', permError);
        setMicPermissionGranted(false);
        
        // 권한 설정 페이지 자동 열기
        openPermissionSettings();
        return;
      }
    }
    
    // 권한이 허용된 경우 정상 시작
    if (recognition && micPermissionGranted === true) {
      setSpokenText("");
      setShowResult(false);
      setIsEditing(false);
      setIsListening(true);
      
      try {
        console.log('🎤 [권한] 음성 인식 시작');
        recognition.start();
      } catch (error) {
        console.error('❌ [권한] 음성 인식 시작 오류:', error);
        setIsListening(false);
      }
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
    
    console.log(`🔄 handleNext 호출 - wrongAnswers 개수: ${wrongAnswers.size}, 틀린 문제들:`, Array.from(wrongAnswers));
    console.log(`📋 현재 모드: ${isReviewMode ? '복습' : '첫 패스'}, 현재 인덱스: ${currentSentenceIndex}, 총 문장 수: ${currentSentenceList.length}`);
    
    // 조건 분기 순서를 명확하게 정리
    
    // 1. 복습 모드에서 모든 문제를 맞춘 경우 (레벨 완료)
    if (isReviewMode && wrongAnswers.size === 0) {
      console.log(`✅ 조건 1 실행: 복습 모드에서 모든 문제 완료 → 레벨 완료`);
      setLevelCompleted(true);
      saveProgress();
      return; // 더 이상 진행하지 않음
    }
    
    // 2. 첫 패스에서 모든 문제를 맞춘 경우 (레벨 완료)
    if (!isReviewMode && wrongAnswers.size === 0 && currentSentenceIndex + 1 >= levelSentences.length) {
      console.log(`✅ 조건 2 실행: 첫 패스에서 모든 문제 완료 → 레벨 완료`);
      setLevelCompleted(true);
      saveProgress();
      return; // 더 이상 진행하지 않음
    }
    
    // 3. 첫 패스 완료 후 틀린 문제가 있으면 복습 모드 시작
    if (!isReviewMode && currentSentenceIndex + 1 >= levelSentences.length && wrongAnswers.size > 0) {
      console.log(`🔄 조건 3 실행: 첫 패스 완료 → 복습 모드 시작 (틀린 문제 ${wrongAnswers.size}개)`);
      setIsReviewMode(true);
      setCurrentSentenceIndex(0);
      setSpokenText("");
      setShowResult(false);
      setIsEditing(false);
      return;
    }
    
    // 4. 복습 모드에서 마지막 문제까지 완료했지만 아직 틀린 문제가 있는 경우
    if (isReviewMode && currentSentenceIndex + 1 >= reviewSentences.length && wrongAnswers.size > 0) {
      console.log(`🔄 조건 4 실행: 복습 모드 재시작 (아직 틀린 문제 ${wrongAnswers.size}개)`);
      setCurrentSentenceIndex(0);
      setSpokenText("");
      setShowResult(false);
      setIsEditing(false);
      return;
    }
    
    // 5. 일반적인 다음 문제로 이동
    if (currentSentenceIndex + 1 < currentSentenceList.length) {
      console.log(`➡️ 조건 5 실행: 다음 문제로 이동 (${currentSentenceIndex + 1}/${currentSentenceList.length})`);
      setCurrentSentenceIndex(currentSentenceIndex + 1);
      setSpokenText("");
      setShowResult(false);
      setIsEditing(false);
      return;
    }
    
    // 6. 예상치 못한 경우 (디버깅용)
    console.error(`❌ 예상치 못한 handleNext 상황:`);
    console.error(`- isReviewMode: ${isReviewMode}`);
    console.error(`- wrongAnswers.size: ${wrongAnswers.size}`);
    console.error(`- currentSentenceIndex: ${currentSentenceIndex}`);
    console.error(`- currentSentenceList.length: ${currentSentenceList.length}`);
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
      console.log('🍎 [iOS] Safari/Chrome 감지 - 더 강력한 오디오 활성화');
      
      // iOS Safari/Chrome에서 오디오 활성화를 위한 강화된 처리
      try {
        // 1. Web Audio API 강제 활성화 (iOS 필수)
        if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
          const AudioContextClass = AudioContext || webkitAudioContext;
          const audioContext = new AudioContextClass();
          
          if (audioContext.state === 'suspended') {
            console.log('🍎 [iOS] 오디오 컨텍스트 강제 활성화');
            await audioContext.resume();
            console.log(`✅ [iOS] 오디오 컨텍스트 상태: ${audioContext.state}`);
          }
          
          audioContext.close();
        }
        
        // 2. 더미 오디오 재생으로 iOS 오디오 시스템 깨우기
        const dummyAudio = new Audio();
        dummyAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAACAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==';
        dummyAudio.volume = 0.01;
        
        try {
          await dummyAudio.play();
          console.log('✅ [iOS] 더미 오디오 재생 성공');
        } catch (audioError) {
          console.log('🍎 [iOS] 더미 오디오 재생 실패 (예상됨)');
        }
        
        // 3. Speech Synthesis 강제 초기화
        if ('speechSynthesis' in window) {
          speechSynthesis.cancel();
          
          // iOS에서 음성 엔진 강제 로딩
          const voices = speechSynthesis.getVoices();
          if (voices.length === 0) {
            console.log('🍎 [iOS] 음성 엔진 강제 로딩...');
            
            // 더미 utterance로 음성 엔진 활성화
            const dummyUtterance = new SpeechSynthesisUtterance(' ');
            dummyUtterance.volume = 0.01;
            dummyUtterance.rate = 10; // 빠르게 처리
            speechSynthesis.speak(dummyUtterance);
            
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
              setTimeout(() => resolve([]), 2000); // 2초 타임아웃
            });
          }
          
          console.log('✅ [iOS] Speech Synthesis 강화 활성화 완료');
        }
      } catch (iosError) {
        console.warn('⚠️ [iOS] 강화 오디오 시스템 준비 실패:', iosError);
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
    <div className="min-h-screen bg-background flex flex-col p-2">
      {/* Header - SentenceCompletionMode와 동일한 스타일 */}
      <div className="flex items-center justify-between p-1 border-b flex-shrink-0">
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
      <div className="flex-1 max-w-sm mx-auto w-full">
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
                {isEditing ? (
                  <div className="flex-1 mx-2">
                    <Input
                      value={editedText}
                      onChange={(e) => setEditedText(e.target.value)}
                      className="text-center text-lg font-medium border-blue-300 focus:border-blue-500"
                      placeholder="텍스트를 수정하세요"
                      autoFocus
                      onBlur={handleEditSave}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleEditSave();
                        } else if (e.key === 'Escape') {
                          handleEditCancel();
                        }
                      }}
                    />
                  </div>
                ) : (
                  <span 
                    className="text-lg font-medium text-blue-700 cursor-text px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                    onClick={() => {
                      setEditedText(spokenText);
                      setIsEditing(true);
                    }}
                    title="클릭하여 텍스트 수정"
                  >
                    {spokenText}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap justify-center items-end gap-1">
                {generateWordUnderlines(currentSentence.englishSentence)}
            </div>
            )}
            </div>
            </div>

        {/* Voice Recognition Button */}
        <div className="text-center mb-6">
          <div className="flex flex-col items-center gap-2">
              <Button
                onClick={isListening ? stopListening : startListening}
              className={`w-20 h-20 rounded-full ${
                isListening 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-blue-500 hover:bg-blue-600'
              } text-white transition-all duration-200`}
              disabled={showResult}
              >
                {isListening ? (
                  <MicOff className="w-8 h-8" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </Button>
                            <p className="text-sm text-gray-600">
                  {isListening ? '마이크를 다시 눌러서 종료' : ''}
                </p>
                </div>
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
        
        {/* 확인/계속 버튼 - 컨텐츠 바로 아래 자연스럽게 배치 */}
        <div className="text-center mt-6 mb-8">
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