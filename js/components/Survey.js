import { SurveyManager } from './survey/SurveyManager.js';

export class Survey {
  constructor(containerId, patientData) {
    this.manager = new SurveyManager(containerId, patientData);
  }
  
  // 추가 public 메서드들
  nextQuestion() {
    this.manager.nextQuestion();
  }
  
  previousQuestion() {
    this.manager.previousQuestion();
  }
  
  scrollToQuestion(index) {
    this.manager.scrollToQuestion(index);
  }
}

// ================================================
// CSS 스타일 (survey-styles.css)
const surveyStyles = `
  .survey-container {
    max-width: 800px;
    margin: 20px auto;
    padding: 20px;
  }
  
  .question-item {
    margin-bottom: 30px;
    padding: 25px;
    background: #f8f9fa;
    border-radius: 12px;
    border: 2px solid transparent;
    transition: all 0.3s ease;
  }
  
  .question-item:hover {
    border-color: #e3f2fd;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  }
  
  .question-item.answered {
    background: #e8f5e9;
    border-color: #4CAF50;
  }
  
  .question-item.highlight {
    animation: highlight 0.5s ease-in-out;
    border-color: #ff5252;
  }
  
  @keyframes highlight {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.02); }
  }
  
  .question-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
  }
  
  .question-number {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: #2196F3;
    color: white;
    border-radius: 50%;
    font-weight: bold;
    font-size: 16px;
  }
  
  .question-item.answered .question-number {
    background: #4CAF50;
  }
  
  .question-status {
    color: #4CAF50;
    font-size: 24px;
    font-weight: bold;
  }
  
  .likert-options {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin-top: 20px;
  }
  
  .likert-label {
    flex: 1;
    text-align: center;
    padding: 12px 8px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    background: white;
    position: relative;
    overflow: hidden;
  }
  
  .likert-label::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #2196F3;
    transform: scaleY(0);
    transform-origin: bottom;
    transition: transform 0.3s ease;
    z-index: 0;
  }
  
  .likert-label:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }
  
  .likert-label.selected {
    border-color: #2196F3;
    background: #2196F3;
    color: white;
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
  }
  
  .likert-label.selected::before {
    transform: scaleY(1);
  }
  
  .likert-value {
    display: block;
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 4px;
    position: relative;
    z-index: 1;
  }
  
  .likert-text {
    display: block;
    font-size: 12px;
    line-height: 1.2;
    position: relative;
    z-index: 1;
  }
  
  .likert-label input[type="radio"] {
    display: none;
  }
  
  .survey-navigation {
    margin: 40px 0;
    padding: 20px;
    background: #f5f5f5;
    border-radius: 8px;
  }
  
  .question-progress {
    margin-bottom: 20px;
  }
  
  .answered-count {
    font-size: 16px;
    font-weight: bold;
    color: #333;
    margin-bottom: 10px;
  }
  
  .question-dots {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  
  .question-dots .dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #e0e0e0;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .question-dots .dot:hover {
    transform: scale(1.2);
  }
  
  .question-dots .dot.answered {
    background: #4CAF50;
  }
  
  .nav-buttons {
    display: flex;
    justify-content: space-between;
    gap: 20px;
  }
  
  .nav-btn {
    padding: 10px 30px;
    background: #2196F3;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    transition: all 0.2s;
  }
  
  .nav-btn:hover {
    background: #1976D2;
    transform: translateY(-1px);
  }
  
  .nav-btn:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
  
  .survey-complete {
    text-align: center;
    padding: 60px 40px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  }
  
  .complete-icon {
    font-size: 80px;
    color: #4CAF50;
    margin-bottom: 20px;
    animation: checkmark 0.6s ease-in-out;
  }
  
  @keyframes checkmark {
    0% { transform: scale(0) rotate(45deg); }
    50% { transform: scale(1.2) rotate(45deg); }
    100% { transform: scale(1) rotate(0); }
  }
  
  .score-display {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 10px;
    margin: 30px 0;
  }
  
  .score-value {
    font-size: 72px;
    font-weight: bold;
    color: #2196F3;
  }
  
  .score-label {
    font-size: 24px;
    color: #666;
  }
  
  .score-interpretation {
    margin: 30px 0;
    padding: 20px;
    background: #f5f5f5;
    border-radius: 8px;
  }
  
  .interpretation-level {
    display: inline-block;
    padding: 8px 20px;
    border-radius: 20px;
    font-weight: bold;
    margin-bottom: 10px;
  }
  
  .interpretation-level.level-low {
    background: #4CAF50;
    color: white;
  }
  
  .interpretation-level.level-mild {
    background: #FFC107;
    color: #333;
  }
  
  .interpretation-level.level-moderate {
    background: #FF9800;
    color: white;
  }
  
  .interpretation-level.level-severe {
    background: #F44336;
    color: white;
  }
  
  @media (max-width: 768px) {
    .likert-options {
      flex-direction: column;
    }
    
    .likert-label {
      padding: 15px;
    }
  }
`;

// 스타일 적용
const styleElement = document.createElement('style');
styleElement.textContent = surveyStyles;
document.head.appendChild(styleElement);