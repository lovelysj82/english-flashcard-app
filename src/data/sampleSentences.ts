// Sample data for testing - will be replaced with Google Sheets integration
export interface Sentence {
  id: string;
  level: number;
  category: string;
  koreanSentence: string;
  englishSentence: string;
  notes: string;
}

export const sampleSentences: Sentence[] = [
  // Level 1 - Basic Expressions
  {
    id: "1-1",
    level: 1,
    category: "기본 인사",
    koreanSentence: "안녕하세요.",
    englishSentence: "Hello.",
    notes: "Simple greeting"
  },
  {
    id: "1-2",
    level: 1,
    category: "기본 인사",
    koreanSentence: "제 이름은 김철수입니다.",
    englishSentence: "My name is Kim Chulsoo.",
    notes: "Self introduction"
  },
  {
    id: "1-3",
    level: 1,
    category: "기본 상태 표현",
    koreanSentence: "저는 학생입니다.",
    englishSentence: "I am a student.",
    notes: "Simple present - be verb"
  },
  {
    id: "1-4",
    level: 1,
    category: "기본 상태 표현",
    koreanSentence: "오늘 날씨가 좋습니다.",
    englishSentence: "The weather is nice today.",
    notes: "Simple present"
  },
  {
    id: "1-5",
    level: 1,
    category: "기본 질문",
    koreanSentence: "이것은 무엇입니까?",
    englishSentence: "What is this?",
    notes: "Wh-question"
  },
  {
    id: "1-6",
    level: 1,
    category: "축약형 표현",
    koreanSentence: "그것은 내 책이야.",
    englishSentence: "That's my book.",
    notes: "Contraction with apostrophe"
  },
  {
    id: "1-7",
    level: 1,
    category: "축약형 표현",
    koreanSentence: "나는 할 수 없어.",
    englishSentence: "I can't do it.",
    notes: "Negative contraction"
  },

  // Level 2 - Daily Activities
  {
    id: "2-1",
    level: 2,
    category: "일상 활동",
    koreanSentence: "저는 매일 아침 7시에 일어납니다.",
    englishSentence: "I wake up at 7 AM every morning.",
    notes: "Simple present - daily routine"
  },
  {
    id: "2-2",
    level: 2,
    category: "일상 활동",
    koreanSentence: "어제 영화를 봤습니다.",
    englishSentence: "I watched a movie yesterday.",
    notes: "Simple past tense"
  },
  {
    id: "2-3",
    level: 2,
    category: "생활 패턴",
    koreanSentence: "내일 친구를 만날 예정입니다.",
    englishSentence: "I will meet my friend tomorrow.",
    notes: "Future tense"
  },
  {
    id: "2-4",
    level: 2,
    category: "일상 활동",
    koreanSentence: "저는 책을 읽는 것을 좋아합니다.",
    englishSentence: "I like reading books.",
    notes: "Gerund as object"
  },
  {
    id: "2-5",
    level: 2,
    category: "생활 패턴",
    koreanSentence: "그는 지금 공부하고 있습니다.",
    englishSentence: "He is studying now.",
    notes: "Present continuous"
  },

  // Level 3 - Complex Expressions
  {
    id: "3-1",
    level: 3,
    category: "복합 문장",
    koreanSentence: "만약 비가 오면, 집에 있을 것입니다.",
    englishSentence: "If it rains, I will stay at home.",
    notes: "Conditional sentence - First conditional"
  },
  {
    id: "3-2",
    level: 3,
    category: "복합 문장",
    koreanSentence: "저는 그가 올 것이라고 생각합니다.",
    englishSentence: "I think that he will come.",
    notes: "Complex sentence with object clause"
  },
  {
    id: "3-3",
    level: 3,
    category: "과거 경험",
    koreanSentence: "저는 한 번도 해외에 가본 적이 없습니다.",
    englishSentence: "I have never been abroad.",
    notes: "Present perfect with 'never'"
  },
  {
    id: "3-4",
    level: 3,
    category: "의견 표현",
    koreanSentence: "제 생각에는 이 계획이 성공할 것 같습니다.",
    englishSentence: "I think this plan will succeed.",
    notes: "Opinion expression"
  },
  {
    id: "3-5",
    level: 3,
    category: "복합 문장",
    koreanSentence: "비록 어렵지만, 포기하지 않겠습니다.",
    englishSentence: "Although it is difficult, I will not give up.",
    notes: "Concessive clause with 'although'"
  }
];