import { surveyQuestionLoader } from '../../services/SurveyQuestionLoader.js';
import { translationService } from '../../services/TranslationService.js';

export class SurveyRenderer {
  constructor(manager) {
    this.manager = manager;
    this.questionData = null;
  }

  async renderSurvey() {
    const currentScale = this.manager.getCurrentScale();
    const scaleId = this.getScaleId(currentScale);
    const language = this.manager.patientData.language;

    // 질문 데이터 로드
    this.questionData = await surveyQuestionLoader.loadQuestions(scaleId, language);

    const progress = this.calculateProgress();

    // 메인 app 컨테이너에 스크롤 강제 적용
    const appContainer = document.getElementById('app');
    if (appContainer) {
      appContainer.style.overflowY = 'auto';
      appContainer.style.height = '100vh';
    }
    this.manager.container.innerHTML = `
    <div class="survey-container" style="overflow-y: auto; min-height: 100vh; height: auto;">
        ${this.renderHeader()}
        ${this.renderInstruction()}
        
        <div id="scale-questions" style="overflow-y: visible !important;">
          ${this.renderQuestions()}
        </div>
        
        <div class="survey-navigation">
          ${this.renderProgressIndicator(progress)}
        </div>
        
        <div class="button-container">
          <button id="submit-scale" class="submit-btn" onclick="window.surveyInstance.submitScale()">
            ${this.getSubmitButtonText()}
          </button>
        </div>
      </div>
    `;

    window.surveyInstance = this.manager;
    this.attachEventListeners();
  }

  renderHeader() {
    const { scale } = this.questionData;

    return `
      <div class="survey-header">
        <h2>${scale.name}</h2>
        <p class="scale-description">${scale.description || ''}</p>
      </div>
    `;
  }

  renderInstruction() {
    const { scale } = this.questionData;

    if (!scale.instruction) return '';

    return `
      <div class="survey-instruction">
        <p>${scale.instruction}</p>
      </div>
    `;
  }

  renderQuestions() {
    const { questions } = this.questionData;
    let html = '<div class="questions-container">';

    questions.forEach((question, index) => {
      const isAnswered = this.manager.currentResponses[index] !== undefined;
      const isCritical = question.critical || false;

      html += `
        <div class="question-item ${isAnswered ? 'answered' : ''} ${isCritical ? 'critical' : ''}" 
             id="question-${index}">
          <div class="question-header">
            <span class="question-number">${index + 1}</span>
            ${isCritical ? `<span class="critical-indicator">${this.getCriticalLabel()}</span>` : ''}
            <span class="question-status">${isAnswered ? '✓' : ''}</span>
          </div>
          <p class="question-text">
            ${question.text}
          </p>
          <div class="likert-scale">
            ${this.renderLikertScale(index)}
          </div>
        </div>
      `;
    });

    html += '</div>';
    return html;
  }

  renderLikertScale(questionIndex) {
    const { response_options } = this.questionData;
    const value = this.manager.currentResponses[questionIndex];

    return `
      <div class="likert-options" data-question="${questionIndex}">
        ${response_options.map((option) => `
          <label class="likert-label ${value === option.value ? 'selected' : ''}">
            <input type="radio" 
                   name="q${questionIndex}" 
                   value="${option.value}"
                   ${value === option.value ? 'checked' : ''}
                   onchange="window.surveyInstance.updateResponse(${questionIndex}, ${option.value})">
            <span class="likert-value">${option.value}</span>
            <small class="likert-text">${option.label}</small>
          </label>
        `).join('')}
      </div>
    `;
  }

  getCriticalLabel() {
    const lang = this.manager.patientData.language;
    const labels = {
      ko: '중요',
      en: 'Important',
      ja: '重要',
      zh: '重要',
      vn: 'Quan trọng',
      th: 'สำคัญ'
    };
    return labels[lang] || labels.ko;
  }

