export class SurveyScoreCalculator {
  constructor() {
    this.scaleDataCache = {}; // JSON 데이터 캐시
  }

  async loadScaleData(scaleType, language = 'ko') {
    if (this.scaleDataCache[scaleType]) {
      return this.scaleDataCache[scaleType];
    }

    const scaleMap = {
      'scale1': 'ces-dc',
      'scale2': 'bai',
      'scale3': 'k-aq',
      'scale4': 'k-ars'
    };
    
    try {
      const scaleName = scaleMap[scaleType];
      const response = await fetch(`./data/surveys/${language}/${scaleName}.json`);
      const data = await response.json();
      this.scaleDataCache[scaleType] = data;
      return data;
    } catch (error) {
      console.error('척도 데이터 로딩 실패:', error);
      return null;
    }
  }

  async calculate(scaleType, responses, language = 'ko') {
    // JSON 데이터 로드
    const scaleData = await this.loadScaleData(scaleType, language);
    
    // 역채점 처리된 응답값 계산
    const adjustedResponses = this.applyReverseScoring(responses, scaleData);
    
    // 총점 계산
    const total = adjustedResponses.reduce((sum, val) => sum + val, 0);
    const average = total / responses.length;
    const maxPossible = this.getMaxPossibleScore(scaleType, responses.length, scaleData);
    const percentage = (total / maxPossible) * 100;
    
    // 척도별 특수 분석
    const analysis = await this.getScaleSpecificAnalysis(scaleType, adjustedResponses, scaleData);
    
    return {
      total,
      average: Math.round(average * 100) / 100,
      percentage: Math.round(percentage),
      maxPossible,
      analysis,
      interpretation: await this.getInterpretation(scaleType, total, scaleData)
    };
  }

  applyReverseScoring(responses, scaleData) {
    if (!scaleData?.scale?.reversedItems) {
      return responses;
    }

    const reversedItems = scaleData.scale.reversedItems;
    
    return responses.map((response, index) => {
      const questionNumber = index + 1; // 문항 번호는 1부터 시작
      
      if (reversedItems.includes(questionNumber)) {
        // 역채점 처리
        // 0-3 척도의 경우: 0→3, 1→2, 2→1, 3→0
        // 1-5 척도의 경우: 1→5, 2→4, 3→3, 4→2, 5→1
        const maxValue = Math.max(...scaleData.response_options.map(opt => opt.value));
        const minValue = Math.min(...scaleData.response_options.map(opt => opt.value));
        return maxValue + minValue - response;
      }
      
      return response;
    });
  }

  getMaxPossibleScore(scaleType, questionCount, scaleData) {
    // JSON에서 최대값 계산
    if (scaleData?.response_options) {
      const maxValue = Math.max(...scaleData.response_options.map(opt => opt.value));
      return questionCount * maxValue;
    }
    
    // 폴백: 기본값
    const defaults = {
      'scale1': 60,  // CES-DC: 20문항 × 3
      'scale2': 63,  // BAI: 21문항 × 3
      'scale3': 135, // K-AQ: 27문항 × 5
      'scale4': 54   // K-ARS: 18문항 × 3
    };
    
    return defaults[scaleType] || questionCount * 4;
  }

  async getInterpretation(scaleType, score, scaleData) {
    // JSON의 scoring.ranges 사용
    if (scaleData?.scale?.scoring?.ranges) {
      const ranges = scaleData.scale.scoring.ranges;
      
      for (const range of ranges) {
        if (score >= range.min && score <= range.max) {
          return {
            level: range.level,
            label: range.label,
            description: range.description
          };
        }
      }
    }
    
    // 폴백: 기본 해석
    return this.getDefaultInterpretation(scaleType, score);
  }

  async getScaleSpecificAnalysis(scaleType, responses, scaleData) {
    switch (scaleType) {
      case 'scale1': // CES-DC
        return this.analyzeCESDC(responses, scaleData);
      case 'scale2': // BAI
        return this.analyzeBAI(responses, scaleData);
      case 'scale3': // K-AQ
        return this.analyzeKAQ(responses, scaleData);
      case 'scale4': // K-ARS
        return this.analyzeKARS(responses, scaleData);
      default:
        return this.basicAnalysis(responses);
    }
  }

