import { translationService } from '../../services/TranslationService.js';

export class SurveyValidator {
  validateResponses(responses, totalQuestions) {
    const t = (key, params) => translationService.t(key, params);
    
    // 응답 개수 확인
    if (!responses || responses.length < totalQuestions) {
      return {
        isValid: false,
        message: t('allQuestionsAnswered')
      };
    }
    
    // 각 질문 응답 확인
    for (let i = 0; i < totalQuestions; i++) {
      if (responses[i] === undefined || responses[i] === null) {
        return {
          isValid: false,
          message: t('questionNumber', { number: i + 1 }),
          questionIndex: i
        };
      }
      
      // 유효한 범위 확인 (0-5, 척도에 따라 다를 수 있음)
      if (responses[i] < 0 || responses[i] > 5) {
        return {
          isValid: false,
          message: t('invalidResponse', { number: i + 1 }),
          questionIndex: i
        };
      }
    }
    
    return { isValid: true };
  }

  validateScaleCompletion(scaleData) {
    const t = (key) => translationService.t(key);
    
    if (!scaleData.isDone) {
      return { 
        isComplete: false, 
        message: t('scaleNotCompleted') 
      };
    }
    
    if (!scaleData.questions || scaleData.questions.length === 0) {
      return { 
        isComplete: false, 
        message: t('noResponseData') 
      };
    }
    
    return { isComplete: true };
  }

  validateConsistency(responses, scaleType) {
    // 일관성 검사 (필요시 구현)
    // 예: 특정 문항 간의 상관관계 확인
    return { isConsistent: true };
  }

  validateResponseTime(startTime, endTime, minTime = 300000) {
    // 최소 응답 시간 검증 (기본 5분)
    const responseTime = endTime - startTime;
    
    if (responseTime < minTime) {
      return {
        isValid: false,
        message: translationService.t('tooQuickResponse')
      };
    }
    
    return { isValid: true };
  }
}