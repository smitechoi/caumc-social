// ================================================
// js/components/survey/SurveyValidator.js
export class SurveyValidator {
    validateResponses(responses, totalQuestions) {
      // 응답 개수 확인
      if (!responses || responses.length < totalQuestions) {
        return {
          isValid: false,
          message: '모든 질문에 응답해주세요.'
        };
      }
      
      // 각 질문 응답 확인
      for (let i = 0; i < totalQuestions; i++) {
        if (responses[i] === undefined || responses[i] === null) {
          return {
            isValid: false,
            message: `${i + 1}번 질문에 응답해주세요.`,
            questionIndex: i
          };
        }
        
        // 유효한 범위 확인 (0-4)
        if (responses[i] < 0 || responses[i] > 4) {
          return {
            isValid: false,
            message: `${i + 1}번 질문의 응답이 올바르지 않습니다.`,
            questionIndex: i
          };
        }
      }
      
      return { isValid: true };
    }
  
    validateScaleCompletion(scaleData) {
      if (!scaleData.isDone) {
        return { isComplete: false, message: '척도가 완료되지 않았습니다.' };
      }
      
      if (!scaleData.questions || scaleData.questions.length === 0) {
        return { isComplete: false, message: '응답 데이터가 없습니다.' };
      }
      
      return { isComplete: true };
    }
  }
  
  