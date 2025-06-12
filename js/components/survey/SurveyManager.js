import { updateSurveyScale } from '../../firebase/crud.js';
import { SurveyRenderer } from './SurveyRenderer.js';
import { SurveyValidator } from './SurveyValidator.js';
import { SurveyScoreCalculator } from './SurveyScoreCalculator.js';

export class SurveyManager {
  constructor(containerId, patientData) {
    this.container = document.getElementById(containerId);
    this.patientData = patientData;
    this.currentScaleIndex = 0;
    
    // 척도 순서와 매핑 직접 정의
    this.scaleMapping = {
      scale1: { id: 'ces-dc', questions: 20 },
      scale2: { id: 'bai', questions: 21 },
      scale3: { id: 'k-aq', questions: 27 },
      scale4: { id: 'k-ars', questions: 18 }
    };
    
    this.scales = ['scale1', 'scale2', 'scale3', 'scale4'];
    
    // 검증 규칙
    this.validationRules = {
      minResponseTime: 300,
      maxResponseTime: 300000,
      consistencyCheck: true,
      requiredCompletion: 1.0
    };
    
    // 선택된 scale 처리
    if (window.selectedScale) {
      this.currentScale = window.selectedScale;
      this.scales = [window.selectedScale];
    } else {
      this.findNextIncompleteScale();
    }
    
    // 의존성 주입
    this.renderer = new SurveyRenderer(this);
    this.validator = new SurveyValidator();
    this.scoreCalculator = new SurveyScoreCalculator();
    
    this.currentResponses = [];
    this.init();
  }
  getScaleConfig() {
    const currentScale = this.getCurrentScale();
    const mapping = this.scaleMapping[currentScale];
    
    if (!mapping) {
      console.error(`Invalid scale: ${currentScale}`);
      return null;
    }
    
    return {
      id: mapping.id,
      name: this.getScaleName(currentScale),
      questions: mapping.questions,
      scaleKey: currentScale
    };
  }
  
  getScaleName(scaleKey) {
    const names = {
      scale1: '아동 우울 척도 (CES-DC)',
      scale2: '벡 불안 척도 (BAI)',
      scale3: '한국판 공격성 질문지 (K-AQ)',
      scale4: '한국형 ADHD 평가척도 (K-ARS)'
    };
    return names[scaleKey] || scaleKey;
  }
  
  
  getQuestionCount(scaleKey) {
    const counts = {
      scale1: 20,
      scale2: 21,
      scale3: 27,
      scale4: 18
    };
    return counts[scaleKey];
  }

  init() {
    this.findNextIncompleteScale();
    this.render();
  }

  findNextIncompleteScale() {
    for (let i = 0; i < this.scales.length; i++) {
      const scale = this.patientData.survey[this.scales[i]];
      if (!scale.isDone) {
        this.currentScaleIndex = i;
        return;
      }
    }
    this.currentScaleIndex = this.scales.length;
  }

  render() {
    if (this.currentScaleIndex >= this.scales.length) {
      this.renderer.renderComplete();
    } else {
      this.renderer.renderSurvey();
    }
  }

  updateResponse(questionIndex, value) {
    this.currentResponses[questionIndex] = parseInt(value);
    this.renderer.updateQuestionUI(questionIndex, value);
  }

  async submitScale() {
    const currentScale = this.scales[this.currentScaleIndex];
    const config = this.getScaleConfig();
    
    // 유효성 검사
    const validation = this.validator.validateResponses(
      this.currentResponses, 
      config.questions
    );
    
    if (!validation.isValid) {
      alert(validation.message);
      if (validation.questionIndex !== undefined) {
        this.renderer.highlightQuestion(validation.questionIndex);
      }
      return;
    }
    
    // 점수 계산 (언어 정보 전달)
    const language = this.patientData.language || 'ko';
    const scoreData = await this.scoreCalculator.calculate(
      currentScale, 
      this.currentResponses,
      language
    );
    
    try {
      // Firebase 업데이트
      const scaleData = {
        scaleName: config.name,
        score: scoreData.total,
        isDone: true,
        questions: [...this.currentResponses],
        responses: [...this.currentResponses], // Report에서 사용
        analysis: scoreData.analysis,
        interpretation: scoreData.interpretation
      };
      
      await updateSurveyScale(
        this.patientData.name,
        this.patientData.birthDate,
        currentScale,
        scaleData
      );
      
      // 로컬 데이터 업데이트
      this.patientData.survey[currentScale] = scaleData;
      
      // 다음 Scale로 이동
      this.currentResponses = [];
      this.currentScaleIndex++;
      this.render();
      
    } catch (error) {
      console.error('Scale 저장 오류:', error);
      alert('저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  }

  getCurrentScale() {
    return this.scales[this.currentScaleIndex];
  }
}

