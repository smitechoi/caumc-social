import { updateSurveyScale, getPatient } from '../firebase/crud.js';

export class Survey {
  constructor(containerId, patientData) {
    this.container = document.getElementById(containerId);
    this.patientData = patientData;
    this.currentScaleIndex = 0;
    this.scales = ['scale1', 'scale2', 'scale3', 'scale4'];
    
    // 선택된 scale만 처리
    if (window.selectedScale) {
      this.currentScale = window.selectedScale;
      this.scales = [window.selectedScale];
    } else {
      // 전체 진행 모드 (기존 방식)
      this.findNextIncompleteScale();
    }
    
    // 각 Scale의 질문 수 (예시)
    this.scaleConfigs = {
      scale1: { name: 'Depression Scale', questions: 20 },
      scale2: { name: 'Anxiety Scale', questions: 15 },
      scale3: { name: 'Stress Scale', questions: 10 },
      scale4: { name: 'Quality of Life', questions: 25 }
    };
    
    this.currentResponses = [];
    this.findNextIncompleteScale();
    this.render();
  }

  findNextIncompleteScale() {
    // 완료되지 않은 첫 번째 Scale 찾기
    for (let i = 0; i < this.scales.length; i++) {
      const scale = this.patientData.survey[this.scales[i]];
      if (!scale.isDone) {
        this.currentScaleIndex = i;
        return;
      }
    }
    // 모든 Scale이 완료된 경우
    this.currentScaleIndex = this.scales.length;
  }

  render() {
    if (this.currentScaleIndex >= this.scales.length) {
      this.renderComplete();
      return;
    }

    const currentScale = this.scales[this.currentScaleIndex];
    const config = this.scaleConfigs[currentScale];
    
    this.container.innerHTML = `
      <div class="survey-container">
        <div class="survey-header">
          <h2>임상 척도 검사 - ${this.getLocalizedScaleName(currentScale)}</h2>
          <div class="current-scale-info">
            <span class="scale-badge">${currentScale.replace('scale', 'Scale ')}</span>
            <span class="scale-name">${this.getLocalizedScaleName(currentScale)}</span>
          </div>
          <div class="progress">
            <div class="progress-text">
              전체 진행률: ${this.currentScaleIndex}/${this.scales.length} 완료
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${(this.currentScaleIndex / this.scales.length) * 100}%"></div>
            </div>
          </div>
        </div>
        
        <div id="scale-questions">
          ${this.renderQuestions(currentScale, config)}
        </div>
        
        <div class="button-container">
          <button id="submit-scale" onclick="window.surveyInstance.submitScale()">
            이 척도 완료
          </button>
        </div>
      </div>
    `;

    // 글로벌 참조 (onclick 이벤트용)
    window.surveyInstance = this;
  }

  renderQuestions(scaleName, config) {
    let html = '<div class="questions-container">';
    
    for (let i = 0; i < config.questions; i++) {
      html += `
        <div class="question-item">
          <p class="question-text">
            ${i + 1}. ${this.getLocalizedQuestion(scaleName, i)}
          </p>
          <div class="likert-scale">
            ${this.renderLikertScale(i)}
          </div>
        </div>
      `;
    }
    
    html += '</div>';
    return html;
  }

  renderLikertScale(questionIndex) {
    const labels = this.getLocalizedLikertLabels();
    let html = '<div class="likert-options">';
    
    for (let value = 0; value <= 4; value++) {
      const isChecked = this.currentResponses[questionIndex] === value;
      html += `
        <label class="likert-label ${isChecked ? 'selected' : ''}">
          <input type="radio" name="q${questionIndex}" value="${value}" 
                 onchange="window.surveyInstance.updateResponse(${questionIndex}, ${value})"
                 ${isChecked ? 'checked' : ''}>
          <span>${value}</span>
          <small>${labels[value]}</small>
        </label>
      `;
    }
    
    html += '</div>';
    return html;
  }

  updateResponse(questionIndex, value) {
    this.currentResponses[questionIndex] = parseInt(value);
    
    // 선택된 항목 시각적 업데이트
    const allLabels = document.querySelectorAll(`input[name="q${questionIndex}"]`).forEach(input => {
      const label = input.closest('.likert-label');
      if (input.value == value) {
        label.classList.add('selected');
      } else {
        label.classList.remove('selected');
      }
    });
  }