  getScaleId(currentScale) {
    const mapping = {
      scale1: 'ces-dc',
      scale2: 'bai',
      scale3: 'k-aq',
      scale4: 'k-ars'
    };
    
    return mapping[currentScale] || currentScale;
  }

  getSubmitButtonText() {
    const t = (key, params) => translationService.t(key, params);
    const answered = this.manager.currentResponses.filter(r => r !== undefined).length;
    const total = this.questionData?.questions?.length || 0;
    
    if (answered < total) {
      return t('answer') + ` (${answered}/${total})`;
    }
    
    return t('completeScale');
  }

  renderProgressIndicator(progress) {
    const t = (key, params) => translationService.t(key, params);
    
    return `
      <div class="progress-indicator">
        <span class="answered-count">
          ${t('answer')}: ${progress.answered}/${progress.totalQuestions}
        </span>
        <div class="question-dots">
          ${this.renderQuestionDots()}
        </div>
      </div>
    `;
  }

  renderQuestionDots() {
    const config = this.manager.getScaleConfig();
    let dots = '';

    for (let i = 0; i < config.questions; i++) {
      const isAnswered = this.manager.currentResponses[i] !== undefined;
      dots += `<span class="dot ${isAnswered ? 'answered' : ''}" 
                     onclick="window.surveyInstance.scrollToQuestion(${i})"></span>`;
    }

    return dots;
  }

  renderComplete() {
    // 개별 척도 완료 시 바로 survey-selection으로 이동
    window.location.hash = '#survey-selection';
  }

  updateQuestionUI(questionIndex, value) {
    // 라디오 버튼 업데이트
    const options = document.querySelectorAll(`input[name="q${questionIndex}"]`);
    options.forEach(option => {
      const label = option.closest('.likert-label');
      if (parseInt(option.value) === value) {
        label.classList.add('selected');
      } else {
        label.classList.remove('selected');
      }
    });

    // 질문 상태 업데이트
    const questionItem = document.getElementById(`question-${questionIndex}`);
    questionItem.classList.add('answered');
    questionItem.querySelector('.question-status').textContent = '✓';

    // 진행 상황 업데이트
    this.updateProgressIndicator();
  }

  updateProgressIndicator() {
    const t = (key, params) => translationService.t(key, params);
    const answered = this.manager.currentResponses.filter(r => r !== undefined).length;
    const total = this.manager.getScaleConfig().questions;

    document.querySelector('.answered-count').textContent = 
      `${t('answer')}: ${answered}/${total}`;

    // 점 업데이트
    const dots = document.querySelectorAll('.question-dots .dot');
    this.manager.currentResponses.forEach((response, idx) => {
      if (response !== undefined && dots[idx]) {
        dots[idx].classList.add('answered');
      }
    });

    // 제출 버튼 텍스트 업데이트
    const submitBtn = document.getElementById('submit-scale');
    if (submitBtn) {
      submitBtn.textContent = this.getSubmitButtonText();
    }
  }

  highlightQuestion(questionIndex) {
    const questionItem = document.getElementById(`question-${questionIndex}`);
    questionItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    questionItem.classList.add('highlight');

    setTimeout(() => {
      questionItem.classList.remove('highlight');
    }, 2000);
  }

  calculateProgress() {
    const currentIndex = this.manager.currentScaleIndex;
    const totalScales = this.manager.scales.length;
    const config = this.manager.getScaleConfig();
    const answered = this.manager.currentResponses.filter(r => r !== undefined).length;

    return {
      completed: currentIndex,
      total: totalScales,
      percentage: Math.round((currentIndex / totalScales) * 100),
      answered: answered,
      totalQuestions: config?.questions || 0
    };
  }

  attachEventListeners() {
    // 스크롤 동작만 유지
    document.querySelectorAll('.dot').forEach((dot, index) => {
      dot.addEventListener('click', () => {
        this.manager.scrollToQuestion(index);
      });
    });
  }
}