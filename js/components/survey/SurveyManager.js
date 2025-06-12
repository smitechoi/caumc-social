// js/components/survey/SurveyManager.js
import { updateSurveyScale } from '../../firebase/crud.js';
import { SurveyRenderer } from './SurveyRenderer.js';
import { SurveyValidator } from './SurveyValidator.js';
import { SurveyScoreCalculator } from './SurveyScoreCalculator.js';
import { surveyConfig } from './surveyConfig.js';

export class SurveyManager {
  constructor(containerId, patientData) {
    this.container = document.getElementById(containerId);
    this.patientData = patientData;
    this.currentScaleIndex = 0;
    this.scales = ['scale1', 'scale2', 'scale3', 'scale4'];
    
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

  getScaleConfig() {
    return surveyConfig.scales[this.getCurrentScale()];
  }
}

