// ================================================
// js/components/survey/SurveyScoreCalculator.js
export class SurveyScoreCalculator {
    calculate(scaleType, responses) {
      const total = responses.reduce((sum, val) => sum + val, 0);
      const average = total / responses.length;
      const maxPossible = responses.length * 4;
      const percentage = (total / maxPossible) * 100;
      
      // 척도별 특수 계산
      const analysis = this.getScaleSpecificAnalysis(scaleType, responses);
      
      return {
        total,
        average: Math.round(average * 100) / 100,
        percentage: Math.round(percentage),
        maxPossible,
        analysis
      };
    }
  
    getScaleSpecificAnalysis(scaleType, responses) {
      switch (scaleType) {
        case 'scale1': // 우울 척도
          return this.analyzeDepression(responses);
        case 'scale2': // 불안 척도
          return this.analyzeAnxiety(responses);
        case 'scale3': // 스트레스 척도
          return this.analyzeStress(responses);
        case 'scale4': // 삶의 질
          return this.analyzeQualityOfLife(responses);
        default:
          return this.basicAnalysis(responses);
      }
    }
  
    analyzeDepression(responses) {
      // 하위 요인 분석 (예시)
      const factors = {
        emotional: this.calculateSubScore(responses, [0, 1, 2, 3, 4]),
        cognitive: this.calculateSubScore(responses, [5, 6, 7, 8, 9]),
        physical: this.calculateSubScore(responses, [10, 11, 12, 13, 14]),
        social: this.calculateSubScore(responses, [15, 16, 17, 18, 19])
      };
      
      return {
        factors,
        primaryConcern: this.getHighestFactor(factors),
        riskLevel: this.assessRiskLevel(responses)
      };
    }
  
    analyzeAnxiety(responses) {
      // 불안 척도 특화 분석
      return {
        somaticSymptoms: this.calculateSubScore(responses, [0, 2, 4, 6, 8]),
        cognitiveSymptoms: this.calculateSubScore(responses, [1, 3, 5, 7, 9]),
        behavioralSymptoms: this.calculateSubScore(responses, [10, 11, 12, 13, 14])
      };
    }
  
    analyzeStress(responses) {
      // 스트레스 척도 분석
      return {
        intensity: this.calculateIntensity(responses),
        frequency: this.calculateFrequency(responses),
        copingDeficit: this.assessCopingDeficit(responses)
      };
    }
  
    analyzeQualityOfLife(responses) {
      // 삶의 질 분석 (역채점 항목 고려)
      const reversedItems = [3, 7, 11, 15, 19]; // 예시
      const adjustedResponses = responses.map((val, idx) => 
        reversedItems.includes(idx) ? 4 - val : val
      );
      
      return {
        overall: this.calculateSubScore(adjustedResponses, [...Array(25).keys()]),
        domains: {
          physical: this.calculateSubScore(adjustedResponses, [0, 1, 2, 3, 4]),
          psychological: this.calculateSubScore(adjustedResponses, [5, 6, 7, 8, 9]),
          social: this.calculateSubScore(adjustedResponses, [10, 11, 12, 13, 14]),
          environmental: this.calculateSubScore(adjustedResponses, [15, 16, 17, 18, 19]),
          spiritual: this.calculateSubScore(adjustedResponses, [20, 21, 22, 23, 24])
        }
      };
    }
  
    basicAnalysis(responses) {
      return {
        highestItems: this.getHighestScoringItems(responses),
        lowestItems: this.getLowestScoringItems(responses),
        consistency: this.checkResponseConsistency(responses)
      };
    }
  
    calculateSubScore(responses, indices) {
      const subResponses = indices
        .filter(i => i < responses.length)
        .map(i => responses[i]);
      
      const sum = subResponses.reduce((acc, val) => acc + val, 0);
      return Math.round((sum / (subResponses.length * 4)) * 100);
    }
  
    getHighestFactor(factors) {
      return Object.entries(factors)
        .sort(([, a], [, b]) => b - a)[0][0];
    }
  
    assessRiskLevel(responses) {
      const criticalItems = [2, 8, 14]; // 자살사고 등 위험 문항
      const criticalScore = criticalItems
        .map(i => responses[i] || 0)
        .reduce((sum, val) => sum + val, 0);
      
      if (criticalScore >= 9) return 'high';
      if (criticalScore >= 6) return 'moderate';
      return 'low';
    }
  
    getHighestScoringItems(responses) {
      return responses
        .map((score, index) => ({ index, score }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(item => item.index);
    }
  
    getLowestScoringItems(responses) {
      return responses
        .map((score, index) => ({ index, score }))
        .sort((a, b) => a.score - b.score)
        .slice(0, 5)
        .map(item => item.index);
    }
  
    checkResponseConsistency(responses) {
      // 응답 패턴 일관성 검사
      const variance = this.calculateVariance(responses);
      if (variance < 0.5) return 'low'; // 너무 일관된 응답
      if (variance > 2.5) return 'high'; // 매우 다양한 응답
      return 'normal';
    }
  
    calculateVariance(responses) {
      const mean = responses.reduce((sum, val) => sum + val, 0) / responses.length;
      const squaredDiffs = responses.map(val => Math.pow(val - mean, 2));
      return squaredDiffs.reduce((sum, val) => sum + val, 0) / responses.length;
    }
  
    calculateIntensity(responses) {
      const highScores = responses.filter(r => r >= 3).length;
      return Math.round((highScores / responses.length) * 100);
    }
  
    calculateFrequency(responses) {
      const frequencyItems = [0, 2, 4, 6, 8]; // 빈도 관련 문항
      return this.calculateSubScore(responses, frequencyItems);
    }
  
    assessCopingDeficit(responses) {
      const copingItems = [1, 3, 5, 7, 9]; // 대처 관련 문항
      const copingScore = this.calculateSubScore(responses, copingItems);
      return copingScore < 30 ? 'significant' : copingScore < 50 ? 'moderate' : 'adequate';
    }
  }
  