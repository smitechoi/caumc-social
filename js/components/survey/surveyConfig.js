export const surveyConfig = {
    scales: {
      scale1: {
        id: 'depression',
        name: 'Depression Scale',
        questions: 20,
        type: 'likert',
        scoring: 'standard',
        interpretation: {
          ranges: [
            { min: 0, max: 20, level: 'minimal' },
            { min: 21, max: 40, level: 'mild' },
            { min: 41, max: 60, level: 'moderate' },
            { min: 61, max: 80, level: 'severe' }
          ]
        }
      },
      scale2: {
        id: 'anxiety',
        name: 'Anxiety Scale',
        questions: 15,
        type: 'likert',
        scoring: 'standard'
      },
      scale3: {
        id: 'stress',
        name: 'Stress Scale',
        questions: 10,
        type: 'likert',
        scoring: 'standard'
      },
      scale4: {
        id: 'qualityOfLife',
        name: 'Quality of Life',
        questions: 25,
        type: 'likert',
        scoring: 'reversed',
        reversedItems: [3, 7, 11, 15, 19]
      }
    },
    
    likertOptions: 5,
    
    validationRules: {
      minResponseTime: 300, // 최소 응답 시간 (ms)
      maxResponseTime: 300000, // 최대 응답 시간 (5분)
      consistencyCheck: true
    }
  };
  