  async submitScale() {
    const currentScale = this.scales[this.currentScaleIndex];
    const config = this.scaleConfigs[currentScale];
    
    // 모든 질문에 응답했는지 확인
    if (this.currentResponses.length < config.questions) {
      alert('모든 질문에 응답해주세요.');
      return;
    }
    
    // null이나 undefined 체크
    for (let i = 0; i < config.questions; i++) {
      if (this.currentResponses[i] === undefined) {
        alert(`${i + 1}번 질문에 응답해주세요.`);
        return;
      }
    }
    
    // 점수 계산
    const totalScore = this.currentResponses.reduce((sum, val) => sum + val, 0);
    
    try {
      // Firebase 업데이트
      const scaleData = {
        scaleName: config.name,
        score: totalScore,
        isDone: true,
        questions: [...this.currentResponses]
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

  renderComplete() {
    this.container.innerHTML = `
      <div class="survey-complete">
        <h2>${this.getLocalizedScaleName(this.currentScale)} 완료!</h2>
        <p>척도 검사를 완료하셨습니다.</p>
        <div class="score-summary">
          <h3>점수</h3>
          <p>${this.patientData.survey[this.currentScale].score}점</p>
        </div>
        <button onclick="window.location.hash='#survey-selection'">
          다른 척도 선택하기
        </button>
      </div>
    `;
  }

  renderScoreSummary() {
    let html = '<ul>';
    for (const scale of this.scales) {
      const data = this.patientData.survey[scale];
      html += `<li>${this.getLocalizedScaleName(scale)}: ${data.score}점</li>`;
    }
    html += '</ul>';
    return html;
  }

  // 다국어 지원 함수들
  getLocalizedScaleName(scale) {
    const lang = this.patientData.language;
    const names = {
      ko: {
        scale1: '우울 척도',
        scale2: '불안 척도',
        scale3: '스트레스 척도',
        scale4: '삶의 질'
      },
      en: {
        scale1: 'Depression Scale',
        scale2: 'Anxiety Scale',
        scale3: 'Stress Scale',
        scale4: 'Quality of Life'
      }
      // 다른 언어 추가...
    };
    
    return names[lang]?.[scale] || this.scaleConfigs[scale].name;
  }

  getLocalizedQuestion(scale, index) {
    // 실제로는 외부 파일에서 질문 목록을 가져와야 함
    const lang = this.patientData.language;
    return `${scale} 질문 ${index + 1} (${lang})`;
  }

  getLocalizedLikertLabels() {
    const lang = this.patientData.language;
    const labels = {
      ko: ['전혀 아니다', '아니다', '보통이다', '그렇다', '매우 그렇다'],
      en: ['Not at all', 'Rarely', 'Sometimes', 'Often', 'Very often']
    };
    
    return labels[lang] || labels['ko'];
  }
}

// CSS 스타일 추가
const style = document.createElement('style');
style.textContent = `
  .survey-container {
    max-width: 800px;
    margin: 20px auto;
    padding: 20px;
  }
  
  .survey-header {
    margin-bottom: 30px;
  }
  
  .current-scale-info {
    margin: 15px 0;
    padding: 15px;
    background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
    color: white;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 15px;
    box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
  }
  
  .scale-badge {
    background: rgba(255, 255, 255, 0.2);
    padding: 8px 16px;
    border-radius: 20px;
    font-weight: bold;
    font-size: 14px;
  }
  
  .scale-name {
    font-size: 18px;
    font-weight: bold;
  }
  
  .progress {
    margin-top: 10px;
  }
  
  .progress-bar {
    width: 100%;
    height: 20px;
    background: #e0e0e0;
    border-radius: 10px;
    overflow: hidden;
  }
  
  .progress-fill {
    height: 100%;
    background: #4CAF50;
    transition: width 0.3s ease;
  }
  
  .question-item {
    margin-bottom: 30px;
    padding: 20px;
    background: #f5f5f5;
    border-radius: 8px;
  }
  
  .question-text {
    font-size: 16px;
    margin-bottom: 15px;
  }
  
  .likert-options {
    display: flex;
    justify-content: space-between;
    gap: 10px;
  }
  
  .likert-label {
    flex: 1;
    text-align: center;
    padding: 10px;
    border: 2px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    background: white;
    position: relative;
  }
  
  .likert-label:hover {
    background: #e3f2fd;
    border-color: #90CAF9;
    transform: translateY(-2px);
  }
  
  .likert-label input[type="radio"] {
    display: none;
  }
  
  .likert-label input[type="radio"]:checked ~ * {
    color: white;
  }
  
  .likert-label:has(input[type="radio"]:checked) {
    background: #2196F3;
    border-color: #1976d2;
    transform: scale(1.05);
    box-shadow: 0 4px 8px rgba(33, 150, 243, 0.3);
  }
  
  .likert-label input[type="radio"]:checked + span {
    font-weight: bold;
    color: white;
  }
  
  .likert-label input[type="radio"]:checked ~ small {
    color: white;
    font-weight: 500;
  }
  
  .likert-label.selected {
    background: #2196F3 !important;
    border-color: #1976d2 !important;
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);
  }
  
  .likert-label.selected span,
  .likert-label.selected small {
    color: white !important;
    font-weight: bold;
  }
  
  .likert-label span {
    display: block;
    font-size: 20px;
    margin-bottom: 5px;
    font-weight: 600;
  }
  
  .likert-label small {
    display: block;
    font-size: 13px;
    color: #666;
    line-height: 1.2;
  }
  
  .button-container {
    margin-top: 40px;
    text-align: center;
  }
  
  #submit-scale {
    padding: 15px 40px;
    font-size: 18px;
    background: #2196F3;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  #submit-scale:hover {
    background: #1976D2;
  }
  
  .survey-complete {
    text-align: center;
    padding: 40px;
  }
  
  .score-summary {
    margin: 30px 0;
    padding: 20px;
    background: #f0f0f0;
    border-radius: 8px;
  }
  
  .score-summary ul {
    list-style: none;
    padding: 0;
  }
  
  .score-summary li {
    padding: 5px 0;
  }
`;
document.head.appendChild(style);