  analyzeCESDC(responses, scaleData) {
    // CES-DC의 하위 요인 분석
    const factors = scaleData?.scale?.scoring?.factors || {};
    const factorScores = {};
    
    if (scaleData?.questions) {
      // 카테고리별 점수 계산
      const categories = ['depressed_affect', 'positive_affect', 'somatic', 'interpersonal'];
      
      categories.forEach(category => {
        const categoryQuestions = scaleData.questions
          .filter(q => q.category === category)
          .map(q => q.number - 1); // 인덱스로 변환
        
        const categoryResponses = categoryQuestions.map(idx => responses[idx] || 0);
        const categorySum = categoryResponses.reduce((sum, val) => sum + val, 0);
        const categoryMax = categoryQuestions.length * 3;
        
        factorScores[category] = {
          score: categorySum,
          percentage: Math.round((categorySum / categoryMax) * 100)
        };
      });
    }
    
    return {
      factors: factorScores,
      primaryConcern: this.getHighestFactor(factorScores)
    };
  }

  analyzeBAI(responses, scaleData) {
    // BAI의 하위 요인 분석
    const factors = {};
    
    if (scaleData?.questions) {
      const categories = ['neurophysiological', 'subjective', 'panic', 'autonomic'];
      
      categories.forEach(category => {
        const categoryQuestions = scaleData.questions
          .filter(q => q.category === category)
          .map(q => q.number - 1);
        
        const categorySum = categoryQuestions
          .map(idx => responses[idx] || 0)
          .reduce((sum, val) => sum + val, 0);
        
        factors[category] = {
          score: categorySum,
          count: categoryQuestions.length
        };
      });
    }
    
    return { factors };
  }

  analyzeKAQ(responses, scaleData) {
    // K-AQ의 하위척도 분석
    const subscales = scaleData?.scale?.scoring?.subscales || {};
    const subscaleScores = {};
    
    Object.entries(subscales).forEach(([key, subscale]) => {
      const items = subscale.items.map(i => i - 1); // 1-based to 0-based
      const subscaleSum = items
        .map(idx => responses[idx] || 0)
        .reduce((sum, val) => sum + val, 0);
      
      subscaleScores[key] = {
        name: subscale.name,
        score: subscaleSum,
        description: subscale.description
      };
    });
    
    return { subscales: subscaleScores };
  }

  analyzeKARS(responses, scaleData) {
    // K-ARS의 하위척도 분석
    const subscales = scaleData?.scale?.scoring?.subscales || {};
    const analysis = {};
    
    if (subscales.inattention && subscales.hyperactivity_impulsivity) {
      // 부주의 점수
      const inattentionItems = subscales.inattention.items.map(i => i - 1);
      const inattentionScore = inattentionItems
        .map(idx => responses[idx] || 0)
        .reduce((sum, val) => sum + val, 0);
      
      // 과잉행동-충동성 점수
      const hyperItems = subscales.hyperactivity_impulsivity.items.map(i => i - 1);
      const hyperScore = hyperItems
        .map(idx => responses[idx] || 0)
        .reduce((sum, val) => sum + val, 0);
      
      analysis.subscales = {
        inattention: {
          score: inattentionScore,
          exceeded: inattentionScore >= subscales.inattention.cutoff,
          cutoff: subscales.inattention.cutoff
        },
        hyperactivity: {
          score: hyperScore,
          exceeded: hyperScore >= subscales.hyperactivity_impulsivity.cutoff,
          cutoff: subscales.hyperactivity_impulsivity.cutoff
        }
      };
      
      // 진단 기준 충족 여부
      analysis.meetsCriteria = 
        analysis.subscales.inattention.exceeded || 
        analysis.subscales.hyperactivity.exceeded;
    }
    
    return analysis;
  }

  getHighestFactor(factors) {
    return Object.entries(factors)
      .sort(([, a], [, b]) => (b.score || b.percentage) - (a.score || a.percentage))[0]?.[0];
  }

  getDefaultInterpretation(scaleType, score) {
    // 폴백용 기본 해석
    const percentage = score / this.getMaxPossibleScore(scaleType, 20) * 100;
    
    if (percentage < 25) {
      return { level: 'low', label: '낮음', description: '증상이 거의 없습니다.' };
    } else if (percentage < 50) {
      return { level: 'mild', label: '경도', description: '가벼운 증상이 있습니다.' };
    } else if (percentage < 75) {
      return { level: 'moderate', label: '중등도', description: '중간 수준의 증상입니다.' };
    } else {
      return { level: 'severe', label: '중증', description: '심각한 수준의 증상입니다.' };
    }
  }

  // 기존 메서드들 유지...
  basicAnalysis(responses) {
    return {
      highestItems: this.getHighestScoringItems(responses),
      lowestItems: this.getLowestScoringItems(responses),
      consistency: this.checkResponseConsistency(responses)
    };
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
    const variance = this.calculateVariance(responses);
    return variance > 0.5 ? 'consistent' : 'potentially inconsistent';
  }
  
  calculateVariance(responses) {
    const mean = responses.reduce((sum, val) => sum + val, 0) / responses.length;
    const squaredDiffs = responses.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / responses.length;
  }
}
