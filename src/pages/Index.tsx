import { useState, useEffect } from "react";
import { LearningModeSelector, LearningMode } from "@/components/LearningModeSelector";
import { LevelSelector } from "@/components/LevelSelector";
import { SentenceCompletionMode } from "@/components/SentenceCompletionMode";
import { SpeakingMode } from "@/components/SpeakingMode";
import { dataService } from "@/services/dataService";
import { Sentence } from "@/data/sampleSentences";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// URL 파라미터에서 상태 추출
const getStateFromURL = () => {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode') as LearningMode | null;
  const level = params.get('level') ? parseInt(params.get('level')!) : null;
  
  console.log('🔗 URL에서 상태 복원:', { mode, level });
  return { mode, level };
};

// 상태를 URL에 반영
const updateURL = (mode: LearningMode | null, level: number | null) => {
  const params = new URLSearchParams();
  if (mode) params.set('mode', mode);
  if (level) params.set('level', level.toString());
  
  const newURL = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
  window.history.replaceState({ mode, level }, '', newURL);
  console.log('🔗 URL 업데이트:', newURL);
};

const Index = () => {
  // URL에서 초기 상태 복원
  const { mode: initialMode, level: initialLevel } = getStateFromURL();
  const [selectedMode, setSelectedMode] = useState<LearningMode | null>(initialMode);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(initialLevel);
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  // 브라우저 뒤로가기 버튼 처리를 위한 History API
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      console.log('🔙 브라우저 뒤로가기 감지:', event.state);
      
      if (event.state) {
        // History state가 있으면 해당 상태로 복원
        setSelectedMode(event.state.mode || null);
        setSelectedLevel(event.state.level || null);
      } else {
        // History state가 없으면 URL에서 상태 복원 시도
        const { mode, level } = getStateFromURL();
        setSelectedMode(mode);
        setSelectedLevel(level);
      }
    };

    // 초기 상태를 history에 추가 (URL에서 복원된 상태 포함)
    if (typeof window !== 'undefined') {
      window.history.replaceState({ mode: selectedMode, level: selectedLevel }, '', window.location.href);
      window.addEventListener('popstate', handlePopState);
      
      console.log('🔗 초기 상태 설정 완료:', { selectedMode, selectedLevel });
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('popstate', handlePopState);
      }
    };
  }, []); // 빈 의존성 배열로 한 번만 실행

  // 데이터 로딩
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setDataError(null);
        console.log('📊 데이터 로딩 시작...');
        
        // 최대 8초 타임아웃
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('로딩 타임아웃: 8초 초과')), 8000)
        );
        
        const data = await Promise.race([
          dataService.getSentences(),
          timeoutPromise
        ]);
        
        setSentences(data);
        
        const status = dataService.getDataStatus();
        console.log('📈 데이터 로딩 완료:', status);
        
        if (status.hasError) {
          setDataError('구글 시트 연결 실패, 로컬 데이터 사용 중');
        }
        
      } catch (error) {
        console.error('❌ 데이터 로딩 실패:', error);
        setDataError('데이터를 불러올 수 없습니다');
        
        // 타임아웃이나 오류 시 폴백 데이터라도 로드
        try {
          const fallbackData = await import('../data/sampleSentences');
          setSentences(fallbackData.sampleSentences);
          setDataError('네트워크 오류, 기본 데이터 사용 중');
        } catch (fallbackError) {
          console.error('폴백 데이터 로딩도 실패:', fallbackError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleModeSelect = (mode: LearningMode) => {
    console.log(`Index: 모드 선택됨 - ${mode}`);
    setSelectedMode(mode);
    setSelectedLevel(null); // 레벨 초기화
    console.log(`Index: selectedMode 상태 업데이트됨 - ${mode}`);
    
    // 🔗 URL과 History 모두 업데이트
    updateURL(mode, null);
    window.history.pushState({ mode, level: null }, '', window.location.href);
    console.log(`📌 History 추가: mode=${mode}, level=null`);
  };

  const handleLevelSelect = (level: number) => {
    console.log(`Index: 레벨 ${level} 선택됨`);
    setSelectedLevel(level);
    
    // 🔗 URL과 History 모두 업데이트
    updateURL(selectedMode, level);
    window.history.pushState({ mode: selectedMode, level }, '', window.location.href);
    console.log(`📌 History 추가: mode=${selectedMode}, level=${level}`);
  };

  const handleBackToModeSelect = () => {
    setSelectedMode(null);
    setSelectedLevel(null);
    
    // 🔗 URL과 History 모두 업데이트 (홈으로)
    updateURL(null, null);
    window.history.pushState({ mode: null, level: null }, '', window.location.href);
    console.log(`📌 History 추가: mode=null, level=null (홈)`);
  };

  const handleBackToLevelSelect = () => {
    console.log('Index: handleBackToLevelSelect 호출 - 레벨 선택 페이지로 이동');
    setSelectedLevel(null);
    
    // 🔗 URL과 History 모두 업데이트 (레벨 선택으로)
    updateURL(selectedMode, null);
    window.history.pushState({ mode: selectedMode, level: null }, '', window.location.href);
    console.log(`📌 History 추가: mode=${selectedMode}, level=null (레벨선택)`);
  };

  console.log(`Index 렌더링: selectedMode=${selectedMode}, selectedLevel=${selectedLevel}, 데이터 수=${sentences.length}`);

  // 로딩 화면
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin" />
            <h2 className="text-xl font-semibold mb-2">데이터 로딩 중...</h2>
            <p className="text-muted-foreground">
              구글 스프레드시트에서 학습 데이터를 가져오고 있습니다.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 데이터 에러 (하지만 폴백 데이터는 있는 경우)
  if (dataError && sentences.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2 text-destructive">데이터 로딩 실패</h2>
            <p className="text-muted-foreground mb-4">{dataError}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
            >
              다시 시도
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 모드 선택 화면
  if (!selectedMode) {
    console.log('Index: LearningModeSelector 렌더링');
    return (
      <div>
        {dataError && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 text-sm">
            ⚠️ {dataError}
          </div>
        )}
        <LearningModeSelector onSelectMode={handleModeSelect} />
      </div>
    );
  }

    // 레벨 선택 화면
  if (selectedMode && !selectedLevel) {
    console.log(`Index: LevelSelector 렌더링 - mode=${selectedMode}`);
    return (
      <LevelSelector
        sentences={sentences}
        selectedMode={selectedMode}
        onSelectLevel={handleLevelSelect}
        onBack={handleBackToModeSelect}
      />
    );
  }

  // 학습 진행 화면
  if (selectedMode === 'sentence-completion' && selectedLevel) {
    console.log(`Index: SentenceCompletionMode 렌더링 - level=${selectedLevel}`);
    return (
      <SentenceCompletionMode
        sentences={sentences}
        selectedLevel={selectedLevel}
        onBack={handleBackToLevelSelect}
      />
    );
  }

  if (selectedMode === 'speaking' && selectedLevel) {
    console.log(`Index: SpeakingMode 렌더링 - level=${selectedLevel}`);
    return (
      <SpeakingMode
        sentences={sentences}
        selectedLevel={selectedLevel}
        onBack={handleBackToLevelSelect}
      />
    );
  }

  console.log('Index: 아무것도 렌더링하지 않음 (null 반환)');
  return null;
};

export default Index;
