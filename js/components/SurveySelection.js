import { translationService } from '../services/TranslationService.js';

export class SurveySelection {
  constructor(containerId, patientData) {
    this.container = document.getElementById(containerId);
    this.patientData = patientData;
    this.render();
  }

  render() {
    const t = (key, params) => translationService.t(key, params);
    
    this.container.innerHTML = `
      <div class="selection-container">
        <div class="selection-header">
          <button onclick="window.location.hash='#dashboard'" class="back-btn">← ${t('back')}</button>
          <h2>${t('clinicalScaleSelection')}</h2>
        </div>
        
        <div class="scale-grid">
          ${this.renderScales()}
        </div>
      </div>
    `;
  }

  renderScales() {
    const t = (key, params) => translationService.t(key, params);
    
    // 순서를 보장하기 위해 키를 명시적으로 정의
    const scaleOrder = ['scale1', 'scale2', 'scale3', 'scale4'];
    const patientSurvey = this.patientData.survey || {};

    return scaleOrder.map((key, index) => {
      const scale = patientSurvey[key];
      if (!scale) return ''; // 데이터가 없으면 스킵

      const isCompleted = scale.isDone;
      const scaleNumber = index + 1;

      return `
        <div class="scale-card ${isCompleted ? 'completed' : ''}" 
             ${!isCompleted ? `onclick="window.surveySelectionInstance.selectScale('${key}')"` : ''}>
          <div class="scale-number">${scaleNumber}</div>
          <h3>${this.getScaleName(key)}</h3>
          <div class="scale-info">
            <p>${t('questions')}: ${this.getQuestionCount(key)}${t('questionsUnit')}</p>
            <p class="age-requirement">${this.getAgeRequirement(key)}</p>
            ${isCompleted ?
              `<p class="score">${t('score')}: ${scale.score}</p>` :
              `<p class="status">${t('notCompleted')}</p>`
            }
          </div>
          <div class="scale-status">
            ${isCompleted ?
              `<span class="completed-badge">✓ ${t('completedStatus')}</span>` :
              `<button class="start-btn">${t('startScale')}</button>`
            }
          </div>
        </div>
      `;
    }).join('');
  }

  // 연령 요구사항을 별도 메서드로 분리
  getAgeRequirement(key) {
    const t = (key) => translationService.t(key);
    const requirements = {
      scale1: t('ageRequirement12'),
      scale2: t('ageRequirement12'),
      scale3: t('ageRequirement6'),
      scale4: t('ageRequirement6')
    };
    return requirements[key] || '';
  }

  selectScale(scaleKey) {
    window.selectedScale = scaleKey;
    window.location.hash = '#survey';
  }

  getScaleName(key) {
    const t = (key) => translationService.t(key);
    const names = {
      scale1: t('cesdc'),
      scale2: t('bai'),
      scale3: t('kaq'),
      scale4: t('kars')
    };
    return names[key] || key;
  }

  getQuestionCount(key) {
    const counts = {
      scale1: 20,
      scale2: 21,
      scale3: 27,
      scale4: 18
    };
    return counts[key] || 10;
  }

  destroy() {
    // 컴포넌트 정리
    this.container.innerHTML = '';
  }
}

// CSS 스타일
const style = document.createElement('style');
style.textContent = `
  .selection-container {
    max-width: 800px;
    margin: 20px auto;
    padding: 20px;
    animation: fadeIn 0.3s ease-out;
  }
  
  .selection-header {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 30px;
  }
  
  .back-btn {
    padding: 8px 16px;
    background: #666;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
  }
  
  .back-btn:hover {
    background: #555;
    transform: translateY(-1px);
  }
  
  .scale-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
  }
  
  .scale-card {
    background: white;
    border: 2px solid #ddd;
    border-radius: 8px;
    padding: 20px;
    position: relative;
    cursor: pointer;
    transition: all 0.3s;
  }
  
  .scale-card:hover:not(.completed) {
    border-color: #2196F3;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    transform: translateY(-2px);
  }
  
  .scale-card.completed {
    background: #f5f5f5;
    cursor: default;
    opacity: 0.8;
  }
  
  .scale-number {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 30px;
    height: 30px;
    background: #2196F3;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
  }
  
  .scale-card.completed .scale-number {
    background: #4CAF50;
  }
  
  .scale-card h3 {
    margin-bottom: 15px;
    color: #333;
    font-size: 18px;
    padding-right: 40px;
  }
  
  .scale-info {
    margin-bottom: 20px;
  }
  
  .scale-info p {
    margin: 5px 0;
    font-size: 14px;
    color: #666;
  }
  
  .age-requirement {
    color: #888;
    font-size: 12px;
  }
  
  .score {
    font-weight: bold;
    color: #4CAF50;
  }
  
  .status {
    color: #ff9800;
  }
  
  .start-btn {
    width: 100%;
    padding: 10px;
    background: #2196F3;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .start-btn:hover {
    background: #1976D2;
    transform: translateY(-1px);
  }
  
  .completed-badge {
    display: block;
    text-align: center;
    color: #4CAF50;
    font-weight: bold;
  }
  
  @media (max-width: 600px) {
    .scale-grid {
      grid-template-columns: 1fr;
    }
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(style);