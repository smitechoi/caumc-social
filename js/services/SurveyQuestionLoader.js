export class SurveyQuestionLoader {
  constructor() {
    this.cache = new Map();
    this.basePath = './data/surveys'; // 상대 경로로 수정
  }

  /**
   * 특정 척도의 질문 로드
   * @param {string} scaleId - 척도 ID (예: 'depression', 'anxiety')
   * @param {string} language - 언어 코드 (예: 'ko', 'en')
   * @returns {Promise<Object>} 질문 데이터
   */
  async loadQuestions(scaleId, language = 'ko') {
    const cacheKey = `${language}_${scaleId}`;
    
    // 캐시 확인
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await fetch(`${this.basePath}/${language}/${scaleId}.json`);
      
      if (!response.ok) {
        // 언어별 파일이 없으면 기본 언어(한국어)로 폴백
        if (language !== 'ko') {
          console.warn(`No ${language} translation for ${scaleId}, falling back to Korean`);
          return this.loadQuestions(scaleId, 'ko');
        }
        throw new Error(`Failed to load questions for ${scaleId}`);
      }

      const data = await response.json();
      
      // 데이터 검증
      this.validateQuestionData(data);
      
      // 캐시에 저장
      this.cache.set(cacheKey, data);
      
      return data;
    } catch (error) {
      console.error(`Error loading questions for ${scaleId}:`, error);
      
      // 개발 중 임시 데이터 반환
      return this.getDefaultQuestions(scaleId, language);
    }
  }

  /**
   * 질문 데이터 유효성 검증
   */
  validateQuestionData(data) {
    if (!data.scale || !data.questions || !Array.isArray(data.questions)) {
      throw new Error('Invalid question data format');
    }

    if (data.questions.length === 0) {
      throw new Error('No questions found');
    }

    // 각 질문 검증
    data.questions.forEach((q, index) => {
      if (!q.id || !q.text) {
        throw new Error(`Invalid question at index ${index}`);
      }
    });
  }

  /**
   * 모든 척도의 메타데이터 로드
   */
  async loadAllScalesMetadata(language = 'ko') {
    try {
      const response = await fetch(`${this.basePath}/${language}/scales-metadata.json`);
      if (!response.ok) {
        throw new Error('Failed to load scales metadata');
      }
      return await response.json();
    } catch (error) {
      console.error('Error loading scales metadata:', error);
      return this.getDefaultScalesMetadata();
    }
  }

  /**
   * 개발용 기본 질문 데이터
   */
  getDefaultQuestions(scaleId, language) {
    const defaults = {
      depression: {
        scale: {
          id: 'depression',
          name: language === 'ko' ? '우울 척도' : 'Depression Scale',
          questions: 9
        },
        questions: Array(9).fill(0).map((_, i) => ({
          id: `dep_${i + 1}`,
          text: language === 'ko' 
            ? `우울 관련 질문 ${i + 1}` 
            : `Depression question ${i + 1}`,
          required: true
        })),
        response_options: this.getDefaultResponseOptions(language)
      },
      anxiety: {
        scale: {
          id: 'anxiety',
          name: language === 'ko' ? '불안 척도' : 'Anxiety Scale',
          questions: 7
        },
        questions: Array(7).fill(0).map((_, i) => ({
          id: `anx_${i + 1}`,
          text: language === 'ko' 
            ? `불안 관련 질문 ${i + 1}` 
            : `Anxiety question ${i + 1}`,
          required: true
        })),
        response_options: this.getDefaultResponseOptions(language)
      },
      stress: {
        scale: {
          id: 'stress',
          name: language === 'ko' ? '스트레스 척도' : 'Stress Scale',
          questions: 10
        },
        questions: Array(10).fill(0).map((_, i) => ({
          id: `str_${i + 1}`,
          text: language === 'ko' 
            ? `스트레스 관련 질문 ${i + 1}` 
            : `Stress question ${i + 1}`,
          required: true
        })),
        response_options: this.getDefaultResponseOptions(language)
      },
      qualityOfLife: {
        scale: {
          id: 'qualityOfLife',
          name: language === 'ko' ? '삶의 질' : 'Quality of Life',
          questions: 26
        },
        questions: Array(26).fill(0).map((_, i) => ({
          id: `qol_${i + 1}`,
          text: language === 'ko' 
            ? `삶의 질 관련 질문 ${i + 1}` 
            : `Quality of life question ${i + 1}`,
          required: true
        })),
        response_options: this.getDefaultResponseOptions(language)
      }
    };

    return defaults[scaleId] || defaults.depression;
  }

  getDefaultResponseOptions(language) {
    if (language === 'ko') {
      return [
        { value: 0, label: "전혀 아니다" },
        { value: 1, label: "아니다" },
        { value: 2, label: "보통이다" },
        { value: 3, label: "그렇다" },
        { value: 4, label: "매우 그렇다" }
      ];
    } else {
      return [
        { value: 0, label: "Not at all" },
        { value: 1, label: "Rarely" },
        { value: 2, label: "Sometimes" },
        { value: 3, label: "Often" },
        { value: 4, label: "Very often" }
      ];
    }
  }

  getDefaultScalesMetadata() {
    return {
      scales: [
        { id: 'depression', order: 1, enabled: true },
        { id: 'anxiety', order: 2, enabled: true },
        { id: 'stress', order: 3, enabled: true },
        { id: 'qualityOfLife', order: 4, enabled: true }
      ]
    };
  }

  /**
   * 캐시 초기화
   */
  clearCache() {
    this.cache.clear();
  }
}

// 싱글톤 인스턴스
export const surveyQuestionLoader = new SurveyQuestionLoader();
