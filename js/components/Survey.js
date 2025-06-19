import { SurveyManager } from './survey/SurveyManager.js';
import { translationService } from '../services/TranslationService.js';

export class Survey {
  constructor(containerId, patientData) {
    this.container = document.getElementById(containerId);
    this.patientData = patientData;
    this.manager = new SurveyManager(containerId, patientData);
  }
  
  // SurveyManager의 메서드들을 위임
  submitScale() {
    this.manager.submitScale();
  }
  
  scrollToQuestion(index) {
    this.manager.scrollToQuestion(index);
  }
  
  updateResponse(questionIndex, value) {
    this.manager.updateResponse(questionIndex, value);
  }
  
  getScaleId(scaleKey) {
    const scaleMapping = {
      'scale1': 'ces-dc',
      'scale2': 'bai',
      'scale3': 'k-aq',
      'scale4': 'k-ars'
    };
    
    return scaleMapping[scaleKey] || scaleKey;
  }
  
  destroy() {
    // 컴포넌트 정리
    this.container.innerHTML = '';
  }
}

// CSS 스타일
const surveyStyles = `
  /* 전체 컨테이너 스크롤 활성화 */
  #app {
    overflow-y: auto !important;
    height: 100vh !important;
  }
  
  .survey-container {
    max-width: 800px;
    margin: 20px auto;
    padding: 20px;
    animation: fadeIn 0.3s ease-out;
    overflow-y: visible !important;
    min-height: 100vh;
  }
  
  .survey-header {
    text-align: center;
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 2px solid #e0e0e0;
  }
  
  .survey-header h2 {
    color: #333;
    margin-bottom: 10px;
  }
  
  .scale-description {
    color: #666;
    font-size: 14px;
    margin-top: 10px;
  }
  
  .survey-instruction {
    background: #f0f7ff;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 30px;
    border-left: 4px solid #2196F3;
  }
  
  .survey-instruction p {
    margin: 0;
    color: #1565c0;
    font-size: 16px;
    line-height: 1.6;
  }
  
  .questions-container {
    margin-bottom: 30px;
    overflow-y: visible !important;
  }
  
  .question-item {
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 25px;
    margin-bottom: 20px;
    transition: all 0.3s ease;
  }
  
  .question-item:hover {
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    border-color: #2196F3;
  }
  
  .question-item.answered {
    background: #f8f9fa;
    border-color: #4CAF50;
  }
  
  .question-header {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
    gap: 10px;
  }
  
  .question-number {
    background: #2196F3;
    color: white;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 16px;
  }
  
  .question-status {
    color: #4CAF50;
    font-size: 20px;
    margin-left: auto;
  }
  
  .question-text {
    font-size: 16px;
    line-height: 1.6;
    margin-bottom: 20px;
    color: #333;
  }
  
  .likert-scale {
    display: flex;
    justify-content: center;
  }
  
  .likert-options {
    display: flex;
    gap: 10px;
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .likert-label {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    min-width: 80px;
    padding: 15px 10px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    transition: all 0.2s ease;
    background: white;
  }
  
  .likert-label:hover {
    border-color: #2196F3;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }
  
  .likert-label.selected {
    background: #2196F3;
    border-color: #2196F3;
    color: white;
  }
  
  .likert-label input[type="radio"] {
    display: none;
  }
  
  .likert-value {
    font-size: 20px;
    font-weight: bold;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: #f0f0f0;
    margin-bottom: 5px;
  }
  
  .likert-label.selected .likert-value {
    background: white;
    color: #2196F3;
  }
  
  .likert-text {
    font-size: 12px;
    text-align: center;
    color: #666;
  }
  
  .likert-label.selected .likert-text {
    color: white;
  }
  
  .survey-navigation {
    margin: 30px 0;
    padding: 20px;
    background: #f5f5f5;
    border-radius: 8px;
  }
  
  .progress-indicator {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .answered-count {
    font-weight: bold;
    color: #333;
  }
  
  .question-dots {
    display: flex;
    gap: 5px;
    flex-wrap: wrap;
  }
  
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #e0e0e0;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .dot.answered {
    background: #4CAF50;
  }
  
  .dot:hover {
    transform: scale(1.5);
  }
  
  .button-container {
    text-align: center;
    margin: 40px 0;
    padding-bottom: 40px;
  }
  
  .submit-btn {
    padding: 15px 40px;
    background: #2196F3;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 18px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
  }
  
  .submit-btn:hover {
    background: #1976D2;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);
  }
  
  .submit-btn:disabled {
    background: #ccc;
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
  }
  
  .question-item.critical {
    border-color: #ff9800;
    background: #fff8e1;
  }
  
  .critical-indicator {
    background: #ff9800;
    color: white;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: bold;
  }
  
  /* 반응형 디자인 */
  @media (max-width: 768px) {
    .survey-container {
      padding: 15px;
    }
    
    .question-item {
      padding: 20px;
    }
    
    .likert-options {
      gap: 5px;
    }
    
    .likert-label {
      min-width: 60px;
      padding: 10px 5px;
    }
    
    .likert-value {
      width: 30px;
      height: 30px;
      font-size: 16px;
    }
    
    .likert-text {
      font-size: 11px;
    }
  }
  
  /* 언어별 스타일 조정 */
  body.lang-ja .question-text,
  body.lang-zh .question-text {
    font-size: 15px;
  }
  
  body.lang-th .question-text {
    font-size: 17px;
    line-height: 1.8;
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

const styleElement = document.createElement('style');
styleElement.textContent = surveyStyles;
document.head.appendChild(styleElement);